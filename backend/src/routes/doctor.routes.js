const express = require('express');
const router = express.Router();
const {
  listDoctors, getDoctor, getDoctorSlots,
  createDoctor, updateDoctor, deleteDoctor,
} = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createDoctorSchema, updateDoctorSchema } = require('../validators/doctor.validator');

// Public
router.get('/', listDoctors);
router.get('/:id', getDoctor);
router.get('/:id/slots', getDoctorSlots);

// Admin only
router.post('/', authenticate, authorize('admin'), validate(createDoctorSchema), createDoctor);
router.put('/:id', authenticate, authorize('admin'), validate(updateDoctorSchema), updateDoctor);
router.delete('/:id', authenticate, authorize('admin'), deleteDoctor);

module.exports = router;
