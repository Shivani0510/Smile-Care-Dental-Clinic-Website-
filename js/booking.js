document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('appointment-form');
  if (!form) return;

  const feedback = document.getElementById('form-feedback');
  const submitBtn = document.getElementById('submit-btn');

  // Prevent picking a date/time in the past
  const dateInput = document.getElementById('preferredDate');
  if (dateInput) {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dateInput.min = now.toISOString().slice(0, 16);
  }

  function showFeedback(message, type) {
    feedback.textContent = message;
    feedback.className = `form-feedback show ${type}`;
    feedback.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function clearFieldErrors() {
    form.querySelectorAll('.field-error').forEach((el) => el.remove());
  }

  function showFieldErrors(errors) {
    clearFieldErrors();
    errors.forEach((err) => {
      const field = form.querySelector(`[name="${err.path || err.param}"]`);
      if (field) {
        const small = document.createElement('small');
        small.className = 'field-error';
        small.textContent = err.msg;
        field.insertAdjacentElement('afterend', small);
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    feedback.className = 'form-feedback';

    const payload = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      service: document.getElementById('service').value,
      preferredDate: document.getElementById('preferredDate').value,
      message: document.getElementById('message').value.trim(),
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'booking...';

    try {
      const res = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) {
          showFieldErrors(data.errors);
          showFeedback('Please fix the highlighted fields and try again.', 'error');
        } else {
          showFeedback(data.message || 'Something went wrong. Please try again.', 'error');
        }
        return;
      }

      showFeedback(data.message || 'Appointment booked! We will contact you shortly.', 'success');
      form.reset();
    } catch (err) {
      showFeedback('Could not reach the server. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'book appointment';
    }
  });
});
