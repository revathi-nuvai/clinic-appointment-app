const { RESEND_API_KEY, FRONTEND_URL } = require('../config/env');

const sendEmail = async ({ to, subject, html }) => {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Clinic App <noreply@clinic.app>',
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
};

const sendPasswordReset = (email, resetToken) =>
  sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${FRONTEND_URL}/reset-password?token=${resetToken}">here</a> to reset your password. Link expires in 1 hour.</p>`,
  });

const sendAppointmentConfirmation = (email, appointment) =>
  sendEmail({
    to: email,
    subject: 'Appointment Confirmed',
    html: `<p>Your appointment on <b>${appointment.appointment_date}</b> at <b>${appointment.appointment_time}</b> has been confirmed.</p>`,
  });

const sendAppointmentCancellation = (email, appointment) =>
  sendEmail({
    to: email,
    subject: 'Appointment Cancelled',
    html: `<p>Your appointment on <b>${appointment.appointment_date}</b> at <b>${appointment.appointment_time}</b> has been cancelled.</p>`,
  });

module.exports = { sendEmail, sendPasswordReset, sendAppointmentConfirmation, sendAppointmentCancellation };
