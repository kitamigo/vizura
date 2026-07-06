'use strict';
// owp = ordinary weekly pay, awe = average weekly earnings


const MIN_WAGE_ADULT = 23.95;
const MIN_WAGE_STARTING = 19.16;
const CASUAL_HOLIDAY_PAY = 0.08;
const PERMANENT_HOLIDAY_PAY = 4 / 52;
const PUBLIC_HOLIDAY_PAY = 1.5;

// PAYE tax brackets 
const PAYE_BRACKETS = [
  { min: 0, max: 14000, rate: 0.105 },
  { min: 14000, max: 48000, rate: 0.175 },
  { min: 48000, max: 70000, rate: 0.30 },
  { min: 70000, max: 180000, rate: 0.33 },
  { min: 180000, max: Infinity, rate: 0.39 },
];

const KIWISAVER_MINIMUM_EMPLOYER = 0.035; // 3.5% employer contribution (not deducted from employee)

// rounds dollars to cents (i.e. 101.235 = 101.24)
const roundCurrency = (amount) => Math.round(amount * 100) / 100;

// const that checks if the hourly rate meets NZ minimums
const validateMinWage = (hourlyRate, wageType = 'adult') => {
  const minimum = wageType === 'starting_out' ? MIN_WAGE_STARTING : MIN_WAGE_ADULT;
  if (hourlyRate < minimum) {
    throw new Error(
      `Hourly rate $${hourlyRate} is below the NZ ${wageType} minimum wage of $${minimum}`
    );
  }
};

// -- GROSS PAY -- //
const calcGrossPay = (regularHours, hourlyRate, overtimeHours = 0, overtimeRate = null) => {

  const regPay = roundCurrency(regularHours * hourlyRate);

  // calculates overtime only if hours and rate are provided
  const overtimePay = (overtimeHours > 0 && overtimeRate)
    ? roundCurrency(overtimeHours * overtimeRate)
    : 0;

  const basePay = roundCurrency(regPay + overtimePay);

  return { regPay, overtimePay, basePay };
};


// -- PUBLIC HOLIDAY PAY -- //
const calcPublicHolidayPay = (holiday, hourlyRate) => {
  const { worked, isNormalWorkDay, hoursWorked = 0, usualDailyHours = 0 } = holiday;

  const holidayPay = worked
    ? roundCurrency(hoursWorked * hourlyRate * PUBLIC_HOLIDAY_PAY)
    : roundCurrency(usualDailyHours * hourlyRate * (isNormalWorkDay ? 1 : 0));

  const alternativeHolidayEarned = worked && isNormalWorkDay;

  return { holidayPay, alternativeHolidayEarned };
};

// loops through all public holidays in the pay period and totals up the results
const calcAllPublicHolidayPay = (publicHolidays, hourlyRate) => {
  const { totalHolidayPay, alternativeHolidaysEarned } = publicHolidays.reduce(
    (acc, holiday) => {
      const { holidayPay, alternativeHolidayEarned } = calcPublicHolidayPay(holiday, hourlyRate);
      return {
        totalHolidayPay: acc.totalHolidayPay + holidayPay,
        alternativeHolidaysEarned: acc.alternativeHolidaysEarned + (alternativeHolidayEarned ? 1 : 0),
      };
    },
    { totalHolidayPay: 0, alternativeHolidaysEarned: 0 }
  );

  return {
    totalHolidayPay: roundCurrency(totalHolidayPay),
    alternativeHolidaysEarned,
  };
};


// -- LEAVE PAY -- //
const calcLeavePay = (leaveDays, owp, awe, usualDaysPerWeek = 5) => {
  // applies the greater-of rule (protects employees with variying/increasing earnings)
  const weeklyRate = Math.max(owp, awe);
  const rateUsed = weeklyRate === owp ? 'OWP' : 'AWE';

  // converts weekly rate to a daily rate then multiply by days taken
  const dailyRate = weeklyRate / usualDaysPerWeek;
  const leavePay = roundCurrency(leaveDays * dailyRate);

  return { leavePay, rateUsed };
};


// -- HOLIDAY PAY ACCRUAL -- //
const calcHolidayPayAccrued = (employmentType, grossEarnings, hoursWorked) => {
  if (employmentType === 'casual') {
    // casual employees - 8% holiday pay on top of every pay slip
    return {
      holidayPayAddition: roundCurrency(grossEarnings * CASUAL_HOLIDAY_PAY),
      leaveHoursAccrued: 0,
    };
  }

  // permanent employees accrue leave hours (controller writes these to leave_balances)
  const leaveHoursAccrued = roundCurrency(hoursWorked * PERMANENT_HOLIDAY_PAY);
  return {
    holidayPayAddition: 0,
    leaveHoursAccrued,
  };
};

// -- KIWISAVER CALCULATION -- //
// Returns employee KiwiSaver deduction if rate is set (null rate = not enrolled)
const calcKiwiSaver = (grossPay, kiwisaverRate) => {
  if (kiwisaverRate == null) {
    return {
      kiwisaverEmployee: 0,
      kiwisaverEmployer: 0,
    };
  }
  const rate = Math.min(kiwisaverRate, 10);
  const employee = roundCurrency(grossPay * (rate / 100));
  const employer = roundCurrency(grossPay * KIWISAVER_MINIMUM_EMPLOYER);
  return { kiwisaverEmployee: employee, kiwisaverEmployer: employer };
};

// -- PAYE TAX CALCULATION -- //
const calcPAYETax = (grossPay, taxCode = 'M', ytdGross = 0) => {
  if (grossPay <= 0) return 0;

  // Estimate annual income
  const annualisedIncome = ytdGross > 0
    ? ytdGross + grossPay
    : grossPay * 52;

  // Calculate annual tax
  let annualTax = 0;
  let remainingAnnualIncome = annualisedIncome;
  for (const bracket of PAYE_BRACKETS) {
    if (remainingAnnualIncome <= 0) break;
    const taxableInBracket = Math.min(remainingAnnualIncome, bracket.max - bracket.min);
    annualTax += taxableInBracket * bracket.rate;
    remainingAnnualIncome -= taxableInBracket;
  }
  annualTax = roundCurrency(annualTax);

  // Convert back to period tax
  const periodTax = roundCurrency(annualTax / 52);

  return Math.max(0, periodTax);
};


// -- MAIN PAY RUN CALCULATION (extended with deductions) -- //
const calcPayRun = (employee, payPeriod, options = {}) => {
  const { ytdGross = 0, ytdPAYE = 0, ytdKiwiSaver = 0 } = options;
  // validates minimum wage compliance before any calculation runs
  validateMinWage(employee.hourlyRate, employee.wageType || 'adult');

  // calculates base pay
  const { regPay, overtimePay, basePay } = calcGrossPay(
    payPeriod.regularHours,
    employee.hourlyRate,
    payPeriod.overtimeHours || 0,
    payPeriod.overtimeRate || null
  );

  // processes all public holidays that fell in the pay period
  const { totalHolidayPay, alternativeHolidaysEarned } = calcAllPublicHolidayPay(
    payPeriod.publicHolidays || [],
    employee.hourlyRate
  );

  // calculates annual leave pay for permanent employees who took leave during the pay period
  const { leavePay, leaveRateUsed } = 
    (employee.employmentType === 'permanent' && payPeriod.leaveDaysTaken > 0)
      ? calcLeavePay(
          payPeriod.leaveDaysTaken,
          payPeriod.owp,
          payPeriod.awe,
          employee.usualDaysPerWeek
        )
      : { leavePay: 0, leaveRateUsed: null };

  // combines the pay components before applying holiday pay accrual
  const preAccrualGross = roundCurrency(basePay + totalHolidayPay + leavePay);

  // total hours worked is used for permanent leave accrual calc
  const totalHoursWorked = (payPeriod.regularHours || 0) + (payPeriod.overtimeHours || 0);

  // adds 8% for casual - accrue leave hours for permanent
  const { holidayPayAddition, leaveHoursAccrued } = calcHolidayPayAccrued(
    employee.employmentType,
    preAccrualGross,
    totalHoursWorked
  );

    const grossPay = roundCurrency(preAccrualGross + holidayPayAddition);

  // --- Deductions ---
  const taxCode = employee.taxCode || 'M';
  const kiwisaverRate = employee.kiwisaverRate != null ? employee.kiwisaverRate : null;

  const payeTax = calcPAYETax(grossPay, taxCode, ytdGross);
  const { kiwisaverEmployee, kiwisaverEmployer } = calcKiwiSaver(grossPay, kiwisaverRate);

  const totalDeductions = roundCurrency(payeTax + kiwisaverEmployee);
  const netPay = roundCurrency(grossPay - totalDeductions);

  return {
    // pay components
    regPay,
    overtimePay,
    basePay,
    totalHolidayPay,
    leavePay,
    leaveRateUsed,
    holidayPayAddition,
    grossPay,
    // deductions
    payeTax,
    kiwisaverEmployee,
    kiwisaverEmployer,
    totalDeductions,
    netPay,
    // accruals
    leaveHoursAccrued,
    alternativeHolidaysEarned,
    // other details
    totalHoursWorked,
    employmentType: employee.employmentType,
  };
};

module.exports = {
  calcPayRun,
  calcGrossPay,
  calcPublicHolidayPay,
  calcAllPublicHolidayPay,
  calcLeavePay,
  calcHolidayPayAccrued,
  calcPAYETax,
  calcKiwiSaver,
  validateMinWage,
  MIN_WAGE_ADULT,
  MIN_WAGE_STARTING,
};