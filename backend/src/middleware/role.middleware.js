const { error } = require('../utils/response');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, 'Unauthorized', 401, 'UNAUTHORIZED');
    }
    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient permissions', 403, 'FORBIDDEN');
    }
    next();
  };
};

module.exports = { authorize };
