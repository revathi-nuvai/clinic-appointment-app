const express = require('express');
const router = express.Router();
const { listUsers, getUser, updateUser, getMe, updateMe } = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);

// Current user profile
router.get('/me', getMe);
router.patch('/me', updateMe);

// Admin only
router.get('/', authorize('admin'), listUsers);
router.get('/:id', authorize('admin'), getUser);
router.patch('/:id', authorize('admin'), updateUser);

module.exports = router;
