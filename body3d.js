/* 3D-muskelkart. Krever vendor/three.min.js (MIT). Faller tilbake hvis WebGL mangler. */
(() => {
  const THREE = globalThis.THREE;
  if (!THREE) {
    globalThis.TrenerBody = { mount: () => null };
    return;
  }

  const GEO = {};
  function geo(key, build) {
    if (!GEO[key]) GEO[key] = build();
    return GEO[key];
  }
  function sphere() { return geo("sphere", () => new THREE.SphereGeometry(1, 36, 28)); }
  function lathe(key, pts, seg) {
    return geo(key, () => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg || 40));
  }

  function makeMat(color, emissive) {
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness: 0.46,
      metalness: 0.03,
      clearcoat: 0.22,
      clearcoatRoughness: 0.38,
      emissive: emissive || 0x000000,
      emissiveIntensity: emissive ? 0.32 : 0,
    });
  }

  const COLORS = {
    core: [0x6d4338, 0],
    skin: [0xd7b094, 0],
    fresh: [0xc45a4c, 0],
    today: [0xd6ff4a, 0x738814],
    assist: [0xcfe07a, 0x4e5e16],
    recovering: [0xff8a3a, 0x7a3010],
  };

  function mount(canvas, opts) {
    opts = opts || {};
    if (!canvas) return null;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, antialias: true, alpha: true, powerPreference: "high-performance",
      });
    } catch (e) {
      return null;
    }
    if (!renderer.getContext()) {
      try { renderer.dispose(); } catch (err) {}
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.compact ? 1.75 : 2));
    if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
    if (THREE.ACESFilmicToneMapping) {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.12;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(opts.compact ? 26 : 24, 1, 0.05, 20);
    if (opts.compact) {
      camera.position.set(0.22, 1.25, 1.35);
      camera.lookAt(0, 1.22, 0);
    } else {
      camera.fov = 22;
      camera.position.set(0.12, 0.92, 4.55);
      camera.lookAt(0, 0.88, 0);
    }

    scene.add(new THREE.HemisphereLight(0xfff4ea, 0x2a211c, 0.72));
    const key = new THREE.DirectionalLight(0xfff7ee, 2.35);
    key.position.set(1.6, 3.2, 2.4);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xd7e6ff, 0.55);
    fill.position.set(-2.2, 1.6, 1.2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffd8b0, 0.85);
    rim.position.set(-0.4, 2.2, -2.6);
    scene.add(rim);

    const pivot = new THREE.Group();
    scene.add(pivot);
    const shadow = shadowDisc();
    shadow.position.y = 0.012;
    pivot.add(shadow);

    const mats = {};
    function material(role) {
      const keyName = COLORS[role] ? role : "fresh";
      if (!mats[keyName]) mats[keyName] = makeMat(COLORS[keyName][0], COLORS[keyName][1]);
      return mats[keyName];
    }

    const pickables = [];
    function add(id, parent, x, y, z, sx, sy, sz, rx, ry, rz) {
      const mesh = new THREE.Mesh(sphere(), id ? material("fresh") : material("core"));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.rotation.set(rx || 0, ry || 0, rz || 0);
      if (id) {
        mesh.userData.muscle = id;
        pickables.push(mesh);
      } else {
        mesh.material = material("core");
      }
      parent.add(mesh);
      return mesh;
    }
    function addGeo(id, geometry, parent, x, y, z, sx, sy, sz, rx, ry, rz) {
      const mesh = new THREE.Mesh(geometry, id ? material("fresh") : material("skin"));
      mesh.position.set(x, y, z);
      mesh.scale.set(sx, sy, sz);
      mesh.rotation.set(rx || 0, ry || 0, rz || 0);
      if (id) {
        mesh.userData.muscle = id;
        pickables.push(mesh);
      }
      parent.add(mesh);
      return mesh;
    }

    const torso = lathe("torso", [
      [0.125, 0.00],
      [0.168, 0.06],
      [0.138, 0.18],
      [0.158, 0.30],
      [0.188, 0.44],
      [0.198, 0.54],
      [0.120, 0.62],
      [0.082, 0.70],
    ], 48);
    const torsoMesh = addGeo(null, torso, pivot, 0, 0.88, 0, 1.22, 1, 0.62);
    torsoMesh.material = material("core");

    const legGeo = lathe("leg", [
      [0.042, 0.00],
      [0.052, 0.10],
      [0.046, 0.24],
      [0.044, 0.40],
      [0.062, 0.54],
      [0.086, 0.72],
      [0.092, 0.84],
    ], 28);

    addGeo(null, sphere(), pivot, 0, 1.69, 0.012, 0.105, 0.126, 0.11).material = material("skin");
    add(null, pivot, 0, 1.56, 0.008, 0.044, 0.05, 0.044);

    function side(s) {
      add(null, pivot, 0.21 * s, 1.45, 0, 0.065, 0.055, 0.058);
      add("pecs", pivot, 0.09 * s, 1.30, 0.112, 0.078, 0.058, 0.04, -0.05, 0.25 * s, -0.12 * s);
      add("front_delt", pivot, 0.175 * s, 1.44, 0.055, 0.044, 0.048, 0.038);
      add("side_delt", pivot, 0.228 * s, 1.45, 0, 0.048, 0.052, 0.046);
      add("rear_delt", pivot, 0.17 * s, 1.44, -0.055, 0.042, 0.046, 0.036);
      add("trap", pivot, 0.085 * s, 1.50, -0.04, 0.07, 0.038, 0.032, -0.45, 0, 0.35 * s);
      add("lat", pivot, 0.13 * s, 1.22, -0.07, 0.09, 0.14, 0.032);
      add("oblique", pivot, 0.12 * s, 1.08, 0.05, 0.034, 0.09, 0.028);

      const arm = new THREE.Group();
      arm.position.set(0.24 * s, 1.42, 0);
      arm.rotation.z = 0.05 * s;
      pivot.add(arm);
      add(null, arm, 0, -0.16, 0, 0.034, 0.15, 0.034);
      add("biceps", arm, 0, -0.15, 0.022, 0.036, 0.105, 0.03);
      add("triceps", arm, 0, -0.15, -0.02, 0.034, 0.115, 0.03);
      const fore = new THREE.Group();
      fore.position.set(0, -0.26, 0);
      fore.rotation.x = -0.12;
      arm.add(fore);
      add(null, fore, 0, -0.13, 0, 0.028, 0.125, 0.028);
      add("forearm", fore, 0, -0.13, 0.01, 0.03, 0.115, 0.026);
      const hand = add(null, fore, 0, -0.26, 0.008, 0.026, 0.03, 0.012);
      hand.material = material("skin");

      const legMesh = addGeo(null, legGeo, pivot, 0.09 * s, 0.015, 0, 1, 1, 0.88);
      legMesh.material = material("core");
      add("quad", pivot, 0.09 * s, 0.58, 0.055, 0.064, 0.155, 0.048);
      add("ham", pivot, 0.09 * s, 0.56, -0.05, 0.052, 0.145, 0.04);
      add("glute", pivot, 0.07 * s, 0.92, -0.055, 0.078, 0.068, 0.058);
      add("calf", pivot, 0.088 * s, 0.26, -0.04, 0.044, 0.105, 0.04);
      const foot = add(null, pivot, 0.092 * s, 0.03, 0.04, 0.036, 0.02, 0.075);
      foot.material = material("skin");
    }
    side(1);
    side(-1);

    const absY = [1.20, 1.145, 1.09];
    for (let i = 0; i < absY.length; i++) {
      add("abs", pivot, -0.032, absY[i], 0.125, 0.03, 0.022, 0.016);
      add("abs", pivot, 0.032, absY[i], 0.125, 0.03, 0.022, 0.016);
    }

    const paint = {};
    function applyPaint(list) {
      for (const row of list || []) paint[row.id] = row;
      for (const mesh of pickables) {
        const row = paint[mesh.userData.muscle];
        mesh.material = material(row ? row.role : "fresh");
      }
      render();
    }

    let yaw = Number(opts.yaw) || 0;
    function applyYaw() { pivot.rotation.y = yaw; }

    const ray = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function resize() {
      const w = canvas.clientWidth || canvas.width || 300;
      const h = canvas.clientHeight || canvas.height || 400;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      render();
    }
    function render() {
      applyYaw();
      renderer.render(scene, camera);
    }

    let dragging = false;
    let moved = 0;
    let lastX = 0;
    function onDown(e) {
      if (opts.compact) return;
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function onMove(e) {
      if (!dragging || opts.compact) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (Math.abs(dx) < 0.5) return;
      yaw += dx * 0.012;
      if (opts.onYaw) opts.onYaw(yaw);
      render();
      if (e.cancelable) e.preventDefault();
    }
    function pick(e) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(pickables, false)[0];
      const id = hit && hit.object.userData.muscle;
      const row = id ? paint[id] : null;
      if (opts.onPick) opts.onPick(row || null);
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      if (moved < 8) pick(e);
    }
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", () => { dragging = false; });

    let ro;
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => resize());
      ro.observe(canvas);
    }
    applyPaint(opts.paint || []);
    resize();
    requestAnimationFrame(resize);

    return {
      setYaw(next) { yaw = next; render(); },
      setPaint: applyPaint,
      getYaw: () => yaw,
      dispose() {
        canvas.removeEventListener("pointerdown", onDown);
        canvas.removeEventListener("pointermove", onMove);
        canvas.removeEventListener("pointerup", onUp);
        if (ro) ro.disconnect();
        for (const m of Object.values(mats)) m.dispose();
        renderer.dispose();
      },
    };
  }

  function shadowDisc() {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(64, 64, 10, 64, 64, 62);
    grd.addColorStop(0, "rgba(0,0,0,0.38)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(0.42, 40),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }),
    );
    mesh.rotation.x = -Math.PI / 2;
    return mesh;
  }

  globalThis.TrenerBody = { mount };
})();
