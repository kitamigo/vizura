// matariki dates (published by NZ govt)
const MATARIKI_DATES = {
  2022: '2022-06-24',
  2023: '2023-07-14',
  2024: '2024-06-28',
  2025: '2025-06-20',
  2026: '2026-07-10',
  2027: '2027-06-25',
  2028: '2028-07-14',
  2029: '2029-07-06',
  2030: '2030-06-21',
};

// regional anniversary days
const REGIONAL_ANNIVERSARY = {
  Auckland: (year) => mondayNearestTo(year, 1, 29),    // nearest Mon to Jan 29
  Wellington: (year) => mondayNearestTo(year, 1, 22),  // nearest Mon to Jan 22
  Canterbury: (year) => mondayNearestTo(year, 12, 16), // nearest Mon to Dec 16 (Canterbury/Westland)
};

// finds Monday nearest to the given date
function mondayNearestTo(year, month, day) {
  const date = new Date(year, month - 1, day);
  const dow = date.getDay();
  const offsets = { 0: 1, 2: -1, 3: -2, 4: 3, 5: 2, 6: -5 };
  date.setDate(date.getDate() + (offsets[dow] || 0));
  return toDateString(date);
}

// finds the nth occurrence of a weekday in a month
function nthWeekdayOfMonth(year, month, weekday, n) {
  const date = new Date(year, month - 1, 1);
  let count = 0;
  while (count < n) {
    if (date.getDay() === weekday) count++;
    if (count < n) date.setDate(date.getDate() + 1);
  }
  return toDateString(date);
}

// finds the last occurrence of a weekday in a month
function lastWeekdayOfMonth(year, month, weekday) {
  const date = new Date(year, month, 0);
  while (date.getDay() !== weekday) {
    date.setDate(date.getDate() - 1);
  }
  return toDateString(date);
}

// Easter Sunday calculation - Anonymous Gregorian algorithm
function easterSunday(Y) {
  const a = Y % 19;
  const b = Math.floor(Y / 100);
  const c = Y % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Y, month - 1, day);
}

// apply mondayisation: move weekend holidays to Monday
function mondayise(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const dow = date.getDay();
  const offsets = { 6: 2, 0: 1 };
  if (offsets[dow]) date.setDate(date.getDate() + offsets[dow]);
  return toDateString(date);
}

// format a date as 'YYYY-MM-DD'
function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Helper - extract date info from Date or string
function parseDateInfo(date) {
  const dateStr = typeof date === 'string' ? date : toDateString(date);
  const year = parseInt(dateStr.slice(0, 4), 10);
  return { dateStr, year };
}

function buildHolidayMap(year, region = 'Canterbury') {
  const holidays = new Map();

  const add = (rawDateStr, name) => {
    const observed = mondayise(rawDateStr);
    // store both actual and observed dates (they may differ due to mondayisation)
    holidays.set(rawDateStr, name);
    if (observed !== rawDateStr) {
      holidays.set(observed, `${name} (observed)`);
    }
  };

  // -- FIXED DATE HOLIDAYS -- //
  add(`${year}-01-01`, "New Year's Day");
  add(`${year}-01-02`, "Day after New Year's Day");
  add(`${year}-02-06`, 'Waitangi Day');
  add(`${year}-04-25`, 'ANZAC Day');
  add(`${year}-12-25`, 'Christmas Day');
  add(`${year}-12-26`, 'Boxing Day');

  // -- CHRISTMAS AND BOXING DAY MONDAYISATION -- //
  const xmas = new Date(`${year}-12-25T00:00:00`);
  if (xmas.getDay() === 0) {
    // xmas on Sunday - observed Monday, Boxing Day (Mon) - observed Tuesday
    holidays.set(`${year}-12-26`, 'Boxing Day (observed)');
    const tue = new Date(xmas);
    tue.setDate(tue.getDate() + 2);
    holidays.set(toDateString(tue), 'Boxing Day (observed)');
  } else if (xmas.getDay() === 6) {
    // xmas on Saturday - observed Monday, Boxing Day (Sun) - observed Tuesday
    const tue = new Date(xmas);
    tue.setDate(tue.getDate() + 3);
    holidays.set(toDateString(tue), 'Boxing Day (observed)');
  }

  // -- EASTER -- //
  const easter = easterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);
  holidays.set(toDateString(goodFriday), 'Good Friday');
  holidays.set(toDateString(easterMonday), 'Easter Monday');

  // -- KINGS B-DAY -- // (first Monday in June)
  holidays.set(nthWeekdayOfMonth(year, 6, 1, 1), "King's Birthday");

  // -- MATARIKI -- //
  if (MATARIKI_DATES[year]) {
    holidays.set(MATARIKI_DATES[year], 'Matariki');
  }

  // -- LABOUR DAY -- // (fourth Monday in October)
  holidays.set(nthWeekdayOfMonth(year, 10, 1, 4), 'Labour Day');

  // -- ANNIVERSARY DAYS -- // (regional)
  const regionFn = REGIONAL_ANNIVERSARY[region];
  if (regionFn) {
    holidays.set(regionFn(year), `${region} Anniversary Day`);
  }

  return holidays;
}

// -- PUBLIC API -- //

// checks if a date is a NZ public holiday - (accepts Date or 'YYYY-MM-DD' string, optional region)
function isPublicHoliday(date, region = 'Canterbury') {
  const { dateStr, year } = parseDateInfo(date);
  return buildHolidayMap(year, region).has(dateStr);
}

// gets holiday name for a date or null if not a holiday - "" ""
function getHolidayName(date, region = 'Canterbury') {
  const { dateStr, year } = parseDateInfo(date);
  return buildHolidayMap(year, region).get(dateStr) || null;
}

// gets all public holidays for a year/region as array of {date, name} objects, sorted by date
function getHolidaysForYear(year, region = 'Canterbury') {
  const map = buildHolidayMap(year, region);
  return Array.from(map.entries())
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// returns the supported regions for anniversary days
function getSupportedRegions() {
  return Object.keys(REGIONAL_ANNIVERSARY);
}

module.exports = {
  isPublicHoliday,
  getHolidayName,
  getHolidaysForYear,
  getSupportedRegions,
  easterSunday,
  mondayNearestTo,
};