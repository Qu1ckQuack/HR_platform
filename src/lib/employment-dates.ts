const PROBATION_PERIOD_DAYS = 120;
const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function getCurrentBangkokDate(now: Date = new Date()) {
  const parts: { year: string; month: string; day: string } = {
    year: "",
    month: "",
    day: "",
  };
  const formatted = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Bangkok",
    year: "numeric",
  }).formatToParts(now);

  for (const part of formatted) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      parts[part.type] = part.value;
    }
  }

  if (!parts.year || !parts.month || !parts.day) {
    throw new RangeError("Could not determine the Bangkok calendar date.");
  }
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getProbationCompletionDate(startDate: string) {
  if (!DATE_INPUT_PATTERN.test(startDate)) {
    throw new RangeError("Start date must use YYYY-MM-DD format.");
  }

  const date = new Date(`${startDate}T00:00:00.000Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== startDate) {
    throw new RangeError("Start date is not a valid calendar date.");
  }

  date.setUTCDate(date.getUTCDate() + PROBATION_PERIOD_DAYS);
  return date.toISOString().slice(0, 10);
}
