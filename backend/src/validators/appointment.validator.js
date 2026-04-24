const Joi = require('joi');

const bookAppointmentSchema = Joi.object({
  doctor_id: Joi.string().uuid().required(),
  appointment_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({ 'string.pattern.base': 'Date must be in YYYY-MM-DD format' }),
  appointment_time: Joi.string()
    .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .required()
    .messages({ 'string.pattern.base': 'Time must be in HH:MM format' }),
  reason: Joi.string().min(5).max(500).required(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('confirmed', 'cancelled', 'completed').required(),
  notes: Joi.string().max(1000).optional().allow(''),
  cancel_reason: Joi.string().max(500).when('status', {
    is: 'cancelled',
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

module.exports = { bookAppointmentSchema, updateStatusSchema };
