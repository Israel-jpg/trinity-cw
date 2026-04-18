const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  deleteInquiry
} = require('../controllers/inquiryController');

const protect = require('../middleware/authMiddleware');

// PUBLIC (users can send messages)
router.post('/', createInquiry);

// ADMIN ONLY
router.get('/', protect, getInquiries);
router.delete('/:id', protect, deleteInquiry);

module.exports = router;