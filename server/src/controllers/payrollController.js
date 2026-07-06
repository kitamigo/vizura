const db = require('../config/db');
const { calcPayRun } = require('../utils/payrollEngine');
const { isPublicHoliday } = require('../utils/nzHolidays');

async function createPayRun(req, res) {
  try {
    const { employeeIds, payPeriod } = req.body;
    const { start, end, weeks } = payPeriod || {};

    if (!employeeIds?.length || !start || !end || !weeks) {
      return res.status(400).json({
        error: 'employeeIds, payPeriod.start, payPeriod.end and payPeriod.weeks are required'
      });
    }

    // Gets business and region //
    const bizResult = await db.query(
      'SELECT business_id, public_holiday_region FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );

    if (!bizResult.rows.length) {
      return res.status(404).json({ message: 'No business found for this user' });
    }

    const { business_id, public_holiday_region } = bizResult.rows[0];
    const region = public_holiday_region || 'Canterbury';

        // Fetchs employees with tax and KiwiSaver details //
    const employeeResult = await db.query(
      `SELECT e.employee_id,
              u.first_name || ' ' || u.last_name AS name,
              e.hourly_rate,
              e.contract_type,
              e.tax_code,
              e.kiwisaver_rate,
              e.ird_number
       FROM employees e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.employee_id = ANY($1) AND e.business_id = $2`,
      [employeeIds, business_id]
    );

    if (!employeeResult.rows.length) {
      return res.status(404).json({ message: 'No matching employees found for this business' });
    }

    // Fetchs shifts //
    const shiftResult = await db.query(
      `SELECT employee_id, date, hours_worked
       FROM shifts
       WHERE employee_id = ANY($1)
         AND date >= $2 AND date <= $3`,
      [employeeIds, start, end]
    );

    const allShifts = shiftResult.rows;
    const results = [];

    for (const emp of employeeResult.rows) {
      const empShifts = allShifts.filter(
        s => String(s.employee_id) === String(emp.employee_id)
      );

      // Calculates hours and detects public holidays from shifts //
      let regularHours = 0;
      let overtimeHours = 0;
      const publicHolidays = [];

      for (const shift of empShifts) {
        const dateStr = new Date(shift.date).toISOString().split('T')[0];
        const hours = parseFloat(shift.hours_worked) || 0;

        if (isPublicHoliday(dateStr, region)) {
          publicHolidays.push({ date: dateStr, hoursWorked: hours, worked: true });
        } else {
          // no OT in NZ unless stated in employment contract
          regularHours += hours;
        }
      }

            // Builds objects in the shape the engine expects //
      const engineEmployee = {
        hourlyRate: parseFloat(emp.hourly_rate),
        employmentType: emp.contract_type,
        wageType: 'adult',
        usualDaysPerWeek: 5,
        taxCode: emp.tax_code || 'M',
        kiwisaverRate: emp.kiwisaver_rate != null ? parseFloat(emp.kiwisaver_rate) : null,
      };

      const enginePayPeriod = {
        regularHours,
        overtimeHours: 0,
        publicHolidays,
        leaveDaysTaken: 0,
        owp: parseFloat(emp.hourly_rate) * 40,
        awe: parseFloat(emp.hourly_rate) * 40,
      };

      // Fetch YTD values from the most recent payslip for this employee //
      let ytdGross = 0;
      let ytdPAYE = 0;
      let ytdKiwiSaver = 0;
      const ytdResult = await db.query(
        `SELECT ytd_gross, ytd_paye, ytd_kiwisaver FROM payslips
         WHERE employee_id = $1 ORDER BY payslip_id DESC LIMIT 1`,
        [emp.employee_id]
      );
      if (ytdResult.rows.length) {
        ytdGross = parseFloat(ytdResult.rows[0].ytd_gross) || 0;
        ytdPAYE = parseFloat(ytdResult.rows[0].ytd_paye) || 0;
        ytdKiwiSaver = parseFloat(ytdResult.rows[0].ytd_kiwisaver) || 0;
      }

      // Wage error handling so an incorrect employee setup doesnt break pay run //
      let result;
      try {
        result = calcPayRun(engineEmployee, enginePayPeriod, { ytdGross, ytdPAYE, ytdKiwiSaver });
      } catch (wageError) {
        results.push({ employee_id: emp.employee_id, name: emp.name, error: wageError.message });
        continue;
      }

      // Persist payslip with updated YTD totals //
      const newYtdGross = ytdGross + result.grossPay;
      const newYtdPAYE = ytdPAYE + result.payeTax;
      const newYtdKiwiSaver = ytdKiwiSaver + result.kiwisaverEmployee;

      const persistResult = await db.query(
        `INSERT INTO payslips
         (employee_id, business_id, pay_period_start, pay_period_end,
          gross_pay, paye_tax, kiwisaver_employee, kiwisaver_employer,
          total_deductions, net_pay,
          ytd_gross, ytd_paye, ytd_kiwisaver)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING payslip_id`,
        [
          emp.employee_id, business_id, start, end,
          result.grossPay, result.payeTax, result.kiwisaverEmployee, result.kiwisaverEmployer,
          result.totalDeductions, result.netPay,
          newYtdGross, newYtdPAYE, newYtdKiwiSaver
        ]
      );

      results.push({
        payslip_id: persistResult.rows[0].payslip_id,
        employee_id: emp.employee_id,
        name: emp.name,
        ...result,
      });
    }

    res.status(201).json({ results });

  } catch (error) {
    console.error('createPayRun error:', error.message);
    res.status(500).json({ error: error.message });
  }
}

async function downloadPayslipPDF(req, res) {
  res.status(501).json({ error: 'PDF generation not yet implemented' });
}

async function listPayRuns(req, res) {
  res.json({ payRuns: [] });
}

async function getPayslips(req, res) {
  res.json({ payslips: [] });
}

async function generatePayslipPDFFromRequest(req, res) {
  res.status(501).json({ error: 'PDF generation not yet implemented' });
}

module.exports = {
  createPayRun,
  listPayRuns,
  getPayslips,
  downloadPayslipPDF,
  generatePayslipPDFFromRequest,
};