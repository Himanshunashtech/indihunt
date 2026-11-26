export const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const MONTHS_SHORT = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export function getDaysInMonth(monthName: string, year: number) {
  const idx = MONTHS_FULL.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
  if (idx === -1) return 30;
  return new Date(year, idx + 1, 0).getDate();
}

export type Period = "daily" | "weekly" | "monthly" | "yearly";

export interface ResolvedBestProductsDate {
  period: Period;
  year: number;
  monthIndex: number;
  monthFull: string;
  rawDay: number | null;
  startDate: string;
  endDate: string;
  displayDate: string;
}

export function resolveBestProductsDate(rawParams: string[]): ResolvedBestProductsDate {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(Date.now() + IST_OFFSET_MS);

  const defaultYear = istNow.getUTCFullYear();
  const defaultMonthIndex = istNow.getUTCMonth();
  const defaultMonthFull = MONTHS_FULL[defaultMonthIndex];

  // 1. Resolve period
  const segment0 = (rawParams[0] || "").toLowerCase();
  const validPeriods: Period[] = ["daily", "weekly", "monthly", "yearly"];
  const period: Period = validPeriods.includes(segment0 as Period) ? (segment0 as Period) : "daily";

  // 2. Resolve year
  const rawYear = rawParams[1] ? parseInt(rawParams[1], 10) : defaultYear;
  const year = isNaN(rawYear) || rawYear < 2000 || rawYear > 2100 ? defaultYear : rawYear;

  // 3. Resolve month
  const rawMonthSegment = (rawParams[2] || "").toLowerCase();
  const monthIdxFromSegment = MONTHS_SHORT.indexOf(rawMonthSegment);
  const monthIndex = monthIdxFromSegment !== -1 ? monthIdxFromSegment : defaultMonthIndex;
  const monthFull = MONTHS_FULL[monthIndex];

  // 4. Resolve day
  const rawDaySegment = rawParams[3] ? parseInt(rawParams[3], 10) : null;
  const rawDay = rawDaySegment !== null && !isNaN(rawDaySegment) && rawDaySegment >= 1 && rawDaySegment <= 31
    ? rawDaySegment
    : null;

  // 5. Calculate start & end bounds for the IST period in UTC
  let startIst: number;
  let endIst: number;

  if (period === "daily") {
    if (rawDay !== null) {
      startIst = Date.UTC(year, monthIndex, rawDay, 0, 0, 0);
      endIst = Date.UTC(year, monthIndex, rawDay + 1, 0, 0, 0) - 1;
    } else {
      const daysInMonth = getDaysInMonth(monthFull, year);
      startIst = Date.UTC(year, monthIndex, 1, 0, 0, 0);
      endIst = Date.UTC(year, monthIndex, daysInMonth, 23, 59, 59, 999);
    }
  } else if (period === "weekly") {
    if (rawDay !== null) {
      const startDay = (rawDay - 1) * 7 + 1;
      const endDay = Math.min(rawDay * 7, getDaysInMonth(monthFull, year));
      startIst = Date.UTC(year, monthIndex, startDay, 0, 0, 0);
      endIst = Date.UTC(year, monthIndex, endDay, 23, 59, 59, 999);
    } else {
      const daysInMonth = getDaysInMonth(monthFull, year);
      startIst = Date.UTC(year, monthIndex, 1, 0, 0, 0);
      endIst = Date.UTC(year, monthIndex, daysInMonth, 23, 59, 59, 999);
    }
  } else if (period === "monthly") {
    const daysInMonth = getDaysInMonth(monthFull, year);
    startIst = Date.UTC(year, monthIndex, 1, 0, 0, 0);
    endIst = Date.UTC(year, monthIndex, daysInMonth, 23, 59, 59, 999);
  } else {
    // Yearly
    startIst = Date.UTC(year, 0, 1, 0, 0, 0);
    endIst = Date.UTC(year + 1, 0, 1, 0, 0, 0) - 1;
  }

  const startDate = new Date(startIst - IST_OFFSET_MS).toISOString();
  const endDate = new Date(endIst - IST_OFFSET_MS).toISOString();

  let displayDate = "";
  if (period === "yearly") {
    displayDate = `${year} (Full Year)`;
  } else if (period === "monthly") {
    displayDate = `${monthFull} ${year} (Monthly Leaderboard)`;
  } else if (period === "weekly") {
    if (rawDay !== null) {
      const startDay = (rawDay - 1) * 7 + 1;
      const endDay = Math.min(rawDay * 7, getDaysInMonth(monthFull, year));
      displayDate = `Week ${rawDay} (${monthFull} ${startDay}–${endDay}, ${year})`;
    } else {
      displayDate = `${monthFull} ${year} (All Weeks)`;
    }
  } else if (rawDay !== null) {
    displayDate = `${monthFull} ${rawDay}, ${year}`;
  } else {
    displayDate = `${monthFull} ${year} (All Days)`;
  }

  return {
    period,
    year,
    monthIndex,
    monthFull,
    rawDay,
    startDate,
    endDate,
    displayDate,
  };
}
