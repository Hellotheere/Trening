(() => {
  const app = document.getElementById("app");
  const state = { view: "boot", tab: "plan", data: null, err: "", onb: {}, step: 0, workout: null, rest: null, draft: {}, chatDraft: "", checkin: { energy: 0, soreness: 0, skipped: 0, weight_kg: "", note: "" }, editing: false, editDay: "mandag", editPlan: null, picker: false, libQuery: "", newEx: "", workoutSess: null };

  const GOALS = [
    ["bli_sterkere", "Bli sterkere", "Mer kraft i hverdagen"],
    ["ga_ned_i_vekt", "Gå ned i vekt", "Rolig og varig underskudd"],
    ["bedre_kondisjon", "Bedre kondisjon", "Pulsen opp, bedre utholdenhet"],
    ["bygge_muskler", "Bygge muskler", "Mer muskelmasse, jevn fremgang"],
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

  async function api(path, { method = "GET", body } = {}) {
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
      else if (path === "library") data = { ok: true, exercises: globalThis.Trener.library() };
      else throw new Error("Ukjent handling.");
      return data;
    } catch (e) {
      const data = e;
      let msg = e && e.message ? e.message : "Noe gikk galt.";
      if (data && typeof data.detail === "string") msg = data.detail;
      else if (data && Array.isArray(data.detail)) msg = data.detail.map((d) => {
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
        else if (k === "html") n.innerHTML = v; // only used for trusted SVG icons
        else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
        else if (k === "dataset") Object.assign(n.dataset, v);
        else n.setAttribute(k, v === true ? "" : v);
      }
    }
    for (const kid of kids) {
      if (kid == null || kid === false) continue;
      n.append(kid.nodeType ? kid : document.createTextNode(kid));
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

  function greeting() {
    const h = osloHour();
    if (h < 10) return "God morgen";
    if (h < 17) return "Hei";
    return "God kveld";
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-").map(Number);
    return `${d}.${m}`;
  }

  function todayIso() {
    const f = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Oslo", year: "numeric", month: "2-digit", day: "2-digit" });
    return f.format(new Date());
  }

  function osloHour() {
    const h = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Oslo", hour: "2-digit", hourCycle: "h23" }).format(new Date());
    return Number(h);
  }

  function prettyDay(name) {
    if (!name) return "";
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  function planDays() {
    return (((state.data || {}).plan || {}).days) || [];
  }

  function sessionFor(iso) {
    return planDays().find((d) => d.date === iso) || null;
  }

  function todaySession() {
    const iso = todayIso();
    return sessionFor(iso) || ((state.data || {}).today) || null;
  }

  function selectedSession() {
    const days = planDays();
    const iso = todayIso();
    if (state.previewDay && days.some((d) => d.date === state.previewDay)) {
      return days.find((d) => d.date === state.previewDay);
    }
    return days.find((d) => d.date === iso) || todaySession() || days[0] || null;
  }

  function shiftSelected(delta) {
    const days = planDays();
    if (!days.length) return;
    const cur = selectedSession();
    const i = Math.max(0, days.findIndex((d) => d.date === (cur && cur.date)));
    const next = days[(i + delta + days.length) % days.length];
    state.previewDay = next.date;
    render();
  }

  function trainingDay(day) {
    return globalThis.Trener && Trener.isTrainingDay ? Trener.isTrainingDay(day) : !!(day && day.kind !== "hvile" && (day.exercises || []).length);
  }

  function nextTraining(from) {
    if (globalThis.Trener && Trener.nextTrainingDay) return Trener.nextTrainingDay((state.data || {}).plan, (from && from.date) || todayIso());
    return null;
  }

  /* ---------- load ---------- */
  async function boot() {
    if (!TrenerStore.hasState()) { state.view = "onboard"; state.step = 0; render(); return; }
    try {
      state.data = await api("me");
      state.view = "app";
    } catch (e) {
      if (e.status === 404) { TrenerStore.reset(); state.view = "onboard"; state.step = 0; }
      else { state.view = "error"; state.err = e.message; }
    }
    render();
  }

  /* ---------- onboarding ---------- */
  function setChoice(key, value) { state.onb[key] = value; render(); }

  async function submitOnboard() {
    state.err = "";
    const o = state.onb;
    if (!o.goal || !o.level || !o.days_per_week || !o.minutes || !o.equipment) {
      state.err = "Huk av valgene først, så lager jeg planen.";
      render(); return;
    }
    try {
      const body = {
        name: (o.name || "").trim(),
        goal: o.goal, level: o.level,
        days_per_week: Number(o.days_per_week), minutes: Number(o.minutes),
        equipment: o.equipment,
        age: o.age ? Math.round(Number(o.age)) : null,
        height_cm: o.height_cm ? Math.round(Number(String(o.height_cm).replace(",", "."))) : null,
        weight_kg: o.weight_kg ? Number(String(o.weight_kg).replace(",", ".")) : null,
        food: (o.food || "").trim(),
      };
      const data = await api("onboard", { method: "POST", body });
      state.data = data;
      state.view = "app";
      state.tab = "plan";
    } catch (e) { state.err = e.message; }
    render();
  }

  function choices(items, key) {
    const box = el("div", { class: "choices" });
    for (const [id, title, sub] of items) {
      box.append(el("button", { class: "choice" + (state.onb[key] === id ? " on" : ""), type: "button", onclick: () => setChoice(key, id) },
        title, el("small", {}, sub)));
    }
    return box;
  }

  function numChoices(key, values, fmt) {
    const box = el("div", { class: "choices two" });
    for (const v of values) {
      box.append(el("button", { class: "choice" + (Number(state.onb[key]) === v ? " on" : ""), type: "button", onclick: () => setChoice(key, v) }, fmt(v)));
    }
    return box;
  }

  function renderOnboard() {
    const steps = 6;
    const dots = el("div", { class: "stepdot" });
    for (let i = 0; i < steps; i++) dots.append(el("i", { class: i <= state.step ? "on" : "" }));
    const wrap = el("div", { class: "wrap" },
      el("div", { class: "pill" }, "Personlig AI-trener"),
      el("h1", {}, "Vi lager en plan som passer deg."),
      el("p", { class: "lead" }, "Bare deg. Ingen passord. Du kan endre målene senere."),
      dots,
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    const s = state.step;
    if (s === 0) {
      wrap.append(el("h2", {}, "Hva er målet?"), choices(GOALS, "goal"));
    } else if (s === 1) {
      wrap.append(el("h2", {}, "Hvor vant er du?"), choices(LEVELS, "level"));
    } else if (s === 2) {
      wrap.append(el("h2", {}, "Hvor ofte vil du trene?"), numChoices("days_per_week", [2, 3, 4, 5, 6], (v) => v + " dager"));
      wrap.append(el("h2", {}, "Hvor lange økter?"), numChoices("minutes", [20, 30, 45, 60], (v) => v + " min"));
    } else if (s === 3) {
      wrap.append(el("h2", {}, "Hvilket utstyr har du?"), choices(EQUIP, "equipment"));
    } else if (s === 4) {
      wrap.append(
        el("h2", {}, "Litt om deg (valgfritt)"),
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
      wrap.append(
        el("h2", {}, "Mat og hensyn"),
        el("p", { class: "lead" }, "Allergier, vegetar, eller mat du helst unngår. Jeg lager en enkel norsk matplan ut fra det."),
        el("textarea", { placeholder: "F.eks. laktoseintoleranse, ingen fisk, vegetar…", oninput: (e) => { state.onb.food = e.target.value; } }, state.onb.food || ""),
      );
    }
    const nav = el("div", { class: "row" });
    if (s > 0) nav.append(el("button", { class: "btn ghost", type: "button", onclick: () => { state.step--; render(); } }, "Tilbake"));
    if (s < steps - 1) nav.append(el("button", { class: "btn", type: "button", onclick: () => { state.err = ""; state.step++; render(); } }, "Neste"));
    else nav.append(el("button", { class: "btn", type: "button", onclick: submitOnboard }, "Lag planen min"));
    wrap.append(nav);
    wrap.append(el("p", { class: "safety" }, "Dette er ikke medisinsk rådgivning. Snakk med lege hvis du er usikker, skadet eller har sykdom."));
    return wrap;
  }


  /* ---------- plan / tabs ---------- */
  function goalLabel(id) { return (GOALS.find((g) => g[0] === id) || [, id])[1]; }

  function renderNav() {
    const items = [["plan", "Plan", "plan"], ["okt", "Økt", "okt"], ["frem", "Fremgang", "frem"], ["chat", "Trener", "chat"]];
    const nav = el("nav", { class: "nav" });
    for (const [id, label, ic] of items) {
      const b = el("button", { class: state.tab === id ? "on" : "", type: "button", onclick: () => goTab(id) });
      b.innerHTML = icon(ic);
      b.append(document.createTextNode(label));
      nav.append(b);
    }
    return nav;
  }

  function goTab(id) {
    if (id !== "okt") state.editing = false;
    if (id !== "okt") state.picker = false;
    if (id === "okt" && !state.workout) state.workoutSess = null;
    state.tab = id;
    if (id === "okt") openWorkout(false);
    render();
  }

  function completedOn(iso) {
    return ((state.data || {}).workouts || []).some((w) => w.date === iso && w.completed);
  }

  function isCustom() {
    return ((state.data || {}).plan_source || "generated") === "custom";
  }

  async function setSource(src) {
    state.err = "";
    try {
      state.data = await api("custom", { method: "POST", body: { plan_source: src } });
      state.editing = src === "custom" ? state.editing : false;
    } catch (e) { state.err = e.message; }
    render();
  }

  function doseText(ex) {
    if (ex.id === "gattur" || (ex.reps || "").includes("min") || (ex.reps || "").includes(" s")) return ex.reps || "";
    return (ex.sets || "") + " × " + (ex.reps || "");
  }

  function lastLine(ex) {
    if (!ex.last_kg && !(ex.last_reps || []).length) return "";
    const reps = (ex.last_reps || []).join(", ");
    const kg = ex.last_kg != null ? String(ex.last_kg).replace(".", ",") + " kg" : "";
    const when = ex.last_date ? " " + fmtDate(ex.last_date) : "";
    if (kg && reps) return "Forrige" + when + ": " + kg + " × " + reps;
    if (kg) return "Forrige" + when + ": " + kg;
    return "Forrige" + when + ": " + reps + " reps";
  }

  function renderPlan() {
    const d = state.data;
    const plan = d.plan || {};
    const today = d.today || sessionFor(todayIso());
    const name = (d.profile && d.profile.name) || "";
    const wrap = el("div", { class: "wrap" });
    const top = el("div", { class: "top" },
      el("div", {},
        el("div", { class: "pill" }, "Uke " + (plan.week || 1) + (isCustom() ? " · din plan" : "")),
        el("h1", {}, greeting() + (name ? ", " + name : "")),
        el("div", { class: "meta" }, goalLabel(d.profile && d.profile.goal) + " · " + ((d.progress && d.progress.streak) || 0) + " dager på rad"),
      ),
      el("div", { class: "iconrow" },
        el("button", { class: "iconbtn", type: "button", title: "Innstillinger", "aria-label": "Innstillinger", onclick: () => { state.view = "settings"; render(); } }, "⚙"),
        el("button", { class: "iconbtn", type: "button", title: "Endre mål", onclick: () => { state.view = "onboard"; state.step = 0; state.onb = { ...((d.profile) || {}) }; render(); } }, "✎"),
      ),
    );
    wrap.append(top);

    const sw = el("div", { class: "switch" },
      el("button", { class: isCustom() ? "" : "on", type: "button", onclick: () => setSource("generated") }, "Trenerens plan"),
      el("button", { class: isCustom() ? "on" : "", type: "button", onclick: () => setSource("custom") }, "Min egen plan"),
    );
    wrap.append(sw);
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.ok) wrap.append(el("div", { class: "okmsg" }, state.ok));

    const week = el("div", { class: "week", role: "tablist", "aria-label": "Ukedager" });
    const isoToday = todayIso();
    const shown = selectedSession();
    for (const day of plan.days || []) {
      const isToday = day.date === isoToday;
      const isOn = shown && day.date === shown.date;
      const done = completedOn(day.date);
      const cls = ["day", trainingDay(day) ? "train" : "rest", isToday ? "today" : "", isOn ? "on" : "", done ? "done" : ""].filter(Boolean).join(" ");
      week.append(el("button", {
        class: cls, type: "button", role: "tab", "aria-selected": isOn ? "true" : "false",
        onclick: () => { state.previewDay = day.date; render(); },
      },
        el("b", {}, day.weekday_short),
        el("span", {}, isToday ? "I dag" : fmtDate(day.date)),
        el("i", {}),
      ));
    }
    wrap.append(week);

    if (shown) {
      const isToday = shown.date === isoToday;
      const train = trainingDay(shown);
      const hero = el("div", { class: "hero" + (train ? "" : " rest") });
      let startX = 0;
      hero.addEventListener("touchstart", (e) => { startX = e.changedTouches[0].clientX; }, { passive: true });
      hero.addEventListener("touchend", (e) => {
        const dx = e.changedTouches[0].clientX - startX;
        if (Math.abs(dx) > 48) shiftSelected(dx < 0 ? 1 : -1);
      }, { passive: true });
      hero.append(
        el("div", { class: "kicker" }, isToday ? "I dag" : prettyDay(shown.weekday)),
        el("div", { class: "title" }, train ? shown.title : "Hviledag"),
        el("p", { class: "blurb" }, train ? (shown.blurb || "") : "Ingen økt i dag. Kroppen bygger seg opp mellom øktene."),
      );
      if (train) {
        const list = el("div", { class: "exlist" });
        for (const ex of shown.exercises || []) {
          const nameRow = el("div", { class: "name" }, ex.name);
          if (ex.pr) nameRow.append(el("span", { class: "pr" }, "PR"));
          const metaBits = [ex.muscle, doseText(ex), lastLine(ex)].filter(Boolean);
          list.append(el("div", { class: "ex" },
            nameRow,
            el("div", { class: "meta" }, metaBits.join(" · ")),
          ));
        }
        hero.append(list);
        hero.append(el("button", { class: "btn start", type: "button", onclick: () => {
          state.workoutSess = shown; openWorkout(true); state.tab = "okt"; render();
        } }, isToday ? "Start økt" : "Start denne økten"));
      } else {
        const next = nextTraining(shown);
        if (next) {
          hero.append(el("p", { class: "next-session" }, "Neste økt: " + next.weekday));
          hero.append(el("button", { class: "btn ghost", type: "button", onclick: () => { state.previewDay = next.date; render(); } }, "Se " + next.weekday));
        }
        if ((shown.exercises || []).length) {
          hero.append(el("button", { class: "btn ghost", type: "button", onclick: () => {
            state.workoutSess = shown; openWorkout(true); state.tab = "okt"; render();
          } }, "Start den rolige turen"));
        }
      }
      wrap.append(hero);
    }

    if (isCustom()) {
      wrap.append(el("button", { class: "btn ghost", type: "button", style: "margin-top:4px", onclick: openEditor }, "Rediger uken"));
      const sugs = d.suggestions || [];
      if (sugs.length) {
        wrap.append(el("h2", {}, "Forslag til resten av uka"));
        wrap.append(el("p", { class: "lead" }, "Bare forslag – du velger selv om du legger dem inn."));
        for (const s of sugs) {
          const card = el("div", { class: "suggest" },
            el("h3", {}, s.title + " · " + s.weekday),
            el("p", { class: "muted" }, s.blurb),
            el("button", { class: "btn ghost", type: "button", onclick: () => applySuggestion(s) }, "Legg inn på " + s.weekday),
          );
          wrap.append(card);
        }
      }
    }

    if ((plan.notes || []).length) {
      for (const n of plan.notes) wrap.append(el("div", { class: "okmsg" }, n));
    }

    wrap.append(el("h2", {}, "Matplan"));
    const meals = el("div", { class: "card" });
    const nut = plan.nutrition || {};
    meals.append(el("div", { class: "muted", style: "margin-bottom:8px" }, `Cirka ${nut.kcal || "–"} kcal og ${nut.protein_g || "–"} g protein om dagen`));
    for (const m of plan.meals || []) {
      meals.append(el("div", { class: "meal" },
        el("div", { class: "slot" }, SLOTS[m.slot] || m.slot),
        el("div", {}, el("div", { class: "name" }, m.name), el("div", { class: "desc" }, m.desc)),
        el("div", { class: "macros" }, m.kcal + " kcal", el("small", {}, m.protein + " g protein")),
      ));
    }
    wrap.append(meals);

    wrap.append(el("button", { class: "btn ghost", type: "button", style: "margin-top:14px", onclick: () => { state.tab = "frem"; state.showCheckin = true; render(); } }, "Ukessjekk – hvordan gikk det?"));
    wrap.append(el("p", { class: "safety" }, plan.safety || (d.safety || "")));
    wrap.append(renderNav());
    return wrap;
  }

  /* ---------- editor ---------- */
  function openEditor() {
    const days = JSON.parse(JSON.stringify(((state.data || {}).custom_plan || {}).days || []));
    state.editPlan = { days };
    const todayName = (globalThis.Trener && Trener.weekdayName(todayIso())) || "mandag";
    state.editDay = days.some((d) => d.weekday === todayName) ? todayName : "mandag";
    state.editing = true;
    state.picker = false;
    state.newEx = "";
    state.libQuery = "";
    render();
  }

  function editDayObj() {
    return (state.editPlan.days || []).find((d) => d.weekday === state.editDay) || state.editPlan.days[0];
  }

  async function saveEditor() {
    state.err = "";
    try {
      state.data = await api("custom", { method: "POST", body: { plan_source: "custom", days: state.editPlan.days } });
      state.editing = false;
      state.ok = "Uken er lagret. Du følger din egen plan.";
      state.previewDay = null;
    } catch (e) { state.err = e.message; }
    render();
  }

  async function applySuggestion(sug) {
    const days = JSON.parse(JSON.stringify(((state.data || {}).custom_plan || {}).days || []));
    const day = days.find((d) => d.weekday === sug.weekday);
    if (!day) return;
    day.title = sug.title;
    day.blurb = sug.blurb;
    day.kind = "custom";
    day.exercises = sug.exercises;
    state.err = "";
    try {
      state.data = await api("custom", { method: "POST", body: { plan_source: "custom", days } });
      state.ok = sug.title + " er lagt inn på " + sug.weekday + ". Du kan endre den når du vil.";
    } catch (e) { state.err = e.message; }
    render();
  }

  function addLibraryEx(item) {
    const day = editDayObj();
    day.exercises = day.exercises || [];
    day.exercises.push({
      id: item.id, name: item.name, muscle: item.muscle,
      sets: item.default_sets || 3, reps: item.default_reps || "8–12",
      rest_sec: item.default_rest_sec || 60, desc: item.desc, tips: item.tips, custom: false,
    });
    if (!day.title || day.title === "Ingen økt") day.title = "Egen økt";
    day.kind = "custom";
    state.picker = false;
    state.libQuery = "";
    render();
  }

  function addFreeEx() {
    const name = (state.newEx || "").trim();
    if (!name) return;
    const day = editDayObj();
    day.exercises = day.exercises || [];
    day.exercises.push({ id: "", name, sets: 3, reps: "8–12", rest_sec: 60, desc: "", tips: "", custom: true });
    if (!day.title || day.title === "Ingen økt") day.title = "Egen økt";
    day.kind = "custom";
    state.newEx = "";
    render();
  }

  function renderEditor() {
    const wrap = el("div", { class: "wrap" },
      el("div", { class: "pill" }, "Min egen plan"),
      el("h1", {}, "Rediger uken"),
      el("p", { class: "lead" }, "Mandag er fylt med bryst, armer og skuldre – slik du ville ha det. Resten av uka står åpen."),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    const week = el("div", { class: "week" });
    for (const day of state.editPlan.days || []) {
      const todayName = (globalThis.Trener && Trener.weekdayName(todayIso())) || "";
      const cls = ["day", (day.exercises || []).length ? "train" : "rest", day.weekday === state.editDay ? "on" : "", day.weekday === todayName ? "today" : ""].filter(Boolean).join(" ");
      week.append(el("button", { class: cls, type: "button", onclick: () => { state.editDay = day.weekday; render(); } },
        el("b", {}, day.weekday_short),
        String((day.exercises || []).length || "–"),
        el("i", {}),
      ));
    }
    wrap.append(week);

    const day = editDayObj();
    wrap.append(
      el("label", {}, "Overskrift for " + day.weekday),
      el("input", { value: day.title || "", oninput: (e) => { day.title = e.target.value; } }),
    );

    const list = el("div", { class: "card" });
    if (!(day.exercises || []).length) list.append(el("p", { class: "muted" }, "Ingen øvelser ennå. Legg til fra biblioteket, eller skriv inn en egen."));
    (day.exercises || []).forEach((ex, i) => {
      const row = el("div", { class: "edit-ex" });
      const left = el("div", {}, el("div", { class: "name" }, (i + 1) + ". " + ex.name));
      const meta = el("div", { class: "meta-row" });
      const sets = el("input", { type: "number", inputmode: "numeric", value: ex.sets, "aria-label": "Sett", title: "Sett" });
      const reps = el("input", { value: ex.reps, "aria-label": "Reps", title: "Reps" });
      const rest = el("input", { type: "number", inputmode: "numeric", value: ex.rest_sec, "aria-label": "Hvile i sekunder", title: "Hvile (s)" });
      sets.addEventListener("input", (e) => { ex.sets = Number(e.target.value || 3); });
      reps.addEventListener("input", (e) => { ex.reps = e.target.value; });
      rest.addEventListener("input", (e) => { ex.rest_sec = Number(e.target.value || 60); });
      meta.append(sets, reps, rest);
      left.append(el("div", { class: "muted", style: "font-size:11px;margin:0 0 6px" }, "Sett · reps · hvile (s)"), meta);
      const tools = el("div", { class: "tools" },
        el("button", { type: "button", disabled: i === 0, onclick: () => { const a = day.exercises; [a[i - 1], a[i]] = [a[i], a[i - 1]]; render(); } }, "↑"),
        el("button", { type: "button", disabled: i === day.exercises.length - 1, onclick: () => { const a = day.exercises; [a[i + 1], a[i]] = [a[i], a[i + 1]]; render(); } }, "↓"),
        el("button", { type: "button", onclick: () => { day.exercises.splice(i, 1); render(); } }, "✕"),
      );
      row.append(left, tools);
      list.append(row);
    });
    wrap.append(list);

    wrap.append(el("h2", {}, "Legg til øvelse"));
    wrap.append(el("button", { class: "btn", type: "button", onclick: () => { state.picker = true; render(); } }, "Velg fra biblioteket"));
    const free = el("div", { class: "row", style: "margin-top:8px" });
    const inp = el("input", { value: state.newEx, placeholder: "Eller skriv en egen øvelse…", style: "margin:0" });
    inp.addEventListener("input", (e) => { state.newEx = e.target.value; });
    inp.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); addFreeEx(); } });
    free.append(inp, el("button", { class: "btn ghost", type: "button", style: "flex:0 0 auto;width:auto;padding:0 16px", onclick: addFreeEx }, "Legg til"));
    wrap.append(free);

    const nav = el("div", { class: "row", style: "margin-top:16px" },
      el("button", { class: "btn ghost", type: "button", onclick: () => { state.editing = false; render(); } }, "Avbryt"),
      el("button", { class: "btn", type: "button", onclick: saveEditor }, "Lagre uken"),
    );
    wrap.append(nav);
    wrap.append(renderNav());

    if (state.picker) {
      wrap.append(el("div", { class: "backdrop", onclick: () => { state.picker = false; render(); } }));
      const sheet = el("div", { class: "sheet" },
        el("h3", {}, "Øvelsesbibliotek"),
        el("p", { class: "muted" }, "Trykk for å legge til på " + day.weekday + "."),
      );
      const search = el("input", { value: state.libQuery, placeholder: "Søk etter øvelse…", style: "margin-bottom:8px" });
      search.addEventListener("input", (e) => { state.libQuery = e.target.value; render(); const s = document.querySelector(".sheet input"); if (s) { s.focus(); s.selectionStart = s.value.length; } });
      sheet.append(search);
      const q = (state.libQuery || "").toLowerCase();
      const ul = el("ul", { class: "lib" });
      const items = ((state.data || {}).library || []).filter((x) => !q || (x.name + " " + x.muscle).toLowerCase().includes(q));
      for (const item of items) {
        const li = el("li", { onclick: () => addLibraryEx(item) },
          el("div", { class: "name" }, item.name),
          el("div", { class: "meta" }, item.muscle),
        );
        ul.append(li);
      }
      if (!items.length) ul.append(el("li", {}, el("div", { class: "muted" }, "Ingen treff. Du kan skrive en egen øvelse under.")));
      sheet.append(ul);
      wrap.append(sheet);
    }
    return wrap;
  }

  /* ---------- workout ---------- */
  function initWorkout(sess) {
    const existing = ((state.data || {}).workouts || []).find((w) => w.date === sess.date);
    const exercises = (sess.exercises || []).map((ex) => {
      const prev = existing && (existing.exercises || []).find((p) => p.id === ex.id);
      const sets = [];
      const n = Math.max(1, ex.sets || 1);
      for (let i = 0; i < n; i++) {
        const ps = prev && prev.sets && prev.sets[i];
        sets.push({
          reps: ps && ps.reps != null ? ps.reps : midReps(ex.reps),
          weight_kg: ps && ps.weight_kg != null ? ps.weight_kg : (ex.suggest_kg || ""),
          done: !!(ps && ps.done),
        });
      }
      return { ...ex, log: sets };
    });
    state.workout = { date: sess.date, title: sess.title, kind: sess.kind, blurb: sess.blurb, exercises, i: 0, completed: !!(existing && existing.completed) };
    state.rest = null;
  }

  function midReps(rep) {
    const nums = String(rep || "").match(/\d+/g);
    if (!nums) return 8;
    if (nums.length === 1) return Number(nums[0]);
    return Math.round((Number(nums[0]) + Number(nums[1])) / 2);
  }

  function openWorkout(forceStart) {
    const sess = state.workoutSess || todaySession();
    if (!sess || !(sess.exercises || []).length) {
      if (forceStart) state.workout = null;
      return;
    }
    if (forceStart || !state.workout || state.workout.date !== sess.date) initWorkout(sess);
  }

  async function saveWorkout(complete) {
    const w = state.workout;
    if (!w) return;
    const body = {
      action: complete ? "complete" : "save",
      date: w.date,
      title: w.title,
      completed: !!complete,
      exercises: w.exercises.map((ex) => ({
        id: ex.id,
        sets: ex.log.map((s) => ({
          reps: s.reps === "" || s.reps == null ? null : Number(s.reps),
          weight_kg: s.weight_kg === "" || s.weight_kg == null ? null : Number(s.weight_kg),
          done: !!s.done,
        })),
      })),
    };
    try {
      state.data = await api("workout", { method: "POST", body });
      if (complete) { w.completed = true; state.tab = "plan"; state.rest = null; state.ok = "Økten er loggført. Bra jobba!"; }
    } catch (e) { state.err = e.message; }
    render();
  }

  function beep() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.09;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
      o.stop(ctx.currentTime + 0.42);
      setTimeout(() => { try { ctx.close(); } catch {} }, 600);
    } catch {}
  }

  function startRest(sec) {
    if (state.rest && state.rest.t) clearInterval(state.rest.t);
    const total = Math.max(10, sec || 60);
    try { if (navigator.vibrate) navigator.vibrate(30); } catch {}
    state.rest = { left: total, total, t: setInterval(() => {
      if (!state.rest) return;
      state.rest.left -= 1;
      if (state.rest.left <= 0) {
        clearInterval(state.rest.t);
        state.rest.left = 0;
        beep();
        try { if (navigator.vibrate) navigator.vibrate([180, 70, 180]); } catch {}
      }
      const node = document.querySelector(".timer .time");
      const fg = document.querySelector(".timer .fg");
      if (node) node.textContent = fmtTime(state.rest.left);
      if (fg) {
        const c = 2 * Math.PI * 54;
        fg.style.strokeDashoffset = String(c * (1 - state.rest.left / state.rest.total));
      }
    }, 1000) };
    render();
  }

  function fmtTime(s) {
    const m = Math.floor(s / 60);
    const r = Math.max(0, s % 60);
    return m + ":" + String(r).padStart(2, "0");
  }

  function renderWorkout() {
    openWorkout(false);
    const w = state.workout;
    const wrap = el("div", { class: "wrap workout" });
    if (!w) {
      const today = todaySession();
      const next = nextTraining(today);
      wrap.append(
        el("div", { class: "pill" }, "I dag"),
        el("h1", {}, "Hviledag"),
        el("p", { class: "lead" }, "Ingen økt i dag."),
      );
      if (next) wrap.append(el("p", { class: "next-session" }, "Neste økt: " + next.weekday));
      wrap.append(el("button", { class: "btn", type: "button", onclick: () => { state.tab = "plan"; render(); } }, "Tilbake til planen"));
      wrap.append(renderNav());
      return wrap;
    }
    const ex = w.exercises[w.i] || w.exercises[0];
    wrap.append(
      el("div", { class: "top" },
        el("div", {},
          el("div", { class: "pill" }, (w.i + 1) + " / " + w.exercises.length),
          el("h1", {}, w.title),
        ),
        el("button", { class: "iconbtn", type: "button", onclick: () => { state.tab = "plan"; render(); } }, "✕"),
      ),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (w.completed) wrap.append(el("div", { class: "okmsg" }, "Økten er loggført. Bra jobba!"));

    if (state.rest && state.rest.left > 0) {
      const c = 2 * Math.PI * 54;
      const off = c * (1 - state.rest.left / state.rest.total);
      const t = el("div", { class: "timer" });
      t.innerHTML = `<svg viewBox="0 0 120 120"><circle class="bg" cx="60" cy="60" r="54"/><circle class="fg" cx="60" cy="60" r="54" stroke-dasharray="${c}" stroke-dashoffset="${off}"/></svg>`;
      t.append(el("div", { class: "time" }, fmtTime(state.rest.left)));
      wrap.append(t, el("p", { class: "center muted" }, "Hvile – pust, rist løs i armene, og gjør deg klar."));
      wrap.append(el("button", { class: "btn ghost", type: "button", onclick: () => { clearInterval(state.rest.t); state.rest = null; render(); } }, "Hopp over hvilen"));
    }

    const title = el("h3", {}, ex.name);
    if (ex.pr) title.append(el("span", { class: "pr" }, "PR"));
    const card = el("div", { class: "card" }, title);
    if (ex.desc) card.append(el("p", { class: "muted" }, ex.desc));
    if (ex.tips) card.append(el("p", { class: "note" }, "Tips: " + ex.tips));
    wrap.append(card);

    if (lastLine(ex)) wrap.append(el("p", { class: "last" }, lastLine(ex)));
    if (ex.hint) wrap.append(el("div", { class: "hint" + (ex.hint_kind === "reduce" ? " warn" : ""), dataset: { hint: "overload" } }, ex.hint));

    const timed = (ex.reps || "").includes("min") || (ex.reps || "").includes(" s");
    const sets = el("div", { class: "sets" });
    function stepper(value, label, step, onChange) {
      const box = el("label", { class: "stepper" });
      box.append(el("span", {}, label));
      const controls = el("div", { class: "stepper-row" });
      const input = el("input", { type: "number", inputmode: "decimal", value: value === "" || value == null ? "" : value, "aria-label": label });
      input.addEventListener("input", (e) => onChange(e.target.value));
      const bump = (dir) => {
        const cur = Number(String(input.value || "0").replace(",", ".")) || 0;
        const next = Math.max(0, Math.round((cur + dir * step) * 10) / 10);
        input.value = String(next);
        onChange(next);
      };
      controls.append(
        el("button", { class: "step", type: "button", "aria-label": "Mindre " + label, onclick: () => bump(-1) }, "−"),
        input,
        el("button", { class: "step", type: "button", "aria-label": "Mer " + label, onclick: () => bump(1) }, "+"),
      );
      box.append(controls);
      return box;
    }
    ex.log.forEach((s, i) => {
      const row = el("div", { class: "set" }, el("div", { class: "n" }, String(i + 1)));
      if (timed) {
        const inp = el("input", { type: "text", value: s.reps || ex.reps, "aria-label": "Tid" });
        inp.addEventListener("input", (e) => { s.reps = e.target.value; });
        row.append(inp, el("div", { class: "muted" }, "tid"));
      } else {
        row.append(
          stepper(s.reps, "Reps", 1, (v) => { s.reps = v; }),
          stepper(s.weight_kg, "Kg", 2.5, (v) => { s.weight_kg = v; }),
        );
      }
      const tick = el("button", { class: "tick" + (s.done ? " on" : ""), type: "button", "aria-label": "Sett ferdig", onclick: () => {
        s.done = !s.done;
        if (s.done && ex.rest_sec) startRest(ex.rest_sec);
        else render();
        saveWorkout(false);
      } }, s.done ? "✓" : "○");
      row.append(tick);
      sets.append(row);
    });
    wrap.append(el("h2", {}, timed ? "Økt" : "Sett · reps · kg"), sets);

    const nav = el("div", { class: "row" });
    nav.append(el("button", { class: "btn ghost", type: "button", disabled: w.i === 0, onclick: () => { w.i = Math.max(0, w.i - 1); state.rest = null; render(); } }, "Forrige"));
    if (w.i < w.exercises.length - 1) {
      nav.append(el("button", { class: "btn", type: "button", onclick: () => { w.i++; state.rest = null; saveWorkout(false); } }, "Neste øvelse"));
    } else {
      nav.append(el("button", { class: "btn coral", type: "button", onclick: () => saveWorkout(true) }, "Fullfør økten"));
    }
    wrap.append(nav);
    wrap.append(renderNav());
    return wrap;
  }

  /* ---------- progress + checkin ---------- */
  function renderChart(progress) {
    const box = el("div", { class: "stats" });
    const tiles = [
      ["Streak", String((progress && progress.streak) || 0)],
      ["Økter", String((progress && progress.sessions_done) || 0)],
      ["Rekorder", String(((progress && progress.prs) || []).length)],
    ];
    for (const [label, value] of tiles) {
      box.append(el("div", { class: "stat" }, el("b", {}, value), el("span", {}, label)));
    }
    const chart = el("div", { class: "card" });
    chart.append(box);
    const weeks = (progress && progress.volume_by_week) || [];
    if (weeks.length) {
      chart.append(el("h2", {}, "Volum per uke"));
      const bars = el("div", { class: "bars" });
      const max = Math.max(...weeks.map((w) => w.volume), 1);
      for (const w of weeks.slice(-8)) {
        const h = Math.max(8, Math.round((w.volume / max) * 96));
        const col = el("div", { class: "col" });
        const i = el("i", {});
        i.style.height = h + "px";
        col.append(i, el("span", {}, fmtDate(w.week_start)));
        bars.append(col);
      }
      chart.append(bars);
    }
    const weights = (progress && progress.weights) || [];
    if (weights.length) {
      chart.append(el("h2", {}, "Vekt"));
      const svg = elNS("svg", { class: "chart", viewBox: "0 0 300 120", preserveAspectRatio: "none" });
      const vals = weights.map((w) => Number(w.kg));
      const lo = Math.min(...vals) - 1, hi = Math.max(...vals) + 1;
      const pts = vals.map((v, i) => {
        const x = vals.length === 1 ? 150 : 16 + (i * (268 / (vals.length - 1)));
        const y = 100 - ((v - lo) / (hi - lo || 1)) * 80;
        return [x, y];
      });
      const line = elNS("polyline", { fill: "none", stroke: "#c6f25c", "stroke-width": "3", points: pts.map((p) => p.join(",")).join(" ") });
      svg.appendChild(line);
      pts.forEach(([x, y]) => svg.appendChild(elNS("circle", { cx: x, cy: y, r: 4, fill: "#c6f25c" })));
      chart.append(svg);
      chart.append(el("p", { class: "muted" }, "Siste: " + vals[vals.length - 1] + " kg"));
    }
    const rms = (progress && progress.one_rm) || [];
    if (rms.length) {
      chart.append(el("h2", {}, "Estimert 1RM"));
      const ul = el("ul", { class: "prlist" });
      for (const r of rms) {
        ul.append(el("li", {},
          el("div", {}, el("div", { class: "name" }, r.name), el("div", { class: "meta" }, (r.from || "") + (r.date ? " · " + fmtDate(r.date) : ""))),
          el("b", {}, String(r.kg).replace(".", ",") + " kg"),
        ));
      }
      chart.append(ul);
    }
    const prs = (progress && progress.prs) || [];
    if (prs.length) {
      chart.append(el("h2", {}, "Personlige rekorder"));
      const ul = el("ul", { class: "prlist" });
      for (const r of prs) {
        ul.append(el("li", {},
          el("div", {}, el("div", { class: "name" }, r.name), el("div", { class: "meta" }, r.max_kg_date ? fmtDate(r.max_kg_date) : "")),
          el("b", {}, String(r.max_kg).replace(".", ",") + " kg"),
        ));
      }
      chart.append(ul);
    }
    return chart;
  }

  function elNS(tag, attrs) {
    const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (const [k, v] of Object.entries(attrs || {})) n.setAttribute(k, v);
    return n;
  }

  function scale(key, labels) {
    const row = el("div", { class: "scale" });
    for (let i = 1; i <= 5; i++) {
      row.append(el("button", { class: state.checkin[key] === i ? "on" : "", type: "button", onclick: () => { state.checkin[key] = i; render(); } }, String(i)));
    }
    return el("div", {}, el("label", {}, labels), row);
  }

  async function submitCheckin() {
    const c = state.checkin;
    if (!c.energy || !c.soreness) { state.err = "Velg både energi og stølhet, så justerer jeg planen."; render(); return; }
    try {
      const data = await api("checkin", { method: "POST", body: {
        energy: c.energy, soreness: c.soreness, skipped: Number(c.skipped || 0),
        weight_kg: c.weight_kg ? Number(String(c.weight_kg).replace(",", ".")) : null,
        note: c.note || "",
      }});
      state.data = data;
      state.showCheckin = false;
      state.ok = (data.adjustment && data.adjustment.message) || "Planen er justert.";
      state.err = "";
    } catch (e) { state.err = e.message; }
    render();
  }

  function renderProgress() {
    const d = state.data;
    const wrap = el("div", { class: "wrap" },
      el("div", { class: "pill coral" }, "Fremgang"),
      el("h1", {}, "Slik går det"),
      el("p", { class: "lead" }, "Etter hver uke sjekker vi inn, og jeg justerer planen opp, ned eller holder nivået."),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.ok) wrap.append(el("div", { class: "okmsg" }, state.ok));
    wrap.append(renderChart(d.progress));
    if (state.showCheckin) {
      wrap.append(el("h2", {}, "Ukessjekk"));
      const card = el("div", { class: "card" });
      card.append(scale("energy", "Hvordan var energien? 1 = sliten, 5 = på topp"));
      card.append(scale("soreness", "Hvor støl eller øm var du? 1 = ingenting, 5 = veldig"));
      card.append(el("label", {}, "Økter du hoppet over"),
        el("input", { type: "number", inputmode: "numeric", value: state.checkin.skipped, min: "0", max: "7", oninput: (e) => { state.checkin.skipped = e.target.value; } }),
        el("label", {}, "Vekt i dag (valgfritt)"),
        el("input", { type: "number", inputmode: "decimal", value: state.checkin.weight_kg, placeholder: "kg", oninput: (e) => { state.checkin.weight_kg = e.target.value; } }),
        el("label", {}, "En kort merknad"),
        el("textarea", { placeholder: "F.eks. dårlig søvn, eller at kneet kjentes rart…", oninput: (e) => { state.checkin.note = e.target.value; } }, state.checkin.note || ""),
        el("button", { class: "btn", type: "button", onclick: submitCheckin }, "Juster planen"),
      );
      wrap.append(card);
    } else {
      wrap.append(el("button", { class: "btn", type: "button", onclick: () => { state.showCheckin = true; state.ok = ""; render(); } }, "Start ukessjekk"));
    }
    const last = (d.checkins || []).slice(-1)[0];
    if (last) wrap.append(el("div", { class: "note" }, "Siste sjekk " + fmtDate(last.date) + ": " + (last.message || "")));
    wrap.append(el("p", { class: "safety" }, d.safety || ""));
    wrap.append(renderNav());
    return wrap;
  }

  /* ---------- chat ---------- */
  async function sendChat() {
    const msg = (state.chatDraft || "").trim();
    if (!msg) return;
    state.chatDraft = "";
    state.err = "";
    const chat = ((state.data || {}).chat || []).slice();
    chat.push({ role: "user", text: msg });
    state.data.chat = chat;
    render();
    const box = document.querySelector(".chat");
    if (box) box.scrollTop = box.scrollHeight;
    try {
      const data = await api("chat", { method: "POST", body: { message: msg } });
      state.data = data;
    } catch (e) { state.err = e.message; }
    render();
    const box2 = document.querySelector(".chat");
    if (box2) box2.scrollTop = box2.scrollHeight;
  }

  function askChip(text) {
    state.chatDraft = text;
    sendChat();
  }

  function renderChat() {
    const d = state.data;
    const today = d.today || todaySession();
    const next = nextTraining(today);
    const status = today && trainingDay(today)
      ? "I dag: " + today.title + "."
      : "I dag er en hviledag." + (next ? " Neste økt: " + next.weekday + "." : "");
    const wrap = el("div", { class: "wrap chat-wrap" },
      el("div", { class: "pill" }, "Spør treneren"),
      el("h1", {}, "Jeg er her"),
      el("p", { class: "lead" }, status + " Jeg er ikke lege."),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    const chat = el("div", { class: "chat" });
    const msgs = d.chat || [];
    if (!msgs.length) {
      chat.append(el("div", { class: "bubble coach" }, "Hei! Spør om teknikk, mat eller progresjon. Forslagene under er gode steder å starte."));
    }
    for (const m of msgs) {
      chat.append(el("div", { class: "bubble " + (m.role === "user" ? "user" : "coach") }, m.text));
    }
    wrap.append(chat);
    const dock = el("div", { class: "composer" });
    const chips = el("div", { class: "chips" });
    for (const q of ["Hva gjør jeg om mat?", "Hvordan gjør jeg knebøy?", "Hvor mange reps?", "Skal jeg øke vekten?"]) {
      chips.append(el("button", { class: "chip", type: "button", onclick: () => askChip(q) }, q));
    }
    dock.append(chips);
    const form = el("div", { class: "composer-row" });
    const ta = el("textarea", { placeholder: "Skriv til treneren…", rows: "1", enterkeyhint: "send" }, state.chatDraft || "");
    ta.addEventListener("input", (e) => { state.chatDraft = e.target.value; });
    ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } });
    form.append(ta, el("button", { class: "btn", type: "button", onclick: sendChat }, "Send"));
    dock.append(form);
    wrap.append(dock);
    wrap.append(renderNav());
    return wrap;
  }


  /* ---------- innstillinger (eksport / import) ---------- */
  function downloadBackup() {
    try {
      const text = TrenerStore.exportJSON();
      const blob = new Blob([text], { type: "application/json" });
      const a = document.createElement("a");
      const iso = todayIso();
      a.href = URL.createObjectURL(blob);
      a.download = "trener-sikkerhetskopi-" + iso + ".json";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      state.ok = "Sikkerhetskopien er lastet ned.";
      state.err = "";
    } catch (e) { state.err = e.message; }
    render();
  }

  function importBackupFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        state.data = TrenerStore.importJSON(String(reader.result || ""));
        state.view = "app";
        state.tab = "plan";
        state.ok = "Sikkerhetskopien er lagt inn. Planen og loggen er tilbake.";
        state.err = "";
      } catch (e) { state.err = e.message; }
      render();
    };
    reader.onerror = () => { state.err = "Klarte ikke å lese filen."; render(); };
    reader.readAsText(file);
  }

  function renderSettings() {
    const wrap = el("div", { class: "wrap" },
      el("div", { class: "pill" }, "Innstillinger"),
      el("h1", {}, "Dataene dine"),
      el("p", { class: "lead" }, "Alt ligger bare i denne nettleseren. Ta en sikkerhetskopi, så mister du ikke planen om du bytter telefon eller tømmer historikk."),
    );
    if (state.err) wrap.append(el("div", { class: "err" }, state.err));
    if (state.ok) wrap.append(el("div", { class: "okmsg" }, state.ok));
    wrap.append(
      el("div", { class: "card settings-card" },
        el("h3", {}, "Sikkerhetskopi"),
        el("p", { class: "muted" }, "Last ned all trening, planen og samtalene som en JSON-fil. Du kan legge den inn igjen senere på denne eller en annen enhet."),
        el("button", { class: "btn", type: "button", id: "export-backup", onclick: downloadBackup }, "Last ned sikkerhetskopi"),
        el("button", { class: "btn ghost", type: "button", id: "import-backup", style: "margin-top:8px", onclick: () => {
          const inp = document.createElement("input");
          inp.type = "file";
          inp.accept = "application/json,.json";
          inp.addEventListener("change", () => importBackupFile(inp.files && inp.files[0]));
          inp.click();
        } }, "Legg inn sikkerhetskopi"),
      ),
      el("div", { class: "card settings-card" },
        el("h3", {}, "Start på nytt"),
        el("p", { class: "muted" }, "Sletter planen og all logg i denne nettleseren. Dette kan ikke angres – last ned en kopi først hvis du vil beholde noe."),
        el("button", { class: "btn ghost", type: "button", onclick: () => {
          if (!confirm("Slette all treningsdata i denne nettleseren?")) return;
          TrenerStore.reset();
          state.data = null;
          state.view = "onboard";
          state.step = 0;
          state.onb = {};
          state.workout = null;
          state.err = "";
          state.ok = "";
          render();
        } }, "Slett data og lag ny plan"),
      ),
      el("p", { class: "safety" }, (state.data && state.data.safety) || Trener.SAFETY),
      el("button", { class: "btn ghost", type: "button", style: "margin-top:14px", onclick: () => { state.view = "app"; state.ok = ""; render(); } }, "Tilbake til planen"),
    );
    return wrap;
  }

  /* ---------- render root ---------- */
  function render() {
    app.innerHTML = "";
    if (state.view === "boot") { app.append(el("div", { class: "boot" }, "Klarer treneren…")); return; }
    if (state.view === "error") {
      app.append(el("div", { class: "wrap" }, el("h1", {}, "Fikk ikke kontakt"), el("p", { class: "lead" }, state.err || "Prøv igjen om litt."), el("button", { class: "btn", onclick: boot }, "Prøv igjen")));
      return;
    }
    if (state.view === "onboard") { app.append(renderOnboard()); return; }
    if (state.view === "settings") { app.append(renderSettings()); return; }
    if (state.tab === "okt") app.append(renderWorkout());
    else if (state.tab === "frem") app.append(renderProgress());
    else if (state.tab === "chat") app.append(renderChat());
    else if (state.editing) app.append(renderEditor());
    else app.append(renderPlan());
    if (state.tab === "chat") {
      const box = document.querySelector(".chat");
      if (box) box.scrollTop = box.scrollHeight;
      const dock = document.querySelector(".composer");
      const vv = window.visualViewport;
      if (dock && vv) {
        const lift = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
        dock.style.transform = lift ? "translateY(-" + Math.round(lift) + "px)" : "";
      }
    }
  }

  if (window.visualViewport && !state._kb) {
    state._kb = true;
    const nudge = () => {
      const dock = document.querySelector(".composer");
      if (!dock || state.tab !== "chat") return;
      const vv = window.visualViewport;
      const lift = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      dock.style.transform = lift ? "translateY(-" + Math.round(lift) + "px)" : "";
    };
    window.visualViewport.addEventListener("resize", nudge);
    window.visualViewport.addEventListener("scroll", nudge);
  }

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch(() => {});
  }
  boot();
})();

