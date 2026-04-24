const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
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

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already exists
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
      return error(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const { password_hash, ...safeUser } = user;
    const { accessToken, refreshToken } = generateTokens(safeUser);

    return success(res, { user: safeUser, accessToken, refreshToken });
  } catch (err) {
    return error(res, err.message || 'Login failed', 500);
  }
};

const logout = async (req, res) => {
  return success(res, { message: 'Logged out successfully' });
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);

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

    const tokens = generateTokens(user);
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

    // Always return success (don't reveal if email exists)
    if (!user) {
      return success(res, { message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    // TODO: send email with resetToken (Week 5 — email service)
    // For now log it
    console.log(`Reset token for ${email}: ${resetToken}`);

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

    return success(res, { message: 'Password reset successfully' });
  } catch (err) {
    return error(res, 'Invalid or expired reset token', 401, 'INVALID_RESET_TOKEN');
  }
};

module.exports = { register, login, logout, refresh, forgotPassword, resetPassword };
