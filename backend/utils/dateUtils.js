/**
 * Date Utilities
 * Pure functions for date operations with robust validation
 */

/**
 * Validates if a date is valid
 * @param {Date} date - Date to validate
 * @returns {boolean} - True if date is valid
 */
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

/**
 * Validates if a date string can be parsed to a valid Date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if string can be parsed to valid date
 */
const isValidDateString = (dateString) => {
  if (typeof dateString !== "string") return false;
  const date = new Date(dateString);
  return isValidDate(date);
};

/**
 * Converts a date to UTC midnight (00:00:00.000)
 * @param {Date} date - Date to convert
 * @returns {Date} - UTC midnight date
 */
const toUTCMidnight = (date) => {
  if (!isValidDate(date)) {
    throw new Error("Invalid date provided to toUTCMidnight");
  }

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
};

/**
 * Calculates inclusive day count between two UTC dates
 * Supports leap years and handles edge cases
 * @param {Date|string} startDate - Start date (inclusive)
 * @param {Date|string} endDate - End date (inclusive)
 * @returns {number} - Number of days (inclusive)
 * @throws {Error} - If dates are invalid or startDate > endDate
 */
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

/**
 * Checks if a year is a leap year
 * @param {number} year - Year to check
 * @returns {boolean} - True if leap year
 */
const isLeapYear = (year) => {
  if (typeof year !== "number" || !Number.isInteger(year)) {
    throw new Error("Year must be a valid integer");
  }

  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
};

/**
 * Gets the number of days in a month for a given year
 * @param {number} month - Month (0-11, where 0 is January)
 * @param {number} year - Year
 * @returns {number} - Number of days in the month
 */
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

/**
 * Formats a date to YYYY-MM-DD string
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDateToYYYYMMDD = (date) => {
  if (!isValidDate(date)) {
    throw new Error("Invalid date provided to formatDateToYYYYMMDD");
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

/**
 * Parses a YYYY-MM-DD string to a UTC Date object
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Date} - UTC Date object
 */
const parseDateFromYYYYMMDD = (dateString) => {
  if (!isValidDateString(dateString)) {
    throw new Error("Invalid date string provided to parseDateFromYYYYMMDD");
  }

  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Gets current date in UTC
 * @returns {Date} - Current UTC date
 */
const getCurrentUTCDate = () => {
  return new Date();
};

/**
 * Checks if a date is today (UTC)
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if date is today
 */
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

/**
 * Adds days to a date
 * @param {Date|string} date - Base date
 * @param {number} days - Number of days to add (can be negative)
 * @returns {Date} - New date
 */
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
