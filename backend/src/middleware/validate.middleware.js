const { error } = require('../utils/response');

const validate = (schema) => {
  return (req, res, next) => {
    const { error: err, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (err) {
      const details = err.details.map((d) => d.message);
      return error(res, 'Validation failed', 400, 'VALIDATION_ERROR', details);
    }
    req.body = value;
    next();
  };
};

module.exports = { validate };
