const express = require('express');
const router = express.Router();
const {
  bookAppointment, listAppointments, getAppointment, updateAppointmentStatus,
} = require('../controllers/appointment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { bookAppointmentSchema, updateStatusSchema } = require('../validators/appointment.validator');

router.use(authenticate);

router.post('/', authorize('patient'), validate(bookAppointmentSchema), bookAppointment);
router.get('/', authorize('patient', 'doctor', 'admin'), listAppointments);
router.get('/:id', authorize('patient', 'doctor', 'admin'), getAppointment);
router.patch('/:id/status', authorize('patient', 'doctor', 'admin'), validate(updateStatusSchema), updateAppointmentStatus);

module.exports = router;
