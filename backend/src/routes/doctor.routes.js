const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  listDoctors, getDoctor, getDoctorSlots,
  createDoctor, updateDoctor, deleteDoctor,
  getMyProfile, updateMyProfile, uploadImage,
} = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createDoctorSchema, updateDoctorSchema } = require('../validators/doctor.validator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// Doctor self-profile (must be before /:id to avoid route conflict)
router.get('/me', authenticate, authorize('doctor'), getMyProfile);
router.patch('/me', authenticate, authorize('doctor'), validate(updateDoctorSchema), updateMyProfile);

// Public
router.get('/', listDoctors);
router.get('/:id', getDoctor);
router.get('/:id/slots', getDoctorSlots);

// Admin only
router.post('/', authenticate, authorize('admin'), validate(createDoctorSchema), createDoctor);
router.put('/:id', authenticate, authorize('admin'), validate(updateDoctorSchema), updateDoctor);
router.delete('/:id', authenticate, authorize('admin'), deleteDoctor);

// Image upload (admin or the doctor themselves)
router.patch('/:id/image', authenticate, authorize('admin', 'doctor'), upload.single('image'), uploadImage);

module.exports = router;
