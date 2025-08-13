
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const isValidDateString = (dateString) => {
  if (typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return isValidDate(date);
};


const toUTCMidnight = (date) => {
  if (!isValidDate(date)) {
    throw new Error("Invalid date provided to toUTCMidnight");
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

const getInclusiveDayCount = (startDate, endDate) => {
  // Convert string dates to Date objects if needed
  const start = typeof startDate === "string" ? new Date(startDate) : startDate;
  const end = typeof endDate === "string" ? new Date(endDate) : endDate;

  // Validate dates
  if (!isValidDate(start)) {
    throw new Error("Invalid start date provided to getInclusiveDayCount");
  }

  if (!isValidDate(end)) {
    throw new Error("Invalid end date provided to getInclusiveDayCount");
  }

  // Ensure start date is not after end date
  if (start > end) {
    throw new Error("Start date cannot be after end date");
  }

  // Convert both dates to UTC midnight for consistent calculation
  const startUTC = toUTCMidnight(start);
  const endUTC = toUTCMidnight(end);

  // Calculate difference in milliseconds and convert to days
  const timeDiff = endUTC.getTime() - startUTC.getTime();
  const dayDiff = timeDiff / (1000 * 60 * 60 * 24);

  // Add 1 for inclusive counting (both start and end dates count)
  return Math.floor(dayDiff) + 1;
};

const isLeapYear = (year) => {
  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw new Error("Year must be a valid integer");
  }

  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

const getDaysInMonth = (month, year) => {
  if (
    typeof month !== "number" ||
    !Number.isInteger(month) ||
    month < 0 ||
    month > 11
  ) {
    throw new Error("Month must be a valid integer between 0 and 11");
  }

  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw new Error("Year must be a valid integer");
  }

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  // February in leap year has 29 days
  if (month === 1 && isLeapYear(year)) {
    return 29;
  }

  return daysInMonth[month];
};


const formatDateToYYYYMMDD = (date) => {
  if (!isValidDate(date)) {
    throw new Error("Invalid date provided to formatDateToYYYYMMDD");
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};


const parseDateFromYYYYMMDD = (dateString) => {
  if (!isValidDateString(dateString)) {
    throw new Error("Invalid date string provided to parseDateFromYYYYMMDD");
  }

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};


const getCurrentUTCDate = () => {
  return new Date();
};


const isToday = (date) => {
  const checkDate = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(checkDate)) {
    throw new Error("Invalid date provided to isToday");
  }

  const today = getCurrentUTCDate();
  const todayUTC = toUTCMidnight(today);
  const checkDateUTC = toUTCMidnight(checkDate);

  return todayUTC.getTime() === checkDateUTC.getTime();
};

const addDays = (date, days) => {
  const baseDate = typeof date === "string" ? new Date(date) : date;

  if (!isValidDate(baseDate)) {
    throw new Error("Invalid date provided to addDays");
  }

  if (typeof days !== "number" || !Number.isInteger(days)) {
    throw new Error("Days must be a valid integer");
  }

  const newDate = new Date(baseDate);
  newDate.setUTCDate(newDate.getUTCDate() + days);
  return newDate;
};

module.exports = {
  // Core functions
  getInclusiveDayCount,
  isValidDate,
  isValidDateString,

  // Date manipulation
  toUTCMidnight,
  addDays,

  // Utility functions
  isLeapYear,
  getDaysInMonth,
  formatDateToYYYYMMDD,
  parseDateFromYYYYMMDD,
  getCurrentUTCDate,
  isToday,
};
