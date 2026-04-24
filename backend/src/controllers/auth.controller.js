const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { logAudit } = require('../services/audit.service');
const logger = require('../config/logger');
const {
  JWT_SECRET, JWT_EXPIRES_IN,
  JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRES_IN,
} = require('../config/env');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('refresh_tokens').insert({ user_id: userId, token, expires_at: expiresAt });
};

const revokeRefreshToken = async (token) => {
  await supabase.from('refresh_tokens').delete().eq('token', token);
};

const isRefreshTokenValid = async (token) => {
  const { data } = await supabase
    .from('refresh_tokens')
    .select('id, expires_at')
    .eq('token', token)
    .single();
  if (!data) return false;
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('refresh_tokens').delete().eq('token', token);
    return false;
  }
  return true;
};

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return error(res, 'Email already registered', 409, 'EMAIL_EXISTS');
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data: user, error: dbError } = await supabase
      .from('users')
      .insert({ id: uuidv4(), name, email, password_hash, role })
      .select('id, name, email, role, created_at')
      .single();

    if (dbError) throw dbError;

    const { accessToken, refreshToken } = generateTokens(user);
    await storeRefreshToken(user.id, refreshToken);
    await logAudit(user.id, 'USER_REGISTER', 'users', user.id, null, { id: user.id, email: user.email, role: user.role });

    return success(res, { user, accessToken, refreshToken }, 201);
  } catch (err) {
    return error(res, err.message || 'Registration failed', 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, password_hash, is_active')
      .eq('email', email)
      .single();

    if (dbError || !user) {
      return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      return error(res, 'Account is deactivated. Contact admin.', 403, 'ACCOUNT_INACTIVE');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await logAudit(user.id, 'LOGIN_FAILED', 'users', user.id, null, { email });
      return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const { password_hash, ...safeUser } = user;
    const { accessToken, refreshToken } = generateTokens(safeUser);
    await storeRefreshToken(safeUser.id, refreshToken);
    await logAudit(safeUser.id, 'LOGIN_SUCCESS', 'users', safeUser.id, null, { email });

    return success(res, { user: safeUser, accessToken, refreshToken });
  } catch (err) {
    return error(res, err.message || 'Login failed', 500);
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    await logAudit(req.user.id, 'LOGOUT', 'users', req.user.id, null, null);
    return success(res, { message: 'Logged out successfully' });
  } catch (err) {
    return error(res, 'Logout failed', 500);
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

    const valid = await isRefreshTokenValid(refreshToken);
    if (!valid) {
      return error(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (dbError || !user) {
      return error(res, 'User not found', 404, 'USER_NOT_FOUND');
    }

    if (!user.is_active) {
      return error(res, 'Account is deactivated', 403, 'ACCOUNT_INACTIVE');
    }

    // Rotate: revoke old, issue new
    await revokeRefreshToken(refreshToken);
    const tokens = generateTokens(user);
    await storeRefreshToken(user.id, tokens.refreshToken);

    return success(res, tokens);
  } catch (err) {
    return error(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (!user) {
      return success(res, { message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // Log at debug level only — never expose token in info/warn logs
    logger.debug(`Password reset requested for ${email}`);

    // TODO: Week 5 — send email via email.service.js
    // await sendPasswordReset(user.email, resetToken);

    return success(res, { message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    return error(res, 'Something went wrong', 500);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const decoded = jwt.verify(token, JWT_SECRET);
    const password_hash = await bcrypt.hash(password, 12);

    const { error: dbError } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('id', decoded.id);

    if (dbError) throw dbError;

    // Revoke all refresh tokens for this user after password reset
    await supabase.from('refresh_tokens').delete().eq('user_id', decoded.id);
    await logAudit(decoded.id, 'PASSWORD_RESET', 'users', decoded.id, null, null);

    return success(res, { message: 'Password reset successfully' });
  } catch (err) {
    return error(res, 'Invalid or expired reset token', 401, 'INVALID_RESET_TOKEN');
  }
};

module.exports = { register, login, logout, refresh, forgotPassword, resetPassword };
