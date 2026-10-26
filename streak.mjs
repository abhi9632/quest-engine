// Local calendar day ("YYYY-MM-DD"). toISOString() is UTC, which in Sydney
// rolls the day over at 10-11am instead of midnight.
export const localDay = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// Streak: consecutive days with XP earned, ending today, or yesterday if
// nothing is done yet today (the streak is still alive until midnight).
export function streakFrom(activity, now = new Date()) {
  const d = new Date(now);
  if (!activity[localDay(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (activity[localDay(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// XP earned since Monday, local time.
export function weekXpFrom(activity, now = new Date()) {
  const d = new Date(now);
  const back = (d.getDay() + 6) % 7; // days since Monday
  let sum = 0;
  for (let i = 0; i <= back; i++) { sum += activity[localDay(d)] || 0; d.setDate(d.getDate() - 1); }
  return sum;
}
