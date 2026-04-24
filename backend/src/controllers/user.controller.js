const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { paginate, paginationMeta } = require('../utils/pagination');

const listUsers = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { role, search } = req.query;

    let query = supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at', { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (role) query = query.eq('role', role);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error: dbError, count } = await query;
    if (dbError) throw dbError;

    return success(res, data, 200, paginationMeta(count, page, limit));
  } catch (err) {
    return error(res, err.message || 'Failed to fetch users', 500);
  }
};

const getUser = async (req, res) => {
  try {
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('id', req.params.id)
      .single();

    if (dbError || !data) return error(res, 'User not found', 404, 'NOT_FOUND');

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to fetch user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const allowed = ['name', 'is_active'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return error(res, 'No valid fields to update', 400, 'NO_FIELDS');
    }

    const { data, error: dbError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.params.id)
      .select('id, name, email, role, is_active, created_at')
      .single();

    if (dbError) throw dbError;
    if (!data) return error(res, 'User not found', 404, 'NOT_FOUND');

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to update user', 500);
  }
};

const getMe = async (req, res) => {
  try {
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('id', req.user.id)
      .single();

    if (dbError || !data) return error(res, 'User not found', 404, 'NOT_FOUND');

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to fetch profile', 500);
  }
};

const updateMe = async (req, res) => {
  try {
    const allowed = ['name'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return error(res, 'No valid fields to update', 400, 'NO_FIELDS');
    }

    const { data, error: dbError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.id)
      .select('id, name, email, role, is_active, created_at')
      .single();

    if (dbError) throw dbError;

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to update profile', 500);
  }
};

module.exports = { listUsers, getUser, updateUser, getMe, updateMe };
