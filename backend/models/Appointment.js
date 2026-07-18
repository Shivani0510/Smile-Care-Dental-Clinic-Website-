const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    service: {
      type: String,
      required: [true, 'Please select a service'],
      enum: [
        'Alignment Specialist',
        'Cosmetic Dentistry',
        'Oral Hygiene',
        'Root Canal',
        'Live Dental Advisory',
        'Cavity Inspection',
        'Other',
      ],
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred appointment date is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'completed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
