const success = (res, data, statusCode = 200, pagination = null) => {
  const response = { success: true, data };
  if (pagination) response.pagination = pagination;
  return res.status(statusCode).json(response);
};

const error = (res, message, statusCode = 500, code = 'SERVER_ERROR', details = null) => {
  const response = { success: false, error: message, code };
  if (details) response.details = details;
  return res.status(statusCode).json(response);
};

module.exports = { success, error };
