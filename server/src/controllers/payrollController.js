const { calcPayRun } = require('../utils/payrollEngine');
const { isPublicHoliday } = require('../utils/nzHolidays');

// create a new pay run
async function createPayRun(req, res) {
  try {
    const { employee, payPeriod } = req.body;

    // validate required fields
    if (!employee || !payPeriod) {
      return res.status(400).json({ error: 'employee and payPeriod required' });
    }

    // calculate the pay run
    const payRun = calcPayRun(employee, payPeriod);

    // TODO: save to database
    res.status(201).json(payRun);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

// list pay runs
async function listPayRuns(req, res) {
  try {
    // TODO: fetch from database with optional filters
    // const { startDate, endDate, employeeId } = req.query;
    const payRuns = [];
    res.json(payRuns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// get payslips for an employee
async function getPayslips(req, res) {
  try {
    const { employeeId } = req.params;

    if (!employeeId) {
      return res.status(400).json({ error: 'employeeId required' });
    }

    // TODO: fetch payslips from database for this employee
    const payslips = [];
    res.json(payslips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// download payslip as PDF
async function downloadPayslipPDF(req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'payslip id required' });
    }

    // TODO: fetch payslip, generate PDF, send to client
    res.json({ message: 'PDF generation not yet implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createPayRun,
  listPayRuns,
  getPayslips,
  downloadPayslipPDF,
};