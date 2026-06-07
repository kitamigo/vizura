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

    // get business and region
    const bizResult = await db.query(
      'SELECT business_id, public_holiday_region FROM businesses WHERE user_id = $1',
      [req.user.user_id]
    );

    if (!bizResult.rows.length) {
      return res.status(404).json({ message: 'No business found for this user' });
    }

    const { business_id, public_holiday_region } = bizResult.rows[0];
    const region = public_holiday_region || 'Canterbury';

    // fetch employees
    const employeeResult = await db.query(
      `SELECT e.employee_id,
              u.first_name || ' ' || u.last_name AS name,
              e.hourly_rate,
              e.contract_type
       FROM employees e
       JOIN users u ON e.user_id = u.user_id
       WHERE e.employee_id = ANY($1) AND e.business_id = $2`,
      [employeeIds, business_id]
    );

    if (!employeeResult.rows.length) {
      return res.status(404).json({ message: 'No matching employees found for this business' });
    }

    // fetch shifts
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

      // calculate hours and detect public holidays from shifts
      let regularHours = 0;
      let overtimeHours = 0;
      let weeklyHoursTotal = 0;
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

      // build objects in the shape the engine expects
      const engineEmployee = {
        hourlyRate: parseFloat(emp.hourly_rate),
        employmentType: emp.contract_type,
        wageType: 'adult',
        usualDaysPerWeek: 5,
      };

      const enginePayPeriod = {
        regularHours,
        overtimeHours: 0,
        publicHolidays,
        leaveDaysTaken: 0,
        owp: parseFloat(emp.hourly_rate) * 40,
        awe: parseFloat(emp.hourly_rate) * 40,
      };

      const result = calcPayRun(engineEmployee, enginePayPeriod);

      results.push({
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
async function listPayRuns(req, res) {
  res.json({ payRuns: [] });
}

async function getPayslips(req, res) {
  res.json({ payslips: [] });
}

async function downloadPayslipPDF(req, res) {
  res.json({ message: 'PDF generation coming soon' });
}

module.exports = {
  createPayRun,
  listPayRuns,
  getPayslips,
  downloadPayslipPDF,
};