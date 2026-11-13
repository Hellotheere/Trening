/* Personlig AI-trener – all plan-, mat- og trenerlogikk i nettleseren. */
(() => {
  const D = (typeof globalThis !== "undefined" && globalThis.TRENER_DATA) || {};
  const EXERCISES = D.EXERCISES || {};
  const MEALS = D.MEALS || [];
  const SAFETY = D.SAFETY || (
    "Dette er ikke medisinsk rådgivning. Planen er laget for friske voksne. " +
    "Snakk med lege før du starter hvis du er skadet, gravid, har sykdom eller er usikker."
  );

  const DAYS = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"];
  const DAY_SHORT = ["man", "tir", "ons", "tor", "fre", "lør", "søn"];
  const GOALS = {
    bli_sterkere: "Bli sterkere",
    ga_ned_i_vekt: "Gå ned i vekt",
    bedre_kondisjon: "Bedre kondisjon",
    bygge_muskler: "Bygge muskler",
  };
  const LEVELS = {
    nybegynner: "Nybegynner",
    litt_erfaring: "Litt erfaring",
    viderekommen: "Viderekommen",
  };
  const EQUIPMENT = {
    ingen: "Ingen utstyr",
    manualer: "Manualer hjemme",
    treningssenter: "Treningssenter",
  };

  const DEFAULT_REPS = "8–12";
  const COMPOUND_REST = 90;
  const ISO_REST = 60;

  class TrenerError extends Error {
    constructor(message, status) {
      super(message);
      this.name = "TrenerError";
      this.status = status || 400;
      this.detail = message;
    }
  }

  function clone(x) {
    return JSON.parse(JSON.stringify(x));
  }

  function todayOslo(now) {
    const f = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Oslo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return f.format(now || new Date());
  }

  function addDays(iso, n) {
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    const yy = dt.getUTCFullYear();
    const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(dt.getUTCDate()).padStart(2, "0");
    return yy + "-" + mm + "-" + dd;
  }

  function weekdayIndex(iso) {
    // Date.getUTCDay() is Sunday=0. Shift so Monday is 0 and Sunday is 6.
    const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
    const sunday0 = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return (sunday0 + 6) % 7;
  }

  function mondayOf(iso) {
    return addDays(iso, -weekdayIndex(iso));
  }

  function weekdayName(iso) {
    return DAYS[weekdayIndex(iso)];
  }

  function daysBetween(later, earlier) {
    const [y1, m1, d1] = String(earlier).slice(0, 10).split("-").map(Number);
    const [y2, m2, d2] = String(later).slice(0, 10).split("-").map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  }

  function midReps(rep) {
    const nums = String(rep || "").match(/\d+/g);
    if (!nums) return 8;
    const a = nums.map(Number);
    return a.length === 1 ? a[0] : Math.floor((a[0] + a[1]) / 2);
  }

  function bumpReps(rep, delta) {
    let nums = (String(rep || "8").match(/\d+/g) || []).map(Number);
    if (!nums.length) nums = [8];
    nums = nums.map((n) => Math.max(4, Math.min(20, n + delta)));
    if (nums.length === 1) return String(nums[0]);
    const lo = Math.min(nums[0], nums[1]);
    const hi = Math.max(nums[0], nums[1]);
    if (lo === hi) return String(lo);
    return lo + "–" + hi;
  }

  function weekVolume(plan) {
    let total = 0;
    for (const day of (plan && plan.days) || []) {
      if (day.kind === "hvile") continue;
      for (const ex of day.exercises || []) {
        total += (Number(ex.sets) || 0) * midReps(ex.reps || "8");
      }
    }
    return total;
  }

  function normalizeProfile(raw) {
    raw = raw || {};
    const goal = raw.goal || "bli_sterkere";
    if (!(goal in GOALS)) throw new TrenerError("Ugyldig mål.");
    const level = raw.level || "nybegynner";
    if (!(level in LEVELS)) throw new TrenerError("Ugyldig nivå.");
    const eq = raw.equipment || "ingen";
    if (!(eq in EQUIPMENT)) throw new TrenerError("Ugyldig utstyr.");
    let days = Number(raw.days_per_week || 3);
    let minutes = Number(raw.minutes || 30);
    if (!Number.isFinite(days) || !Number.isFinite(minutes)) {
      throw new TrenerError("Ugyldig antall dager eller minutter.");
    }
    days = Math.max(2, Math.min(6, Math.round(days)));
    minutes = Math.max(20, Math.min(90, Math.round(minutes)));
    const notes = [];
    if (level === "nybegynner") {
      if (days > 4) {
        notes.push(
          "Som nybegynner kjører vi fire skikkelige treningsdager og rolige turer de andre dagene, " +
          "så kroppen får tid til å lære teknikken."
        );
        days = 4;
      }
      if (minutes > 45) {
        notes.push("Øktene er satt til 45 minutter i starten – bedre med kvalitet enn for lange økter.");
        minutes = 45;
      }
    }
    function num(key, lo, hi) {
      const v = raw[key];
      if (v == null || v === "") return null;
      const x = Number(String(v).replace(",", "."));
      if (!Number.isFinite(x)) return null;
      return lo <= x && x <= hi ? x : null;
    }
    const age = num("age", 16, 80);
    const height = num("height_cm", 130, 220);
    const weight = num("weight_kg", 40, 200);
    const food = String(raw.food || "").trim().slice(0, 400);
    const name = String(raw.name || "").trim().slice(0, 30);
    return {
      name,
      goal,
      level,
      days_per_week: days,
      minutes,
      equipment: eq,
      age: age != null ? Math.round(age) : null,
      height_cm: height != null ? Math.round(height) : null,
      weight_kg: weight != null ? Math.round(weight * 10) / 10 : null,
      food,
      beginner_notes: notes,
    };
  }

  function allergens(food) {
    const t = String(food || "").toLowerCase();
    const tags = new Set();
    const pairs = [
      ["vegetar", "kjøtt"], ["vegetarian", "kjøtt"], ["vegan", "animal"], ["plantebasert", "animal"],
      ["laktosefri", "laktose"], ["laktose", "laktose"], ["melkefri", "laktose"],
      ["glutenfri", "gluten"], ["gluten", "gluten"], ["cøliaki", "gluten"], ["celiaki", "gluten"],
      ["nøtt", "nøtter"], ["peanøtt", "nøtter"],
      ["fisk", "fisk"], ["skalldyr", "fisk"],
      ["egg", "egg"], ["svin", "svin"], ["gris", "svin"],
    ];
    for (const [needle, tag] of pairs) {
      if (t.includes(needle)) tags.add(tag);
    }
    return tags;
  }

  function nutritionTargets(profile) {
    const w = profile.weight_kg || 75;
    const h = profile.height_cm || 175;
    const age = profile.age || 30;
    const bmr = 10 * w + 6.25 * h - 5 * age - 78;
    const days = profile.days_per_week;
    const activity = 1.35 + Math.min(0.25, 0.04 * days);
    const tdee = bmr * activity;
    const goal = profile.goal;
    let kcal;
    if (goal === "ga_ned_i_vekt") kcal = tdee - 350;
    else if (goal === "bygge_muskler") kcal = tdee + 200;
    else if (goal === "bli_sterkere") kcal = tdee + 50;
    else kcal = tdee;
    const floor = w >= 55 ? 1600 : 1400;
    kcal = Math.max(floor, Math.min(3600, kcal));
    let prot = ["bygge_muskler", "bli_sterkere", "ga_ned_i_vekt"].includes(goal) ? 1.8 * w : 1.5 * w;
    prot = Math.max(70, Math.min(180, prot));
    return { kcal: Math.round(kcal / 10) * 10, protein_g: Math.round(prot / 5) * 5, tdee: Math.round(tdee) };
  }

  function mealTags(meal) {
    return new Set(meal.tags || []);
  }

  function okMeal(meal, banned) {
    for (const t of mealTags(meal)) if (banned.has(t)) return false;
    return true;
  }

  function generateMeals(profile, week) {
    week = week || 1;
    const banned = allergens(profile.food || "");
    if (banned.has("animal")) {
      for (const t of ["kjøtt", "fisk", "egg", "laktose", "svin"]) banned.add(t);
    }
    const out = [];
    ["frokost", "lunsj", "middag", "kvelds"].forEach((slot, i) => {
      let choices = MEALS.filter((m) => m.slot === slot && okMeal(m, banned));
      if (!choices.length) {
        choices = MEALS.filter((m) => m.slot === slot && !mealTags(m).has("animal") && !mealTags(m).has("fisk") && !mealTags(m).has("kjøtt"));
      }
      if (!choices.length) choices = MEALS.filter((m) => m.slot === slot);
      const meal = choices[(week + i * 3) % choices.length];
      out.push({ slot, name: meal.name, desc: meal.desc, kcal: meal.kcal, protein: meal.protein });
    });
    return out;
  }

  function eqCode(equipment) {
    return { ingen: 0, manualer: 1, treningssenter: 2 }[equipment];
  }

  function scheme(profile, kind) {
    const level = profile.level, goal = profile.goal, minutes = profile.minutes;
    if (kind === "kondisjon") return [1, String(minutes), 0];
    if (kind === "hold") {
      const hold = level === "nybegynner" ? 30 : 40;
      return [3, hold + " s", 45];
    }
    let sets, reps, rest;
    if (goal === "bli_sterkere") { sets = 3; reps = "5–8"; rest = 150; }
    else if (goal === "bygge_muskler") { sets = 3; reps = "8–12"; rest = 90; }
    else if (goal === "ga_ned_i_vekt") { sets = 3; reps = "10–15"; rest = 45; }
    else { sets = 3; reps = "8–12"; rest = 60; }
    if (level === "nybegynner") {
      sets = minutes <= 25 ? 2 : 3;
      if (goal === "bli_sterkere") reps = "6–8";
      rest = Math.min(Math.max(rest, 60), 120);
    } else if (level === "viderekommen") {
      if (minutes >= 45 && kind !== "kjerne") sets = 4;
    }
    if (kind === "kjerne") {
      rest = 45;
      reps = String(reps).includes("s") ? reps : "8–12";
      sets = Math.min(sets, 3);
    }
    return [sets, reps, rest];
  }

  function makeEx(eid, profile, kind) {
    kind = kind || "styrke";
    if (["planke", "sideplanke", "wall_sit"].includes(eid)) kind = "hold";
    const meta = EXERCISES[eid];
    let [sets, reps, rest] = scheme(profile, kind);
    if (["gattur", "intervall_gang", "jogg", "sykkel"].includes(eid)) {
      sets = 1; reps = profile.minutes + " min"; rest = 0;
    }
    if (eid === "burpee" && profile.level === "nybegynner") {
      sets = 2; reps = "6–8"; rest = 60;
    }
    return {
      id: eid, name: meta.name, muscle: meta.muscle,
      sets, reps, rest_sec: rest,
      desc: meta.desc, tips: meta.tips, suggest_kg: null,
    };
  }

  const MOVES = {
    squat: ["goblet", "kneboy_kv"],
    hinge: ["rdl", "markloft", "glute_bridge"],
    lunge: ["utfall", "oppsteg"],
    push_h: ["benk", "gulvpress", "armhev"],
    push_v: ["skulderpress", "pike", "armhev"],
    pull: ["nedtrekk", "sittende_roing", "roing", "omvendt_roing"],
    row: ["sittende_roing", "roing", "omvendt_roing"],
    hip: ["hip_thrust", "glute_bridge"],
    core: ["planke", "dead_bug"],
    core2: ["sideplanke", "dead_bug", "superman"],
    arms_bi: ["biceps"],
    arms_tri: ["triceps", "dips_stol"],
    shoulders: ["lateral", "face_pull", "pike"],
    rear: ["face_pull", "superman"],
    legs_iso: ["leg_press", "oppsteg", "wall_sit"],
    hams: ["leg_curl", "rdl", "glute_bridge"],
    calves: ["calf"],
    carry: ["farmers"],
    cardio: ["sykkel", "intervall_gang", "jogg", "gattur"],
    cardio_easy: ["gattur"],
    cond_finisher: ["mountain", "jumping_jacks", "burpee"],
  };

  function move(key, profile, kind, used) {
    kind = kind || "styrke";
    used = used || new Set();
    const code = eqCode(profile.equipment);
    let eid = null;
    for (const i of MOVES[key]) {
      const meta = EXERCISES[i];
      if (meta && (meta.eq || []).includes(code) && !used.has(i)) {
        eid = i;
        break;
      }
    }
    if (!eid) return null;
    used.add(eid);
    return makeEx(eid, profile, kind);
  }

  function trainingWeekdays(n) {
    const table = { 2: [0, 3], 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 2, 3, 4], 6: [0, 1, 2, 3, 4, 5] };
    return table[Math.max(2, Math.min(6, n))];
  }

  function sessionKinds(profile) {
    const n = profile.days_per_week, goal = profile.goal, level = profile.level;
    if (goal === "bedre_kondisjon") {
      if (n === 2) return ["fullkropp", "kondisjon"];
      if (n === 3) return ["fullkropp", "kondisjon", "fullkropp"];
      if (n === 4) return ["fullkropp", "kondisjon", "fullkropp", "kondisjon"];
      return ["fullkropp", "kondisjon", "overkropp", "kondisjon", "underkropp"].slice(0, n);
    }
    if (level === "nybegynner" || n <= 3) {
      const seq = ["fullkropp_a", "fullkropp_b", "fullkropp_a", "kondisjon", "fullkropp_b", "kondisjon"];
      if (goal === "ga_ned_i_vekt" && n >= 3) seq[2] = "kondisjon";
      return seq.slice(0, n);
    }
    if (n === 4) return ["underkropp", "overkropp", "underkropp", "overkropp"];
    if (n === 5) return ["underkropp", "overkropp", "kondisjon", "underkropp", "overkropp"];
    return ["push", "pull", "bein", "push", "pull", "kondisjon"].slice(0, n);
  }

  function sessionExercises(kind, profile) {
    const minutes = profile.minutes;
    let cap = minutes <= 30 ? 4 : (minutes <= 45 ? 5 : 7);
    if (profile.level === "nybegynner") cap = Math.min(cap, 5);
    const used = new Set();
    const mv = (key, k) => move(key, profile, k || "styrke", used);
    const take = (items) => {
      const clean = items.filter(Boolean);
      return kind === "kondisjon" ? clean.slice(0, 3) : clean.slice(0, cap);
    };
    if (kind === "kondisjon") {
      const cardio = mv("cardio", "kondisjon");
      const title = "Kondisjon";
      const blurb = "I dag er det pulsen som gjelder. Hold et tempo du kan opprettholde, og avslutt med litt kjerne.";
      if (profile.equipment === "ingen") {
        const items = [cardio, cardio && cardio.id !== "intervall_gang" ? makeEx("intervall_gang", profile, "kondisjon") : makeEx("jogg", profile, "kondisjon")];
        items.push(mv("core", "kjerne"));
        return [title, blurb, take(items)];
      }
      return [title, blurb, take([cardio, mv("cond_finisher"), mv("core", "kjerne")])];
    }
    if (kind === "fullkropp" || kind === "fullkropp_a") {
      const items = [mv("squat"), mv("push_h"), mv("hinge"), mv("pull"), mv("core", "kjerne")];
      if (minutes >= 40) items.splice(4, 0, mv("lunge"));
      if (profile.goal === "ga_ned_i_vekt") items.push(mv("cond_finisher"));
      return ["Fullkropp A", "Hele kroppen i arbeid. Hold teknikken ren, og øk bare når alle settene sitter.", take(items)];
    }
    if (kind === "fullkropp_b") {
      const items = [mv("hip"), mv("push_v"), mv("row"), mv("lunge"), mv("core2", "kjerne")];
      if (minutes >= 40) items.splice(4, 0, profile.equipment !== "ingen" ? mv("carry") : mv("calves"));
      if (profile.goal === "bedre_kondisjon") items.push(mv("cond_finisher"));
      return ["Fullkropp B", "En annen vinkel på hele kroppen, så du får med både bakside og overkropp.", take(items)];
    }
    if (kind === "overkropp") {
      const items = [mv("push_h"), mv("pull"), mv("push_v"), mv("row"), mv("shoulders"), mv("core", "kjerne")];
      if (minutes >= 50 && profile.equipment !== "ingen") {
        items.splice(5, 0, mv("arms_bi"));
        items.splice(6, 0, mv("arms_tri"));
      }
      return ["Overkropp", "Bryst, rygg, skuldre og armer. Ro mellom settene, og la skuldrene synke ned.", take(items)];
    }
    if (kind === "underkropp" || kind === "bein") {
      const items = [mv("squat"), mv("hinge"), mv("lunge"), mv("hip"), mv("hams"), mv("core2", "kjerne")];
      if (minutes >= 45) items.splice(5, 0, mv("calves"));
      return ["Underkropp", "Bein og sete. Start rolig på første sett – dette skal kjennes, men ikke knuse deg.", take(items)];
    }
    if (kind === "push") {
      const items = [mv("push_h"), mv("push_v"), mv("shoulders"), mv("arms_tri"), mv("core", "kjerne")];
      return ["Press", "Alt som presser: bryst, skuldre og triceps.", take(items)];
    }
    if (kind === "pull") {
      const items = [mv("pull"), mv("row"), mv("hinge"), mv("rear"), profile.equipment !== "ingen" ? mv("arms_bi") : mv("core2", "kjerne")];
      return ["Trekk", "Rygg og bakside. Klem skulderbladene, og la armene bare være kroker.", take(items)];
    }
    return sessionExercises("fullkropp_a", profile);
  }

  function scaleExercise(ex, mode, intensity) {
    const out = clone(ex);
    if (["gattur", "intervall_gang", "jogg", "sykkel"].includes(out.id)) {
      let mins = midReps(out.reps || "30");
      if (mode === "deload") mins = Math.max(15, Math.floor(mins * 0.75));
      else if (mode === "overload") mins = Math.min(75, mins + 5);
      else if (mode === "easier") mins = Math.max(15, mins - 5);
      out.reps = mins + " min";
      return out;
    }
    if (mode === "overload") {
      if (out.sets < 4 && intensity >= 1.08) out.sets += 1;
      else out.reps = bumpReps(out.reps, 1);
      if (out.suggest_kg) out.suggest_kg = Math.round(Number(out.suggest_kg) * 1.025 * 2) / 2;
    } else if (mode === "deload") {
      out.sets = Math.max(2, Math.round(out.sets * 0.7));
      out.reps = bumpReps(out.reps, -2);
      out.rest_sec = Math.min(180, (Number(out.rest_sec) || 60) + 30);
      if (out.suggest_kg) out.suggest_kg = Math.round(Number(out.suggest_kg) * 0.85 * 2) / 2;
    } else if (mode === "easier") {
      if (out.sets > 3) out.sets -= 1;
      else out.reps = bumpReps(out.reps, -1);
      out.rest_sec = Math.min(180, (Number(out.rest_sec) || 60) + 15);
    }
    return out;
  }

  function applyIntensity(days, mode, intensity) {
    return days.map((d) => {
      const nd = clone(d);
      if (nd.kind !== "hvile") {
        nd.exercises = (nd.exercises || []).map((ex) => scaleExercise(ex, mode, intensity));
      }
      return nd;
    });
  }

  function suggestFromLogs(plan, logs) {
    const last = {};
    for (const sess of logs || []) {
      for (const ex of sess.exercises || []) {
        const weights = (ex.sets || []).filter((s) => s.done && s.weight_kg).map((s) => s.weight_kg);
        if (weights.length && ex.id) last[ex.id] = Number(weights[weights.length - 1]);
      }
    }
    plan = clone(plan);
    for (const day of plan.days || []) {
      for (const ex of day.exercises || []) {
        if (ex.id in last) {
          ex.suggest_kg = last[ex.id];
          ex.last_kg = last[ex.id];
        }
      }
    }
    return plan;
  }

  function generatePlan(profile, opts) {
    opts = opts || {};
    profile = normalizeProfile(profile);
    const week = opts.week || 1;
    let intensity = opts.intensity != null ? opts.intensity : 1.0;
    const mode = opts.mode || "start";
    const start = mondayOf(opts.start || todayOslo());
    const logs = opts.logs;
    const note = opts.note;
    const trainingIdx = new Set(trainingWeekdays(profile.days_per_week));
    const kinds = sessionKinds(profile);
    let kindI = 0;
    let days = [];
    for (let i = 0; i < DAYS.length; i++) {
      const name = DAYS[i];
      const d = addDays(start, i);
      if (trainingIdx.has(i)) {
        const kind = kinds[kindI++];
        const [title, blurb, exercises] = sessionExercises(kind, profile);
        days.push({ date: d, weekday: name, weekday_short: DAY_SHORT[i], kind, title, blurb, exercises });
      } else {
        const easy = makeEx("gattur", { ...profile, minutes: Math.min(40, Math.max(20, profile.minutes - 10)) }, "kondisjon");
        days.push({
          date: d, weekday: name, weekday_short: DAY_SHORT[i], kind: "hvile",
          title: "Aktiv hvile",
          blurb: "I dag er det lov å ta det med ro. En rolig tur er nok – gjerne langs sjøen hvis været er greit.",
          exercises: [easy],
        });
      }
    }
    if (mode !== "start") days = applyIntensity(days, mode, intensity);
    const meals = generateMeals(profile, week);
    const nutrition = nutritionTargets(profile);
    const notes = [...(profile.beginner_notes || [])];
    if (note) notes.push(note);
    if (mode === "overload") notes.push("Bra uke bak deg – vi øker litt, forsiktig.");
    else if (mode === "deload") notes.push("Denne uken er lettere, så kroppen får hentet seg inn.");
    else if (mode === "easier") notes.push("Vi tar det litt roligere denne uken, og bygger oss opp igjen etterpå.");
    const plan = {
      week, week_start: start, intensity: Math.round(intensity * 1000) / 1000,
      mode, days, meals, nutrition, notes, safety: SAFETY,
    };
    return suggestFromLogs(plan, logs);
  }

  function checkinDecision(energy, soreness, skipped) {
    energy = Math.max(1, Math.min(5, Number(energy)));
    soreness = Math.max(1, Math.min(5, Number(soreness)));
    skipped = Math.max(0, Math.min(7, Number(skipped)));
    let score = 0;
    if (energy >= 4) score += 1;
    if (energy <= 2) score -= 1;
    if (soreness <= 2) score += 1;
    if (soreness >= 4) score -= 1;
    if (skipped === 0) score += 1;
    if (skipped >= 2) score -= 2;
    else if (skipped === 1) score -= 1;
    if (score >= 2) {
      return ["overload", 1.08, "Du hadde overskudd og fikk unna øktene. Vi øker belastningen litt – mer vekt, en repetisjon mer, eller et sett ekstra der det passer."];
    }
    if (score <= -2) {
      return ["deload", 0.7, "Kroppen signaliserer at den trenger ro. Denne uken kutter vi volumet og gir deg mer hvile mellom settene."];
    }
    if (score < 0) {
      return ["easier", 0.9, "Det var en litt tung uke. Vi gjør øktene noe lettere, slik at du kommer deg merkbart videre neste uke."];
    }
    return ["hold", 1.0, "Vi holder nivået denne uken. Stabilitet er også fremgang – neste sjekk avgjør om vi øker."];
  }

  function adjustPlan(profile, plan, checkin, logs, start) {
    const energy = Number((checkin && checkin.energy) || 3);
    const soreness = Number((checkin && checkin.soreness) || 3);
    const skipped = Number((checkin && checkin.skipped) || 0);
    const [mode, factor, text] = checkinDecision(energy, soreness, skipped);
    let prev = Number((plan && plan.intensity) || 1.0);
    let intensity = mode === "hold" ? prev : Math.max(0.6, Math.min(1.25, prev * factor));
    const week = (Number((plan && plan.week) || 1) || 1) + 1;
    const newPlan = generatePlan(profile, { week, intensity, mode, start, logs, note: text });
    const summary = {
      mode, intensity, message: text,
      prev_volume: plan ? weekVolume(plan) : 0,
      new_volume: weekVolume(newPlan),
      energy, soreness, skipped,
    };
    return [newPlan, summary];
  }

  function todaySession(plan, day) {
    const iso = day || todayOslo();
    const days = (plan && plan.days) || [];
    for (const d of days) if (d.date === iso) return d;
    const name = weekdayName(iso);
    for (const d of days) if (d.weekday === name) return d;
    return null;
  }

  function isTrainingDay(day) {
    return !!(day && day.kind !== "hvile" && (day.exercises || []).length);
  }

  function nextTrainingDay(plan, day) {
    const days = (plan && plan.days) || [];
    if (!days.length) return null;
    const iso = day || todayOslo();
    let idx = days.findIndex((d) => d.date === iso);
    if (idx < 0) idx = days.findIndex((d) => d.weekday === weekdayName(iso));
    if (idx < 0) idx = weekdayIndex(iso);
    for (let step = 1; step <= days.length; step++) {
      const candidate = days[(idx + step) % days.length];
      if (isTrainingDay(candidate)) return candidate;
    }
    return null;
  }

  function alignToCurrentWeek(plan, today) {
    plan = clone(plan || {});
    const start = mondayOf(today || todayOslo());
    const byName = {};
    for (const day of plan.days || []) {
      if (day && DAYS.includes(day.weekday)) byName[day.weekday] = day;
    }
    plan.days = DAYS.map((name, i) => {
      const src = byName[name] || {
        weekday: name, kind: "hvile", title: "Ingen økt", blurb: "", exercises: [],
      };
      const day = clone(src);
      day.date = addDays(start, i);
      day.weekday = name;
      day.weekday_short = DAY_SHORT[i];
      if (!day.exercises) day.exercises = [];
      return day;
    });
    plan.week_start = start;
    return plan;
  }

  function progressStats(state, today) {
    today = today || todayOslo();
    const workouts = state.workouts || [];
    const doneDates = [...new Set(workouts.filter((w) => w.completed).map((w) => w.date))].sort();
    let streak = 0;
    let cursor = today;
    const planned = {};
    for (const d of ((state.plan || {}).days) || []) planned[d.date] = d;
    const completed = new Set(doneDates);
    for (;;) {
      const iso = cursor;
      const kind = (planned[iso] || {}).kind;
      if (completed.has(iso)) streak += 1;
      else if (kind === "hvile") { /* skip rest */ }
      else {
        if (cursor === today) { cursor = addDays(cursor, -1); continue; }
        break;
      }
      cursor = addDays(cursor, -1);
      if (daysBetween(today, cursor) > 60) break;
    }
    const volumeByWeek = {};
    for (const w of workouts) {
      if (!w.completed) continue;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(w.date || "")) continue;
      const key = mondayOf(w.date);
      let vol = 0;
      for (const ex of w.exercises || []) {
        for (const s of ex.sets || []) {
          if (s.done) {
            const reps = Number(s.reps || 0);
            const kg = Number(s.weight_kg || 0);
            vol += reps * (kg > 0 ? kg : 1);
          }
        }
      }
      volumeByWeek[key] = (volumeByWeek[key] || 0) + Math.round(vol);
    }
    let weights = (state.weights || []).filter((x) => x.kg).map((x) => ({ date: x.date, kg: x.kg }));
    if ((state.profile || {}).weight_kg && !weights.some((w) => w.date === today) && !weights.length) {
      const created = String(state.created || today).slice(0, 10);
      weights = [{ date: created, kg: state.profile.weight_kg }];
    }
    return {
      streak,
      sessions_done: doneDates.length,
      volume_by_week: Object.keys(volumeByWeek).sort().map((k) => ({ week_start: k, volume: volumeByWeek[k] })),
      weights: weights.slice(-16),
    };
  }

  const EXERCISE_ALIASES = {
    kneboy_kv: ["squat", "squats", "back squat", "kneboy", "kneboey"],
    goblet: ["goblet squat", "goblet kneboy"],
    benk: ["bench", "bench press", "benchpress", "benkpress", "benk press", "benkpres", "flat bench"],
    armhev: ["push up", "push ups", "pushup", "pushups", "push-ups", "armheving", "armhevninger"],
    markloft: ["deadlift", "dead lift", "deadlifts", "markloft", "mark loft", "markloftt"],
    rdl: ["romanian deadlift", "rumensk deadlift"],
    nedtrekk: ["lat pulldown", "pulldown", "lat pull down", "latsdrag"],
    skulderpress: ["shoulder press", "overhead press", "ohp", "militarpress", "skulderpres"],
    roing: ["row", "rows", "bent over row", "barbell row", "stangroing"],
    sittende_roing: ["seated row", "cable row", "kabelroing"],
    lateral: ["lateral raise", "side lateral"],
    biceps: ["curl", "curls", "biceps curl", "dumbbell curl"],
    triceps: ["skullcrusher", "triceps extension"],
    triceps_pushdown: ["pushdown", "triceps pushdown", "rope pushdown"],
    maskin_brystpress: ["chest press", "machine chest press", "brystpress"],
    incline_manualpress: ["incline press", "incline bench", "incline dumbbell press"],
    pec_fly_maskin: ["pec fly", "pec deck", "chest fly", "flyes", "pecfly"],
    preacher_curl: ["preacher", "preacher curl"],
    incline_biceps: ["incline curl", "incline biceps"],
    reverse_pec_fly: ["reverse fly", "rear delt", "bakre skulder"],
    front_raise: ["front raise"],
    hip_thrust: ["hipthrust", "hip thrusts"],
    glute_bridge: ["glute bridge"],
    leg_press: ["leg press"],
    leg_curl: ["leg curl", "hamstring curl", "larcurl"],
    calf: ["calf raise", "calf raises"],
    planke: ["plank"],
    jogg: ["jogging", "running"],
    farmers: ["farmer walk", "farmers walk"],
    face_pull: ["facepull", "face pulls"],
    dips_stol: ["bench dip", "chair dip", "dips"],
    wall_sit: ["wall sit"],
    burpee: ["burpees"],
    jumping_jacks: ["jumping jack"],
    mountain: ["mountain climber", "mountain climbers"],
    dead_bug: ["deadbug"],
    sykkel: ["bike", "erg", "romaskin"],
    utfall: ["lunge", "lunges", "forward lunge"],
  };

  const PULLUP = {
    id: "pullups",
    name: "Pull-ups / chins",
    muscle: "rygg",
    desc: "Heng i en stang med skulderbredde eller litt bredere for pull-ups, og smalere underhåndsgrep for chins. Start med strake armer og stram midje. Trekk albuene ned og brystet mot stangen til haken er over. Senk deg rolig helt ned.",
    tips: "Klarer du ikke en hel: hopp opp og senk deg sakte, eller tren nedtrekk i maskin til du blir sterkere.",
    aliases: ["pull up", "pull ups", "pullups", "pull-ups", "chin", "chins", "chin up", "chin ups", "chinups", "chin-ups"],
  };

  const CHAT_STOP = new Set([
    "plan", "planen", "maten", "mat", "vekt", "vekta", "reps", "sett", "settet",
    "hei", "hey", "hi", "hello", "hallo", "takk", "hvile", "trening", "treningen",
    "protein", "kalorier", "okt", "okten", "ovelse", "ovelsen", "teknikk",
  ]);

  let exerciseCatalog = null;

  function softText(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9æøå\s]+/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function foldText(s) {
    return softText(s)
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a");
  }

  function squashText(s) {
    return foldText(s).replace(/ /g, "");
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;
    let prev = [];
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      const ca = a.charCodeAt(i - 1);
      for (let j = 1; j <= b.length; j++) {
        const cost = ca === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      prev = cur;
    }
    return prev[b.length];
  }

  function fuzzyLimit(a, b) {
    const n = Math.max(a.length, b.length);
    const m = Math.min(a.length, b.length);
    if (m < 5) return 0;
    if (n >= 8 && m >= 6) return 2;
    if (m >= 5) return 1;
    return 0;
  }

  function exerciseCatalogEntries() {
    if (exerciseCatalog) return exerciseCatalog;
    const list = [];
    for (const [id, ex] of Object.entries(EXERCISES)) {
      const aliases = new Set([ex.name, id.replace(/_/g, " "), String(ex.name).replace(/\([^)]*\)/g, " ")]);
      for (const extra of EXERCISE_ALIASES[id] || []) aliases.add(extra);
      list.push({
        id, name: ex.name, desc: ex.desc, tips: ex.tips, muscle: ex.muscle,
        aliases: [...aliases].filter(Boolean),
      });
    }
    list.push(PULLUP);
    exerciseCatalog = list;
    return list;
  }

  function considerExercise(best, squashed, start, allowFuzzy) {
    if (!squashed || CHAT_STOP.has(squashed)) return best;
    for (const entry of exerciseCatalogEntries()) {
      for (const alias of entry.aliases) {
        const as = squashText(alias);
        if (!as || CHAT_STOP.has(as)) continue;
        const dist = as === squashed ? 0 : (allowFuzzy ? levenshtein(squashed, as) : 99);
        if (dist !== 0 && (!allowFuzzy || dist > fuzzyLimit(squashed, as))) continue;
        const score = dist * 1000 - as.length * 10 + start;
        if (!best || score < best.score) best = { entry, dist, score };
      }
    }
    return best;
  }

  function matchExercise(phrase) {
    const tokens = foldText(phrase).split(" ").filter(Boolean);
    if (!tokens.length) return null;
    let best = null;
    best = considerExercise(best, tokens.join(""), 0, tokens.length <= 4);
    if (tokens.length <= 10) {
      for (let i = 0; i < tokens.length; i++) {
        const max = Math.min(4, tokens.length - i);
        for (let n = 1; n <= max; n++) {
          best = considerExercise(best, tokens.slice(i, i + n).join(""), i, false);
        }
      }
    }
    return best ? best.entry : null;
  }

  function userTurns(state) {
    const chat = (state && state.chat) || [];
    const out = [];
    for (const m of chat) {
      if (!m || m.role !== "user") continue;
      const text = m.text || m.message || "";
      if (text) out.push(String(text));
    }
    return out;
  }

  function historyExercise(state) {
    const turns = userTurns(state);
    for (let i = turns.length - 1; i >= 0; i--) {
      const ex = matchExercise(turns[i]);
      if (ex && !isFoodText(softText(turns[i]))) return ex;
    }
    return null;
  }

  function isFoodText(text) {
    return /(\bmat\b|\bmaten\b|kosthold|protein|spise|\bspis\b|kalor|kcal|måltid|før trening|etter trening|pre workout|post workout|gå ned i vekt|ned i vekt|bygge muskl|kosthold)/iu.test(text);
  }

  function foodKind(text) {
    if (/etter trening|etter økt|post workout|etterpå/iu.test(text)) return "post";
    if (/før trening|pre workout|før økt/iu.test(text)) return "pre";
    if (/gå ned|ned i vekt|slanke/iu.test(text)) return "cut";
    if (/bygge muskl|muskelvekst/iu.test(text)) return "bulk";
    return "general";
  }

  function injuryReply(raw) {
    const text = String(raw || "");
    const emergency = /\b(knip i bryst|brystsmerte|svimmel|besvim|pustevansk|hjerte)\b/iu.test(text);
    const pain = /\b(vondt|smerte|skad|brudd|hevelse|hoven|knip)\b/iu.test(text);
    const chest = /\bbryst/iu.test(text) && !/\bbrystpress\b/iu.test(text);
    if (emergency || (pain && chest && /\b(brystet|brystsmerte|knip)\b/iu.test(text))) {
      return "Det høres ut som noe du bør ta alvorlig. Jeg er ikke lege, og jeg skal ikke gjettesykdommer. " +
        "Ta kontakt med lege eller legevakt, og tren ikke før du har fått det avklart.";
    }
    const knee = /\bkne\b|\bknær|\bkneet|\bknærne/iu.test(text);
    const back = /\bryggen\b|\bkorsrygg|\blynderygg/iu.test(text);
    const shoulder = /\bskuldra\b|\bskulderen\b|\bskuldrene\b|\bskulder\b/iu.test(text);
    if (pain && (knee || back || shoulder)) {
      let part = "kroppen";
      if (knee) part = "knærne";
      else if (back) part = "ryggen";
      else part = "skulderen";
      return `Hvis det er skarp smerte i ${part}, er det lurt å stoppe øvelsen og ta det rolig. ` +
        "Jeg er ikke lege, så ved vedvarende eller forverret smerte bør du snakke med fastlege eller fysioterapeut. " +
        "I mellomtiden: kutt dyp bøy og hopp, velg kortere bevegelsesutslag, og hold deg til det som er helt smertefritt. " +
        "Stølhet er greit, skarp vondt er det ikke.";
    }
    if (pain && /\b(vondt|smerte)\b/iu.test(text) && !matchExercise(text)) {
      return "Skarp eller plutselig smerte er et signal om å stoppe øvelsen, ikke om å tøffe seg gjennom. " +
        "Jeg er ikke lege. Ved smerte som ikke gir seg, hevelse eller smerte som blir verre, snakk med fastlege eller fysioterapeut. " +
        "Stølhet er greit, skarp vondt er det ikke.";
    }
    return "";
  }

  function splitSentences(s) {
    const parts = [];
    let buf = "";
    for (const ch of String(s || "")) {
      buf += ch;
      if (ch === "." || ch === "!" || ch === "?") {
        const t = buf.trim();
        if (t) parts.push(t);
        buf = "";
      }
    }
    if (buf.trim()) parts.push(buf.trim());
    return parts;
  }

  function techniqueReply(ex) {
    const sentences = splitSentences(ex.desc);
    const steps = (sentences.length ? sentences : ["Gjør bevegelsen rolig og kontrollert."])
      .map((s, i) => (i + 1) + ". " + s.replace(/[.!?]+$/, "") + ".")
      .join(" ");
    let reply = ex.name + ", steg for steg: " + steps;
    if (ex.tips) reply += " Tips: " + ex.tips;
    return reply;
  }

  function foodReply(profile, plan, kind) {
    const p = profile || {};
    const w = Number(p.weight_kg) || 75;
    const low = Math.round(1.6 * w);
    const high = Math.round(2.2 * w);
    const nut = (plan && plan.nutrition && plan.nutrition.kcal) ? plan.nutrition : nutritionTargets(p);
    const bits = [];
    if (kind === "post") {
      bits.push("Etter trening: få i deg protein og litt karbohydrat innen et par timer. Kvarg og banan, eller kylling og ris, er nok. Du trenger ikke en shake hvis vanlig mat er like greit.");
    } else if (kind === "pre") {
      bits.push("Før trening: spis et vanlig måltid 2–3 timer før, med karbohydrat og litt protein, for eksempel grove brødskiver og egg eller havregryn. Er det under en time igjen, holder det med en banan.");
    }
    bits.push("Sikt på omtrent " + low + "–" + high + " g protein om dagen, altså ca. 1,6–2,2 g per kg kroppsvekt.");
    if (nut && nut.kcal) bits.push("Et rolig energimål for deg er rundt " + nut.kcal + " kcal.");
    bits.push("Måltider som funker: frokost kvarg med banan, lunsj grove brødskiver med egg eller kylling, middag laks, fiskekaker eller bønner med potet og brokkoli, kvelds kesam eller knekkebrød.");
    if (kind === "general") {
      bits.push("Før trening: et måltid 2–3 timer før, eller en banan hvis det er kort tid. Etter trening: protein og karbohydrat innen et par timer.");
    }
    if (kind === "cut" || p.goal === "ga_ned_i_vekt") {
      bits.push("For å gå ned i vekt: hold et rolig underskudd, nok protein, og grønnsaker som metter. Ikke kutt så hardt at du blir sliten og sulten.");
    }
    if (kind === "bulk" || p.goal === "bygge_muskler") {
      bits.push("For å bygge muskler: spis litt mer enn du forbruker, fordel proteinet på dagens måltider, og løft tungt nok til at de siste repetisjonene er krevende.");
    }
    const meals = (plan && plan.meals) || [];
    if (meals.length) bits.push("Dagens forslag er " + meals.map((m) => String(m.name || "").toLowerCase() + " til " + m.slot).join(", ") + ".");
    bits.push("Jeg er ikke lege eller klinisk ernæringsfysiolog. Har du sykdom, spiseforstyrrelse eller er usikker, ta det med helsevesenet.");
    return bits.join(" ");
  }

  function setsReply(ex) {
    if (!ex) {
      return "Et vanlig utgangspunkt er 3 sett med 8–12 repetisjoner. Hvil 60–90 sekunder mellom settene på tunge øvelser, og 45–75 sekunder på mindre øvelser. Si navnet på øvelsen, så kan jeg være mer konkret.";
    }
    const rest = ["bein", "bryst", "rygg", "bakside"].includes(ex.muscle) ? "60–90" : "45–75";
    return ex.name + ": ta 3 sett med 8–12 repetisjoner. Hvil omtrent " + rest + " sekunder mellom settene. Når du klarer alle settene med god teknikk og et par reps i reserve, kan du legge på litt vekt neste økt.";
  }

  function planReply(profile, plan) {
    const goal = GOALS[profile.goal || ""] || "målet ditt";
    const level = LEVELS[profile.level || ""] || "nivået ditt";
    const eq = EQUIPMENT[profile.equipment || ""] || "utstyret ditt";
    const sess = plan ? todaySession(plan) : null;
    const today = sess ? ` I dag er det ${sess.title.toLowerCase()}: ${sess.blurb}` : "";
    return `Planen er satt opp for å ${goal.toLowerCase()}, tilpasset at du er ${level.toLowerCase()} og trener med ${eq.toLowerCase()}. ` +
      `Du har ${profile.days_per_week || 3} treningsdager og økter på rundt ${profile.minutes || 30} minutter.` +
      `${today} Etter hver uke spør jeg hvordan det gikk, og justerer opp, ned eller holder nivået.`;
  }

  function techniquePhrase(text) {
    const patterns = [
      /^hvordan gjør jeg (.+)$/,
      /^hvordan gjøre (.+)$/,
      /^hvordan gjør man (.+)$/,
      /^how do i (.+)$/,
      /^how to (.+)$/,
      /^forklar (.+)$/,
      /^vis meg (.+)$/,
      /^teknikk (?:på|for) (.+)$/,
      /^(.+) teknikk$/,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m[1]) return m[1];
    }
    return "";
  }

  function fallbackReply(message) {
    const pool = [
      "Hvordan gjør jeg knebøy?",
      "Hva gjør jeg om mat?",
      "Hvor mange reps bør jeg ta?",
      "Skal jeg øke vekten?",
      "Hva spiser jeg etter trening?",
      "Hvordan varmer jeg opp?",
    ];
    let h = 0;
    const s = softText(message);
    for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * (i + 1)) % 997;
    const picks = [];
    for (let k = 0; picks.length < 3 && k < pool.length * 2; k++) {
      const q = pool[(h + k) % pool.length];
      if (!picks.includes(q)) picks.push(q);
    }
    return "Jeg får ikke helt tak i spørsmålet. Du kan for eksempel spørre: «" +
      picks[0] + "», «" + picks[1] + "» eller «" + picks[2] + "».";
  }

  function programAwareReply(raw, text, state, plan) {
    if (/trene i dag|dagens økt|hva skal jeg trene|skal jeg trene i dag/.test(text)) {
      const sess = todaySession(plan);
      if (!sess) return "Jeg finner ikke en plan for i dag ennå.";
      if (!isTrainingDay(sess)) {
        const next = nextTrainingDay(plan, sess.date);
        return "I dag er en hviledag. Gå en rolig tur, sov 7–9 timer, og spis nok protein. " +
          (next ? "Neste økt: " + next.weekday + " – " + next.title + "." : "");
      }
      const names = (sess.exercises || []).slice(0, 6).map((e) => e.name).filter(Boolean);
      return "I dag er det " + (sess.title || "trening") + ". " +
        (names.length ? "Øvelsene er " + names.join(", ") + ". " : "") +
        "Trykk Start økt når du er klar.";
    }
    if (/hvordan går det|går det med|fremgang med/.test(text)) {
      const tokens = foldText(raw).split(" ").filter(Boolean);
      let best = null;
      for (let i = 0; i < tokens.length; i++) {
        const chunk = tokens.slice(i, i + 3).join("");
        const stemmed = chunk.replace(/(ene|en|et|a)$/, "");
        best = considerExercise(best, chunk, i, false);
        if (stemmed !== chunk) best = considerExercise(best, stemmed, i, false);
      }
      const ex = best && best.entry;
      const logs = (state && state.workouts) || [];
      if (!ex) {
        const done = logs.filter((w) => w.completed).length;
        return "Du har " + done + " fullførte økter i loggen. Spør for eksempel «hvordan går det med benken», så ser jeg på vekta di.";
      }
      let last = null;
      for (const w of logs) {
        for (const e of w.exercises || []) {
          if (e.id !== ex.id) continue;
          const sets = (e.sets || []).filter((s) => s.done && Number(s.weight_kg) > 0);
          if (sets.length) last = { date: w.date, kg: sets[sets.length - 1].weight_kg, reps: sets[sets.length - 1].reps };
        }
      }
      if (!last) return "Jeg har ikke en logg på " + ex.name + " ennå. Ta den neste gang, så følger jeg med.";
      const kg = String(last.kg).replace(".", ",");
      return ex.name + ": sist " + kg + " kg" + (last.reps ? " × " + last.reps : "") + " den " + last.date + ". Når de siste settene er lette, legger du på ca. 2,5 kg.";
    }
    return "";
  }

  function ruleReply(message, state) {
    const raw = String(message || "").trim();
    if (!raw) return "Hva lurer du på? Du kan spørre om øvelser, mat, stølhet, eller hvorfor planen ser ut som den gjør.";
    const text = softText(raw);
    const profile = (state || {}).profile || {};
    const plan = (state || {}).plan || {};
    const name = profile.name || "";
    const hello = name ? name + ", " : "";
    const hurt = injuryReply(raw);
    if (hurt) return hurt;
    if (/^(hei|heisann|hallo|hello|hey|hi|yo|morn|god morgen|god kveld|god dag)( der| igjen)?$/.test(text)) {
      return "Hei" + (name ? " " + name : "") + "! Jeg kan hjelpe med teknikk, mat, søvn og hvordan du øker vekten. Prøv «hvordan gjør jeg knebøy?» eller «hva gjør jeg om mat?».";
    }
    if (/^(takk|tusen takk|takk skal du ha|thanks|thank you)$/.test(text)) {
      return (name ? name + ", bare " : "Bare ") + "hyggelig. Spør igjen når du står fast i en øvelse, i maten eller i progresjonen.";
    }
    if (!isFoodText(text)) {
      const program = programAwareReply(raw, text, state, plan);
      if (program) return program;
    }
    if (isFoodText(text)) return foodReply(profile, plan, foodKind(text));
    if (/\b(søvn|sove|sovet|trøtt|søvnløs)\b/.test(text)) {
      return "Sikt på 7–9 timer søvn, gjerne med omtrent samme leggetid. Musklene blir sterkere mens du sover, så en veldig kort natt er et dårlig tidspunkt for en rekordtung økt. Mørkt rom og rolig siste time hjelper mer enn å scrolle. Jeg er ikke lege – ved langvarig søvnvansker, snakk med fastlegen.";
    }
    if (/(?:^|\s)(?:støl|stølhet|ømme|øm|doms|sore)(?=\s|$)/.test(text)) {
      return "Stølhet ett til to døgn etter økten er vanlig, særlig i starten. En rolig gåtur og litt lett bevegelse hjelper ofte mer enn å ligge stille. " +
        "Hvis du er så støl at teknikken blir dårlig, tar du en lettere økt eller bytter til aktiv hvile. " +
        "Skarp smerte, hevelse eller smerte som ikke gir seg, er noe annet – da skal du ikke «trene det bort». Jeg er ikke lege.";
    }
    if (/\b(oppvarming|varm opp|warmup|warm up)\b/.test(text)) {
      return "Bruk 5–8 minutter på å bli varm: rask gange, sykkel eller lett jogg. Ta deretter 1–2 lette sett av den første øvelsen, med god teknikk, før du går på arbeidsvekta. Du trenger ikke å tøye hardt når du er kald.";
    }
    if (/\b(orke|motivas|gidder|lei|tung dag|gi opp|umotivert)\b/.test(text)) {
      return `${hello}du trenger ikke å ha lyst. Du trenger bare å starte de første fem minuttene. ` +
        "Sett på skoene, gjør oppvarmingen, og tillat deg å ta en kort økt hvis det er en sånn dag. " +
        "Streaken din bygges av økter som ble gjort, ikke av perfekte økter.";
    }
    if (/øke vekt|legge på|tyngre|for lett|for tung|progresjon|progressive/.test(text)) {
      return `${hello}øk bare når du har tatt alle settene med god teknikk, og hatt et par repetisjoner i reserve. ` +
        "Da kan du legge på ca. 2,5 kg, eller ta én repetisjon mer neste økt. " +
        "Hvis siste sett var en kamp, eller teknikken raknet, blir du på samme vekt en uke til.";
    }
    if (/hvile mellom|pause mellom|rest mellom|hvor lenge (?:skal jeg )?hvile/.test(text)) {
      const ex = matchExercise(raw) || historyExercise(state);
      if (ex) return setsReply(ex);
      return "Hvil 60–90 sekunder mellom sett på tunge øvelser som knebøy, benkpress og markløft, og 45–75 sekunder på mindre øvelser som sidehev og curls. Du skal kunne starte neste sett med god teknikk, ikke stå og hive etter pusten.";
    }
    if (/\b(hvor mange reps|hvor mange sett|antall reps|antall sett|sett og reps|reps og sett)\b/.test(text)) {
      return setsReply(matchExercise(raw) || historyExercise(state));
    }
    if (/\b(hoppe over|hoppa over|ikke trent|missa|missed|skip)\b/.test(text)) {
      return `${hello}én tapt økt er ikke et problem. Ta neste planlagte økt som vanlig, eller gå en tur i dag hvis kroppen er sliten. ` +
        "Ikke prøv å «ta igjen» to økter på en dag. Når du tar ukesjekken, justerer jeg planen etter hvor mange økter som faktisk ble gjort.";
    }
    if (/\bplan(en)?\b|ukesplan|hva er økten|hvorfor denne|hvorfor akkurat|forklar planen/.test(text)) {
      return planReply(profile, plan);
    }
    if (/\bhviledag\b|\bhvile\b/.test(text)) {
      return "Hvile er en del av treningsplanen, ikke et avbrekk fra den. Musklene blir sterkere mellom øktene, særlig når du sover nok. " +
        "På hviledager er en rolig gåtur gull. Prøv å få 7–9 timer søvn – det gjør mer for fremgangen enn et ekstra sett.";
    }
    const phrase = techniquePhrase(text);
    const tokens = text.split(" ").filter(Boolean);
    const fromPhrase = phrase ? matchExercise(phrase) : null;
    const fromAll = matchExercise(raw);
    const ex = fromPhrase || fromAll;
    if (ex && (phrase || tokens.length <= 6)) return techniqueReply(ex);
    if (/^(og |men )?(teknikk|hvordan|forklar det)$/.test(text)) {
      const prev = historyExercise(state);
      if (prev) return techniqueReply(prev);
    }
    if (/^(og|men|også|mer|utdyp|fortell mer|samme)\b/.test(text)) {
      const prev = historyExercise(state);
      if (prev && /reps|sett|vekt|teknikk/.test(text)) return setsReply(prev);
      const turns = userTurns(state);
      for (let i = turns.length - 1; i >= 0; i--) {
        if (isFoodText(softText(turns[i]))) return foodReply(profile, plan, foodKind(text + " " + turns[i]));
      }
      if (prev) return techniqueReply(prev);
    }
    return fallbackReply(raw);
  }

  function coachBackend() { return "regler"; }

  function coachReply(message, state) {
    return { reply: ruleReply(message, state || {}), source: "regler" };
  }

  /* ---------- Min egen plan, overload, PR, 1RM ---------- */

  const MONDAY_TEMPLATE = [
    ["maskin_brystpress", COMPOUND_REST],
    ["incline_manualpress", COMPOUND_REST],
    ["pec_fly_maskin", ISO_REST],
    ["incline_biceps", ISO_REST],
    ["preacher_curl", ISO_REST],
    ["triceps_pushdown", ISO_REST],
    ["lateral", ISO_REST],
    ["reverse_pec_fly", ISO_REST],
    ["front_raise", ISO_REST],
  ];

  const BALANCE = [
    {
      id: "rygg_biceps",
      title: "Rygg og biceps",
      blurb: "En god motvekt til mandagens pressøkt. Forslag – du velger selv om og når du tar den.",
      prefer: ["onsdag", "torsdag"],
      muscles: new Set(["rygg"]),
      exercises: [["nedtrekk", COMPOUND_REST], ["sittende_roing", COMPOUND_REST], ["roing", COMPOUND_REST], ["face_pull", ISO_REST], ["biceps", ISO_REST]],
    },
    {
      id: "bein",
      title: "Bein og sete",
      blurb: "Beina fortjener en egen dag. Forslag – bare trykk på hvis du vil legge den inn.",
      prefer: ["fredag", "lørdag"],
      muscles: new Set(["bein", "sete", "bakside"]),
      exercises: [["leg_press", COMPOUND_REST], ["goblet", COMPOUND_REST], ["rdl", COMPOUND_REST], ["leg_curl", ISO_REST], ["hip_thrust", ISO_REST], ["calf", ISO_REST]],
    },
  ];

  function library() {
    const out = [];
    for (const [eid, meta] of Object.entries(EXERCISES)) {
      out.push({
        id: eid, name: meta.name, muscle: meta.muscle, desc: meta.desc, tips: meta.tips,
        eq: [...(meta.eq || [])], default_sets: 3, default_reps: DEFAULT_REPS,
        default_rest_sec: ["bein", "bryst", "rygg", "bakside"].includes(meta.muscle) ? COMPOUND_REST : ISO_REST,
      });
    }
    const order = { bryst: 0, rygg: 1, skulder: 2, arm: 3, triceps: 4, bein: 5, sete: 6, bakside: 7, legg: 8, kjerne: 9, helkropp: 10, kondisjon: 11 };
    out.sort((a, b) => (order[a.muscle] ?? 20) - (order[b.muscle] ?? 20) || a.name.localeCompare(b.name, "nb"));
    return out;
  }

  function fromCatalog(eid, restSec) {
    const meta = EXERCISES[eid];
    const rest = restSec != null ? restSec : (["bein", "bryst", "rygg", "bakside"].includes(meta.muscle) ? COMPOUND_REST : ISO_REST);
    return {
      id: eid, name: meta.name, muscle: meta.muscle, sets: 3, reps: DEFAULT_REPS,
      rest_sec: rest, desc: meta.desc, tips: meta.tips, custom: false,
    };
  }

  function mondayExercises() {
    return MONDAY_TEMPLATE.map(([eid, rest]) => fromCatalog(eid, rest));
  }

  function emptyDay(weekday) {
    const i = DAYS.indexOf(weekday);
    return {
      weekday, weekday_short: DAY_SHORT[i], kind: "hvile", title: "Ingen økt",
      blurb: "Tom dag. Legg til øvelser hvis du vil trene, eller la den være en hviledag.",
      exercises: [],
    };
  }

  function defaultCustomPlan() {
    const days = DAYS.map((name, i) => {
      if (name === "mandag") {
        return {
          weekday: name, weekday_short: DAY_SHORT[i], kind: "custom",
          title: "Bryst, armer og skuldre",
          blurb: "Din egen økt: først bryst, så armer og skuldre. Sett og hvile kan du justere selv.",
          exercises: mondayExercises(),
        };
      }
      return emptyDay(name);
    });
    return { days };
  }

  function slug(name) {
    const s = String(name || "ovelse").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40) || "ovelse";
    return "egen_" + s;
  }

  function normalizeExercise(raw) {
    raw = raw || {};
    let name = String(raw.name || "").trim().slice(0, 80);
    let eid = String(raw.id || "").trim().slice(0, 64);
    let desc, tips, muscle, custom;
    if (eid && EXERCISES[eid]) {
      const meta = EXERCISES[eid];
      name = name || meta.name;
      desc = String(raw.desc || meta.desc).slice(0, 400);
      tips = String(raw.tips || meta.tips).slice(0, 400);
      muscle = meta.muscle;
      custom = false;
    } else {
      if (!eid || eid === "custom" || eid === "egen") eid = slug(name || "øvelse");
      name = name || "Egen øvelse";
      desc = String(raw.desc || "").slice(0, 400);
      tips = String(raw.tips || "").slice(0, 400);
      muscle = String(raw.muscle || "annet").slice(0, 40);
      custom = true;
    }
    let sets = Number(raw.sets || 3);
    if (!Number.isFinite(sets)) sets = 3;
    sets = Math.max(1, Math.min(8, Math.round(sets)));
    const reps = (String(raw.reps || DEFAULT_REPS).trim().slice(0, 20)) || DEFAULT_REPS;
    let rest = raw.rest_sec != null ? Number(raw.rest_sec) : ISO_REST;
    if (!Number.isFinite(rest)) rest = ISO_REST;
    rest = Math.max(0, Math.min(300, Math.round(rest)));
    return { id: eid, name, muscle, sets, reps, rest_sec: rest, desc, tips, custom };
  }

  function normalizeCustomPlan(raw) {
    const base = defaultCustomPlan();
    const incoming = {};
    for (const d of (raw && raw.days) || []) {
      if (d && DAYS.includes(d.weekday)) incoming[d.weekday] = d;
    }
    const days = [];
    for (const tmpl of base.days) {
      const src = incoming[tmpl.weekday];
      if (!src) { days.push(tmpl); continue; }
      const exercises = (src.exercises || []).slice(0, 16).map(normalizeExercise);
      const title = String(src.title || "").trim().slice(0, 60);
      const blurb = String(src.blurb || "").trim().slice(0, 400);
      if (exercises.length) {
        days.push({
          weekday: tmpl.weekday, weekday_short: tmpl.weekday_short, kind: "custom",
          title: title || "Egen økt", blurb: blurb || "Din egen økt for denne dagen.", exercises,
        });
      } else {
        const empty = emptyDay(tmpl.weekday);
        if (title && title !== "Ingen økt" && title !== "Aktiv hvile") empty.title = title;
        if (blurb) empty.blurb = blurb;
        days.push(empty);
      }
    }
    return { days };
  }

  function estimate1rm(weightKg, reps) {
    const w = Number(weightKg);
    const r = Number(reps);
    if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return null;
    if (r === 1) return Math.round(w * 10) / 10;
    return Math.round(w * (1 + r / 30) * 10) / 10;
  }

  function doneSets(ex) {
    const out = [];
    for (const s of ex.sets || []) {
      if (!s.done) continue;
      let reps = Number(s.reps || 0);
      if (!Number.isFinite(reps)) reps = 0;
      let kg = Number(s.weight_kg || 0);
      if (!Number.isFinite(kg)) kg = 0;
      if (reps <= 0) continue;
      out.push({ reps, weight_kg: kg });
    }
    return out;
  }

  function lastPerformance(logs) {
    const out = {};
    for (const sess of logs || []) {
      for (const ex of sess.exercises || []) {
        const eid = ex.id;
        const done = doneSets(ex);
        if (eid && done.length) out[eid] = { date: sess.date, sets: done, name: ex.name || eid };
      }
    }
    return out;
  }

  function personalRecords(logs) {
    const prs = {};
    for (const sess of logs || []) {
      const day = sess.date;
      for (const ex of sess.exercises || []) {
        const eid = ex.id;
        if (!eid) continue;
        if (!prs[eid]) {
          prs[eid] = {
            id: eid, name: ex.name || (EXERCISES[eid] || {}).name || eid,
            max_kg: 0, max_kg_reps: 0, max_kg_date: null,
            max_1rm: 0, max_1rm_kg: 0, max_1rm_reps: 0, max_1rm_date: null,
          };
        }
        const rec = prs[eid];
        if (ex.name) rec.name = ex.name;
        for (const s of doneSets(ex)) {
          const w = s.weight_kg, r = s.reps;
          if (w <= 0) continue;
          if (w > rec.max_kg) { rec.max_kg = w; rec.max_kg_reps = r; rec.max_kg_date = day; }
          const rm = estimate1rm(w, r);
          if (rm && rm > rec.max_1rm) {
            rec.max_1rm = rm; rec.max_1rm_kg = w; rec.max_1rm_reps = r; rec.max_1rm_date = day;
          }
        }
      }
    }
    const filtered = {};
    for (const [k, v] of Object.entries(prs)) if (v.max_kg > 0 || v.max_1rm > 0) filtered[k] = v;
    return filtered;
  }

  function rangeBounds(reps) {
    if (!reps || String(reps).includes("min") || /\ds\b| s$/.test(reps)) return null;
    const nums = (String(reps).match(/\d+/g) || []).map(Number);
    if (!nums.length) return null;
    if (nums.length === 1) return [nums[0], nums[0]];
    return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
  }

  function fmtKg(kg) {
    if (kg == null) return "";
    const v = Number(kg);
    return Number.isInteger(v) ? String(v) : String(v);
  }

  function overloadHint(ex, last) {
    if (!last || !(last.sets || []).length) return null;
    const bounds = rangeBounds(ex.reps || DEFAULT_REPS);
    if (!bounds) return null;
    const [low, high] = bounds;
    const sets = last.sets;
    const reps = sets.map((s) => s.reps);
    const weights = sets.filter((s) => s.weight_kg > 0).map((s) => s.weight_kg);
    const lastKg = weights.length ? weights[weights.length - 1] : null;
    const lastReps = reps.slice();
    const date = last.date;
    const prettyReps = lastReps.join(", ");
    let suggest, text, kind;
    if (lastKg && reps.every((r) => r >= high)) {
      suggest = Math.round((lastKg + 2.5) * 2) / 2;
      text = `Du klarte ${high} reps på alle sett – prøv +2,5 kg neste gang`;
      kind = "increase_weight";
    } else if (lastKg && reps.every((r) => r >= low)) {
      suggest = lastKg;
      text = `Forrige: ${fmtKg(lastKg)} × ${prettyReps}. Prøv én repetisjon mer neste gang, eller bli på samme vekt til alle sett er ${high}.`;
      kind = "add_rep";
    } else if (lastKg && reps.some((r) => r < low)) {
      suggest = lastKg;
      text = `Forrige økt ble litt tung (${fmtKg(lastKg)} × ${prettyReps}). Bli på samme vekt, eller ta av 2,5 kg og hold teknikken ren.`;
      kind = "reduce";
    } else if (lastKg) {
      suggest = lastKg;
      text = `Forrige: ${fmtKg(lastKg)} kg × ${prettyReps}.`;
      kind = "hold";
    } else {
      suggest = null;
      text = `Forrige: ${prettyReps} reps.`;
      kind = "hold";
    }
    return { text, kind, last_kg: lastKg, last_reps: lastReps, last_date: date, suggest_kg: suggest };
  }

  function annotateExercises(exercises, logs) {
    const last = lastPerformance(logs);
    const prs = personalRecords(logs);
    return (exercises || []).map((raw) => {
      const ex = clone(raw);
      const eid = ex.id;
      const perf = last[eid];
      const hint = overloadHint(ex, perf);
      const rec = prs[eid];
      if (hint) {
        ex.hint = hint.text;
        ex.hint_kind = hint.kind;
        ex.last_kg = hint.last_kg;
        ex.last_reps = hint.last_reps;
        ex.last_date = hint.last_date;
        if (hint.suggest_kg) ex.suggest_kg = hint.suggest_kg;
      } else if (perf) {
        const weights = perf.sets.filter((s) => s.weight_kg > 0).map((s) => s.weight_kg);
        if (weights.length) {
          ex.last_kg = weights[weights.length - 1];
          ex.suggest_kg = weights[weights.length - 1];
        }
        ex.last_reps = perf.sets.map((s) => s.reps);
        ex.last_date = perf.date;
      }
      if (rec) {
        ex.pr_kg = rec.max_kg;
        ex.pr_1rm = rec.max_1rm;
        ex.pr_date = rec.max_kg_date;
        if (perf && rec.max_kg_date === perf.date && rec.max_kg > 0) {
          ex.pr = true;
          ex.pr_label = "Personlig rekord: " + fmtKg(rec.max_kg) + " kg";
        }
      }
      return ex;
    });
  }

  function annotatePlan(plan, logs) {
    plan = clone(plan || {});
    for (const day of plan.days || []) day.exercises = annotateExercises(day.exercises || [], logs);
    return plan;
  }

  function materializeCustomPlan(custom, opts) {
    opts = opts || {};
    const start = mondayOf(opts.start || todayOslo());
    custom = normalizeCustomPlan(custom);
    const logs = opts.logs;
    const profile = opts.profile;
    const week = opts.week || 1;
    const notes = [...(opts.notes || [])];
    const days = custom.days.map((src, i) => {
      const d = addDays(start, i);
      const day = clone(src);
      day.date = d;
      day.weekday = DAYS[i];
      day.weekday_short = DAY_SHORT[i];
      day.exercises = annotateExercises(day.exercises || [], logs);
      if (!day.exercises.length) day.kind = "hvile";
      return day;
    });
    let meals = [], nutrition = {};
    if (profile) {
      meals = generateMeals(profile, week);
      nutrition = nutritionTargets(profile);
    }
    return {
      week, week_start: start, intensity: 1.0, mode: "custom", source: "custom",
      days, meals, nutrition, notes, safety: SAFETY,
    };
  }

  function migrateState(state) {
    if (!state.plan_source) state.plan_source = "generated";
    if (!state.custom_plan || !(state.custom_plan.days || []).length) {
      state.custom_plan = defaultCustomPlan();
    } else {
      const notes = state.custom_plan.notes;
      state.custom_plan = normalizeCustomPlan(state.custom_plan);
      if (notes && notes.length) state.custom_plan.notes = notes;
    }
    return state;
  }

  function resolvePlan(state, today) {
    state = migrateState(state);
    const logs = state.workouts;
    today = today || todayOslo();
    if ((state.plan_source || "generated") === "custom") {
      const notes = [...((state.custom_plan || {}).notes || [])];
      const week = Number((state.plan || {}).week || 1);
      return materializeCustomPlan(state.custom_plan || {}, { start: today, logs, profile: state.profile, week, notes });
    }
    const plan = alignToCurrentWeek(annotatePlan(state.plan || {}, logs), today);
    plan.source = "generated";
    return plan;
  }

  function applyCustomCheckin(state, checkin, start) {
    const energy = Number((checkin && checkin.energy) || 3);
    const soreness = Number((checkin && checkin.soreness) || 3);
    const skipped = Number((checkin && checkin.skipped) || 0);
    const [mode, , text] = checkinDecision(energy, soreness, skipped);
    let extra;
    if (mode === "overload") extra = "Se hintene på hver øvelse – der du tok topp-repetisjonene, kan du legge på 2,5 kg.";
    else if (mode === "deload") extra = "Behold øvelsene dine, men ta litt mindre vekt eller ett sett mindre denne uken.";
    else if (mode === "easier") extra = "Behold øvelsene, og gå litt roligere på vektene til overskuddet er tilbake.";
    else extra = "Behold øvelsene som de er. Hintene på hver øvelse viser når det er klart å øke.";
    const message = text + " " + extra;
    const custom = normalizeCustomPlan(state.custom_plan || {});
    custom.notes = [message];
    state.custom_plan = custom;
    const newPlan = materializeCustomPlan(custom, {
      start, logs: state.workouts, profile: state.profile,
      week: Number((state.plan || {}).week || 1) + 1, notes: [message],
    });
    const prev = resolvePlan(state, start);
    const summary = {
      mode, intensity: 1.0, message,
      prev_volume: weekVolume(prev), new_volume: weekVolume(newPlan),
      energy, soreness, skipped,
    };
    return [newPlan, summary];
  }

  function musclesIn(custom) {
    const found = new Set();
    for (const day of (custom || {}).days || []) {
      for (const ex of day.exercises || []) {
        if (ex.muscle) found.add(ex.muscle);
        if (ex.id && EXERCISES[ex.id]) found.add(EXERCISES[ex.id].muscle);
      }
    }
    return found;
  }

  function emptyWeekdays(custom) {
    return ((custom || {}).days || []).filter((d) => !(d.exercises || []).length).map((d) => d.weekday);
  }

  function setIntersect(a, b) {
    for (const x of a) if (b.has(x)) return true;
    return false;
  }

  function balanceSuggestions(custom) {
    custom = normalizeCustomPlan(custom);
    const have = musclesIn(custom);
    const free = emptyWeekdays(custom);
    const out = [];
    for (const sug of BALANCE) {
      if (setIntersect(sug.muscles, have)) continue;
      let day = sug.prefer.find((d) => free.includes(d));
      if (!day && free.length) day = free.find((d) => d !== "mandag") || free[0];
      if (!day) continue;
      out.push({
        id: sug.id, title: sug.title, blurb: sug.blurb, weekday: day,
        exercises: sug.exercises.filter(([eid]) => EXERCISES[eid]).map(([eid, rest]) => fromCatalog(eid, rest)),
      });
    }
    return out;
  }

  function progressExtras(state) {
    const prs = personalRecords(state.workouts || []);
    const ranked = Object.values(prs).sort((a, b) => (b.max_1rm || 0) - (a.max_1rm || 0));
    return {
      prs: ranked.slice(0, 16),
      one_rm: ranked.filter((r) => r.max_1rm).slice(0, 16).map((r) => ({
        id: r.id, name: r.name, kg: r.max_1rm,
        from: fmtKg(r.max_1rm_kg) + " kg × " + r.max_1rm_reps,
        date: r.max_1rm_date,
      })),
    };
  }

  const api = {
    SAFETY, DAYS, DAY_SHORT, GOALS, LEVELS, EQUIPMENT, EXERCISES,
    TrenerError, todayOslo, mondayOf, weekdayName, addDays, midReps, bumpReps, weekVolume,
    normalizeProfile, nutritionTargets, generateMeals, generatePlan, checkinDecision, adjustPlan,
    todaySession, nextTrainingDay, isTrainingDay, progressStats, ruleReply, coachReply, coachBackend,
    library, mondayExercises, defaultCustomPlan, normalizeExercise, normalizeCustomPlan,
    estimate1rm, lastPerformance, personalRecords, overloadHint,
    annotateExercises, annotatePlan, materializeCustomPlan, migrateState, resolvePlan,
    applyCustomCheckin, balanceSuggestions, progressExtras, fmtKg,
  };
  if (typeof globalThis !== "undefined") globalThis.Trener = api;
})();
