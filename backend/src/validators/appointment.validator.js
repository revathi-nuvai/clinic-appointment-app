const Joi = require('joi');

const bookAppointmentSchema = Joi.object({
  doctor_id: Joi.string().uuid().required(),
  appointment_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .custom((value, helpers) => {
      const today = new Date().toISOString().split('T')[0];
      if (value < today) return helpers.error('date.min');
      return value;
    })
    .required()
    .messages({
      'string.pattern.base': 'Date must be a valid date (YYYY-MM-DD)',
      'date.min': 'Appointment date cannot be in the past',
    }),
  appointment_time: Joi.string()
    .pattern(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({ 'string.pattern.base': 'Time must be in HH:MM format (e.g. 09:00)' }),
  reason: Joi.string().min(5).max(500).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'cancelled', 'completed').required(),
  notes: Joi.string().max(1000).optional().allow(''),
  cancel_reason: Joi.string().max(500).when('status', {
    is: 'cancelled',
    then: Joi.required(),
    otherwise: Joi.optional().allow(''),
  }),
});

module.exports = { bookAppointmentSchema, updateStatusSchema };
