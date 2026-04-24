const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { paginate, paginationMeta } = require('../utils/pagination');
const { logAudit } = require('../services/audit.service');

const ALLOWED_UPDATE_FIELDS = [
  'specialization', 'experience_years', 'available_days',
  'available_from', 'available_to', 'slot_duration', 'bio', 'is_active',
];

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

// Parse YYYY-MM-DD safely without timezone shift
const parseDateUTC = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const listDoctors = async (req, res) => {
  try {
    const { page, limit, offset } = paginate(req.query);
    const { specialization, search } = req.query;

    let query = supabase
      .from('doctors')
      .select(`
        id, specialization, experience_years, available_days,
        available_from, available_to, slot_duration, bio, is_active,
        users!inner(id, name, email)
      `, { count: 'exact' })
      .eq('is_active', true)
      .range(offset, offset + limit - 1);

    if (specialization) query = query.eq('specialization', specialization);
    if (search) query = query.ilike('users.name', `%${search}%`);

    const { data, error: dbError, count } = await query;
    if (dbError) throw dbError;

    return success(res, data, 200, paginationMeta(count, page, limit));
  } catch (err) {
    return error(res, err.message || 'Failed to fetch doctors', 500);
  }
};

const getDoctor = async (req, res) => {
  try {
    const { data, error: dbError } = await supabase
      .from('doctors')
      .select(`
        id, specialization, experience_years, available_days,
        available_from, available_to, slot_duration, bio, is_active,
        users!inner(id, name, email)
      `)
      .eq('id', req.params.id)
      .single();

    if (dbError || !data) return error(res, 'Doctor not found', 404, 'NOT_FOUND');

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to fetch doctor', 500);
  }
};

const getDoctorSlots = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return error(res, 'date query param required (YYYY-MM-DD)', 400, 'MISSING_DATE');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return error(res, 'Date must be in YYYY-MM-DD format', 400, 'INVALID_DATE');
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const requestedDate = parseDateUTC(date);
    if (requestedDate < today) {
      return error(res, 'Cannot fetch slots for a past date', 400, 'PAST_DATE');
    }

    const { data: doctor, error: dbError } = await supabase
      .from('doctors')
      .select('available_days, available_from, available_to, slot_duration, is_active')
      .eq('id', req.params.id)
      .single();

    if (dbError || !doctor) return error(res, 'Doctor not found', 404, 'NOT_FOUND');
    if (!doctor.is_active) return error(res, 'Doctor is not active', 400, 'DOCTOR_INACTIVE');

    // Use UTC day to avoid timezone shift
    const dayName = DAY_NAMES[requestedDate.getUTCDay()];
    if (!doctor.available_days.includes(dayName)) {
      return success(res, { slots: [], message: 'Doctor not available on this day' });
    }

    const allSlots = generateSlots(doctor.available_from, doctor.available_to, doctor.slot_duration);

    const { data: booked } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('doctor_id', req.params.id)
      .eq('appointment_date', date)
      .in('status', ['pending', 'confirmed']);

    const bookedTimes = new Set((booked || []).map(a => a.appointment_time.slice(0, 5)));
    const slots = allSlots.map(time => ({ time, available: !bookedTimes.has(time) }));

    return success(res, { slots });
  } catch (err) {
    return error(res, err.message || 'Failed to fetch slots', 500);
  }
};

const createDoctor = async (req, res) => {
  try {
    const {
      user_id, specialization, experience_years,
      available_days, available_from, available_to, slot_duration, bio,
    } = req.body;

    if (available_from >= available_to) {
      return error(res, 'available_from must be before available_to', 400, 'INVALID_HOURS');
    }

    const { data: existing } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', user_id)
      .single();

    if (existing) return error(res, 'Doctor profile already exists for this user', 409, 'DOCTOR_EXISTS');

    const { data, error: dbError } = await supabase
      .from('doctors')
      .insert({ user_id, specialization, experience_years, available_days, available_from, available_to, slot_duration, bio })
      .select()
      .single();

    if (dbError) throw dbError;

    await logAudit(req.user.id, 'CREATE_DOCTOR', 'doctors', data.id, null, data);

    return success(res, data, 201);
  } catch (err) {
    return error(res, err.message || 'Failed to create doctor', 500);
  }
};

const updateDoctor = async (req, res) => {
  try {
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => ALLOWED_UPDATE_FIELDS.includes(k))
    );

    if (Object.keys(updates).length === 0) {
      return error(res, 'No valid fields to update', 400, 'NO_FIELDS');
    }

    // Validate hours consistency if both provided
    const from = updates.available_from;
    const to = updates.available_to;
    if (from && to && from >= to) {
      return error(res, 'available_from must be before available_to', 400, 'INVALID_HOURS');
    }

    const { data: existing, error: fetchErr } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchErr || !existing) return error(res, 'Doctor not found', 404, 'NOT_FOUND');

    const { data, error: dbError } = await supabase
      .from('doctors')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (dbError) throw dbError;

    await logAudit(req.user.id, 'UPDATE_DOCTOR', 'doctors', req.params.id, existing, data);

    return success(res, data);
  } catch (err) {
    return error(res, err.message || 'Failed to update doctor', 500);
  }
};

const deleteDoctor = async (req, res) => {
  try {
    // Block deactivation if there are pending/confirmed appointments
    const { count } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('doctor_id', req.params.id)
      .in('status', ['pending', 'confirmed']);

    if (count > 0) {
      return error(
        res,
        `Cannot deactivate doctor with ${count} active appointment(s). Resolve them first.`,
        409,
        'HAS_ACTIVE_APPOINTMENTS'
      );
    }

    const { data: existing } = await supabase
      .from('doctors')
      .select('*')
      .eq('id', req.params.id)
      .single();

    const { error: dbError } = await supabase
      .from('doctors')
      .update({ is_active: false })
      .eq('id', req.params.id);

    if (dbError) throw dbError;

    await logAudit(req.user.id, 'DEACTIVATE_DOCTOR', 'doctors', req.params.id, existing, { is_active: false });

    return success(res, { message: 'Doctor deactivated' });
  } catch (err) {
    return error(res, err.message || 'Failed to delete doctor', 500);
  }
};

module.exports = { listDoctors, getDoctor, getDoctorSlots, createDoctor, updateDoctor, deleteDoctor };
