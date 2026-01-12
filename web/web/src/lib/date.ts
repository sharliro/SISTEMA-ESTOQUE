export function isValidIsoDate(dateStr: string): boolean {
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  if (d < 1) return false;
  // JS: new Date(year, monthIndex, day) where monthIndex is 0-based; using day 0 trick
  // to get last day of month: new Date(y, m, 0)
  const daysInMonth = new Date(y, m, 0).getDate();
  if (d > daysInMonth) return false;
  return true;
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}