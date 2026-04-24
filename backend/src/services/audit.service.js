const supabase = require('../config/supabase');
const logger = require('../config/logger');

const logAudit = async (userId, action, tableName, recordId, oldData, newData) => {
  try {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: oldData,
      new_data: newData,
    });
  } catch (err) {
    // Audit failures must never break business logic, but always warn
    logger.warn('Audit log failed', { action, tableName, recordId, error: err.message });
  }
};

module.exports = { logAudit };
