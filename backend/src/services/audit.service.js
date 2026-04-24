const supabase = require('../config/supabase');

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
  } catch {
    // Audit failures must never break business logic
  }
};

module.exports = { logAudit };
