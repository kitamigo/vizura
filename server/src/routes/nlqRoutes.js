const express = require('express');
const {
  queryNlq,
  getNlqHistory,
} = require('../controllers/nlqController');

const router = express.Router();

// Submits an nlq against the uploaded dataset
router.post('/query', queryNlq);

// Retrieves recent query history
router.get('/history', getNlqHistory);

module.exports = router;