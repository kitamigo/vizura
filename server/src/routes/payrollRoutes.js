const express = require('express');
const {
  createPayRun,
  listPayRuns,
  getPayslips,
  downloadPayslipPDF,
} = require('../controllers/payrollController');
const { protect, managerOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// create a new pay run
router.post('/payruns', createPayRun);

// list all pay runs
router.get('/payruns', listPayRuns);

// get payslips for an employee
router.get('/payslips/:employeeId', getPayslips);

// download payslip as PDF
router.get('/payslips/:id/pdf', downloadPayslipPDF);

module.exports = router;