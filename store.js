/* Lokal lagring i localStorage. Ingen server, ingen passord. */
(() => {
  const T = globalThis.Trener;
  const KEY = "trener_state_v1";
  const LEGACY_TOKEN = "trener_token_v1";

  const FIELD = {
    age: "Alder",
    height_cm: "Høyde",
    weight_kg: "Vekt",
    days_per_week: "Dager i uka",
    minutes: "Minutter per økt",
    name: "Navn",
    food: "Mat og hensyn",
    energy: "Energi",
    soreness: "Stølhet",
    skipped: "Økter du hoppet over",
    message: "Melding",
  };

  class TrenerError extends T.TrenerError {}

  function makeToken() {
    const bytes = new Uint8Array(24);
    (globalThis.crypto || {}).getRandomValues
      ? crypto.getRandomValues(bytes)
      : bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
    let s = "";
    for (const b of bytes) s += String.fromCharCode(b);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function loadRaw() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
    return state;
  }

  function hasState() {
    const s = loadRaw();
    return !!(s && s.profile);
  }

  function requireState() {
    const state = loadRaw();
    if (!state || !state.profile) {
      throw new TrenerError("Fant ingen plan på denne enheten. Lag en ny plan så er du i gang.", 404);
    }
    return T.migrateState(state);
  }

  function issues(fields) {
    const detail = [];
    for (const f of fields) {
      const { key, value, ge, le, required, maxLen, integer } = f;
      if (value == null || value === "") {
        if (required) detail.push({ loc: ["body", key], msg: "required", ctx: {} });
        continue;
      }
      if (maxLen != null && String(value).length > maxLen) {
        detail.push({ loc: ["body", key], msg: "too_long", ctx: { le: maxLen } });
        continue;
      }
      if (ge != null || le != null) {
        const n = Number(String(value).replace(",", "."));
        if (!Number.isFinite(n)) {
          detail.push({ loc: ["body", key], msg: "invalid", ctx: {} });
        } else if (ge != null && n < ge) {
          detail.push({ loc: ["body", key], msg: "ge", ctx: { ge } });
        } else if (le != null && n > le) {
          detail.push({ loc: ["body", key], msg: "le", ctx: { le } });
        }
      }
    }
    if (detail.length) {
      const err = new TrenerError("Ugyldig verdi.");
      err.status = 422;
      err.detail = detail;
      throw err;
    }
  }

  function formatError(err) {
    if (typeof err.detail === "string") return err;
    if (Array.isArray(err.detail)) {
      const msg = err.detail.map((d) => {
        const f = FIELD[(d.loc || []).slice(-1)[0]] || "Et felt";
        const c = d.ctx || {};
        if (c.ge !== undefined) return f + " må være minst " + c.ge + ".";
        if (c.le !== undefined) return f + " kan være høyst " + c.le + ".";
        return f + " har en ugyldig verdi.";
      }).join(" ");
      const e = new TrenerError(msg, err.status || 422);
      e.detail = err.detail;
      return e;
    }
    return err;
  }

  function recentWorkouts(state) {
    return (state.workouts || []).slice(-20).map((w) => ({
      date: w.date, title: w.title, completed: !!w.completed, exercises: w.exercises || [],
    }));
  }

  function publicView(state, extra) {
    T.migrateState(state);
    const today = T.todayOslo();
    const plan = T.resolvePlan(state, today);
    const view = { ...state, plan };
    const progress = T.progressStats(view, today);
    Object.assign(progress, T.progressExtras(state));
    const out = {
      ok: true,
      token: state.token,
      profile: state.profile,
      plan,
      plan_source: state.plan_source || "generated",
      custom_plan: state.custom_plan,
      suggestions: T.balanceSuggestions(state.custom_plan || {}),
      library: T.library(),
      today: T.todaySession(plan, today),
      progress,
      prefs: state.prefs || { units: "kg", rest_sec: 90, theme: "dark" },
      active_workout: state.active_workout || null,
      day_marks: state.day_marks || {},
      badges: T.achievements(state),
      week: T.weeklySummary(Object.assign({}, state, { plan })),
      checkins: (state.checkins || []).slice(-8),
      chat: (state.chat || []).slice(-20),
      workouts: recentWorkouts(state),
      coach: T.coachBackend(),
      safety: T.SAFETY,
    };
    if (extra) Object.assign(out, extra);
    return out;
  }

  function onboard(body) {
    issues([
      { key: "name", value: body.name, maxLen: 30 },
      { key: "food", value: body.food, maxLen: 400 },
      { key: "days_per_week", value: body.days_per_week, ge: 2, le: 6, required: true },
      { key: "minutes", value: body.minutes, ge: 20, le: 90, required: true },
      { key: "age", value: body.age, ge: 16, le: 80 },
      { key: "height_cm", value: body.height_cm, ge: 130, le: 220 },
      { key: "weight_kg", value: body.weight_kg, ge: 40, le: 200 },
    ]);
    let profile;
    try {
      profile = T.normalizeProfile(body);
    } catch (e) {
      throw formatError(e);
    }
    const today = T.todayOslo();
    let state = loadRaw();
    if (!state || !state.token) {
      state = {
        token: makeToken(),
        created: new Date().toISOString(),
        workouts: [], checkins: [], weights: [], chat: [],
      };
    }
    if (profile.weight_kg) {
      const weights = [...(state.weights || [])];
      if (!weights.some((w) => w.date === today)) weights.push({ date: today, kg: profile.weight_kg });
      state.weights = weights;
    }
    state.profile = profile;
    state.plan = T.generatePlan(profile, { week: Number((state.plan || {}).week || 1), start: today, logs: state.workouts });
    T.migrateState(state);
    save(state);
    try { localStorage.removeItem(LEGACY_TOKEN); } catch {}
    return publicView(state);
  }

  function me() {
    return publicView(requireState());
  }

  function checkin(body) {
    issues([
      { key: "energy", value: body.energy, ge: 1, le: 5, required: true },
      { key: "soreness", value: body.soreness, ge: 1, le: 5, required: true },
      { key: "skipped", value: body.skipped || 0, ge: 0, le: 7 },
      { key: "weight_kg", value: body.weight_kg, ge: 40, le: 200 },
      { key: "note", value: body.note, maxLen: 400 },
    ]);
    const state = requireState();
    const today = T.todayOslo();
    const weight = body.weight_kg ? Number(String(body.weight_kg).replace(",", ".")) : null;
    if (weight) {
      const weights = [...(state.weights || [])];
      weights.push({ date: today, kg: weight });
      state.weights = weights.slice(-24);
      if (state.profile) state.profile.weight_kg = weight;
    }
    const payload = {
      energy: Number(body.energy),
      soreness: Number(body.soreness),
      skipped: Number(body.skipped || 0),
      weight_kg: weight,
      note: body.note || "",
    };
    let summary;
    if ((state.plan_source || "generated") === "custom") {
      [, summary] = T.applyCustomCheckin(state, payload, today);
    } else {
      const [newPlan, s] = T.adjustPlan(state.profile, state.plan || {}, payload, state.workouts, today);
      state.plan = newPlan;
      summary = s;
    }
    const rec = {
      date: today,
      energy: payload.energy,
      soreness: payload.soreness,
      skipped: payload.skipped,
      weight_kg: weight,
      note: payload.note,
      mode: summary.mode,
      message: summary.message,
    };
    state.checkins = [...(state.checkins || []), rec];
    save(state);
    return publicView(state, { adjustment: summary });
  }

  function workout(body) {
    const state = requireState();
    let iso;
    try {
      iso = body.date ? String(body.date).slice(0, 10) : T.todayOslo();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error("bad");
    } catch {
      throw new TrenerError("Ugyldig dato.");
    }
    if ((body.title || "").length > 60) {
      const err = new TrenerError("Ugyldig verdi.", 422);
      err.detail = [{ loc: ["body", "title"], ctx: { le: 60 } }];
      throw formatError(err);
    }
    const exercisesIn = (body.exercises || []).slice(0, 16);
    const workouts = [...(state.workouts || [])];
    let current = workouts.find((w) => w.date === iso);
    if (!current) {
      current = { date: iso, title: body.title || "", exercises: [], completed: false };
      workouts.push(current);
    }
    if (body.title) current.title = String(body.title).slice(0, 60);
    if (exercisesIn.length) {
      current.exercises = exercisesIn.map((ex) => ({
        id: String(ex.id || "").slice(0, 64),
        note: String(ex.note || "").slice(0, 200),
        superset: !!ex.superset,
        sets: (ex.sets || []).slice(0, 10).map((s) => {
          const row = {
            reps: s.reps === "" || s.reps == null ? null : Number(s.reps),
            weight_kg: s.weight_kg === "" || s.weight_kg == null ? null : Number(String(s.weight_kg).replace(",", ".")),
            done: !!s.done,
          };
          if (s.rpe != null && s.rpe !== "") row.rpe = Number(s.rpe);
          return row;
        }),
      }));
    }
    if (body.action === "complete" || body.completed) {
      current.completed = true;
      state.active_workout = null;
    } else if (body.draft) {
      state.active_workout = body.draft;
    }
    state.workouts = workouts.slice(-80);
    save(state);
    return publicView(state);
  }

  function chat(body) {
    const msg = String((body && body.message) || "").trim();
    if (!msg) {
      const err = new TrenerError("Ugyldig verdi.", 422);
      err.detail = [{ loc: ["body", "message"], ctx: { ge: 1 } }];
      throw formatError(err);
    }
    if (msg.length > 1000) {
      const err = new TrenerError("Ugyldig verdi.", 422);
      err.detail = [{ loc: ["body", "message"], ctx: { le: 1000 } }];
      throw formatError(err);
    }
    const state = requireState();
    const ctx = { ...state, plan: T.resolvePlan(state) };
    const result = T.coachReply(msg, ctx);
    const now = T.todayOslo();
    const log = [...(state.chat || [])];
    log.push({ role: "user", text: msg, date: now });
    log.push({ role: "coach", text: result.reply, date: now, source: result.source });
    state.chat = log.slice(-40);
    save(state);
    return publicView(state, { reply: result.reply, source: result.source });
  }

  function saveCustom(body) {
    const state = requireState();
    let source = String((body && body.plan_source) || "custom").trim();
    if (source !== "generated" && source !== "custom") throw new TrenerError("Ugyldig plankilde.");
    state.plan_source = source;
    if (body && body.days) {
      state.custom_plan = T.normalizeCustomPlan({ days: body.days });
      if (!body.plan_source) state.plan_source = "custom";
    }
    save(state);
    return publicView(state);
  }

  function exportJSON() {
    const state = loadRaw();
    if (!state) throw new TrenerError("Ingen data å eksportere ennå.", 404);
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new TrenerError("Filen er ikke gyldig JSON.");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new TrenerError("Sikkerhetskopien mangler treningsdata.");
    }
    if (!parsed.profile) throw new TrenerError("Sikkerhetskopien mangler profilen. Velg en fil fra denne appen.");
    if (!parsed.token) parsed.token = makeToken();
    parsed.workouts = parsed.workouts || [];
    parsed.checkins = parsed.checkins || [];
    parsed.weights = parsed.weights || [];
    parsed.chat = parsed.chat || [];
    T.migrateState(parsed);
    if (!parsed.plan) {
      parsed.plan = T.generatePlan(parsed.profile, { start: T.todayOslo(), logs: parsed.workouts });
    }
    save(parsed);
    return publicView(parsed);
  }

  function savePrefs(body) {
    const state = requireState();
    state.prefs = Object.assign({ units: "kg", rest_sec: 90, theme: "system" }, state.prefs || {}, body || {});
    if (body && body.rest_sec) state.prefs.rest_sec = Math.max(15, Math.min(300, Number(body.rest_sec) || 90));
    save(state);
    return publicView(state);
  }

  function swapDays(body) {
    const state = requireState();
    const a = String((body && body.from) || "");
    const b = String((body && body.to) || "");
    const plan = (state.plan_source === "custom" ? state.custom_plan : state.plan) || {};
    const days = plan.days || [];
    const da = days.find((d) => d.weekday === a);
    const db = days.find((d) => d.weekday === b);
    if (!da || !db) throw new TrenerError("Fant ikke dagene.");
    for (const key of ["title", "blurb", "kind", "exercises"]) {
      const tmp = da[key];
      da[key] = db[key];
      db[key] = tmp;
    }
    save(state);
    return publicView(state);
  }

  function markDay(body) {
    const state = requireState();
    const date = String((body && body.date) || "").slice(0, 10);
    const mark = String((body && body.mark) || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new TrenerError("Ugyldig dato.");
    state.day_marks = state.day_marks || {};
    if (mark === "done" || mark === "skipped") state.day_marks[date] = mark;
    else delete state.day_marks[date];
    save(state);
    return publicView(state);
  }

  function reset() {
    localStorage.removeItem(KEY);
    try { localStorage.removeItem(LEGACY_TOKEN); } catch {}
  }

  const api = {
    KEY, hasState, me, onboard, checkin, workout, chat, saveCustom, savePrefs, swapDays, markDay,
    exportJSON, importJSON, reset, publicView, formatError, TrenerError,
  };
  if (typeof globalThis !== "undefined") globalThis.TrenerStore = api;
})();
