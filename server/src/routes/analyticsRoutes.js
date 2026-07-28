const express = require('express');
const multer = require('multer');
const {
  getSavedForecast,
  runForecast,
  getAnomalies,
  uploadCsv,
  getRevenueTrend,
} = require('../controllers/analyticsController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Uploads CSV file to generate analytics (forecast + anomaly detection)
router.post('/upload', upload.single('file'), uploadCsv);

// Gets the saved forecast from the latest upload
router.get('/forecast', getSavedForecast);

// Runs a new forecast on-demand
router.post('/forecast', runForecast);

// Gets anomalies from the latest upload
router.get('/anomalies', getAnomalies);

// Gets real historical revenue trend
router.get('/revenue-trend', getRevenueTrend);

module.exports = router;