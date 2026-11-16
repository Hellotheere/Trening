/* Anatomisk muskelkart, tegnet for denne appen. Forside og bakside, med skygge. */
(() => {
  const CX = 200;

  function splineClosed(points) {
    const n = points.length;
    const at = (i) => points[(i + n) % n];
    let d = "M " + points[0][0] + " " + points[0][1];
    for (let i = 0; i < n; i++) {
      const p0 = at(i - 1);
      const p1 = at(i);
      const p2 = at(i + 1);
      const p3 = at(i + 2);
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += " C " + c1x.toFixed(1) + " " + c1y.toFixed(1) + " " + c2x.toFixed(1) + " " + c2y.toFixed(1) + " " + p2[0] + " " + p2[1];
    }
    return d + " Z";
  }

  function mirror(points) {
    return points.map(([x, y]) => [CX * 2 - x, y]);
  }

  function bodyFrom(left) {
    const right = mirror(left).slice().reverse();
    return splineClosed(left.concat(right.slice(1, -1)));
  }

  function pair(id, left) {
    return [[id, splineClosed(left)], [id, splineClosed(mirror(left))]];
  }

  const frontLeft = [
    [196, 118], [190, 142], [184, 166], [172, 182], [148, 194], [120, 204], [96, 214],
    [78, 232], [64, 258], [54, 294], [50, 332], [54, 366], [46, 402], [42, 442],
    [48, 478], [66, 504], [84, 514], [96, 500], [94, 468], [88, 430], [82, 396],
    [88, 364], [96, 332], [106, 300], [118, 274], [132, 262], [132, 262], [144, 286],
    [150, 318], [154, 352], [156, 386], [148, 416], [136, 444], [124, 484], [116, 528],
    [112, 572], [114, 612], [122, 656], [126, 700], [122, 736], [116, 756], [138, 772],
    [164, 778], [176, 762], [172, 728], [166, 688], [160, 644], [154, 600], [150, 556],
    [152, 512], [160, 468], [172, 436], [186, 418], [186, 418],
  ];

  const backLeft = [
    [196, 118], [190, 142], [182, 168], [164, 184], [136, 198], [108, 210], [86, 226],
    [70, 248], [58, 284], [52, 324], [56, 360], [48, 398], [44, 438], [50, 476],
    [68, 506], [88, 516], [100, 500], [96, 464], [90, 424], [86, 388], [94, 354],
    [104, 322], [116, 292], [128, 270], [128, 270], [140, 292], [136, 332], [130, 372],
    [124, 410], [116, 446], [110, 490], [106, 534], [108, 578], [116, 622], [126, 666],
    [132, 708], [128, 740], [122, 758], [144, 774], [170, 780], [180, 764], [176, 728],
    [168, 684], [160, 640], [154, 596], [150, 552], [152, 508], [160, 468], [174, 436],
    [188, 416], [188, 416],
  ];

  const frontMuscles = [].concat(
    pair("trap", [[190, 156], [168, 164], [140, 176], [112, 190], [96, 206], [120, 200], [156, 184], [182, 168]]),
    pair("front_delt", [[118, 198], [96, 206], [78, 226], [72, 252], [90, 262], [112, 248], [126, 222]]),
    pair("side_delt", [[100, 202], [78, 214], [62, 238], [60, 264], [78, 272], [100, 254], [112, 226]]),
    pair("pecs", [[184, 196], [156, 190], [128, 204], [114, 228], [118, 256], [142, 274], [170, 276], [188, 254], [192, 220]]),
    pair("biceps", [[100, 258], [82, 274], [70, 308], [72, 344], [90, 358], [108, 346], [114, 308], [108, 274]]),
    pair("triceps", [[74, 262], [58, 286], [54, 324], [64, 354], [80, 346], [84, 308], [78, 276]]),
    pair("forearm", [[86, 362], [68, 392], [56, 434], [54, 474], [72, 500], [96, 492], [104, 452], [102, 406], [94, 372]]),
    pair("oblique", [[158, 268], [146, 292], [144, 336], [150, 378], [168, 396], [180, 364], [178, 310], [170, 280]]),
    pair("quad", [[176, 430], [154, 442], [136, 478], [124, 528], [118, 578], [128, 622], [156, 632], [178, 604], [188, 548], [188, 484], [180, 446]]),
    pair("calf", [[150, 640], [136, 678], [130, 724], [140, 758], [166, 760], [176, 722], [170, 676], [160, 644]])
  );
  frontMuscles.push(
    ["abs", splineClosed([[176, 268], [158, 272], [154, 292], [160, 308], [176, 306]])],
    ["abs", splineClosed(mirror([[176, 268], [158, 272], [154, 292], [160, 308], [176, 306]]))],
    ["abs", splineClosed([[174, 312], [156, 316], [152, 338], [160, 354], [176, 350]])],
    ["abs", splineClosed(mirror([[174, 312], [156, 316], [152, 338], [160, 354], [176, 350]]))],
    ["abs", splineClosed([[172, 358], [156, 362], [154, 384], [164, 398], [178, 392]])],
    ["abs", splineClosed(mirror([[172, 358], [156, 362], [154, 384], [164, 398], [178, 392]]))]
  );

  const backMuscles = [].concat(
    pair("trap", [[192, 150], [164, 156], [132, 172], [104, 192], [88, 210], [118, 202], [158, 180], [186, 160]]),
    pair("rear_delt", [[112, 204], [88, 216], [70, 242], [68, 268], [90, 276], [114, 254], [122, 222]]),
    pair("side_delt", [[96, 206], [74, 218], [60, 244], [60, 270], [80, 266], [102, 236]]),
    pair("lat", [[156, 210], [128, 226], [112, 268], [114, 328], [128, 378], [152, 400], [174, 372], [180, 310], [172, 246]]),
    pair("triceps", [[86, 270], [68, 294], [60, 336], [66, 372], [88, 378], [102, 346], [100, 304], [92, 276]]),
    pair("forearm", [[84, 380], [66, 414], [56, 458], [64, 498], [90, 502], [104, 462], [102, 414], [94, 384]]),
    pair("glute", [[176, 412], [150, 418], [128, 446], [122, 486], [142, 516], [170, 518], [190, 492], [194, 448]]),
    pair("ham", [[164, 516], [142, 534], [126, 584], [120, 636], [138, 662], [166, 656], [182, 610], [184, 548]]),
    pair("calf", [[146, 668], [128, 706], [124, 748], [142, 772], [168, 772], [180, 740], [174, 698], [160, 670]])
  );

  const DEFS = `
    <linearGradient id="g-skin" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f7e7d8"/>
      <stop offset="0.42" stop-color="#e4c3a6"/>
      <stop offset="1" stop-color="#b8886c"/>
    </linearGradient>
    <linearGradient id="g-hair" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a342f"/>
      <stop offset="1" stop-color="#1c1917"/>
    </linearGradient>
    <radialGradient id="g-today" cx="32%" cy="26%" r="78%">
      <stop offset="0" stop-color="#f4ffb4"/>
      <stop offset="0.5" stop-color="#d6f04a"/>
      <stop offset="1" stop-color="#9bb824"/>
    </radialGradient>
    <radialGradient id="g-assist" cx="32%" cy="26%" r="78%">
      <stop offset="0" stop-color="#f7ffd4"/>
      <stop offset="0.55" stop-color="#e3f29a"/>
      <stop offset="1" stop-color="#c2d46a"/>
    </radialGradient>
    <radialGradient id="g-recovering" cx="32%" cy="26%" r="78%">
      <stop offset="0" stop-color="#ffd7b0"/>
      <stop offset="0.5" stop-color="#ff9a45"/>
      <stop offset="1" stop-color="#d86a22"/>
    </radialGradient>
    <radialGradient id="g-idle" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="#e4e7eb"/>
      <stop offset="0.55" stop-color="#b7bec6"/>
      <stop offset="1" stop-color="#7e878f"/>
    </radialGradient>
    <radialGradient id="g-shade" cx="70%" cy="40%" r="70%">
      <stop offset="0" stop-color="#000" stop-opacity="0"/>
      <stop offset="1" stop-color="#3a2418" stop-opacity=".28"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#1a120e" flood-opacity=".28"/>
    </filter>`;

  function face() {
    return `
      <path fill="url(#g-hair)" d="M160,64 C158,28 176,14 200,12 C224,14 242,28 240,64 C228,44 214,36 200,36 C186,36 172,44 160,64 Z"/>
      <path fill="#3a302c" d="M172,72 C178,66 188,66 194,72 C186,74 178,76 172,72 Z"/>
      <path fill="#3a302c" d="M228,72 C222,66 212,66 206,72 C214,74 222,76 228,72 Z"/>
      <path fill="none" stroke="#8a5a46" stroke-width="2" stroke-linecap="round" d="M200,84 C199,98 198,108 200,114"/>
      <path fill="none" stroke="#8a5a46" stroke-width="1.5" stroke-linecap="round" d="M193,112 C196,114 204,114 207,112"/>
      <path fill="none" stroke="#a56d58" stroke-width="1.7" stroke-linecap="round" d="M188,122 L212,122"/>
      <path fill="#e4b193" d="M150,74 C140,78 138,92 146,102 C152,108 158,100 158,88 C158,80 156,74 150,74 Z"/>
      <path fill="#e4b193" d="M250,74 C260,78 262,92 254,102 C248,108 242,100 242,88 C242,80 244,74 250,74 Z"/>`;
  }

  function head() {
    return `<path fill="url(#g-skin)" d="M200,16 C170,18 152,40 152,70 C152,94 164,110 178,120 C188,126 194,128 200,128 C206,128 212,126 222,120 C236,110 248,94 248,70 C248,40 230,18 200,16 Z"/>`;
  }

  function svgFor(side, crop) {
    const body = side === "back" ? bodyFrom(backLeft) : bodyFrom(frontLeft);
    const muscles = side === "back" ? backMuscles : frontMuscles;
    const parts = muscles.map(([id, d]) => `<path class="anat" data-id="${id}" d="${d}"/>`).join("");
    const view = crop === "torso" ? "70 10 260 340" : "20 8 360 800";
    return `<svg class="anat-svg" viewBox="${view}" role="img" aria-label="${side === "back" ? "Muskelkart bakfra" : "Muskelkart forfra"}">
      <defs>${DEFS}
        <clipPath id="clip-${side}"><path d="${body}"/></clipPath>
      </defs>
      <ellipse cx="200" cy="804" rx="70" ry="10" fill="#000" opacity=".18"/>
      <g filter="url(#soft)">
        ${head()}
        <path fill="url(#g-skin)" d="${body}"/>
        <path fill="url(#g-shade)" d="${body}"/>
      </g>
      <g clip-path="url(#clip-${side})">${parts}</g>
      ${side === "front" ? face() : `<path fill="url(#g-hair)" d="M158,70 C156,34 176,22 200,20 C224,22 244,34 242,70 C228,50 214,44 200,44 C186,44 172,50 158,70 Z"/>`}
    </svg>`;
  }

  const FILL = { today: "url(#g-today)", assist: "url(#g-assist)", recovering: "url(#g-recovering)", fresh: "url(#g-idle)" };

  function paintSvg(root, paint) {
    const map = {};
    for (const row of paint || []) map[row.id] = row;
    root.querySelectorAll("path.anat").forEach((node) => {
      const row = map[node.getAttribute("data-id")];
      const role = row ? row.role : "fresh";
      node.setAttribute("fill", FILL[role] || FILL.fresh);
      node.setAttribute("stroke", role === "fresh" ? "rgba(60,40,32,.18)" : "rgba(40,30,10,.28)");
      node.setAttribute("stroke-width", role === "today" ? "1.4" : "0.8");
    });
  }

  function svg(side, paint, opts) {
    const html = svgFor(side, opts && opts.crop);
    const wrap = document.createElement("div");
    wrap.innerHTML = html;
    const node = wrap.firstElementChild;
    paintSvg(node, paint);
    return node;
  }

  function mount(container, opts) {
    opts = opts || {};
    container.innerHTML = "";
    container.classList.add("anatomy-stage");
    const turn = document.createElement("div");
    turn.className = "anatomy-turn";
    const front = document.createElement("div");
    front.className = "anatomy-face";
    const back = document.createElement("div");
    back.className = "anatomy-face back";
    front.appendChild(svg("front", opts.paint));
    back.appendChild(svg("back", opts.paint));
    const light = document.createElement("div");
    light.className = "anatomy-light";
    turn.append(front, back, light);
    container.appendChild(turn);

    let yaw = Number(opts.yaw) || 0;
    let tilt = 7;
    function apply() {
      let y = yaw % 360;
      if (y < 0) y += 360;
      const showFront = y < 90 || y > 270;
      front.style.pointerEvents = showFront ? "auto" : "none";
      back.style.pointerEvents = showFront ? "none" : "auto";
      turn.style.transform = "rotateX(" + tilt.toFixed(2) + "deg) rotateY(" + yaw.toFixed(2) + "deg)";
      const lx = 28 + Math.sin(yaw * Math.PI / 180) * -22;
      light.style.setProperty("--lx", lx + "%");
      light.style.setProperty("--ly", (16 + tilt) + "%");
    }
    apply();

    let dragging = false;
    let moved = 0;
    let lx = 0;
    let ly = 0;
    function down(e) {
      dragging = true;
      moved = 0;
      lx = e.clientX;
      ly = e.clientY;
      turn.classList.add("dragging");
      try { container.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function move(e) {
      if (!dragging) return;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lx = e.clientX;
      ly = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.55;
      tilt = Math.max(-16, Math.min(20, tilt - dy * 0.12));
      if (opts.onYaw) opts.onYaw(yaw);
      apply();
      if (e.cancelable) e.preventDefault();
    }
    function up(e) {
      if (!dragging) return;
      dragging = false;
      turn.classList.remove("dragging");
      if (moved > 10) return;
      const hit = document.elementFromPoint(e.clientX, e.clientY);
      const node = hit && hit.closest && hit.closest("[data-id]");
      const id = node && node.getAttribute("data-id");
      const row = (opts.paint || []).find((m) => m.id === id) || null;
      if (opts.onPick) opts.onPick(row);
    }
    container.addEventListener("pointerdown", down);
    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);
    container.addEventListener("pointercancel", () => { dragging = false; turn.classList.remove("dragging"); });

    return {
      setYaw(next, nextTilt) {
        yaw = next;
        if (nextTilt != null) tilt = nextTilt;
        apply();
      },
      dispose() {
        container.removeEventListener("pointerdown", down);
        container.removeEventListener("pointermove", move);
        container.removeEventListener("pointerup", up);
      },
    };
  }

  globalThis.TrenerAnatomy = { svg, mount, paintSvg };
})();
