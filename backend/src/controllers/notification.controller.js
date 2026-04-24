const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { paginate, paginationMeta } = require('../utils/pagination');

const listNotifications = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { unread_only } = req.query;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unread_only === 'true') query = query.eq('is_read', false);

    const { data, error: dbError, count } = await query;
    if (dbError) throw dbError;

    return success(res, data, 200, paginationMeta(count, page, limit));
  } catch (err) {
    return error(res, err.message || 'Failed to fetch notifications', 500);
  }
};

const markRead = async (req, res) => {
  try {
    const { error: dbError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', req.params.id)
      .eq('user_id', req.user.id);

    if (dbError) throw dbError;

    return success(res, { message: 'Marked as read' });
  } catch (err) {
    return error(res, err.message || 'Failed to mark notification', 500);
  }
};

const markAllRead = async (req, res) => {
  try {
    const { error: dbError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    if (dbError) throw dbError;

    return success(res, { message: 'All notifications marked as read' });
  } catch (err) {
    return error(res, err.message || 'Failed to mark all notifications', 500);
  }
};

module.exports = { listNotifications, markRead, markAllRead };
