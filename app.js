(() => {
  const app = document.getElementById("app");
  const state = {
    view: "boot", tab: "plan", data: null, err: "", onb: {}, step: 0,
    workout: null, rest: null, previewDay: null, editing: false, editDay: "mandag",
    editPlan: null, picker: false, libQuery: "", newEx: "", workoutSess: null,
    chatDraft: "", checkin: { energy: 0, soreness: 0, skipped: 0, weight_kg: "", note: "" },
    showCheckin: false, ok: "", summary: null, swap: false, typing: false, updateReady: false,
  };

  const GOALS = [
    ["bygge_muskler", "Bygge muskler", "Mer masse, jevn fremgang"],
    ["bli_sterkere", "Bli sterkere", "Mer kraft i hverdagen"],
    ["ga_ned_i_vekt", "Gå ned i vekt", "Rolig og varig underskudd"],
    ["bedre_kondisjon", "Bedre kondisjon", "Pulsen opp, bedre utholdenhet"],
  ];
  const LEVELS = [
    ["nybegynner", "Nybegynner", "Jeg er i gang, eller starter på nytt"],
    ["litt_erfaring", "Litt erfaring", "Jeg har trent av og til"],
    ["viderekommen", "Viderekommen", "Jeg trener jevnt og kan basisløft"],
  ];
  const EQUIP = [
    ["ingen", "Ingen utstyr", "Kroppsvekt og gåturer"],
    ["manualer", "Manualer", "Jeg har vekter hjemme"],
    ["treningssenter", "Treningssenter", "Stang, maskiner og kabel"],
  ];
  const SLOTS = { frokost: "Frokost", lunsj: "Lunsj", middag: "Middag", kvelds: "Kvelds" };

  async function api(path, { body } = {}) {
    const NAVN = { age: "Alder", height_cm: "Høyde", weight_kg: "Vekt", days_per_week: "Dager i uka", minutes: "Minutter per økt", name: "Navn", food: "Mat og hensyn" };
    try {
      const S = globalThis.TrenerStore;
      let data;
      if (path === "me") data = S.me();
      else if (path === "onboard") data = S.onboard(body);
      else if (path === "checkin") data = S.checkin(body);
      else if (path === "workout") data = S.workout(body);
      else if (path === "chat") data = S.chat(body);
      else if (path === "custom") data = S.saveCustom(body);
      else throw new Error("Ukjent handling.");
      return data;
    } catch (e) {
      let msg = e && e.message ? e.message : "Noe gikk galt.";
      if (e && typeof e.detail === "string") msg = e.detail;
      else if (e && Array.isArray(e.detail)) msg = e.detail.map((d) => {
        const f = NAVN[(d.loc || []).slice(-1)[0]] || "Et felt";
        const c = d.ctx || {};
        if (c.ge !== undefined) return f + " må være minst " + c.ge + ".";
        if (c.le !== undefined) return f + " kan være høyst " + c.le + ".";
        return f + " har en ugyldig verdi.";
      }).join(" ");
      const err = new Error(msg);
      err.status = e.status || 400;
      throw err;
    }
  }

  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === "class") n.className = v;
        else if (k === "html") n.innerHTML = v;
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else if (k === "dataset") Object.assign(n.dataset, v);
        else n.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const kid of kids) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return n;
  }

  function icon(name) {
    const paths = {
      plan: '<path d="M8 4h8v2H8zM5 8h14v12H5z" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12h8M8 15h5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      okt: '<path d="M5 12h14M7 8v8M17 8v8M4 9.5v5M20 9.5v5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
      frem: '<path d="M4 16l5-5 4 3 7-8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
      chat: '<path d="M5 6h14v10H8l-3 3z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[name] || ""}</svg>`;
  }

  function tap(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 12); } catch {} }
  function todayIso() {
    return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  }
  function osloHour() {
    return Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
  }
  function greeting() {
    const h = osloHour();
    if (h < 10) return "God morgen";
    if (h < 18) return "Hei";
    return "God kveld";
  }
  function prettyDay(name) { return name ? name.charAt(0).toUpperCase() + name.slice(1) : ""; }
  function fmtDate(iso) {
    if (!iso) return "";
    const [, m, d] = iso.split("-");
    return Number(d) + "." + Number(m);
  }
  function planDays() { return (((state.data || {}).plan || {}).days) || []; }
  function sessionFor(iso) { return planDays().find((d) => d.date === iso) || null; }
  function todaySession() { return sessionFor(todayIso()) || ((state.data || {}).today) || null; }
  function trainingDay(day) {
    return globalThis.Trener && Trener.isTrainingDay ? Trener.isTrainingDay(day) : !!(day && day.kind !== "hvile" && (day.exercises || []).length);
  }
  function nextTraining(from) {
    if (!(globalThis.Trener && Trener.nextTrainingDay)) return null;
    return Trener.nextTrainingDay((state.data || {}).plan, (from && from.date) || todayIso());
  }
  function selectedSession() {
    const days = planDays();
    const iso = todayIso();
    if (state.previewDay && days.some((d) => d.date === state.previewDay)) return days.find((d) => d.date === state.previewDay);
    return days.find((d) => d.date === iso) || todaySession() || days[0] || null;
  }
  function shiftSelected(delta) {
    const days = planDays();
    if (!days.length) return;
    const cur = selectedSession();
    const i = Math.max(0, days.findIndex((d) => d.date === (cur && cur.date)));
    state.previewDay = days[(i + delta + days.length) % days.length].date;
    render();
  }
  function isCustom() { return ((state.data || {}).plan_source || "generated") === "custom"; }
  function goalLabel(id) { return (GOALS.find((g) => g[0] === id) || [, id])[1]; }
  function completedOn(iso) { return ((state.data || {}).workouts || []).some((w) => w.date === iso && w.completed); }
  function doseText(ex) {
    if (!ex) return "";
    if ((ex.reps || "").includes("min") || (ex.reps || "").includes(" s")) return ex.reps || "";
    return (ex.sets || "") + " × " + (ex.reps || "");
  }
  function lastLine(ex) {
    if (!ex.last_kg && !(ex.last_reps || []).length) return "";
    const reps = (ex.last_reps || []).filter((r) => r != null).join(", ");
    const kg = ex.last_kg != null ? String(ex.last_kg).replace(".", ",") + " kg" : "";
    if (kg && reps) return "Forrige: " + kg + " × " + reps;
    if (kg) return "Forrige: " + kg;
    return reps ? "Forrige: " + reps + " reps" : "";
  }
  function estimateMinutes(sess) {
    let sec = 180;
    for (const ex of (sess && sess.exercises) || []) {
      const sets = Number(ex.sets) || 3;
      sec += sets * 45 + Math.max(0, sets - 1) * (Number(ex.rest_sec) || 60);
    }
    return Math.max(15, Math.round(sec / 60));
  }
  function midReps(rep) {
    const nums = String(rep || "").match(/\d+/g);
    if (!nums) return 8;
    if (nums.length === 1) return Number(nums[0]);
    return Math.round((Number(nums[0]) + Number(nums[1])) / 2);
  }

  async function boot() {
    if (!TrenerStore.hasState()) { state.view = "onboard"; state.step = 0; render(); return; }
    try { state.data = await api("me"); state.view = "app"; }
    catch (e) {
      if (e.status === 404) { TrenerStore.reset(); state.view = "onboard"; state.step = 0; }
      else { state.view = "error"; state.err = e.message; }
    }
    render();
  }

  function setChoice(key, value) { tap(8); state.onb[key] = value; render(); }
  function choices(items, key) {
    const box = el("div", { class: "choices" });
    for (const [id, title, sub] of items) {
      box.append(el("button", { class: "choice" + (state.onb[key] === id ? " on" : ""), type: "button", onclick: () => setChoice(key, id) }, title, el("small", {}, sub)));
    }
    return box;
  }
  function numChoices(key, values, fmt) {
    const box = el("div", { class: "choices two" });
    for (const v of values) box.append(el("button", { class: "choice" + (Number(state.onb[key]) === v ? " on" : ""), type: "button", onclick: () => setChoice(key, v) }, fmt(v)));
    return box;
  }

  async function submitOnboard() {
    state.err = "";
    const o = state.onb;
    if (!o.goal || !o.level || !o.days_per_week || !o.minutes || !o.equipment) {
      state.err = "Huk av valgene først, så lager jeg planen.";
      render(); return;
    }
    try {
      state.data = await api("onboard", { body: {
        name: (o.name || "").trim(), goal: o.goal, level: o.level,
        days_per_week: Number(o.days_per_week), minutes: Number(o.minutes), equipment: o.equipment,
        age: o.age ? Math.round(Number(o.age)) : null,
        height_cm: o.height_cm ? Math.round(Number(String(o.height_cm).replace(",", "."))) : null,
        weight_kg: o.weight_kg ? Number(String(o.weight_kg).replace(",", ".")) : null,
        food: (o.food || "").trim(),
      }});
      state.view = "app"; state.tab = "plan"; state.previewDay = null;
    } catch (e) { state.err = e.message; }
    render();
  }

  function renderOnboard() {
    const steps = 6;
    const dots = el("div", { class: "stepdot" });
    for (let i = 0; i < steps; i++) dots.append(el("i", { class: i <= state.step ? "on" : "" }));
    const wrap = el("div", { class: "wrap solo" },
      el("div", { class: "pill" }, (state.step + 1) + " / " + steps),
      el("h1", {}, "Vi lager en plan som passer deg"),
      el("p", { class: "lead" }, "Kort og rolig. Du kan endre alt senere."),
      dots,
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    const s = state.step;
    if (s === 0) wrap.append(el("h2", {}, "Mål"), choices(GOALS, "goal"));
    else if (s === 1) wrap.append(el("h2", {}, "Erfaring"), choices(LEVELS, "level"));
    else if (s === 2) {
      wrap.append(el("h2", {}, "Dager i uka"), numChoices("days_per_week", [2, 3, 4, 5, 6], (v) => v + " dager"));
      wrap.append(el("h2", {}, "Lengde"), numChoices("minutes", [20, 30, 45, 60], (v) => v + " min"));
    } else if (s === 3) wrap.append(el("h2", {}, "Utstyr"), choices(EQUIP, "equipment"));
    else if (s === 4) {
      wrap.append(el("h2", {}, "Kroppen din"),
        el("label", {}, "Navn eller kallenavn"),
        el("input", { value: state.onb.name || "", placeholder: "F.eks. Inifi", oninput: (e) => { state.onb.name = e.target.value; } }),
        el("label", {}, "Alder"),
        el("input", { type: "number", inputmode: "numeric", value: state.onb.age || "", placeholder: "År", oninput: (e) => { state.onb.age = e.target.value; } }),
        el("label", {}, "Høyde (cm)"),
        el("input", { type: "number", inputmode: "numeric", value: state.onb.height_cm || "", placeholder: "cm", oninput: (e) => { state.onb.height_cm = e.target.value; } }),
        el("label", {}, "Vekt (kg)"),
        el("input", { type: "number", inputmode: "decimal", value: state.onb.weight_kg || "", placeholder: "kg", oninput: (e) => { state.onb.weight_kg = e.target.value; } }),
      );
    } else {
      wrap.append(el("h2", {}, "Mat og hensyn"),
        el("p", { class: "lead" }, "Allergier, vegetar, eller mat du helst unngår."),
        el("textarea", { placeholder: "F.eks. laktose, ingen fisk, vegetar…", oninput: (e) => { state.onb.food = e.target.value; } }, state.onb.food || ""),
      );
    }
    const nav = el("div", { class: "row" });
    if (s > 0) nav.append(el("button", { class: "btn ghost", type: "button", onclick: () => { state.step--; render(); } }, "Tilbake"));
    if (s < steps - 1) nav.append(el("button", { class: "btn", type: "button", onclick: () => { state.err = ""; state.step++; render(); } }, "Neste"));
    else nav.append(el("button", { class: "btn", type: "button", onclick: submitOnboard }, "Lag planen min"));
    wrap.append(nav);
    wrap.append(el("p", { class: "safety" }, "Dette er ikke medisinsk rådgivning."));
    return wrap;
  }

  function renderNav() {
    const nav = el("nav", { class: "nav" });
    for (const [id, label, ic] of [["plan", "Plan", "plan"], ["okt", "Økt", "okt"], ["frem", "Fremgang", "frem"], ["chat", "Trener", "chat"]]) {
      const b = el("button", { class: state.tab === id ? "on" : "", type: "button", onclick: () => goTab(id) });
      b.innerHTML = icon(ic);
      b.append(document.createTextNode(label));
      nav.append(b);
    }
    return nav;
  }
  function goTab(id) {
    tap(8);
    state.editing = false; state.picker = false; state.swap = false;
    if (id === "okt" && !state.workout) state.workoutSess = null;
    state.tab = id; state.view = "app";
    if (id === "okt") openWorkout(false);
    render();
  }

  async function setSource(src) {
    state.err = "";
    try {
      state.data = await api("custom", { body: { plan_source: src } });
      state.previewDay = null;
    } catch (e) { state.err = e.message; }
    render();
  }

  function renderPlan() {
    const d = state.data;
    const plan = d.plan || {};
    const name = (d.profile && d.profile.name) || "";
    const shown = selectedSession();
    const isoToday = todayIso();
    const wrap = el("div", { class: "wrap" });
    wrap.append(el("div", { class: "top" },
      el("div", {},
        el("div", { class: "pill" }, "Uke " + (plan.week || 1) + (isCustom() ? " · din plan" : "")),
        el("h1", {}, greeting() + (name ? ", " + name : "")),
        el("div", { class: "meta" }, goalLabel(d.profile && d.profile.goal) + " · " + ((d.progress && d.progress.streak) || 0) + " dager på rad"),
      ),
      el("div", { class: "iconrow" },
        el("button", { class: "iconbtn", type: "button", "aria-label": "Innstillinger", onclick: () => { state.view = "settings"; render(); } }, "⚙"),
      ),
    ));
    wrap.append(el("div", { class: "switch" },
      el("button", { class: isCustom() ? "" : "on", type: "button", onclick: () => setSource("generated") }, "Trenerens plan"),
      el("button", { class: isCustom() ? "on" : "", type: "button", onclick: () => setSource("custom") }, "Min egen plan"),
    ));
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.ok) wrap.append(el("div", { class: "okmsg" }, state.ok));

    const week = el("div", { class: "week" });
    for (const day of plan.days || []) {
      const isToday = day.date === isoToday;
      const isOn = shown && day.date === shown.date;
      const cls = ["day", trainingDay(day) ? "train" : "rest", isToday ? "today" : "", isOn ? "on" : ""].filter(Boolean).join(" ");
      week.append(el("button", { class: cls, type: "button", onclick: () => { tap(8); state.previewDay = day.date; render(); } },
        el("b", {}, day.weekday_short),
        el("span", {}, isToday ? "I dag" : fmtDate(day.date)),
        el("i", {}),
      ));
    }
    wrap.append(week);

    if (shown) {
      const isToday = shown.date === isoToday;
      const train = trainingDay(shown);
      const hero = el("div", { class: "hero" });
      let x0 = 0;
      hero.addEventListener("touchstart", (e) => { x0 = e.changedTouches[0].clientX; }, { passive: true });
      hero.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 50) shiftSelected(dx < 0 ? 1 : -1);
      }, { passive: true });
      hero.append(
        el("div", { class: "kicker" }, isToday ? "I dag" : prettyDay(shown.weekday)),
        el("div", { class: "title" }, train ? shown.title : "Hviledag"),
        el("p", { class: "blurb" }, train ? (shown.blurb || "") : "Ingen økt i dag. Sov, gå en rolig tur, og la musklene hente seg inn."),
      );
      if (train) {
        hero.append(el("div", { class: "time" }, "Omtrent " + estimateMinutes(shown) + " min"));
        hero.append(el("button", { class: "btn start", type: "button", onclick: () => {
          tap(16); state.workoutSess = shown; openWorkout(true); state.tab = "okt"; render();
        } }, isToday ? "Start økt" : "Start denne økten"));
        const list = el("div", { class: "exlist" });
        for (const ex of shown.exercises || []) {
          list.append(el("div", { class: "ex" }, el("div", {},
            el("div", { class: "name" }, ex.name),
            el("div", { class: "meta" }, [ex.muscle, doseText(ex), lastLine(ex)].filter(Boolean).join(" · ")),
          )));
        }
        hero.append(list);
      } else {
        const next = nextTraining(shown);
        if (next) {
          hero.append(el("p", { class: "next-session" }, "Neste økt: " + next.weekday));
          hero.append(el("button", { class: "btn ghost", type: "button", style: "margin-top:12px", onclick: () => { state.previewDay = next.date; render(); } }, "Se " + next.weekday));
        }
      }
      wrap.append(hero);
    }

    if (isCustom()) {
      wrap.append(el("button", { class: "btn ghost", type: "button", onclick: openEditor }, "Rediger uken"));
      const sugs = d.suggestions || [];
      if (sugs.length) {
        wrap.append(el("h2", {}, "Forslag"));
        for (const s of sugs) {
          wrap.append(el("div", { class: "card suggest" },
            el("h3", {}, s.title + " · " + s.weekday),
            el("p", { class: "muted" }, s.blurb),
            el("button", { class: "btn ghost", type: "button", style: "margin-top:10px", onclick: () => applySuggestion(s) }, "Legg inn på " + s.weekday),
          ));
        }
      }
    }
    if ((plan.meals || []).length) {
      wrap.append(el("h2", {}, "Mat i dag"));
      const meals = el("div", { class: "card" });
      const nut = plan.nutrition || {};
      meals.append(el("div", { class: "muted" }, "Ca. " + (nut.kcal || "–") + " kcal · " + (nut.protein_g || "–") + " g protein"));
      for (const m of plan.meals) {
        meals.append(el("div", { class: "meal" },
          el("div", { class: "slot" }, SLOTS[m.slot] || m.slot),
          el("div", {}, el("div", { class: "name" }, m.name)),
          el("div", { class: "macros" }, m.kcal, el("small", {}, m.protein + " g")),
        ));
      }
      wrap.append(meals);
    }
    wrap.append(el("p", { class: "safety" }, (plan.safety || d.safety || "")));
    wrap.append(renderNav());
    return wrap;
  }

  function openEditor() {
    const days = JSON.parse(JSON.stringify(((state.data || {}).custom_plan || {}).days || []));
    state.editPlan = { days };
    const todayName = (globalThis.Trener && Trener.weekdayName(todayIso())) || "mandag";
    state.editDay = days.some((d) => d.weekday === todayName) ? todayName : "mandag";
    state.editing = true; state.picker = false; render();
  }
  function editDayObj() {
    return (state.editPlan.days || []).find((d) => d.weekday === state.editDay) || state.editPlan.days[0];
  }
  async function saveEditor() {
    try {
      state.data = await api("custom", { body: { plan_source: "custom", days: state.editPlan.days } });
      state.editing = false; state.previewDay = null; state.ok = "Uken er lagret.";
    } catch (e) { state.err = e.message; }
    render();
  }
  async function applySuggestion(sug) {
    const days = JSON.parse(JSON.stringify(((state.data || {}).custom_plan || {}).days || []));
    const day = days.find((d) => d.weekday === sug.weekday);
    if (!day) return;
    day.title = sug.title; day.blurb = sug.blurb; day.kind = "custom"; day.exercises = sug.exercises;
    try { state.data = await api("custom", { body: { plan_source: "custom", days } }); state.ok = sug.title + " er lagt inn på " + sug.weekday + "."; }
    catch (e) { state.err = e.message; }
    render();
  }
  function renderEditor() {
    const wrap = el("div", { class: "wrap" }, el("div", { class: "pill" }, "Min egen plan"), el("h1", {}, "Rediger uken"));
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    const todayName = (globalThis.Trener && Trener.weekdayName(todayIso())) || "";
    const week = el("div", { class: "week" });
    for (const day of state.editPlan.days || []) {
      const cls = ["day", (day.exercises || []).length ? "train" : "rest", day.weekday === state.editDay ? "on" : "", day.weekday === todayName ? "today" : ""].filter(Boolean).join(" ");
      week.append(el("button", { class: cls, type: "button", onclick: () => { state.editDay = day.weekday; render(); } },
        el("b", {}, day.weekday_short), el("span", {}, String((day.exercises || []).length || "–")), el("i", {})));
    }
    wrap.append(week);
    const day = editDayObj();
    wrap.append(el("label", {}, "Overskrift for " + day.weekday), el("input", { value: day.title || "", oninput: (e) => { day.title = e.target.value; } }));
    const list = el("div", { class: "card" });
    (day.exercises || []).forEach((ex, i) => {
      const row = el("div", { class: "edit-ex" }, el("div", { class: "name" }, (i + 1) + ". " + ex.name));
      const meta = el("div", { class: "meta-row" });
      const sets = el("input", { type: "number", value: ex.sets, "aria-label": "Sett" });
      const reps = el("input", { value: ex.reps, "aria-label": "Reps" });
      const rest = el("input", { type: "number", value: ex.rest_sec, "aria-label": "Hvile" });
      sets.addEventListener("input", (e) => { ex.sets = Number(e.target.value || 3); });
      reps.addEventListener("input", (e) => { ex.reps = e.target.value; });
      rest.addEventListener("input", (e) => { ex.rest_sec = Number(e.target.value || 60); });
      meta.append(sets, reps, rest);
      row.append(meta, el("div", { class: "tools" },
        el("button", { type: "button", onclick: () => { day.exercises.splice(i, 1); render(); } }, "✕"),
      ));
      list.append(row);
    });
    if (!(day.exercises || []).length) list.append(el("p", { class: "muted" }, "Ingen øvelser denne dagen."));
    wrap.append(list);
    wrap.append(el("button", { class: "btn", type: "button", style: "margin-top:12px", onclick: () => { state.picker = true; render(); } }, "Velg fra biblioteket"));
    const free = el("div", { class: "row", style: "margin-top:8px" });
    const inp = el("input", { value: state.newEx, placeholder: "Eller skriv en egen øvelse…", style: "margin:0" });
    inp.addEventListener("input", (e) => { state.newEx = e.target.value; });
    free.append(inp, el("button", { class: "btn ghost", type: "button", style: "flex:0 0 auto;width:auto", onclick: () => {
      const name = (state.newEx || "").trim(); if (!name) return;
      day.exercises = day.exercises || [];
      day.exercises.push({ id: "", name, sets: 3, reps: "8–12", rest_sec: 60, custom: true });
      if (!day.title || day.title === "Ingen økt") day.title = "Egen økt";
      day.kind = "custom"; state.newEx = ""; render();
    } }, "Legg til"));
    wrap.append(free);
    wrap.append(el("div", { class: "row", style: "margin-top:16px" },
      el("button", { class: "btn ghost", type: "button", onclick: () => { state.editing = false; render(); } }, "Avbryt"),
      el("button", { class: "btn", type: "button", onclick: saveEditor }, "Lagre uken"),
    ));
    wrap.append(renderNav());
    if (state.picker) wrap.append(librarySheet((item) => {
      day.exercises = day.exercises || [];
      day.exercises.push({ id: item.id, name: item.name, muscle: item.muscle, sets: item.default_sets || 3, reps: item.default_reps || "8–12", rest_sec: item.default_rest_sec || 60, desc: item.desc, tips: item.tips });
      if (!day.title || day.title === "Ingen økt") day.title = "Egen økt";
      day.kind = "custom"; state.picker = false; render();
    }, day.weekday));
    return wrap;
  }

  function librarySheet(onPick, label) {
    const nodes = [el("div", { class: "backdrop", onclick: () => { state.picker = false; state.swap = false; render(); } })];
    const sheet = el("div", { class: "sheet" }, el("div", { class: "handle" }), el("h3", {}, "Øvelser"), el("p", { class: "muted" }, label ? "Legges på " + label + "." : "Bytt øvelsen du holder på med."));
    const search = el("input", { value: state.libQuery, placeholder: "Søk…" });
    search.addEventListener("input", (e) => { state.libQuery = e.target.value; render(); });
    sheet.append(search);
    const ul = el("ul", { class: "lib" });
    const q = (state.libQuery || "").toLowerCase();
    for (const item of ((state.data || {}).library || []).filter((x) => !q || (x.name + " " + x.muscle).toLowerCase().includes(q))) {
      ul.append(el("li", { onclick: () => onPick(item) }, el("div", { class: "name" }, item.name), el("div", { class: "meta muted" }, item.muscle)));
    }
    sheet.append(ul);
    nodes.push(sheet);
    const frag = el("div", {});
    nodes.forEach((n) => frag.append(n));
    return frag;
  }

  function initWorkout(sess) {
    const existing = ((state.data || {}).workouts || []).find((w) => w.date === sess.date);
    state.workout = {
      date: sess.date, title: sess.title, kind: sess.kind, weekday: sess.weekday,
      exercises: (sess.exercises || []).map((ex) => {
        const prev = existing && (existing.exercises || []).find((p) => p.id === ex.id);
        const n = Math.max(1, ex.sets || 1);
        const log = [];
        for (let i = 0; i < n; i++) {
          const ps = prev && prev.sets && prev.sets[i];
          log.push({
            reps: ps && ps.reps != null ? ps.reps : midReps(ex.reps),
            weight_kg: ps && ps.weight_kg != null ? ps.weight_kg : (ex.suggest_kg != null ? ex.suggest_kg : ""),
            done: !!(ps && ps.done),
          });
        }
        return { ...ex, log };
      }),
      i: 0, completed: !!(existing && existing.completed),
    };
    state.rest = null;
  }
  function openWorkout(force) {
    const sess = state.workoutSess || todaySession();
    if (!sess || !(sess.exercises || []).length) { if (force) state.workout = null; return; }
    if (force || !state.workout || state.workout.date !== sess.date) initWorkout(sess);
  }
  function sessionStats(w) {
    let volume = 0, sets = 0; const prs = [];
    for (const ex of w.exercises || []) {
      let best = 0;
      for (const s of ex.log || []) {
        if (!s.done) continue;
        sets += 1;
        const kg = Number(String(s.weight_kg).replace(",", ".")) || 0;
        const reps = Number(s.reps) || 0;
        volume += kg * reps;
        if (kg > best) best = kg;
      }
      if (best && ex.pr_kg && best > Number(ex.pr_kg)) prs.push(ex.name + " " + String(best).replace(".", ",") + " kg");
    }
    return { volume: Math.round(volume), sets, prs, title: w.title };
  }
  async function saveWorkout(complete) {
    const w = state.workout;
    if (!w) return;
    try {
      state.data = await api("workout", { body: {
        action: complete ? "complete" : "save", date: w.date, title: w.title, completed: !!complete,
        exercises: w.exercises.map((ex) => ({ id: ex.id, sets: ex.log.map((s) => ({
          reps: s.reps === "" || s.reps == null ? null : Number(s.reps),
          weight_kg: s.weight_kg === "" || s.weight_kg == null ? null : Number(String(s.weight_kg).replace(",", ".")),
          done: !!s.done,
        })) })),
      }});
      if (complete) {
        w.completed = true;
        state.summary = sessionStats(w);
        state.view = "summary";
        state.rest = null;
        state.tab = "plan";
      }
    } catch (e) { state.err = e.message; }
    render();
  }
  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = 740; g.gain.value = 0.05; o.connect(g); g.connect(ctx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35); o.stop(ctx.currentTime + 0.36);
    } catch {}
  }
  function fmtTime(s) { return Math.floor(s / 60) + ":" + String(Math.max(0, s % 60)).padStart(2, "0"); }
  function startRest(sec) {
    if (state.rest && state.rest.t) clearInterval(state.rest.t);
    const total = Math.max(10, sec || 60);
    tap(18);
    state.rest = { left: total, total, t: setInterval(() => {
      if (!state.rest) return;
      state.rest.left -= 1;
      if (state.rest.left <= 0) {
        clearInterval(state.rest.t); state.rest.left = 0; beep();
        try { if (navigator.vibrate) navigator.vibrate([160, 60, 160]); } catch {}
      }
      const node = document.querySelector(".timer .time");
      const fg = document.querySelector(".timer .fg");
      if (node) node.textContent = fmtTime(state.rest.left);
      if (fg) {
        const c = 2 * Math.PI * 86;
        fg.style.strokeDashoffset = String(c * (1 - state.rest.left / state.rest.total));
      }
    }, 1000) };
    render();
  }

  function renderWorkout() {
    openWorkout(false);
    const w = state.workout;
    const wrap = el("div", { class: "wrap solo" });
    if (!w) {
      const next = nextTraining(todaySession());
      wrap.append(el("div", { class: "kicker" }, "I dag"), el("h1", {}, "Hviledag"), el("p", { class: "lead" }, "Ingen økt å logge."));
      if (next) wrap.append(el("p", { class: "next-session" }, "Neste økt: " + next.weekday));
      wrap.append(el("button", { class: "btn", type: "button", onclick: () => goTab("plan") }, "Tilbake"));
      return wrap;
    }
    const ex = w.exercises[w.i] || w.exercises[0];
    const pct = Math.round(((w.i) / Math.max(1, w.exercises.length)) * 100);
    wrap.append(el("div", { class: "workout-top" },
      el("div", { class: "pill" }, (w.i + 1) + " / " + w.exercises.length),
      el("button", { class: "iconbtn", type: "button", "aria-label": "Lukk", onclick: () => { state.tab = "plan"; state.rest = null; render(); } }, "✕"),
    ));
    wrap.append(el("div", { class: "progress-line" }, el("i", { style: "width:" + pct + "%" })));
    wrap.append(el("h1", {}, ex.name));
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.rest && state.rest.left > 0) {
      const c = 2 * Math.PI * 86;
      const off = c * (1 - state.rest.left / state.rest.total);
      const t = el("div", { class: "timer" });
      t.innerHTML = `<svg viewBox="0 0 200 200"><circle class="bg" cx="100" cy="100" r="86"/><circle class="fg" cx="100" cy="100" r="86" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>`;
      t.append(el("div", { class: "time" }, fmtTime(state.rest.left)));
      wrap.append(el("div", { class: "timer-wrap" }, t));
      wrap.append(el("p", { class: "lead" }, "Pust. Rist løs. Neste sett venter."));
      wrap.append(el("button", { class: "btn ghost", type: "button", onclick: () => { clearInterval(state.rest.t); state.rest = null; render(); } }, "Hopp over hvilen"));
    }
    if (ex.desc) wrap.append(el("p", { class: "cue" }, ex.desc));
    if (ex.tips) wrap.append(el("div", { class: "tip" }, ex.tips));
    if (lastLine(ex)) wrap.append(el("p", { class: "last" }, lastLine(ex) + (ex.suggest_kg ? " · forslag " + String(ex.suggest_kg).replace(".", ",") + " kg" : "")));
    if (ex.hint) wrap.append(el("div", { class: "hint" + (ex.hint_kind === "reduce" ? " warn" : "") }, ex.hint));

    const sets = el("div", { class: "sets" });
    ex.log.forEach((s, i) => {
      const row = el("div", { class: "set" }, el("div", { class: "n" }, "Sett " + (i + 1)));
      const stepper = (value, label, step, onChange) => {
        const box = el("div", { class: "stepper" }, el("span", {}, label));
        const input = el("input", { type: "number", inputmode: "decimal", value: value === "" || value == null ? "" : value, "aria-label": label });
        input.addEventListener("input", (e) => onChange(e.target.value));
        const bump = (dir) => {
          tap(8);
          const cur = Number(String(input.value || "0").replace(",", ".")) || 0;
          const next = Math.max(0, Math.round((cur + dir * step) * 10) / 10);
          input.value = String(next); onChange(next);
        };
        const controls = el("div", { class: "stepper-row" },
          el("button", { class: "step", type: "button", "aria-label": "Mindre", onclick: () => bump(-1) }, "−"),
          input,
          el("button", { class: "step", type: "button", "aria-label": "Mer", onclick: () => bump(1) }, "+"),
        );
        box.append(controls);
        return box;
      };
      row.append(
        stepper(s.reps, "Reps", 1, (v) => { s.reps = v; }),
        stepper(s.weight_kg, "Kg", 2.5, (v) => { s.weight_kg = v; }),
      );
      row.append(el("button", { class: "tick" + (s.done ? " on" : ""), type: "button", "aria-label": "Sett ferdig", onclick: () => {
        s.done = !s.done; tap(14);
        if (s.done && ex.rest_sec) startRest(ex.rest_sec);
        else render();
        saveWorkout(false);
      } }, s.done ? "✓" : "○"));
      sets.append(row);
    });
    wrap.append(el("h2", {}, "Sett"), sets);
    wrap.append(el("button", { class: "btn ghost", type: "button", onclick: () => { state.swap = true; state.libQuery = ""; render(); } }, "Bytt øvelse"));
    const nav = el("div", { class: "row", style: "margin-top:12px" });
    nav.append(el("button", { class: "btn ghost", type: "button", disabled: w.i === 0, onclick: () => { w.i--; state.rest = null; render(); } }, "Forrige"));
    if (w.i < w.exercises.length - 1) nav.append(el("button", { class: "btn", type: "button", onclick: () => { w.i++; state.rest = null; saveWorkout(false); } }, "Neste øvelse"));
    else nav.append(el("button", { class: "btn coral", type: "button", onclick: () => saveWorkout(true) }, "Fullfør økten"));
    wrap.append(nav);
    if (state.swap) wrap.append(librarySheet((item) => {
      const cur = w.exercises[w.i];
      cur.id = item.id; cur.name = item.name; cur.desc = item.desc; cur.tips = item.tips; cur.muscle = item.muscle;
      cur.rest_sec = item.default_rest_sec || cur.rest_sec;
      state.swap = false; render();
    }, ""));
    return wrap;
  }

  function renderSummary() {
    const s = state.summary || { volume: 0, sets: 0, prs: [], title: "Økt" };
    const wrap = el("div", { class: "wrap solo celebrate" },
      el("div", { class: "pill" }, "Ferdig"),
      el("h1", {}, s.prs.length ? "Ny rekord." : "Sterkt."),
      el("p", { class: "lead" }, s.title || "Økten er logget."),
      el("div", { class: "statgrid" },
        el("div", { class: "stat" }, el("b", {}, String(s.volume)), el("span", {}, "Volum, kg")),
        el("div", { class: "stat" }, el("b", {}, String(s.sets)), el("span", {}, "Sett logget")),
      ),
    );
    if (s.prs.length) wrap.append(el("div", { class: "card" }, el("h3", {}, "Personlige rekorder"), el("p", {}, s.prs.join(" · "))));
    wrap.append(el("button", { class: "btn start", type: "button", onclick: () => { state.view = "app"; state.summary = null; state.workout = null; state.tab = "plan"; render(); } }, "Tilbake til i dag"));
    return wrap;
  }

  function renderProgress() {
    const d = state.data;
    const p = d.progress || {};
    const wrap = el("div", { class: "wrap" },
      el("div", { class: "pill warm" }, "Fremgang"),
      el("h1", {}, "Slik går det"),
      el("p", { class: "lead" }, "Streak, volum og rekorder. Alt ligger bare på denne telefonen."),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.ok) wrap.append(el("div", { class: "okmsg" }, state.ok));
    const tiles = el("div", { class: "stats" },
      el("div", { class: "stat" }, el("b", {}, String(p.streak || 0)), el("span", {}, "Streak")),
      el("div", { class: "stat" }, el("b", {}, String(p.sessions_done || 0)), el("span", {}, "Økter")),
      el("div", { class: "stat" }, el("b", {}, String((p.prs || []).length)), el("span", {}, "Rekorder")),
    );
    wrap.append(tiles);

    const done = new Set(((d.workouts || []).filter((w) => w.completed).map((w) => w.date)));
    const heat = el("div", { class: "card" }, el("h3", {}, "Siste 16 uker"));
    const grid = el("div", { class: "heat" });
    const start = addDays(todayIso(), -16 * 7 + 1);
    for (let i = 0; i < 16 * 7; i++) {
      const iso = addDays(start, i);
      const on = done.has(iso);
      grid.append(el("i", { class: on ? "on3" : "", title: iso }));
    }
    heat.append(grid);
    wrap.append(heat);

    const weeks = p.volume_by_week || [];
    if (weeks.length) {
      const card = el("div", { class: "card" }, el("h3", {}, "Volum per uke"));
      const svg = svgChart(weeks.map((w) => w.volume), "#d6ff4a");
      card.append(svg);
      wrap.append(card);
    }
    const weights = p.weights || [];
    if (weights.length) {
      const card = el("div", { class: "card" }, el("h3", {}, "Kroppsvekt"));
      card.append(svgChart(weights.map((w) => Number(w.kg)), "#9fd6ff"));
      card.append(el("p", { class: "muted" }, "Siste " + weights[weights.length - 1].kg + " kg"));
      wrap.append(card);
    }
    const rms = p.one_rm || [];
    if (rms.length) {
      const card = el("div", { class: "card" }, el("h3", {}, "Estimert 1RM"));
      const max = Math.max(...rms.map((r) => Number(r.kg) || 0), 1);
      for (const r of rms) {
        const row = el("div", { style: "padding:8px 0" }, el("div", { class: "name" }, r.name), el("b", {}, String(r.kg).replace(".", ",") + " kg"));
        const line = el("div", { class: "barline" }, el("i", { style: "width:" + Math.round((Number(r.kg) / max) * 100) + "%" }));
        card.append(row, line);
      }
      wrap.append(card);
    }
    const prs = p.prs || [];
    if (prs.length) {
      const ul = el("ul", { class: "prlist" });
      for (const r of prs) ul.append(el("li", {}, el("div", {}, r.name), el("b", {}, String(r.max_kg).replace(".", ",") + " kg")));
      wrap.append(el("div", { class: "card" }, el("h3", {}, "Personlige rekorder"), ul));
    }
    if (!state.showCheckin) wrap.append(el("button", { class: "btn", type: "button", style: "margin-top:16px", onclick: () => { state.showCheckin = true; render(); } }, "Ukessjekk"));
    else {
      const card = el("div", { class: "card", style: "margin-top:16px" });
      card.append(scale("energy", "Energi 1–5"), scale("soreness", "Stølhet 1–5"));
      card.append(el("label", {}, "Hoppet over"), el("input", { type: "number", value: state.checkin.skipped, oninput: (e) => { state.checkin.skipped = e.target.value; } }));
      card.append(el("label", {}, "Vekt i dag"), el("input", { type: "number", inputmode: "decimal", value: state.checkin.weight_kg, placeholder: "kg", oninput: (e) => { state.checkin.weight_kg = e.target.value; } }));
      card.append(el("button", { class: "btn", type: "button", onclick: submitCheckin }, "Juster planen"));
      wrap.append(card);
    }
    wrap.append(renderNav());
    return wrap;
  }
  function addDays(iso, n) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return dt.getUTCFullYear() + "-" + String(dt.getUTCMonth() + 1).padStart(2, "0") + "-" + String(dt.getUTCDate()).padStart(2, "0");
  }
  function svgChart(vals, color) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "chart"); svg.setAttribute("viewBox", "0 0 320 140");
    if (!vals.length) return svg;
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const span = (hi - lo) || Math.max(hi, 1);
    const base = hi === lo ? 0 : lo;
    const pts = vals.map((v, i) => {
      const x = vals.length === 1 ? 48 : 12 + i * (296 / (vals.length - 1));
      const y = 118 - ((v - base) / (hi === lo ? Math.max(v, 1) : span)) * 90;
      return [x, y];
    });
    if (vals.length === 1) {
      const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      bar.setAttribute("x", "36"); bar.setAttribute("width", "28"); bar.setAttribute("rx", "8");
      bar.setAttribute("y", String(pts[0][1])); bar.setAttribute("height", String(Math.max(8, 124 - pts[0][1])));
      bar.setAttribute("fill", color);
      svg.append(bar);
      return svg;
    }
    const area = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    area.setAttribute("fill", color); area.setAttribute("opacity", "0.16");
    area.setAttribute("points", pts.map((p) => p.join(",")).join(" ") + " " + pts[pts.length - 1][0] + ",128 " + pts[0][0] + ",128");
    const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    line.setAttribute("fill", "none"); line.setAttribute("stroke", color); line.setAttribute("stroke-width", "3");
    line.setAttribute("stroke-linecap", "round"); line.setAttribute("stroke-linejoin", "round");
    line.setAttribute("points", pts.map((p) => p.join(",")).join(" "));
    svg.append(area, line);
    pts.forEach(([x, y]) => {
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", vals.length < 3 ? "6" : "4"); c.setAttribute("fill", color);
      svg.append(c);
    });
    return svg;
  }
  function scale(key, labels) {
    const row = el("div", { class: "scale" });
    for (let i = 1; i <= 5; i++) row.append(el("button", { class: state.checkin[key] === i ? "on" : "", type: "button", onclick: () => { state.checkin[key] = i; render(); } }, String(i)));
    return el("div", {}, el("label", {}, labels), row);
  }
  async function submitCheckin() {
    const c = state.checkin;
    if (!c.energy || !c.soreness) { state.err = "Velg energi og stølhet."; render(); return; }
    try {
      state.data = await api("checkin", { body: { energy: c.energy, soreness: c.soreness, skipped: Number(c.skipped || 0), weight_kg: c.weight_kg ? Number(String(c.weight_kg).replace(",", ".")) : null, note: c.note || "" } });
      state.showCheckin = false; state.ok = (state.data.adjustment && state.data.adjustment.message) || "Planen er justert.";
    } catch (e) { state.err = e.message; }
    render();
  }

  async function sendChat(preset) {
    const msg = (preset || state.chatDraft || "").trim();
    if (!msg) return;
    state.chatDraft = ""; state.err = ""; state.typing = true;
    const chat = ((state.data || {}).chat || []).slice();
    chat.push({ role: "user", text: msg });
    state.data.chat = chat;
    render();
    try { state.data = await api("chat", { body: { message: msg } }); }
    catch (e) { state.err = e.message; }
    state.typing = false;
    render();
  }
  function renderChat() {
    const d = state.data;
    const today = d.today || todaySession();
    const next = nextTraining(today);
    const status = today && trainingDay(today) ? "I dag: " + today.title + "." : "I dag er en hviledag." + (next ? " Neste økt: " + next.weekday + "." : "");
    const wrap = el("div", { class: "wrap chat-wrap" },
      el("div", { class: "pill" }, "Trener"),
      el("h1", {}, "Spør meg"),
      el("p", { class: "lead" }, status),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    const chat = el("div", { class: "chat" });
    const msgs = d.chat || [];
    if (!msgs.length) chat.append(el("div", { class: "bubble coach" }, "Jeg kjenner planen og loggen din. Spør hva du skal trene, hvordan benken går, eller hva du skal spise."));
    for (const m of msgs) chat.append(el("div", { class: "bubble " + (m.role === "user" ? "user" : "coach") }, m.text));
    if (state.typing) chat.append(el("div", { class: "bubble coach" }, el("span", { class: "typing" }, el("i"), el("i"), el("i"))));
    wrap.append(chat);
    const dock = el("div", { class: "composer" });
    const chips = el("div", { class: "chips" });
    for (const q of ["Hva skal jeg trene i dag?", "Hvordan går det med benken?", "Hva gjør jeg om mat?", "Hvor mange reps?"]) {
      chips.append(el("button", { class: "chip", type: "button", onclick: () => sendChat(q) }, q));
    }
    dock.append(chips);
    const ta = el("textarea", { placeholder: "Skriv til treneren…", rows: "1" }, state.chatDraft || "");
    ta.addEventListener("input", (e) => { state.chatDraft = e.target.value; });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
    dock.append(el("div", { class: "composer-row" }, ta, el("button", { class: "btn", type: "button", onclick: () => sendChat() }, "Send")));
    wrap.append(dock, renderNav());
    return wrap;
  }

  function renderSettings() {
    const wrap = el("div", { class: "wrap solo" },
      el("div", { class: "pill" }, "Innstillinger"),
      el("h1", {}, "Din profil"),
      el("p", { class: "lead" }, "Endre programmet, eller ta med deg loggen."),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.ok) wrap.append(el("div", { class: "okmsg" }, state.ok));
    wrap.append(el("div", { class: "card settings-card" },
      el("h3", {}, "Program"),
      el("p", { class: "muted" }, "Mål, dager, utstyr og kroppsvekt. Den gamle loggen blir med."),
      el("button", { class: "btn", type: "button", onclick: () => { state.view = "onboard"; state.step = 0; state.onb = { ...((state.data && state.data.profile) || {}) }; render(); } }, "Endre program"),
    ));
    wrap.append(el("div", { class: "card settings-card" },
      el("h3", {}, "Sikkerhetskopi"),
      el("p", { class: "muted" }, "JSON-fil med plan, økter og chat."),
      el("button", { class: "btn", type: "button", onclick: downloadBackup }, "Eksporter"),
      el("button", { class: "btn ghost", type: "button", onclick: () => {
        const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json,.json";
        inp.addEventListener("change", () => importBackupFile(inp.files && inp.files[0])); inp.click();
      } }, "Importer"),
    ));
    wrap.append(el("button", { class: "btn ghost", type: "button", onclick: () => { state.view = "app"; render(); } }, "Lukk"));
    wrap.append(el("p", { class: "safety" }, (state.data && state.data.safety) || ""));
    return wrap;
  }
  function downloadBackup() {
    try {
      const blob = new Blob([TrenerStore.exportJSON()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "trener-" + todayIso() + ".json"; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1500);
      state.ok = "Filen er lastet ned.";
    } catch (e) { state.err = e.message; }
    render();
  }
  function importBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.data = TrenerStore.importJSON(String(reader.result || ""));
        state.view = "app"; state.tab = "plan"; state.ok = "Sikkerhetskopien er lagt inn.";
      } catch (e) { state.err = e.message; }
      render();
    };
    reader.readAsText(file);
  }

  function renderUpdate() {
    if (!state.updateReady) return null;
    return el("button", { class: "update", type: "button", onclick: () => {
      state.updateReady = false;
      const reg = state.swReg;
      if (reg && reg.waiting) reg.waiting.postMessage({ type: "SKIP_WAITING" });
      setTimeout(() => location.reload(), 180);
    } }, "Ny versjon – trykk for å oppdatere");
  }

  function render() {
    app.innerHTML = "";
    const banner = renderUpdate();
    if (banner) app.append(banner);
    if (state.view === "boot") {
      app.append(el("div", { class: "boot" }, el("b", {}, "AI-trener"), el("span", {}, "Gjør klar økten…")));
      return;
    }
    if (state.view === "error") {
      app.append(el("div", { class: "wrap solo" }, el("h1", {}, "Noe skar seg"), el("p", { class: "lead" }, state.err || ""), el("button", { class: "btn", onclick: boot }, "Prøv igjen")));
      return;
    }
    if (state.view === "onboard") { app.append(renderOnboard()); return; }
    if (state.view === "settings") { app.append(renderSettings()); return; }
    if (state.view === "summary") { app.append(renderSummary()); return; }
    if (state.tab === "okt") app.append(renderWorkout());
    else if (state.tab === "frem") app.append(renderProgress());
    else if (state.tab === "chat") app.append(renderChat());
    else if (state.editing) app.append(renderEditor());
    else app.append(renderPlan());
    if (state.tab === "chat") {
      const box = document.querySelector(".chat");
      if (box) box.scrollTop = box.scrollHeight;
    }
  }

  function watchUpdates() {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).then((reg) => {
      state.swReg = reg;
      const watch = (worker) => {
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            state.updateReady = true; render();
          }
        });
      };
      if (reg.waiting && navigator.serviceWorker.controller) { state.updateReady = true; render(); }
      reg.addEventListener("updatefound", () => watch(reg.installing));
      watch(reg.installing);
    }).catch(() => {});
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
    });
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest("button");
    if (t) tap(8);
  });
  watchUpdates();
  boot();
})();
