const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { paginate, paginationMeta } = require('../utils/pagination');
const { logAudit } = require('../services/audit.service');

const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    const patient_id = req.user.id;

    const dayName = new Date(appointment_date).toLocaleDateString('en-US', { weekday: 'long' });
    const { data: doctor, error: drErr } = await supabase
      .from('doctors')
      .select('available_days, available_from, available_to, slot_duration, is_active')
      .eq('id', doctor_id)
      .single();

    if (drErr || !doctor) return error(res, 'Doctor not found', 404, 'NOT_FOUND');
    if (!doctor.is_active) return error(res, 'Doctor is not active', 400, 'DOCTOR_INACTIVE');
    if (!doctor.available_days.includes(dayName)) {
      return error(res, 'Doctor not available on this day', 400, 'NOT_AVAILABLE');
    }

    const { data: apt, error: dbError } = await supabase
      .from('appointments')
      .insert({ patient_id, doctor_id, appointment_date, appointment_time, reason, status: 'pending' })
      .select()
      .single();

    if (dbError) {
      if (dbError.code === '23505') {
        return error(res, 'This time slot is already booked', 409, 'SLOT_TAKEN');
      }
      throw dbError;
    }

    await logAudit(patient_id, 'BOOK_APPOINTMENT', 'appointments', apt.id, null, apt);

    return success(res, apt, 201);
  } catch (err) {
    return error(res, err.message || 'Failed to book appointment', 500);
  }
};

const listAppointments = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { status, date } = req.query;
    const user = req.user;

    let query = supabase
      .from('appointments')
      .select(`
        id, appointment_date, appointment_time, reason, status, notes, cancel_reason, created_at,
        patient:users!patient_id(id, name, email),
        doctor:doctors!doctor_id(id, specialization, user:users!user_id(id, name))
      `, { count: 'exact' })
      .range(offset, offset + limit - 1)
      .order('appointment_date', { ascending: false });

    if (user.role === 'patient') query = query.eq('patient_id', user.id);
    if (user.role === 'doctor') {
      const { data: doc } = await supabase.from('doctors').select('id').eq('user_id', user.id).single();
      if (doc) query = query.eq('doctor_id', doc.id);
    }

    if (status) query = query.eq('status', status);
    if (date) query = query.eq('appointment_date', date);

    const { data, error: dbError, count } = await query;
    if (dbError) throw dbError;

    return success(res, data, 200, paginationMeta(count, page, limit));
  } catch (err) {
    return error(res, err.message || 'Failed to fetch appointments', 500);
  }
};

const getAppointment = async (req, res) => {
  try {
    const { data, error: dbError } = await supabase
      .from('appointments')
      .select(`
        id, appointment_date, appointment_time, reason, status, notes, cancel_reason, created_at,
        patient:users!patient_id(id, name, email),
        doctor:doctors!doctor_id(id, specialization, user:users!user_id(id, name))
      `)
      .eq('id', req.params.id)
      .single();

    if (dbError || !data) return error(res, 'Appointment not found', 404, 'NOT_FOUND');

    const user = req.user;
    if (user.role === 'patient' && data.patient.id !== user.id) {
      return error(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to fetch appointment', 500);
  }
};

const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, notes, cancel_reason } = req.body;
    const { id } = req.params;

    const { data: existing, error: fetchErr } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !existing) return error(res, 'Appointment not found', 404, 'NOT_FOUND');

    const user = req.user;
    if (user.role === 'patient') {
      if (existing.patient_id !== user.id) return error(res, 'Forbidden', 403, 'FORBIDDEN');
      if (status !== 'cancelled') return error(res, 'Patients can only cancel', 403, 'FORBIDDEN');
    }

    const updates = { status };
    if (notes !== undefined) updates.notes = notes;
    if (cancel_reason !== undefined) updates.cancel_reason = cancel_reason;

    const { data, error: dbError } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;

    await logAudit(user.id, `UPDATE_STATUS_${status.toUpperCase()}`, 'appointments', id, existing, data);

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to update appointment', 500);
  }
};

module.exports = { bookAppointment, listAppointments, getAppointment, updateAppointmentStatus };
