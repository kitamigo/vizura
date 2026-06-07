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
router.post('/payruns', protect, managerOnly, createPayRun);

// list all pay runs
router.get('/payruns', protect, managerOnly, listPayRuns);

// gets payslips for an employee
router.get('/payslips/:employeeId', protect, getPayslips);

// downloads payslip as PDF
router.get('/payslips/:id/pdf', protect, downloadPayslipPDF);

module.exports = router;