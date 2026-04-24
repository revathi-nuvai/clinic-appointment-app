const Joi = require('joi');

const createDoctorSchema = Joi.object({
  user_id: Joi.string().uuid().required(),
  specialization: Joi.string().min(2).max(100).required(),
  experience_years: Joi.number().integer().min(0).max(60).required(),
  available_days: Joi.array()
    .items(Joi.string().valid('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'))
    .min(1)
    .default(['Monday','Tuesday','Wednesday','Thursday','Friday']),
  available_from: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('09:00'),
  available_to: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('17:00'),
  slot_duration: Joi.number().integer().valid(15, 20, 30, 45, 60).default(30),
  bio: Joi.string().max(1000).optional().allow(''),
});

const updateDoctorSchema = Joi.object({
  specialization: Joi.string().min(2).max(100),
  experience_years: Joi.number().integer().min(0).max(60),
  available_days: Joi.array()
    .items(Joi.string().valid('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'))
    .min(1),
  available_from: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  available_to: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  slot_duration: Joi.number().integer().valid(15, 20, 30, 45, 60),
  bio: Joi.string().max(1000).allow(''),
  is_active: Joi.boolean(),
}).min(1);

module.exports = { createDoctorSchema, updateDoctorSchema };
