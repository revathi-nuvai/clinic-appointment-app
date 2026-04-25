const supabase = require('../config/supabase');
const logger = require('../config/logger');

const createNotification = async (userId, { title, message, type = 'info' }) => {
  const { error } = await supabase
    .from('notifications')
    .insert({ user_id: userId, title, message, type });
  if (error) logger.warn('Failed to create notification', { userId, title, error: error.message });
};

const notifyAppointmentBooked = async ({ patientId, doctorUserId, appointment }) => {
  const date = appointment.appointment_date;
  const time = appointment.appointment_time?.slice(0, 5);
  await Promise.all([
    createNotification(patientId, {
      title: 'Appointment Booked',
      message: `Your appointment on ${date} at ${time} is pending confirmation.`,
      type: 'info',
    }),
    createNotification(doctorUserId, {
      title: 'New Appointment Request',
      message: `A patient has booked an appointment on ${date} at ${time}.`,
      type: 'info',
    }),
  ]);
};

const notifyAppointmentConfirmed = async ({ patientId, appointment }) => {
  const date = appointment.appointment_date;
  const time = appointment.appointment_time?.slice(0, 5);
  await createNotification(patientId, {
    title: 'Appointment Confirmed',
    message: `Your appointment on ${date} at ${time} has been confirmed.`,
    type: 'success',
  });
};

const notifyAppointmentCancelled = async ({ patientId, doctorUserId, appointment, cancelledByRole }) => {
  const date = appointment.appointment_date;
  const time = appointment.appointment_time?.slice(0, 5);
  const byWhom = cancelledByRole === 'doctor' ? 'the doctor' : 'you';
  await Promise.all([
    createNotification(patientId, {
      title: 'Appointment Cancelled',
      message: `Your appointment on ${date} at ${time} was cancelled by ${byWhom}.`,
      type: 'warning',
    }),
    doctorUserId && cancelledByRole !== 'doctor'
      ? createNotification(doctorUserId, {
          title: 'Appointment Cancelled',
          message: `A patient cancelled their appointment on ${date} at ${time}.`,
          type: 'warning',
        })
      : Promise.resolve(),
  ]);
};

const notifyAppointmentCompleted = async ({ patientId, appointment }) => {
  const date = appointment.appointment_date;
  const time = appointment.appointment_time?.slice(0, 5);
  await createNotification(patientId, {
    title: 'Appointment Completed',
    message: `Your appointment on ${date} at ${time} has been marked as completed.`,
    type: 'success',
  });
};

module.exports = {
  createNotification,
  notifyAppointmentBooked,
  notifyAppointmentConfirmed,
  notifyAppointmentCancelled,
  notifyAppointmentCompleted,
};
