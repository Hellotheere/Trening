#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const mem = {};
const localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
const ctx = {
  console, Date, Math, JSON, Number, String, Array, Object, Error, Set, Map,
  Intl, parseInt, parseFloat, isFinite, isNaN, Infinity, undefined,
  Uint8Array, RegExp, Boolean, Promise, localStorage,
  btoa: (s) => Buffer.from(s, "binary").toString("base64"),
  atob: (s) => Buffer.from(s, "base64").toString("binary"),
};
ctx.globalThis = ctx;
ctx.crypto = { getRandomValues: (a) => { for (let i = 0; i < a.length; i++) a[i] = (i * 17) % 256; return a; } };
vm.createContext(ctx);
const root = path.resolve(__dirname, "..");
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "engine.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "store.js"), "utf8"), ctx);
const S = ctx.TrenerStore;
const T = ctx.Trener;

let failed = 0;
let passed = 0;
function test(name, fn) {
  try { fn(); passed += 1; console.log("  ok  " + name); }
  catch (e) { failed += 1; console.error("  FAIL " + name); console.error("       " + (e.stack || e)); }
}

test("en måned med bruk overlever", () => {
  assert.strictEqual(S.hasState(), false);
  const me = S.onboard({
    name: "Inifi", goal: "bygge_muskler", level: "litt_erfaring",
    days_per_week: 4, minutes: 45, equipment: "treningssenter", weight_kg: 80,
  });
  assert.strictEqual(me.profile.name, "Inifi");
  assert.ok(me.plan.days.length === 7);

  const programmed = S.chooseProgram({ id: "fullkropp3" });
  assert.strictEqual(programmed.plan.program_id, "fullkropp3");
  assert.strictEqual(programmed.profile.days_per_week, 3);

  const deload = T.buildProgram(programmed.profile, "fullkropp3", { week: 4, start: "2026-11-02" });
  assert.strictEqual(deload.plan.phase, "deload");

  const days = programmed.plan.days.filter((d) => T.isTrainingDay(d));
  assert.ok(days.length >= 1);
  const first = days[0];
  const draft = S.workout({
    date: first.date, title: first.title, action: "save",
    exercises: [{ id: first.exercises[0].id, sets: [{ reps: 8, weight_kg: 40, done: false }] }],
    draft: { date: first.date, title: first.title, i: 0, exercises: [{ id: first.exercises[0].id, log: [{ reps: 8, weight_kg: 40, done: false }] }] },
  });
  assert.ok(draft.active_workout);
  assert.strictEqual(draft.active_workout.date, first.date);

  const resumed = S.me();
  assert.strictEqual(resumed.active_workout.date, first.date);
  const done = S.workout({
    date: first.date, title: first.title, action: "complete", completed: true,
    exercises: [{ id: first.exercises[0].id, note: "tungt", sets: [{ reps: 10, weight_kg: 42.5, done: true, rpe: 8 }] }],
  });
  assert.strictEqual(done.active_workout, null);
  const saved = done.workouts.find((w) => w.date === first.date);
  assert.strictEqual(saved.completed, true);
  assert.strictEqual(saved.exercises[0].sets[0].weight_kg, 42.5);
  assert.strictEqual(saved.exercises[0].note, "tungt");

  const second = days[1] || days[0];
  S.swapDays({ from: first.weekday, to: second.weekday });
  const moved = S.me();
  const after = moved.plan.days.find((d) => d.weekday === second.weekday);
  assert.ok((after.exercises || []).some((ex) => ex.id === first.exercises[0].id));

  S.markDay({ date: "2026-11-12", mark: "skipped" });
  assert.strictEqual(S.me().day_marks["2026-11-12"], "skipped");

  const before = S.me();
  const beforeCount = (before.plan.days.find((d) => d.weekday === T.weekdayName(T.todayOslo())) || { exercises: [] }).exercises.length;
  const chat = S.chat({ message: "gjør økta kortere" });
  assert(/tre første/i.test(chat.reply));
  const today = chat.plan.days.find((d) => d.weekday === T.weekdayName(T.todayOslo()));
  if (beforeCount > 3) assert.ok(today.exercises.length <= 3);

  S.chat({ message: "ka ska æ trene" });
  S.chat({ message: "e det greit å trene sår" });
  const last = S.me().chat.slice(-1)[0].text;
  assert(/støl/i.test(last));

  const themed = S.savePrefs({ theme: "light", rest_sec: 75, units: "kg", sound: false });
  assert.strictEqual(themed.prefs.theme, "light");
  assert.strictEqual(themed.prefs.rest_sec, 75);

  const raw = S.exportJSON();
  const parsed = JSON.parse(raw);
  assert.strictEqual(parsed.profile.name, "Inifi");
  assert.ok(parsed.workouts.length >= 1);
  S.reset();
  assert.strictEqual(S.hasState(), false);
  const back = S.importJSON(raw);
  assert.strictEqual(back.profile.name, "Inifi");
  assert.ok(back.workouts.length >= 1);
  assert.strictEqual(back.prefs.theme, "light");
  const again = S.me();
  assert.strictEqual(again.workouts[0].exercises[0].sets[0].reps, 10);
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
