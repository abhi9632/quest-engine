// node streak.test.mjs
import assert from "node:assert";
import { localDay, streakFrom, weekXpFrom } from "./streak.mjs";

const day = (y, m, d) => new Date(y, m - 1, d, 12);
const wed = day(2026, 10, 28);
const act = { "2026-10-25": 50, "2026-10-26": 30, "2026-10-27": 20 }; // Sun, Mon, Tue

assert.equal(localDay(day(2026, 1, 5)), "2026-01-05");
assert.equal(streakFrom(act, wed), 3, "nothing yet today keeps yesterday's streak");
assert.equal(streakFrom({ ...act, "2026-10-28": 10 }, wed), 4);
assert.equal(streakFrom(act, day(2026, 10, 29)), 0, "a missed day breaks it");
assert.equal(weekXpFrom(act, wed), 50, "week starts Monday: Sunday's 50 not counted");
assert.equal(weekXpFrom(act, day(2026, 10, 26)), 30, "Monday counts only itself");
console.log("streak ok");
