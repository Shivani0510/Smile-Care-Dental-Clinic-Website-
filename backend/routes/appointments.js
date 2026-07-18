const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Limit public booking submissions to reduce spam (10 requests / 15 min / IP)
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

const VALID_SERVICES = [
  'Alignment Specialist',
  'Cosmetic Dentistry',
  'Oral Hygiene',
  'Root Canal',
  'Live Dental Advisory',
  'Cavity Inspection',
  'Other',
];

// @route   POST /api/appointments
// @desc    Book a new appointment (public)
// @access  Public
router.post(
  '/',
  bookingLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
    body('email').trim().isEmail().withMessage('Valid email is required'),
    body('phone').trim().isLength({ min: 7, max: 20 }).withMessage('Valid phone number is required'),
    body('service').isIn(VALID_SERVICES).withMessage('Please select a valid service'),
    body('preferredDate')
      .notEmpty().withMessage('Preferred date is required')
      .isISO8601().withMessage('Preferred date must be a valid date')
      .custom((value) => {
        if (new Date(value) < new Date()) {
          throw new Error('Preferred date cannot be in the past');
        }
        return true;
      }),
    body('message').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { name, email, phone, service, preferredDate, message } = req.body;

      const appointment = await Appointment.create({
        name,
        email,
        phone,
        service,
        preferredDate,
        message,
      });

      res.status(201).json({
        success: true,
        message: 'Appointment request received! We will contact you shortly to confirm.',
        data: appointment,
      });
    } catch (err) {
      next(err);
    }
  }
);

// @route   GET /api/appointments
// @desc    Get all appointments, newest first (admin only)
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    next(err);
  }
});

// @route   PATCH /api/appointments/:id
// @desc    Update appointment status (admin only)
// @access  Private
router.patch(
  '/:id',
  protect,
  [body('status').isIn(['pending', 'confirmed', 'cancelled', 'completed'])],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );

      if (!appointment) {
        return res.status(404).json({ success: false, message: 'Appointment not found' });
      }

      res.json({ success: true, data: appointment });
    } catch (err) {
      next(err);
    }
  }
);

// @route   DELETE /api/appointments/:id
// @desc    Delete an appointment (admin only)
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }
    res.json({ success: true, message: 'Appointment deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
