#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

const root = path.resolve(__dirname, "..");
const ctx = {
  console, Date, Math, JSON, Number, String, Array, Object, Error, Set, Map,
  Intl, parseInt, parseFloat, isFinite, isNaN, Infinity, undefined,
  Uint8Array, RegExp, Boolean, Promise,
};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), ctx);
vm.runInContext(fs.readFileSync(path.join(root, "engine.js"), "utf8"), ctx);
const T = ctx.Trener;
assert(T, "Trener-motoren lastet ikke");

const MONDAY = "2026-11-09";
let failed = 0;
let passed = 0;

function same(a, b) {
  assert.strictEqual(JSON.stringify(a), JSON.stringify(b));
}

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("  ok  " + name);
  } catch (e) {
    failed += 1;
    console.error("  FAIL " + name);
    console.error("       " + (e.stack || e));
  }
}

function profile(kw) {
  return T.normalizeProfile(Object.assign({
    goal: "bli_sterkere", level: "nybegynner", days_per_week: 3, minutes: 30, equipment: "ingen",
  }, kw || {}));
}

test("mandagsmalen har brukerens ni øvelser", () => {
  const ids = Array.from(T.mondayExercises(), (ex) => ex.id);
  same(ids, [
    "maskin_brystpress", "incline_manualpress", "pec_fly_maskin",
    "incline_biceps", "preacher_curl", "triceps_pushdown",
    "lateral", "reverse_pec_fly", "front_raise",
  ]);
  const push = T.EXERCISES.triceps_pushdown;
  const blob = (push.desc + " " + push.tips).toLowerCase();
  assert(blob.includes("stang") && blob.includes("tau"));
  for (const ex of T.mondayExercises()) {
    assert.strictEqual(ex.sets, 3);
    assert.strictEqual(ex.reps, "8–12");
    assert(ex.rest_sec >= 60 && ex.rest_sec <= 90);
    assert(ex.desc.length > 40);
  }
  const plan = T.defaultCustomPlan();
  assert.strictEqual(plan.days[0].weekday, "mandag");
  assert.strictEqual(plan.days[0].title, "Bryst, armer og skuldre");
  same(Array.from(plan.days[0].exercises, (ex) => ex.id), ids);
  assert(plan.days.slice(1).every((d) => !d.exercises.length));
});

test("overload-hint foreslår +2,5 kg etter 3×12", () => {
  const ex = { id: "maskin_brystpress", name: "Brystpress i maskin", reps: "8–12", sets: 3 };
  const logs = [{
    date: "2026-11-02", completed: true,
    exercises: [{
      id: "maskin_brystpress", name: "Brystpress i maskin",
      sets: [
        { reps: 12, weight_kg: 40, done: true },
        { reps: 12, weight_kg: 40, done: true },
        { reps: 12, weight_kg: 40, done: true },
      ],
    }],
  }];
  const hint = T.overloadHint(ex, T.lastPerformance(logs).maskin_brystpress);
  assert(hint);
  assert(hint.text.includes("12 reps på alle sett"));
  assert(hint.text.includes("+2,5 kg"));
  assert.strictEqual(hint.suggest_kg, 42.5);
  assert.strictEqual(hint.last_kg, 40);
  assert.strictEqual(hint.kind, "increase_weight");
  logs[0].exercises[0].sets = [
    { reps: 8, weight_kg: 40, done: true },
    { reps: 9, weight_kg: 40, done: true },
    { reps: 10, weight_kg: 40, done: true },
  ];
  const hint2 = T.overloadHint(ex, T.lastPerformance(logs).maskin_brystpress);
  assert.strictEqual(hint2.kind, "add_rep");
  assert(hint2.text.includes("én repetisjon mer"));
});

test("materialiser og sjekk inn uten å overskrive øvelser", () => {
  const custom = T.defaultCustomPlan();
  const plan = T.materializeCustomPlan(custom, {
    start: MONDAY,
    profile: T.normalizeProfile({
      goal: "bygge_muskler", level: "litt_erfaring",
      days_per_week: 3, minutes: 45, equipment: "treningssenter",
    }),
  });
  assert.strictEqual(plan.days[0].date, "2026-11-09");
  assert.strictEqual(plan.days[0].weekday, "mandag");
  assert.strictEqual(plan.days[0].exercises.length, 9);
  assert.strictEqual(plan.source, "custom");
  const logs = [{
    date: "2026-11-02", completed: true,
    exercises: [{ id: "maskin_brystpress", sets: [{ reps: 12, weight_kg: 50, done: true }, { reps: 12, weight_kg: 50, done: true }, { reps: 12, weight_kg: 50, done: true }] }],
  }];
  const plan2 = T.materializeCustomPlan(custom, { start: MONDAY, logs });
  const press = plan2.days[0].exercises[0];
  assert((press.hint || "").includes("12 reps på alle sett"));
  assert.strictEqual(press.suggest_kg, 52.5);
  assert.strictEqual(press.last_kg, 50);
  assert.strictEqual(press.pr, true);
  const state = {
    plan_source: "custom", custom_plan: custom, workouts: logs,
    profile: T.normalizeProfile({
      goal: "bygge_muskler", level: "litt_erfaring",
      days_per_week: 3, minutes: 45, equipment: "treningssenter",
    }),
    plan: { week: 1 },
  };
  const [newPlan, summary] = T.applyCustomCheckin(state, { energy: 5, soreness: 1, skipped: 0 }, MONDAY);
  assert.strictEqual(summary.mode, "overload");
  const ids = Array.from(newPlan.days[0].exercises, (ex) => ex.id);
  same(ids, Array.from(T.mondayExercises(), (ex) => ex.id));
  assert(!ids.includes("gattur"));
});

test("balanseforslag er valgfrie og hopper over fylte dager", () => {
  const custom = T.defaultCustomPlan();
  let sugs = T.balanceSuggestions(custom);
  const ids = new Set(sugs.map((s) => s.id));
  assert(ids.has("rygg_biceps") && ids.has("bein"));
  assert(sugs.every((s) => s.weekday !== "mandag"));
  const filled = T.defaultCustomPlan();
  filled.days[2] = {
    weekday: "onsdag", title: "Rygg og biceps",
    exercises: [{ id: "nedtrekk", name: "Nedtrekk", sets: 3, reps: "8–12", rest_sec: 90 }],
  };
  sugs = T.balanceSuggestions(filled);
  assert(!sugs.some((s) => s.id === "rygg_biceps"));
  assert(sugs.some((s) => s.id === "bein"));
});

test("migrering bevarer generert plan", () => {
  const p = profile();
  const generated = T.generatePlan(p, { start: MONDAY });
  const state = { profile: p, plan: generated, workouts: [] };
  T.migrateState(state);
  assert.strictEqual(state.plan_source, "generated");
  assert.strictEqual(state.custom_plan.days[0].exercises[0].id, "maskin_brystpress");
  const active = T.resolvePlan(state, MONDAY);
  assert.strictEqual(active.source, "generated");
  assert.strictEqual(T.weekVolume(active), T.weekVolume(generated));
  state.plan_source = "custom";
  const own = T.resolvePlan(state, MONDAY);
  assert.strictEqual(own.source, "custom");
  assert.strictEqual(own.days[0].title, "Bryst, armer og skuldre");
});

test("1RM og personlige rekorder", () => {
  assert.strictEqual(T.estimate1rm(100, 1), 100);
  assert.strictEqual(T.estimate1rm(100, 5), 116.7);
  assert.strictEqual(T.estimate1rm(0, 8), null);
  const logs = [
    { date: "2026-10-01", exercises: [{ id: "benk", name: "Benkpress", sets: [{ reps: 5, weight_kg: 60, done: true }] }] },
    { date: "2026-11-01", exercises: [{ id: "benk", name: "Benkpress", sets: [{ reps: 3, weight_kg: 80, done: true }] }] },
  ];
  const pr = T.personalRecords(logs).benk;
  assert.strictEqual(pr.max_kg, 80);
  assert.strictEqual(pr.max_1rm, T.estimate1rm(80, 3));
  assert.strictEqual(pr.max_kg_date, "2026-11-01");
});

test("fri tekst får stabil egen-id", () => {
  const plan = T.normalizeCustomPlan({ days: [{
    weekday: "tirsdag", title: "Påfunn",
    exercises: [{ name: "Slededrag", sets: 4, reps: "20 m", rest_sec: 90 }],
  }] });
  const tis = plan.days.find((d) => d.weekday === "tirsdag");
  assert(tis.exercises[0].id.startsWith("egen_"));
  assert.strictEqual(tis.exercises[0].custom, true);
  assert.strictEqual(tis.exercises[0].name, "Slededrag");
});

test("nybegynner kapasitetsbegrenses og får kroppsvekt", () => {
  const p = profile({ level: "nybegynner", days_per_week: 6, minutes: 60, equipment: "ingen" });
  assert.strictEqual(p.days_per_week, 4);
  assert.strictEqual(p.minutes, 45);
  assert(p.beginner_notes.length);
  const plan = T.generatePlan(p, { start: MONDAY });
  const train = plan.days.filter((d) => d.kind !== "hvile");
  assert.strictEqual(train.length, 4);
  const ids = new Set(train.flatMap((d) => d.exercises.map((ex) => ex.id)));
  const gymOnly = new Set(["benk", "markloft", "nedtrekk", "leg_press", "sittende_roing", "sykkel", "face_pull"]);
  for (const id of ids) assert(!gymOnly.has(id), id);
  for (const d of train) {
    if (d.kind !== "kondisjon") {
      assert(d.exercises.length >= 1 && d.exercises.length <= 5);
      for (const ex of d.exercises) {
        if (!["gattur", "intervall_gang", "jogg"].includes(ex.id)) assert(ex.sets <= 3);
      }
    }
  }
  for (const d of train) for (const ex of d.exercises) assert(ex.desc.length > 40);
});

test("gym-hypertrofi har baseøvelser og mer protein", () => {
  const p = profile({
    goal: "bygge_muskler", level: "litt_erfaring", days_per_week: 4, minutes: 60,
    equipment: "treningssenter", weight_kg: 80, height_cm: 180, age: 28,
  });
  const plan = T.generatePlan(p, { start: MONDAY });
  const train = plan.days.filter((d) => d.kind !== "hvile");
  assert.strictEqual(train.length, 4);
  const ids = new Set(train.flatMap((d) => d.exercises.map((ex) => ex.id)));
  const want = ["benk", "nedtrekk", "sittende_roing", "goblet", "rdl", "markloft", "leg_press", "skulderpress", "hip_thrust"];
  assert(want.some((id) => ids.has(id)));
  assert(plan.nutrition.protein_g >= 140);
  const fat = T.generatePlan(profile({
    goal: "ga_ned_i_vekt", level: "litt_erfaring", days_per_week: 4,
    minutes: 45, equipment: "treningssenter", weight_kg: 80, height_cm: 180, age: 28,
  }), { start: MONDAY });
  assert(fat.nutrition.kcal < plan.nutrition.kcal);
});

test("måltider respekterer allergier og bruker norsk mat", () => {
  const meals = T.generateMeals(profile({ food: "allergi mot fisk og laktose, vegetar" }), 1);
  const blob = meals.map((m) => m.name + " " + m.desc).join(" ").toLowerCase();
  for (const forbidden of ["laks", "torsk", "makrell", "fiskekaker", "fiskegrateng", "kvarg", "kesam", "melk", "kylling", "kjøttdeig", "kalkun"]) {
    assert(!blob.includes(forbidden), forbidden);
  }
  const allNames = T.generateMeals(profile(), 2).map((m) => m.name).join(" ").toLowerCase();
  assert(["havregryn", "brød", "kvarg", "laks", "kylling"].some((w) => allNames.includes(w)));
});

test("veganske måltider uten animalske produkter", () => {
  const meals = T.generateMeals(profile({ food: "veganer" }), 3);
  const blob = meals.map((m) => m.name + " " + m.desc).join(" ").toLowerCase();
  for (const forbidden of ["kylling", "laks", "torsk", "egg", "kvarg", "kesam", "ost", "kjøttdeig", "makrell"]) {
    assert(!blob.includes(forbidden), forbidden);
  }
});

test("overload øker volum, deload senker", () => {
  const p = profile({ level: "litt_erfaring", days_per_week: 4, minutes: 45, equipment: "manualer", goal: "bygge_muskler" });
  const base = T.generatePlan(p, { start: MONDAY, week: 1, mode: "start" });
  const v0 = T.weekVolume(base);
  const [over, sOver] = T.adjustPlan(p, base, { energy: 5, soreness: 1, skipped: 0 }, null, MONDAY);
  const [easy, sEasy] = T.adjustPlan(p, base, { energy: 3, soreness: 3, skipped: 1 }, null, MONDAY);
  const [down, sDown] = T.adjustPlan(p, base, { energy: 1, soreness: 5, skipped: 3 }, null, MONDAY);
  assert.strictEqual(sOver.mode, "overload");
  assert.strictEqual(sDown.mode, "deload");
  assert.strictEqual(sEasy.mode, "easier");
  assert(T.weekVolume(over) > v0);
  assert(T.weekVolume(down) < v0 * 0.85);
  assert(T.weekVolume(down) < T.weekVolume(over));
  assert.strictEqual(over.week, 2);
  assert.strictEqual(down.week, 2);
});

test("sjekk-inn-beslutninger", () => {
  assert.strictEqual(T.checkinDecision(5, 1, 0)[0], "overload");
  assert.strictEqual(T.checkinDecision(1, 5, 3)[0], "deload");
  assert.strictEqual(T.checkinDecision(3, 3, 0)[0], "hold");
  assert.strictEqual(T.checkinDecision(3, 3, 1)[0], "easier");
});

test("ernæring sultes ikke", () => {
  const low = T.nutritionTargets(profile({ goal: "ga_ned_i_vekt", weight_kg: 50, height_cm: 160, age: 25, days_per_week: 2 }));
  assert(low.kcal >= 1400);
  const mid = T.nutritionTargets(profile({ goal: "ga_ned_i_vekt" }));
  assert(mid.kcal >= 1600);
});

test("regeltreneren forklarer og er trygg", () => {
  const p = profile({ name: "Inifi", goal: "bygge_muskler", equipment: "manualer" });
  const plan = T.generatePlan(p, { start: MONDAY });
  const state = { profile: p, plan };
  const squat = T.ruleReply("Hvordan gjør jeg knebøy?", state);
  assert(squat.toLowerCase().includes("skulderbredde") || squat.toLowerCase().includes("hofta"));
  const injury = T.ruleReply("Jeg har vondt i knærne når jeg bøyer", state);
  assert(injury.toLowerCase().includes("lege"));
  const food = T.ruleReply("Hva skal jeg spise for mer protein?", state);
  assert(food.toLowerCase().includes("protein"));
  assert.strictEqual(T.coachBackend(), "regler");
  const r = T.coachReply("Forklar planen", state);
  assert.strictEqual(r.source, "regler");
  assert(!r.reply.includes("sk-"));
  assert(!r.reply.includes("API_KEY"));
});

test("treneren skjønner mat, benkpress og hei", () => {
  const state = { profile: profile({ name: "Inifi", weight_kg: 80, goal: "bygge_muskler" }), plan: { days: [] }, chat: [] };
  const mat = T.ruleReply("Hva gjør jeg om mat", state);
  assert(!/si navnet på øvelsen/i.test(mat));
  assert(!/jeg henger med/i.test(mat));
  assert(/protein/i.test(mat));
  assert(/1,6/.test(mat));
  assert(/2,2/.test(mat));
  assert(/kvarg|kylling|egg/i.test(mat));
  assert(/etter trening/i.test(mat));
  assert(/lege/i.test(mat));

  const benk = T.ruleReply("Benk press", state);
  assert(/benkpress/i.test(benk));
  assert(/bryst/i.test(benk));
  assert(/\b1\./.test(benk));
  assert(!/jeg henger med/i.test(benk));
  assert(!/si navnet på øvelsen/i.test(benk));

  const hey = T.ruleReply("Hey", state);
  assert(/hei/i.test(hey));
  assert(!/si navnet på øvelsen/i.test(hey));
  assert(!/jeg henger med/i.test(hey));
});

test("treneren tåler skrivefeil, engelsk og oppfølging", () => {
  const base = { profile: profile({ weight_kg: 70, goal: "bli_sterkere" }), plan: { days: [] }, chat: [] };
  assert(/benkpress/i.test(T.ruleReply("benkpres", base)));
  assert(/stangen|markløft/i.test(T.ruleReply("deadlift", base)));
  assert(/skulderbredde|hofta/i.test(T.ruleReply("squat", base)));
  assert(/armhev|brystet|planke/i.test(T.ruleReply("push-ups", base)));
  assert(/haken|stang/i.test(T.ruleReply("chins", base)));
  assert(/skulderpress/i.test(T.ruleReply("skulderpress", base)));
  assert(/2,5 kg/.test(T.ruleReply("øke vekten", base)));
  assert(/støl/i.test(T.ruleReply("jeg er øm", base)));
  assert(/markløft|stangen/i.test(T.ruleReply("mark løft", base)));

  const afterFood = {
    profile: base.profile,
    plan: { days: [] },
    chat: [
      { role: "user", text: "Hva gjør jeg om mat" },
      { role: "coach", text: "protein" },
    ],
  };
  const post = T.ruleReply("og etter trening?", afterFood);
  assert(/etter trening/i.test(post));
  assert(/protein/i.test(post));
  assert(!/si navnet på øvelsen/i.test(post));

  const afterBench = {
    profile: base.profile,
    plan: { days: [] },
    chat: [
      { role: "user", text: "Benk press" },
      { role: "coach", text: "steg" },
    ],
  };
  const reps = T.ruleReply("hvor mange reps?", afterBench);
  assert(/8/.test(reps));
  assert(/benk/i.test(reps));
  assert(/sett/i.test(reps));

  const unknown = T.ruleReply("asdfgh qwerty zzzzz", base);
  assert(!/jeg henger med/i.test(unknown));
  assert(!/si navnet på øvelsen/i.test(unknown));
  const examples = unknown.match(/«[^»]+»/g) || [];
  assert.strictEqual(examples.length, 3);
});

test("bump_reps holder seg i området", () => {
  assert.strictEqual(T.midReps("8–12"), 10);
  assert.strictEqual(T.bumpReps("8–12", 1), "9–13");
  const bumped = T.bumpReps("20", 5);
  assert(bumped.includes("20") || bumped === "20");
});

console.log("\n" + passed + " passed, " + failed + " failed");
process.exit(failed ? 1 : 0);
