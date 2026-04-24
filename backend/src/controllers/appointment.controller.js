const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { paginate, paginationMeta } = require('../utils/pagination');
const { logAudit } = require('../services/audit.service');

// Terminal states cannot be changed
const TERMINAL_STATES = new Set(['cancelled', 'completed']);

// Allowed transitions: current → allowed next states
const ALLOWED_TRANSITIONS = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: [],
};

const parseDateUTC = (dateInput) => {
  if (dateInput instanceof Date) return dateInput;
  const [y, m, d] = dateInput.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const generateSlots = (availableFrom, availableTo, slotDuration) => {
  const slots = [];
  const [fromH, fromM] = availableFrom.split(':').map(Number);
  const [toH, toM] = availableTo.split(':').map(Number);
  let current = fromH * 60 + fromM;
  const end = toH * 60 + toM;
  while (current + slotDuration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += slotDuration;
  }
  return slots;
};

const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, appointment_date, appointment_time, reason } = req.body;
    const patient_id = req.user.id;

    // Joi date().iso() converts to Date object — normalize to YYYY-MM-DD string for DB
    const requestedDate = parseDateUTC(appointment_date);
    const dateString = requestedDate.toISOString().split('T')[0];

    // Reject past dates (Joi min('now') covers this but double-check at controller level)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return error(res, 'Cannot book an appointment in the past', 400, 'PAST_DATE');
    }

    const { data: doctor, error: drErr } = await supabase
      .from('doctors')
      .select('available_days, available_from, available_to, slot_duration, is_active')
      .eq('id', doctor_id)
      .single();

    if (drErr || !doctor) return error(res, 'Doctor not found', 404, 'NOT_FOUND');
    if (!doctor.is_active) return error(res, 'Doctor is not active', 400, 'DOCTOR_INACTIVE');

    const dayName = DAY_NAMES[requestedDate.getUTCDay()];
    if (!doctor.available_days.includes(dayName)) {
      return error(res, 'Doctor not available on this day', 400, 'NOT_AVAILABLE');
    }

    // Validate appointment_time is an actual slot
    const validSlots = generateSlots(doctor.available_from, doctor.available_to, doctor.slot_duration);
    const normalizedTime = appointment_time.slice(0, 5);
    if (!validSlots.includes(normalizedTime)) {
      return error(res, 'Invalid time slot for this doctor', 400, 'INVALID_SLOT');
    }

    const { data: apt, error: dbError } = await supabase
      .from('appointments')
      .insert({ patient_id, doctor_id, appointment_date: dateString, appointment_time: normalizedTime, reason, status: 'pending' })
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
        patient_id, doctor_id,
        patient:users!patient_id(id, name, email),
        doctor:doctors!doctor_id(id, specialization, user_id, user:users!user_id(id, name))
      `)
      .eq('id', req.params.id)
      .single();

    if (dbError || !data) return error(res, 'Appointment not found', 404, 'NOT_FOUND');

    const user = req.user;

    if (user.role === 'patient' && data.patient_id !== user.id) {
      return error(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    if (user.role === 'doctor') {
      const { data: doc } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!doc || doc.id !== data.doctor_id) {
        return error(res, 'Forbidden', 403, 'FORBIDDEN');
      }
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

    // Enforce state transition rules
    if (TERMINAL_STATES.has(existing.status)) {
      return error(
        res,
        `Cannot change a ${existing.status} appointment`,
        409,
        'INVALID_TRANSITION'
      );
    }

    const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      return error(
        res,
        `Cannot transition from '${existing.status}' to '${status}'`,
        409,
        'INVALID_TRANSITION'
      );
    }

    const user = req.user;

    if (user.role === 'patient') {
      if (existing.patient_id !== user.id) return error(res, 'Forbidden', 403, 'FORBIDDEN');
      if (status !== 'cancelled') return error(res, 'Patients can only cancel appointments', 403, 'FORBIDDEN');
    }

    if (user.role === 'doctor') {
      const { data: doc } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single();
      if (!doc || doc.id !== existing.doctor_id) return error(res, 'Forbidden', 403, 'FORBIDDEN');
    }

    const updates = { status };
    if (notes !== undefined) updates.notes = notes;
    if (cancel_reason !== undefined) updates.cancel_reason = cancel_reason;
    if (status === 'cancelled') updates.cancelled_by = user.id;

    const { data, error: dbError } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (dbError) throw dbError;

    await logAudit(user.id, `APPOINTMENT_${status.toUpperCase()}`, 'appointments', id, existing, data);

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to update appointment', 500);
  }
};

module.exports = { bookAppointment, listAppointments, getAppointment, updateAppointmentStatus };
