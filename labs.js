(() => {
  "use strict";
  const PI = Math.PI;
  const TAU = 2 * PI;
  const COL = {
    osc: "#f2b33d",
    wave: "#3fd0c9",
    optics: "#ff6f91",
    ink: "#ece7dc",
    ink2: "#bdb7ab",
    muted: "#8a857b",
    grid: "rgba(236,231,220,0.07)",
    axis: "rgba(236,231,220,0.42)",
  };
  const FONT = {
    mono: '"JetBrains Mono", "SF Mono", Menlo, monospace',
    sans: '"Noto Sans SC", "PingFang SC", sans-serif',
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const deg = (r) => (r * 180) / PI;
  const rad = (d) => (d * PI) / 180;

  function fmtPi(k) {
    if (k === 0) return "0";
    const s = k < 0 ? "−" : "";
    let n = Math.abs(k);
    let d = 12;
    const g = gcd(n, d);
    n /= g;
    d /= g;
    return s + (n === 1 ? "π" : n + "π") + (d === 1 ? "" : "/" + d);
  }
  function wrapPi(r) {
    let x = (((r + PI) % TAU) + TAU) % TAU - PI;
    if (x <= -PI + 1e-9) x = PI;
    return x;
  }
  function fmtPhase(r) {
    const x = wrapPi(r) / PI;
    return Math.abs(x) < 0.005 ? "0" : x.toFixed(2).replace("-", "−") + "π";
  }
  function num(v, d = 2) {
    const r = Math.abs(v) < 0.5 * Math.pow(10, -d) ? 0 : v;
    return r.toFixed(d).replace("-", "−");
  }
  // 波长 → 近似 RGB（0–1），380–780 nm
  function wl2rgb(nm) {
    let r = 0, g = 0, b = 0;
    if (nm >= 380 && nm < 440) { r = -(nm - 440) / 60; b = 1; }
    else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
    else if (nm < 510) { g = 1; b = -(nm - 510) / 20; }
    else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
    else if (nm < 645) { r = 1; g = -(nm - 645) / 65; }
    else if (nm <= 780) { r = 1; }
    let f = 0;
    if (nm >= 380 && nm < 420) f = 0.3 + (0.7 * (nm - 380)) / 40;
    else if (nm < 701) f = 1;
    else if (nm <= 780) f = 0.3 + (0.7 * (780 - nm)) / 80;
    return [r * f, g * f, b * f];
  }
  const rgbCss = (c, a = 1) => `rgba(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)},${a})`;
  function brighten(c) {
    const m = Math.max(c[0], c[1], c[2], 0.001);
    return c.map((v) => Math.min(1, (v / m) * 0.92 + 0.08));
  }

  /* ---------------- DOM helpers ---------------- */
  function h(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function slider(parent, o) {
    const row = h("label", "ctl");
    const head = h("span", "ctl-head");
    const out = h("output", "ctl-val");
    head.append(h("span", "ctl-name", o.label), out);
    const inp = document.createElement("input");
    inp.type = "range";
    inp.min = o.min;
    inp.max = o.max;
    inp.step = o.step;
    inp.value = o.value;
    inp.setAttribute("aria-label", o.label.replace(/<[^>]+>/g, ""));
    row.append(head, inp);
    parent.append(row);
    const api = {
      row,
      inp,
      get v() {
        return parseFloat(inp.value);
      },
      set(v, fire = true) {
        inp.value = v;
        show();
        if (fire && o.on) o.on(api.v);
      },
      range(min, max, step) {
        inp.min = min;
        inp.max = max;
        if (step != null) inp.step = step;
      },
      refresh: () => show(),
      hide(b) {
        row.hidden = b;
      },
      disable(b) {
        inp.disabled = b;
      },
    };
    function show() {
      out.innerHTML = o.fmt ? o.fmt(api.v) : String(api.v);
    }
    inp.addEventListener("input", () => {
      show();
      if (o.on) o.on(api.v);
    });
    show();
    return api;
  }
  function seg(parent, o) {
    const wrap = h("div");
    if (o.label) wrap.append(h("div", "seg-label", o.label));
    const box = h("div", "seg");
    box.setAttribute("role", "group");
    let cur = String(o.value);
    const btns = o.options.map(([v, l]) => {
      const b = h("button", "", l);
      b.type = "button";
      b.dataset.v = v;
      box.append(b);
      return b;
    });
    const paint = () => btns.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === cur)));
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        cur = b.dataset.v;
        paint();
        if (o.on) o.on(cur);
      })
    );
    paint();
    wrap.append(box);
    parent.append(wrap);
    return { wrap, get v() { return cur; } };
  }
  function buttons(parent, list) {
    const row = h("div", "btn-row");
    const map = {};
    list.forEach((b) => {
      const e = h("button", "", b.label);
      e.type = "button";
      e.addEventListener("click", b.on);
      row.append(e);
      if (b.id) map[b.id] = e;
    });
    parent.append(row);
    map.row = row;
    return map;
  }
  function check(parent, label, value, on) {
    const l = h("label", "check-row");
    const i = document.createElement("input");
    i.type = "checkbox";
    i.checked = value;
    i.addEventListener("change", () => on(i.checked));
    l.append(i, document.createTextNode(label));
    parent.append(l);
    return { el: l, input: i };
  }
  function readouts(dl, defs) {
    const map = {};
    const cache = {};
    defs.forEach(([k, label, wide]) => {
      const row = h("div", "ro" + (wide ? " wide" : ""));
      const dd = h("dd");
      row.append(h("dt", "", label), dd);
      dl.append(row);
      map[k] = { row, dd };
    });
    return {
      set(k, v) {
        if (cache[k] !== v) {
          cache[k] = v;
          map[k].dd.innerHTML = v;
        }
      },
      show(k, b) {
        map[k].row.hidden = !b;
      },
    };
  }

  /* ---------------- canvas helpers ---------------- */
  const allCanvases = [];
  function makeCanvas(box, hf) {
    const c = document.createElement("canvas");
    box.append(c);
    const ctx = c.getContext("2d");
    const s = { c, ctx, w: 0, h: 0, dpr: 1, dirty: true };
    s.resize = () => {
      const w = Math.floor(box.clientWidth - 16);
      if (w <= 0 || w === s.w) return;
      const hh = Math.round(hf(w));
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      c.width = Math.round(w * dpr);
      c.height = Math.round(hh * dpr);
      c.style.width = w + "px";
      c.style.height = hh + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      s.w = w;
      s.h = hh;
      s.dpr = dpr;
      s.dirty = true;
    };
    new ResizeObserver(s.resize).observe(box);
    s.resize();
    allCanvases.push(s);
    return s;
  }
  function line(ctx, x1, y1, x2, y2, col, w = 1, dash) {
    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }
  function arrow(ctx, x1, y1, x2, y2, col, w = 1.6, hd = 7) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L = Math.hypot(dx, dy);
    if (L < 1.5) return;
    const ux = dx / L;
    const uy = dy / L;
    const hl = Math.min(hd, L * 0.6);
    ctx.save();
    ctx.strokeStyle = col;
    ctx.fillStyle = col;
    ctx.lineWidth = w;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - ux * hl * 0.7, y2 - uy * hl * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - ux * hl - uy * hl * 0.48, y2 - uy * hl + ux * hl * 0.48);
    ctx.lineTo(x2 - ux * hl + uy * hl * 0.48, y2 - uy * hl - ux * hl * 0.48);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  function dblArrow(ctx, x, y, angFromVertical, half, col, w = 1.6) {
    const dx = Math.sin(angFromVertical) * half;
    const dy = -Math.cos(angFromVertical) * half;
    arrow(ctx, x, y, x + dx, y + dy, col, w, 5);
    arrow(ctx, x, y, x - dx, y - dy, col, w, 5);
  }
  function txt(ctx, s, x, y, o = {}) {
    ctx.save();
    ctx.fillStyle = o.color || COL.ink2;
    ctx.font = `${o.weight || 400} ${o.size || 12}px ${FONT[o.font || "mono"]}`;
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.base || "middle";
    ctx.fillText(s, x, y);
    ctx.restore();
  }
  function tw(ctx, s, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 400} ${o.size || 12}px ${FONT[o.font || "mono"]}`;
    const w = ctx.measureText(s).width;
    ctx.restore();
    return w;
  }
  function dot(ctx, x, y, r, col, stroke) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    if (stroke) {
      ctx.strokeStyle = col;
      ctx.lineWidth = stroke;
      ctx.stroke();
    } else {
      ctx.fillStyle = col;
      ctx.fill();
    }
    ctx.restore();
  }
  function path(ctx, pts, col, w = 1.5, dash, alpha = 1) {
    if (pts.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.lineJoin = "round";
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
    ctx.restore();
  }
  function plot(x, y, w, hh, x0, x1, y0, y1) {
    return {
      x, y, w, h: hh, x0, x1, y0, y1,
      X: (v) => x + ((v - x0) / (x1 - x0)) * w,
      Y: (v) => y + hh - ((v - y0) / (y1 - y0)) * hh,
    };
  }
  function axes(ctx, P, o = {}) {
    const yz = P.Y(o.yZero != null ? o.yZero : 0);
    arrow(ctx, P.x, yz, P.x + P.w + 12, yz, COL.axis, 1, 6);
    arrow(ctx, P.x, P.y + P.h + 4, P.x, P.y - 10, COL.axis, 1, 6);
    if (o.xl) txt(ctx, o.xl, P.x + P.w + 12, yz + 14, { align: "right", size: 11 });
    if (o.yl) txt(ctx, o.yl, P.x + 9, P.y - 6, { size: 11 });
  }
  function sample(P, f, step = 1) {
    const pts = [];
    for (let px = 0; px <= P.w; px += step) {
      const v = P.x0 + ((P.x1 - P.x0) * px) / P.w;
      pts.push([P.x + px, P.Y(f(v))]);
    }
    return pts;
  }
  function niceStep(raw) {
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  /* =========================================================
     Lab 1 · 旋转矢量 ↔ 简谐振动
     ========================================================= */
  function labShm(ui) {
    const st = { A: 3, w: 1.2, k: 4, t: 0, play: true, speed: 1, q: null };
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 520 : 470));
    const sA = slider(ui.controls, { label: "振幅 A", min: 1, max: 4, step: 0.5, value: st.A, fmt: (v) => `${v.toFixed(1)} cm`, on: (v) => (st.A = v) });
    const sW = slider(ui.controls, { label: "角频率 ω", min: 0.4, max: 3, step: 0.1, value: st.w, fmt: (v) => `${v.toFixed(1)} rad/s`, on: (v) => (st.w = v) });
    const sP = slider(ui.controls, { label: "初相 φ", min: -12, max: 12, step: 1, value: st.k, fmt: fmtPi, on: (v) => (st.k = v) });
    slider(ui.controls, { label: "播放速度", min: 0.25, max: 2, step: 0.25, value: 1, fmt: (v) => `${v}×`, on: (v) => (st.speed = v) });
    const b = buttons(ui.controls, [
      { label: "暂停", id: "play", on: () => { st.play = !st.play; paint(); } },
      { label: "回到 t = 0", on: () => { st.t = 0; } },
    ]);
    const paint = () => (b.play.textContent = st.play ? "暂停" : "播放");

    const Q = [
      { d: "x₀ = A", k: 0 }, { d: "x₀ = −A", k: 12 },
      { d: "x₀ = 0，向 x 正方向运动", k: -6 }, { d: "x₀ = 0，向 x 负方向运动", k: 6 },
      { d: "x₀ = A/2，向 x 正方向运动", k: -4 }, { d: "x₀ = A/2，向 x 负方向运动", k: 4 },
      { d: "x₀ = −A/2，向 x 正方向运动", k: -8 }, { d: "x₀ = −A/2，向 x 负方向运动", k: 8 },
      { d: "x₀ = √2A/2，向 x 负方向运动", k: 3 }, { d: "x₀ = −√3A/2，向 x 正方向运动", k: -10 },
    ];
    const box = h("div", "challenge");
    box.innerHTML = `<h5>初相挑战</h5><p class="q">随机给出 t = 0 时的状态，用「初相 φ」滑块把旋转矢量摆到正确位置。</p>
      <div class="btn-row"><button type="button" data-a="new">出一道题</button><button type="button" data-a="check">检查</button><button type="button" data-a="ans">看答案</button></div>
      <p class="fb"></p>`;
    ui.controls.append(box);
    const qEl = box.querySelector(".q");
    const fb = box.querySelector(".fb");
    box.addEventListener("click", (e) => {
      const a = e.target.dataset && e.target.dataset.a;
      if (!a) return;
      if (a === "new") {
        let next;
        do next = Q[Math.floor(Math.random() * Q.length)]; while (st.q && next === st.q && Q.length > 1);
        st.q = next;
        st.t = 0;
        st.play = false;
        paint();
        qEl.innerHTML = `t = 0 时：<b>${next.d}</b>。初相 φ 是多少？`;
        fb.className = "fb";
        fb.textContent = "旋转矢量逆时针转。先看投影位置，再看运动方向。";
        return;
      }
      if (!st.q) {
        fb.className = "fb";
        fb.textContent = "先点「出一道题」。";
        return;
      }
      if (a === "ans") {
        sP.set(st.q.k);
        st.t = 0;
        fb.className = "fb ok";
        fb.textContent = `答案：φ = ${fmtPi(st.q.k)}（取值范围 −π < φ ≤ π）。`;
        return;
      }
      const u = st.k;
      const ok = (((u - st.q.k) % 24) + 24) % 24 === 0;
      if (ok) {
        fb.className = "fb ok";
        fb.textContent = `正确：φ = ${fmtPi(st.q.k)}。点播放看看它之后怎么运动。`;
        return;
      }
      const cu = Math.cos((u * PI) / 12), ca = Math.cos((st.q.k * PI) / 12);
      const su = Math.sin((u * PI) / 12), sa = Math.sin((st.q.k * PI) / 12);
      const sameX = Math.abs(cu - ca) < 1e-6;
      const sameDir = Math.sign(Math.round(su * 1e6)) === Math.sign(Math.round(sa * 1e6));
      fb.className = "fb no";
      fb.textContent = sameX
        ? "投影位置对了，运动方向反了。矢量逆时针转：端点在 x 轴上方时，投影往哪边走？"
        : sameDir
          ? "运动方向对了，投影位置不对。用 x₀ = A cos φ 再算一次。"
          : "投影位置和运动方向都不对。先由 x₀ = A cos φ 找两个候选角，再用速度方向排除一个。";
    });

    const R = readouts(ui.readouts, [
      ["ph", "相位 ωt + φ"], ["x", "位移 x"], ["v", "速度 v"], ["a", "加速度 a"], ["T", "周期 T = 2π/ω"],
    ]);

    function draw() {
      const { ctx, w: W, h: H } = S;
      ctx.clearRect(0, 0, W, H);
      const wide = W >= 620;
      const LW = wide ? Math.min(W * 0.5, 440) : W;
      const Rmax = Math.min(LW / 2 - (wide ? 46 : 80), 118);
      const cx = LW / 2;
      const cy = Rmax + 44;
      const ppc = Rmax / 4;
      const A = st.A;
      const phi = (st.k * PI) / 12;
      const th = st.w * st.t + phi;
      const T = TAU / st.w;
      const x = A * Math.cos(th);
      const v = -A * st.w * Math.sin(th);
      const a = -st.w * st.w * x;
      const Rr = A * ppc;

      // 参考圆与 x 轴
      ctx.save();
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(236,231,220,0.28)";
      ctx.beginPath();
      ctx.arc(cx, cy, Rr, 0, TAU);
      ctx.stroke();
      ctx.restore();
      arrow(ctx, cx - Rmax - 26, cy, cx + Rmax + 34, cy, COL.axis, 1, 6);
      txt(ctx, "x", cx + Rmax + 32, cy + 15, { align: "right", size: 12 });
      txt(ctx, "O", cx - 12, cy + 14, { size: 11, color: COL.muted });
      txt(ctx, "逆时针旋转，角速度 ω", cx, cy - Rmax - 22, { size: 11, color: COL.osc, font: "sans", align: "center" });

      // 相位角弧
      const tm = ((th % TAU) + TAU) % TAU;
      if (tm > 0.02) {
        ctx.save();
        ctx.strokeStyle = "rgba(242,179,61,0.6)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, -tm, true);
        ctx.stroke();
        ctx.restore();
      }

      // 旋转矢量与投影
      const tx = cx + Rr * Math.cos(th);
      const ty = cy - Rr * Math.sin(th);
      const recTop = cy + Rmax + 30;
      const recBot = H - 26;
      line(ctx, tx, ty, tx, cy, "rgba(242,179,61,0.75)", 1, [4, 4]);
      line(ctx, tx, cy, tx, recTop, "rgba(242,179,61,0.3)", 1, [2, 4]);
      arrow(ctx, cx, cy, tx, ty, COL.osc, 2.6, 10);
      txt(ctx, "A", cx + (Rr + 15) * Math.cos(th), cy - (Rr + 15) * Math.sin(th), { align: "center", size: 12, color: COL.osc, weight: 500 });
      const lv = (50 * v) / (A * st.w);
      const la = (50 * a) / (A * st.w * st.w);
      if (Math.abs(lv) > 3) {
        arrow(ctx, tx, cy - 16, tx + lv, cy - 16, COL.wave, 2, 7);
        txt(ctx, "v", tx + lv + Math.sign(lv) * 9, cy - 16, { align: "center", color: COL.wave, size: 12 });
      }
      if (Math.abs(la) > 3) {
        arrow(ctx, tx, cy + 17, tx + la, cy + 17, COL.optics, 2, 7);
        txt(ctx, "a", tx + la + Math.sign(la) * 9, cy + 17, { align: "center", color: COL.optics, size: 12 });
      }
      dot(ctx, tx, cy, 4.5, COL.ink);

      // 记录纸：x–t（时间轴向下）
      const pps = (recBot - recTop) / (2 * T);
      line(ctx, cx - Rr, recTop, cx - Rr, recBot, "rgba(236,231,220,0.1)", 1, [3, 5]);
      line(ctx, cx + Rr, recTop, cx + Rr, recBot, "rgba(236,231,220,0.1)", 1, [3, 5]);
      arrow(ctx, cx, recTop, cx, recBot + 10, COL.axis, 1, 6);
      txt(ctx, "t", cx + 9, recBot + 6, { size: 12 });
      txt(ctx, "x–t 曲线", 12, recTop + 8, { size: 11, color: COL.ink2, font: "sans" });
      txt(ctx, "时间轴向下", 12, recTop + 26, { size: 11, color: COL.muted, font: "sans" });
      const pts = [];
      for (let j = 0; j <= recBot - recTop; j += 2) {
        const tp = st.t - j / pps;
        if (tp < 0) break;
        pts.push([cx + A * Math.cos(st.w * tp + phi) * ppc, recTop + j]);
      }
      path(ctx, pts, COL.osc, 2);
      const j0 = st.t * pps;
      if (j0 <= recBot - recTop) {
        const x0p = cx + A * Math.cos(phi) * ppc;
        dot(ctx, x0p, recTop + j0, 3.5, COL.ink);
        txt(ctx, "t = 0", x0p + 8, recTop + j0, { size: 11, color: COL.ink2 });
      }
      dot(ctx, tx, recTop, 3.5, COL.osc);

      // 右侧 x、v、a 曲线
      if (wide) {
        const px0 = LW + 56;
        const pw = W - px0 - 30;
        const ph = (H - 76) / 3 - 18;
        const tc = st.t % (2 * T);
        const rows = [
          ["x = A cos(ωt + φ)", COL.osc, (t) => Math.cos(st.w * t + phi)],
          ["v：相位比 x 超前 π/2", COL.wave, (t) => -Math.sin(st.w * t + phi)],
          ["a = −ω²x：与 x 反相", COL.optics, (t) => -Math.cos(st.w * t + phi)],
        ];
        let lastP = null;
        rows.forEach(([label, col, f], i) => {
          const py = 40 + i * (ph + 24);
          const P = plot(px0, py, pw, ph, 0, 2 * T, -1.2, 1.2);
          for (let q = 1; q <= 4; q++) line(ctx, P.X((q * T) / 2), P.y, P.X((q * T) / 2), P.y + P.h, COL.grid, 1);
          axes(ctx, P, { xl: "t" });
          txt(ctx, label, px0 + 12, py - 7, { size: 11, color: col, font: "sans" });
          path(ctx, sample(P, f, 2), col, 1.4, null, 0.28);
          const prog = [];
          for (let px = 0; px <= P.X(tc) - P.x; px += 2) prog.push([P.x + px, P.Y(f((px / P.w) * 2 * T))]);
          path(ctx, prog, col, 2);
          dot(ctx, P.X(tc), P.Y(f(tc)), 4, col);
          lastP = P;
        });
        if (lastP) {
          const xc = lastP.X(tc);
          line(ctx, xc, 32, xc, lastP.y + lastP.h + 2, "rgba(236,231,220,0.22)", 1, [3, 4]);
          ["T/2", "T", "3T/2", "2T"].forEach((s, q) => txt(ctx, s, lastP.X(((q + 1) * T) / 2), lastP.y + lastP.h + 14, { align: "center", size: 11, color: COL.muted }));
        }
      }

      R.set("ph", fmtPhase(th));
      R.set("x", `${num(x)} cm`);
      R.set("v", `${num(v)} cm/s`);
      R.set("a", `${num(a)} cm/s²`);
      R.set("T", `${num(T)} s`);
    }
    return {
      frame(dt) {
        if (st.play) st.t += dt * st.speed;
        draw();
      },
    };
  }

  /* =========================================================
     Lab 2 · 振动合成与拍
     ========================================================= */
  function labSuperpose(ui) {
    const st = { mode: "same", A1: 3, A2: 2, k1: 0, k2: 4, t: 0, n1: 8, n2: 9, play: true };
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 520 : 400));
    seg(ui.controls, { options: [["same", "同频合成"], ["beat", "拍"]], value: "same", on: (v) => { st.mode = v; st.t = 0; layout(); } });
    const gS = h("div", "lab-controls");
    const gB = h("div", "lab-controls");
    ui.controls.append(gS, gB);
    slider(gS, { label: "A₁", min: 0.5, max: 3, step: 0.5, value: st.A1, fmt: (v) => `${v.toFixed(1)} cm`, on: (v) => (st.A1 = v) });
    slider(gS, { label: "A₂", min: 0.5, max: 3, step: 0.5, value: st.A2, fmt: (v) => `${v.toFixed(1)} cm`, on: (v) => (st.A2 = v) });
    slider(gS, { label: "φ₁", min: -12, max: 12, step: 1, value: st.k1, fmt: fmtPi, on: (v) => (st.k1 = v) });
    slider(gS, { label: "φ₂", min: -12, max: 12, step: 1, value: st.k2, fmt: fmtPi, on: (v) => (st.k2 = v) });
    slider(gB, { label: "ν₁", min: 6, max: 12, step: 0.1, value: st.n1, fmt: (v) => `${v.toFixed(1)} Hz`, on: (v) => (st.n1 = v) });
    slider(gB, { label: "ν₂", min: 6, max: 12, step: 0.1, value: st.n2, fmt: (v) => `${v.toFixed(1)} Hz`, on: (v) => (st.n2 = v) });
    const b = buttons(ui.controls, [{ label: "暂停", id: "play", on: () => { st.play = !st.play; b.play.textContent = st.play ? "暂停" : "播放"; } }]);
    const R = readouts(ui.readouts, [
      ["dphi", "相位差 φ₂ − φ₁"], ["A", "合振幅 A"], ["phi", "合振动初相 φ"], ["case", "情况", true],
      ["nb", "拍频 |ν₂ − ν₁|"], ["Tb", "拍的周期"], ["nm", "合振动频率"],
    ]);
    function layout() {
      gS.hidden = st.mode !== "same";
      gB.hidden = st.mode !== "beat";
      ["dphi", "A", "phi", "case"].forEach((k) => R.show(k, st.mode === "same"));
      ["nb", "Tb", "nm"].forEach((k) => R.show(k, st.mode === "beat"));
    }
    layout();

    function drawSame() {
      const { ctx, w: W, h: H } = S;
      const wide = W >= 620;
      const LW = wide ? Math.min(W * 0.42, 360) : W;
      const areaH = wide ? H : 250;
      const cx = LW / 2;
      const cy = areaH / 2 + 4;
      const Rm = Math.min(LW / 2 - 34, areaH / 2 - 34);
      const ppu = Rm / 6.2;
      const p1 = (st.k1 * PI) / 12;
      const p2 = (st.k2 * PI) / 12;
      const th = st.t;
      const a1 = th + p1;
      const a2 = th + p2;
      const X1 = cx + st.A1 * ppu * Math.cos(a1), Y1 = cy - st.A1 * ppu * Math.sin(a1);
      const dx2 = st.A2 * ppu * Math.cos(a2), dy2 = -st.A2 * ppu * Math.sin(a2);
      const XR = X1 + dx2, YR = Y1 + dy2;
      arrow(ctx, cx - Rm - 10, cy, cx + Rm + 18, cy, COL.axis, 1, 6);
      txt(ctx, "x", cx + Rm + 16, cy + 15, { align: "right" });
      txt(ctx, "O", cx - 12, cy + 14, { size: 11, color: COL.muted });
      line(ctx, cx, cy, cx + dx2, cy + dy2, "rgba(63,208,201,0.35)", 1.2, [4, 4]);
      line(ctx, cx + dx2, cy + dy2, XR, YR, "rgba(242,179,61,0.35)", 1.2, [4, 4]);
      arrow(ctx, cx, cy, X1, Y1, COL.osc, 2.4, 9);
      arrow(ctx, X1, Y1, XR, YR, COL.wave, 2.4, 9);
      arrow(ctx, cx, cy, XR, YR, COL.ink, 3, 11);
      txt(ctx, "A₁", (cx + X1) / 2 - 10, (cy + Y1) / 2 - 10, { color: COL.osc, size: 12, align: "center" });
      txt(ctx, "A₂", (X1 + XR) / 2 + 10, (Y1 + YR) / 2 - 10, { color: COL.wave, size: 12, align: "center" });
      txt(ctx, "A", XR + 12 * Math.sign(XR - cx || 1), YR - 10, { color: COL.ink, size: 13, align: "center", weight: 500 });
      line(ctx, XR, YR, XR, cy, "rgba(236,231,220,0.35)", 1, [2, 3]);
      dot(ctx, XR, cy, 3.5, COL.ink);

      const P = wide
        ? plot(LW + 50, 46, W - LW - 84, H - 92, 0, 2 * TAU, -7.4, 7.4)
        : plot(44, areaH + 40, W - 80, H - areaH - 70, 0, 2 * TAU, -7.4, 7.4);
      [TAU / 2, TAU, 1.5 * TAU, 2 * TAU].forEach((q) => line(ctx, P.X(q), P.y, P.X(q), P.y + P.h, COL.grid, 1));
      axes(ctx, P, { xl: "t", yl: "x / cm" });
      const f1 = (t) => st.A1 * Math.cos(t + p1);
      const f2 = (t) => st.A2 * Math.cos(t + p2);
      path(ctx, sample(P, f1, 2), COL.osc, 1.4, null, 0.75);
      path(ctx, sample(P, f2, 2), COL.wave, 1.4, null, 0.75);
      path(ctx, sample(P, (t) => f1(t) + f2(t), 2), COL.ink, 2.6);
      const tc = st.t % (2 * TAU);
      line(ctx, P.X(tc), P.y, P.X(tc), P.y + P.h, "rgba(236,231,220,0.25)", 1, [3, 4]);
      dot(ctx, P.X(tc), P.Y(f1(tc) + f2(tc)), 4, COL.ink);
      ["T/2", "T", "3T/2", "2T"].forEach((s, q) => txt(ctx, s, P.X(((q + 1) * TAU) / 2), P.y + P.h + 14, { align: "center", size: 11, color: COL.muted }));
      const lg = [["x₁", COL.osc], ["x₂", COL.wave], ["x = x₁ + x₂", COL.ink]];
      let lx = P.x + 70;
      lg.forEach(([s, c]) => {
        line(ctx, lx, P.y - 8, lx + 16, P.y - 8, c, 2);
        txt(ctx, s, lx + 22, P.y - 8, { size: 11, color: c });
        lx += 30 + tw(ctx, s, { size: 11 });
      });

      let dk = (((st.k2 - st.k1) % 24) + 24) % 24;
      if (dk > 12) dk -= 24;
      const dphi = (dk * PI) / 12;
      const A = Math.sqrt(st.A1 ** 2 + st.A2 ** 2 + 2 * st.A1 * st.A2 * Math.cos(dphi));
      const phi = Math.atan2(st.A1 * Math.sin(p1) + st.A2 * Math.sin(p2), st.A1 * Math.cos(p1) + st.A2 * Math.cos(p2));
      R.set("dphi", fmtPi(dk));
      R.set("A", `${num(A)} cm`);
      R.set("phi", A < 1e-9 ? "无意义（A = 0）" : fmtPhase(phi));
      R.set(
        "case",
        dk === 0
          ? "同相：A = A₁ + A₂，最大"
          : Math.abs(dk) === 12
            ? "反相：A = |A₁ − A₂|，最小"
            : Math.abs(dk) === 6
              ? "相位差 π/2：A = √(A₁² + A₂²)"
              : "一般情况：|A₁ − A₂| < A < A₁ + A₂"
      );
    }

    function drawBeat() {
      const { ctx, w: W, h: H } = S;
      const P = plot(48, 46, W - 92, H - 96, 0, 2, -2.5, 2.5);
      for (let q = 0.25; q <= 2; q += 0.25) line(ctx, P.X(q), P.y, P.X(q), P.y + P.h, COL.grid, 1);
      axes(ctx, P, { xl: "t / s", yl: "x" });
      const dn = st.n2 - st.n1;
      const env = (t) => 2 * Math.abs(Math.cos(PI * dn * t));
      path(ctx, sample(P, env, 2), COL.optics, 1.4, [5, 4]);
      path(ctx, sample(P, (t) => -env(t), 2), COL.optics, 1.4, [5, 4]);
      const f = (t) => Math.cos(TAU * st.n1 * t) + Math.cos(TAU * st.n2 * t);
      path(ctx, sample(P, f, 0.5), COL.wave, 1.4);
      const tc = st.t % 2;
      line(ctx, P.X(tc), P.y, P.X(tc), P.y + P.h, "rgba(236,231,220,0.25)", 1, [3, 4]);
      dot(ctx, P.X(tc), P.Y(f(tc)), 4, COL.ink);
      [0.5, 1, 1.5, 2].forEach((q) => txt(ctx, q.toFixed(1), P.X(q), P.y + P.h + 14, { align: "center", size: 11, color: COL.muted }));
      line(ctx, P.x + 40, P.y - 8, P.x + 56, P.y - 8, COL.wave, 2);
      txt(ctx, "x = x₁ + x₂", P.x + 62, P.y - 8, { size: 11, color: COL.wave });
      line(ctx, P.x + 162, P.y - 8, P.x + 178, P.y - 8, COL.optics, 2, [4, 3]);
      txt(ctx, "包络 ±2|cos(πΔν·t)|", P.x + 184, P.y - 8, { size: 11, color: COL.optics });
      const nb = Math.abs(dn);
      R.set("nb", nb < 1e-9 ? "0（同频，无拍）" : `${num(nb, 1)} Hz`);
      R.set("Tb", nb < 1e-9 ? "—" : `${num(1 / nb, 2)} s`);
      R.set("nm", `${num((st.n1 + st.n2) / 2, 2)} Hz`);
    }

    return {
      frame(dt) {
        if (st.play) st.t += dt * (st.mode === "beat" ? 0.12 : 0.9);
        S.ctx.clearRect(0, 0, S.w, S.h);
        if (st.mode === "same") drawSame();
        else drawBeat();
      },
    };
  }

  /* =========================================================
     Lab 3 · 平面简谐波：波形图 vs 振动图
     ========================================================= */
  function labWave(ui) {
    const st = { A: 2, lam: 2, T: 2, dir: 1, k: 0, xP: 1.5, t: 0, play: true, speed: 1 };
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 470 : 460));
    seg(ui.controls, { options: [["1", "沿 +x 传播"], ["-1", "沿 −x 传播"]], value: "1", on: (v) => (st.dir = +v) });
    slider(ui.controls, { label: "振幅 A", min: 1, max: 3, step: 0.5, value: st.A, fmt: (v) => `${v.toFixed(1)} cm`, on: (v) => (st.A = v) });
    slider(ui.controls, { label: "波长 λ", min: 1, max: 4, step: 0.5, value: st.lam, fmt: (v) => `${v.toFixed(1)} m`, on: (v) => (st.lam = v) });
    slider(ui.controls, { label: "周期 T", min: 1, max: 4, step: 0.5, value: st.T, fmt: (v) => `${v.toFixed(1)} s`, on: (v) => (st.T = v) });
    slider(ui.controls, { label: "原点初相 φ", min: -12, max: 12, step: 1, value: st.k, fmt: fmtPi, on: (v) => (st.k = v) });
    slider(ui.controls, { label: "质点 P 的位置", min: 0, max: 8, step: 0.25, value: st.xP, fmt: (v) => `x = ${v.toFixed(2)} m`, on: (v) => (st.xP = v) });
    const b = buttons(ui.controls, [
      { label: "◀ T/8", on: () => { st.play = false; st.t = Math.max(0, st.t - st.T / 8); paint(); } },
      { label: "暂停", id: "play", on: () => { st.play = !st.play; paint(); } },
      { label: "T/8 ▶", on: () => { st.play = false; st.t += st.T / 8; paint(); } },
    ]);
    const paint = () => (b.play.textContent = st.play ? "暂停" : "播放");
    const R = readouts(ui.readouts, [
      ["fn", "波函数（y: cm，x: m，t: s）", true], ["u", "波速 u = λ/T"], ["pe", "P 点振动方程", true], ["vp", "P 点此刻的振动速度"], ["t", "时刻 t"],
    ]);

    function draw() {
      const { ctx, w: W, h: H } = S;
      ctx.clearRect(0, 0, W, H);
      const wide = W >= 620;
      const padL = 50, padR = 34;
      const top1 = 56;
      const h1 = (H - top1 - 96) / 2;
      const P1 = plot(padL, top1, W - padL - padR, h1, 0, 8, -3.6, 3.6);
      const top2 = top1 + h1 + 76;
      const P2 = plot(padL, top2, W - padL - padR, H - top2 - 30, 0, 2 * st.T, -3.6, 3.6);
      const phi0 = (st.k * PI) / 12;
      const ph = (x, t) => TAU * (t / st.T - (st.dir * x) / st.lam) + phi0;
      const y = (x, t) => st.A * Math.cos(ph(x, t));
      const vy = (x, t) => -st.A * (TAU / st.T) * Math.sin(ph(x, t));

      // 上：波形图
      txt(ctx, "波形图 y–x", padL, top1 - 34, { size: 13, color: COL.ink, font: "sans", weight: 500 });
      if (wide) txt(ctx, `同一时刻（t = ${st.t.toFixed(2)} s）所有质点的位置`, padL + 88, top1 - 34, { size: 12, color: COL.muted, font: "sans" });
      const u = st.lam / st.T;
      const ax = W - padR - (wide ? 150 : 110);
      const ay = top1 - 34;
      if (st.dir > 0) arrow(ctx, ax, ay, ax + 46, ay, COL.wave, 1.8, 7);
      else arrow(ctx, ax + 46, ay, ax, ay, COL.wave, 1.8, 7);
      txt(ctx, `u = ${u.toFixed(2)} m/s`, ax + 54, ay, { size: 12, color: COL.wave });
      for (let q = 1; q <= 8; q++) line(ctx, P1.X(q), P1.y, P1.X(q), P1.y + P1.h, COL.grid, 1);
      axes(ctx, P1, { xl: "x / m", yl: "y / cm" });
      for (let q = 0; q <= 8; q += 1) txt(ctx, String(q), P1.X(q), P1.y + P1.h + 12, { align: "center", size: 10.5, color: COL.muted });
      path(ctx, sample(P1, (x) => y(x, st.t), 1), COL.wave, 2.2);
      for (let x = 0; x <= 8.0001; x += 0.25) dot(ctx, P1.X(x), P1.Y(y(x, st.t)), 2.4, "rgba(236,231,220,0.7)");
      const XP = P1.X(st.xP);
      line(ctx, XP, P1.y, XP, P1.y + P1.h, "rgba(242,179,61,0.35)", 1, [3, 4]);
      const yP = y(st.xP, st.t);
      const vP = vy(st.xP, st.t);
      const vmax = st.A * (TAU / st.T);
      const lv = (-32 * vP) / vmax;
      if (Math.abs(lv) > 3) {
        arrow(ctx, XP + 12, P1.Y(yP), XP + 12, P1.Y(yP) + lv, COL.optics, 2, 7);
        txt(ctx, "v", XP + 22, P1.Y(yP) + lv / 2, { size: 12, color: COL.optics });
      }
      dot(ctx, XP, P1.Y(yP), 5.5, COL.osc);
      txt(ctx, "P", XP - 12, P1.Y(yP) - 10, { size: 12, color: COL.osc, weight: 500 });

      // 下：P 的振动图
      txt(ctx, "振动图 y–t", padL, top2 - 34, { size: 13, color: COL.ink, font: "sans", weight: 500 });
      if (wide) txt(ctx, `同一个质点 P（x = ${st.xP.toFixed(2)} m）在各个时刻的位置`, padL + 88, top2 - 34, { size: 12, color: COL.muted, font: "sans" });
      for (let q = 1; q <= 4; q++) line(ctx, P2.X((q * st.T) / 2), P2.y, P2.X((q * st.T) / 2), P2.y + P2.h, COL.grid, 1);
      axes(ctx, P2, { xl: "t / s", yl: "y / cm" });
      for (let q = 1; q <= 4; q++) txt(ctx, ((q * st.T) / 2).toFixed(1), P2.X((q * st.T) / 2), P2.y + P2.h + 12, { align: "center", size: 10.5, color: COL.muted });
      const fP = (t) => y(st.xP, t);
      path(ctx, sample(P2, fP, 2), COL.osc, 1.4, null, 0.3);
      const tc = st.t % (2 * st.T);
      const prog = [];
      for (let px = 0; px <= P2.X(tc) - P2.x; px += 1.5) prog.push([P2.x + px, P2.Y(fP((px / P2.w) * 2 * st.T))]);
      path(ctx, prog, COL.osc, 2.2);
      line(ctx, P2.X(tc), P2.y, P2.X(tc), P2.y + P2.h, "rgba(236,231,220,0.25)", 1, [3, 4]);
      dot(ctx, P2.X(tc), P2.Y(fP(tc)), 5, COL.osc);

      const sgn = st.dir > 0 ? "−" : "+";
      R.set("fn", `y = ${st.A.toFixed(1)} cos[2π(t/${st.T.toFixed(1)} ${sgn} x/${st.lam.toFixed(1)}) + ${fmtPi(st.k)}]`);
      R.set("u", `${u.toFixed(2)} m/s`);
      R.set("pe", `y<sub>P</sub> = ${st.A.toFixed(1)} cos(2πt/${st.T.toFixed(1)} + ${fmtPhase(phi0 - (st.dir * TAU * st.xP) / st.lam)})`);
      R.set("vp", `${num(vP)} cm/s`);
      R.set("t", `${st.t.toFixed(2)} s`);
    }
    return {
      frame(dt) {
        if (st.play) st.t += dt * st.speed;
        draw();
      },
    };
  }

  /* =========================================================
     Lab 4 · 驻波与半波损失
     ========================================================= */
  function labStanding(ui) {
    const st = { lam: 2.4, end: "fixed", comps: true, t: 0, play: true, speed: 0.6 };
    const L = 6;
    const T = 2;
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 360 : 380));
    seg(ui.controls, { label: "反射端", options: [["fixed", "固定端（波密）"], ["free", "自由端（波疏）"]], value: "fixed", on: (v) => (st.end = v) });
    slider(ui.controls, { label: "波长 λ", min: 0.8, max: 6, step: 0.1, value: st.lam, fmt: (v) => `${v.toFixed(1)} m`, on: (v) => (st.lam = v) });
    slider(ui.controls, { label: "播放速度", min: 0.2, max: 1.5, step: 0.1, value: st.speed, fmt: (v) => `${v.toFixed(1)}×`, on: (v) => (st.speed = v) });
    check(ui.controls, "显示入射波和反射波", true, (v) => (st.comps = v));
    const b = buttons(ui.controls, [{ label: "暂停", id: "play", on: () => { st.play = !st.play; b.play.textContent = st.play ? "暂停" : "播放"; } }]);
    const R = readouts(ui.readouts, [
      ["end", "反射点"], ["dn", "相邻波节间距 λ/2"], ["pos", "波节到反射端的距离"], ["eq", "驻波方程（x′ 从反射端量起）", true], ["n", "图中波节数"],
    ]);

    function draw() {
      const { ctx, w: W, h: H } = S;
      ctx.clearRect(0, 0, W, H);
      const P = plot(40, 44, W - 40 - 84, H - 120, 0, L, -2.5, 2.5);
      const k = TAU / st.lam;
      const w = TAU / T;
      const pr = st.end === "fixed" ? PI - 2 * k * L : -2 * k * L;
      const sp = (x) => Math.cos(k * x + pr / 2);
      for (let q = 1; q <= L; q++) line(ctx, P.X(q), P.y, P.X(q), P.y + P.h, COL.grid, 1);
      axes(ctx, P, { yl: "y" });
      for (let q = 0; q < L; q++) txt(ctx, String(q), P.X(q), P.y + P.h + 12, { align: "center", size: 10.5, color: COL.muted });
      txt(ctx, "x / m", P.x + P.w, P.y + P.h + 12, { align: "right", size: 10.5, color: COL.muted });

      path(ctx, sample(P, (x) => 2 * Math.abs(sp(x)), 2), "rgba(236,231,220,0.3)", 1, [3, 4]);
      path(ctx, sample(P, (x) => -2 * Math.abs(sp(x)), 2), "rgba(236,231,220,0.3)", 1, [3, 4]);
      const nodes = [];
      const anti = [];
      for (let n = -60; n <= 60; n++) {
        const xn = (PI / 2 + n * PI - pr / 2) / k;
        if (xn >= -1e-9 && xn <= L + 1e-9) nodes.push(xn);
        const xa = (n * PI - pr / 2) / k;
        if (xa >= -1e-9 && xa <= L + 1e-9) anti.push(xa);
      }
      nodes.forEach((x) => line(ctx, P.X(x), P.y, P.X(x), P.y + P.h, "rgba(255,111,145,0.16)", 1, [2, 4]));
      if (st.comps) {
        path(ctx, sample(P, (x) => Math.cos(w * st.t - k * x), 1.5), COL.osc, 1.3, null, 0.8);
        path(ctx, sample(P, (x) => Math.cos(w * st.t + k * x + pr), 1.5), COL.wave, 1.3, null, 0.8);
        arrow(ctx, P.x + 14, P.y + 2, P.x + 44, P.y + 2, COL.osc, 1.5, 6);
        txt(ctx, "入射", P.x + 50, P.y + 2, { size: 11, color: COL.osc, font: "sans" });
        arrow(ctx, P.x + 120, P.y + 2, P.x + 90, P.y + 2, COL.wave, 1.5, 6);
        txt(ctx, "反射", P.x + 126, P.y + 2, { size: 11, color: COL.wave, font: "sans" });
      }
      // 合成波：按空间因子正负着色
      const tf = Math.cos(w * st.t + pr / 2);
      let run = [];
      let sign = Math.sign(sp(0)) || 1;
      const flush = () => {
        path(ctx, run, sign > 0 ? COL.ink : COL.optics, 3);
      };
      for (let px = 0; px <= P.w; px += 1) {
        const x = (px / P.w) * L;
        const s = sp(x);
        const sg = Math.sign(s) || sign;
        const pt = [P.x + px, P.Y(2 * s * tf)];
        if (sg !== sign) {
          run.push(pt);
          flush();
          run = [pt];
          sign = sg;
        } else run.push(pt);
      }
      flush();
      // 节 / 腹 标记条
      const yb = P.y + P.h + 34;
      nodes.forEach((x) => dot(ctx, P.X(x), yb, 4.5, COL.optics, 1.6));
      anti.forEach((x) => {
        ctx.save();
        ctx.fillStyle = COL.ink;
        ctx.translate(P.X(x), yb);
        ctx.rotate(PI / 4);
        ctx.fillRect(-3.5, -3.5, 7, 7);
        ctx.restore();
      });
      dot(ctx, P.x + 4, yb + 22, 4, COL.optics, 1.5);
      txt(ctx, "波节", P.x + 14, yb + 22, { size: 11, font: "sans" });
      ctx.save();
      ctx.fillStyle = COL.ink;
      ctx.translate(P.x + 62, yb + 22);
      ctx.rotate(PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      txt(ctx, "波腹", P.x + 72, yb + 22, { size: 11, font: "sans" });
      line(ctx, P.x + 118, yb + 22, P.x + 134, yb + 22, COL.ink, 3);
      line(ctx, P.x + 136, yb + 22, P.x + 152, yb + 22, COL.optics, 3);
      txt(ctx, W >= 620 ? "合成波：同色段同相，相邻段反相" : "同色同相", P.x + 160, yb + 22, { size: 11, font: "sans" });

      // 反射端
      const xw = P.X(L);
      if (st.end === "fixed") {
        line(ctx, xw, P.y - 4, xw, P.y + P.h + 4, COL.ink, 2.5);
        for (let yy = P.y; yy < P.y + P.h; yy += 10) line(ctx, xw, yy + 8, xw + 9, yy, "rgba(236,231,220,0.5)", 1);
        txt(ctx, "固定端", xw + 14, P.y + 8, { size: 11, font: "sans", color: COL.ink });
        txt(ctx, "波密", xw + 14, P.y + 26, { size: 11, font: "sans", color: COL.muted });
      } else {
        line(ctx, xw, P.y - 4, xw, P.y + P.h + 4, "rgba(236,231,220,0.6)", 1.2, [4, 4]);
        txt(ctx, "自由端", xw + 10, P.y + 8, { size: 11, font: "sans", color: COL.ink });
        txt(ctx, "波疏", xw + 10, P.y + 26, { size: 11, font: "sans", color: COL.muted });
      }

      const fixed = st.end === "fixed";
      R.set("end", fixed ? "波节（有半波损失）" : "波腹（无半波损失）");
      R.set("dn", `${(st.lam / 2).toFixed(2)} m`);
      R.set("pos", fixed ? "0, λ/2, λ, 3λ/2 …" : "λ/4, 3λ/4, 5λ/4 …");
      R.set("eq", fixed ? "y = 2A sin(2πx′/λ) · cos(ωt + φ′)" : "y = 2A cos(2πx′/λ) · cos(ωt + φ′)");
      R.set("n", String(nodes.length));
    }
    return {
      frame(dt) {
        if (st.play) st.t += dt * st.speed;
        draw();
      },
    };
  }

  /* =========================================================
     Lab 5 · 双缝 / 单缝 / 光栅
     ========================================================= */
  function labDiff(ui) {
    const PRESET = {
      single: { a: [1, 30, 0.5, 5] },
      double: { a: [5, 50, 1, 20], d: [20, 300, 5, 100] },
      grating: { a: [0.5, 10, 0.1, 1], d: [1, 20, 0.1, 3] },
    };
    const st = { mode: "double", lam: 550, a: 20, d: 100, N: 6, f: 1, white: false };
    let dirty = true;
    const set = (k) => (v) => { st[k] = v; dirty = true; };
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 410 : 440));
    seg(ui.controls, { options: [["single", "单缝"], ["double", "双缝"], ["grating", "光栅"]], value: st.mode, on: (v) => { st.mode = v; applyMode(); } });
    const sL = slider(ui.controls, {
      label: "波长 λ", min: 380, max: 760, step: 1, value: st.lam,
      fmt: (v) => `<span class="swatch" style="background:${rgbCss(brighten(wl2rgb(v)))}"></span>${v} nm`, on: set("lam"),
    });
    const um = (v) => (st.mode === "grating" ? `${v.toFixed(1)} μm` : `${v} μm`);
    const sA = slider(ui.controls, {
      label: "缝宽 a", min: 5, max: 50, step: 1, value: st.a, fmt: um,
      on: (v) => {
        st.a = v;
        if (st.mode !== "single" && st.a >= st.d) {
          sD.set(+(st.a + +sD.inp.step).toFixed(2), false);
          st.d = sD.v;
        }
        dirty = true;
      },
    });
    const sD = slider(ui.controls, {
      label: "缝间距 d = a + b", min: 20, max: 300, step: 5, value: st.d, fmt: um,
      on: (v) => {
        st.d = v;
        if (st.d <= st.a) {
          sA.set(+(st.d - +sA.inp.step).toFixed(2), false);
          st.a = sA.v;
        }
        dirty = true;
      },
    });
    const sN = slider(ui.controls, { label: "缝数 N", min: 2, max: 30, step: 1, value: st.N, fmt: (v) => `${v}`, on: set("N") });
    const sF = slider(ui.controls, { label: "透镜焦距 f（屏距）", min: 0.5, max: 2, step: 0.1, value: st.f, fmt: (v) => `${v.toFixed(1)} m`, on: set("f") });
    const cW = check(ui.controls, "白光（400–700 nm）", false, (v) => { st.white = v; sL.disable(v); dirty = true; });
    const R = readouts(ui.readouts, [
      ["s1", "第一暗纹 sinθ₁ = λ/a"], ["w0", "中央明纹角宽度 ≈ 2λ/a"], ["x0", "中央明纹线宽度 2fλ/a"],
      ["dx", "条纹间距 Δx = fλ/d"], ["ratio", "d / a"], ["miss", "缺级", true], ["inside", "中央包络内亮纹条数"],
      ["kmax", "最高级次 k < d/λ"], ["vis", "实际可见主极大条数"], ["ovl", "光谱重叠", true],
    ]);
    function applyMode() {
      const p = PRESET[st.mode];
      sA.range(p.a[0], p.a[1], p.a[2]);
      sA.set(p.a[3], false);
      st.a = p.a[3];
      if (p.d) {
        sD.range(p.d[0], p.d[1], p.d[2]);
        sD.set(p.d[3], false);
        st.d = p.d[3];
      }
      sA.refresh();
      sD.refresh();
      sD.hide(st.mode === "single");
      sN.hide(st.mode !== "grating");
      sF.hide(st.mode === "grating");
      cW.el.hidden = st.mode !== "grating";
      if (st.mode !== "grating" && st.white) {
        st.white = false;
        cW.input.checked = false;
        sL.disable(false);
      }
      const m = st.mode;
      ["s1", "w0", "x0"].forEach((k) => R.show(k, m === "single"));
      ["dx", "inside"].forEach((k) => R.show(k, m === "double"));
      R.show("ratio", m !== "single");
      R.show("miss", m !== "single");
      ["kmax", "vis", "ovl"].forEach((k) => R.show(k, m === "grating"));
      dirty = true;
    }

    function I(s, lamNm) {
      const lam = lamNm * 1e-3;
      const be = (PI * st.a * s) / lam;
      const f1 = Math.abs(be) < 1e-9 ? 1 : (Math.sin(be) / be) ** 2;
      if (st.mode === "single") return f1;
      const N = st.mode === "double" ? 2 : st.N;
      const al = (PI * st.d * s) / lam;
      const sa = Math.sin(al);
      let f2 = 1;
      if (Math.abs(sa) > 1e-7) {
        const r = Math.sin(N * al) / (N * sa);
        f2 = r * r;
      }
      return f1 * f2;
    }
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");

    function draw() {
      const { ctx, w: W, h: H, dpr } = S;
      ctx.clearRect(0, 0, W, H);
      const lamRef = st.white ? 550 : st.lam;
      const lam = lamRef * 1e-3;
      const smax = st.mode === "grating" ? 1 : Math.min(1, ((st.mode === "single" ? 3.5 : 2.5) * lam) / st.a);
      const stripY = 40;
      const stripH = 62;
      const P = plot(44, 150, W - 88, H - 200, -smax, smax, 0, 1.1);

      // 屏上图样
      const n = Math.max(2, Math.round(P.w * dpr));
      off.width = n;
      off.height = 1;
      const img = octx.createImageData(n, 1);
      const acc = new Float32Array(n * 3);
      let mx = 1e-9;
      for (let i = 0; i < n; i++) {
        const s = -smax + ((i + 0.5) / n) * 2 * smax;
        if (st.white) {
          let r = 0, g = 0, b = 0;
          for (let l = 400; l <= 700; l += 5) {
            const c = wl2rgb(l);
            const v = I(s, l);
            r += v * c[0];
            g += v * c[1];
            b += v * c[2];
          }
          acc[i * 3] = r;
          acc[i * 3 + 1] = g;
          acc[i * 3 + 2] = b;
          mx = Math.max(mx, r, g, b);
        } else {
          const v = I(s, st.lam);
          const c = brighten(wl2rgb(st.lam));
          acc[i * 3] = v * c[0];
          acc[i * 3 + 1] = v * c[1];
          acc[i * 3 + 2] = v * c[2];
        }
      }
      if (!st.white) mx = 1;
      for (let i = 0; i < n; i++) {
        for (let c = 0; c < 3; c++) img.data[i * 4 + c] = Math.round(255 * Math.pow(acc[i * 3 + c] / mx, 0.55));
        img.data[i * 4 + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(off, P.x, stripY, P.w, stripH);
      ctx.restore();
      ctx.strokeStyle = "rgba(236,231,220,0.2)";
      ctx.strokeRect(P.x - 0.5, stripY - 0.5, P.w + 1, stripH + 1);
      txt(ctx, "屏上图样", P.x, stripY - 14, { size: 12, color: COL.ink, font: "sans", weight: 500 });
      if (W >= 620) txt(ctx, "颜色按波长近似，亮度经非线性压缩", P.x + 64, stripY - 14, { size: 11, color: COL.muted, font: "sans" });
      txt(ctx, st.mode === "single" ? "数字 = 暗纹级次 k" : "数字 = 主极大级次 k", P.x + P.w, stripY - 14, { size: 11, color: st.mode === "single" ? COL.optics : COL.ink2, font: "sans", align: "right" });

      // 强度曲线
      line(ctx, P.X(0), P.y, P.X(0), P.y + P.h, COL.grid, 1);
      axes(ctx, P, { yl: "I / I₀" });
      if (st.mode !== "single") path(ctx, sample(P, (s) => envelope(s, lamRef), 1), "rgba(236,231,220,0.5)", 1.2, [4, 4]);
      if (st.white) {
        [[450], [550], [650]].forEach(([l]) => path(ctx, sample(P, (s) => I(s, l), 0.5), rgbCss(brighten(wl2rgb(l))), 1.3, null, 0.9));
      } else {
        const col = brighten(wl2rgb(st.lam));
        const pts = sample(P, (s) => I(s, st.lam), 0.5);
        ctx.save();
        ctx.fillStyle = rgbCss(col, 0.16);
        ctx.beginPath();
        ctx.moveTo(P.x, P.Y(0));
        pts.forEach((p) => ctx.lineTo(p[0], p[1]));
        ctx.lineTo(P.x + P.w, P.Y(0));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        path(ctx, pts, rgbCss(col), 1.6);
      }

      // 横轴刻度
      if (st.mode === "grating") {
        [-1, -0.5, 0, 0.5, 1].forEach((s) => {
          line(ctx, P.X(s), P.Y(0), P.X(s), P.Y(0) + 4, COL.axis, 1);
          txt(ctx, String(s).replace("-", "−"), P.X(s), P.Y(0) + 15, { align: "center", size: 10.5, color: COL.muted });
        });
        txt(ctx, "sin θ", P.x + P.w, P.Y(0) + 30, { align: "right", size: 11 });
      } else {
        const xmax = st.f * Math.tan(Math.asin(smax)) * 1000;
        const stp = niceStep(xmax / 3);
        for (let x = -Math.floor(xmax / stp) * stp; x <= xmax + 1e-9; x += stp) {
          const s = Math.sin(Math.atan(x / 1000 / st.f));
          line(ctx, P.X(s), P.Y(0), P.X(s), P.Y(0) + 4, COL.axis, 1);
          txt(ctx, (Math.abs(x) < 1e-9 ? "0" : x.toFixed(stp < 1 ? (stp < 0.1 ? 2 : 1) : 0)).replace("-", "−"), P.X(s), P.Y(0) + 15, { align: "center", size: 10.5, color: COL.muted });
        }
        txt(ctx, `屏上位置 x / mm（f = ${st.f.toFixed(1)} m）`, P.x + P.w, P.Y(0) + 30, { align: "right", size: 11 });
      }

      // 级次标注
      const labY = P.y - 28;
      if (st.mode === "single") {
        for (let k = -6; k <= 6; k++) {
          if (!k) continue;
          const s = (k * lam) / st.a;
          if (Math.abs(s) >= smax) continue;
          line(ctx, P.X(s), P.Y(0) - 5, P.X(s), P.Y(0) + 1, COL.optics, 1.5);
          txt(ctx, String(k).replace("-", "−"), P.X(s), labY, { align: "center", size: 11, color: COL.optics });
        }
      } else {
        const gap = (P.w / (2 * smax)) * (lam / st.d);
        const kw = Math.floor((smax * st.d) / lam);
        for (let k = -kw; k <= kw; k++) {
          const s = (k * lam) / st.d;
          if (Math.abs(s) >= 1 || Math.abs(s) >= smax) continue;
          const r = (k * st.a) / st.d;
          const missing = k !== 0 && Math.abs(r - Math.round(r)) < 1e-3;
          if (gap < 22 && k % Math.ceil(22 / gap) !== 0 && !missing) continue;
          txt(ctx, missing ? "缺" : String(k).replace("-", "−"), P.X(s), labY, { align: "center", size: 11, color: missing ? COL.optics : COL.ink, font: missing ? "sans" : "mono" });
        }
      }

      // 读数
      const missList = (kLim) => {
        const out = [];
        for (let k = 1; k <= kLim; k++) {
          const r = (k * st.a) / st.d;
          if (Math.abs(r - Math.round(r)) < 1e-3) out.push(k);
        }
        return out;
      };
      if (st.mode === "single") {
        R.set("s1", num(lam / st.a, 4));
        R.set("w0", `${num((2 * lam) / st.a, 4)} rad`);
        R.set("x0", `${num((2 * st.f * lam) / st.a * 1000, 2)} mm`);
      } else {
        R.set("ratio", num(st.d / st.a, 2));
      }
      if (st.mode === "double") {
        R.set("dx", `${num(((st.f * lam) / st.d) * 1000, 3)} mm`);
        const kw = Math.floor((smax * st.d) / lam);
        const ml = missList(kw);
        R.set("miss", ml.length ? ml.map((k) => `±${k}`).join("、") + (ml.length >= 3 ? " …" : "") : "图中范围内无（d/a 不是整数时不缺级）");
        R.set("inside", `${2 * Math.ceil(st.d / st.a - 1e-9) - 1} 条`);
      }
      if (st.mode === "grating") {
        const kmax = Math.ceil(st.d / lam - 1e-9) - 1;
        const ml = missList(kmax);
        R.set("kmax", `${kmax}（d/λ = ${num(st.d / lam, 2)}）`);
        R.set("miss", ml.length ? ml.map((k) => `±${k}`).join("、") : "无");
        R.set("vis", `${2 * kmax + 1 - 2 * ml.length} 条`);
        R.set("ovl", st.white ? "从第 2 级起相邻级次重叠：k·700 nm > (k+1)·400 nm 对 k ≥ 2 成立" : "勾选白光后显示");
      }
    }
    function envelope(s, lamNm) {
      const be = (PI * st.a * s) / (lamNm * 1e-3);
      return Math.abs(be) < 1e-9 ? 1 : (Math.sin(be) / be) ** 2;
    }
    applyMode();
    return {
      frame() {
        if (!dirty && !S.dirty) return;
        draw();
        dirty = false;
        S.dirty = false;
      },
      touch() {
        dirty = true;
      },
    };
  }

  /* =========================================================
     Lab 6 · 等厚干涉：劈尖与牛顿环
     ========================================================= */
  function labFilm(ui) {
    const st = { mode: "wedge", lam: 589, n1: 1.5, n2: 1.0, n3: 1.5, th: 2, R: 1 };
    let dirty = true;
    const set = (k) => (v) => { st[k] = v; dirty = true; };
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 470 : 420));
    seg(ui.controls, { options: [["wedge", "劈尖"], ["newton", "牛顿环"]], value: "wedge", on: (v) => { st.mode = v; sT.hide(v !== "wedge"); sR.hide(v !== "newton"); dirty = true; } });
    slider(ui.controls, { label: "波长 λ", min: 380, max: 760, step: 1, value: st.lam, fmt: (v) => `<span class="swatch" style="background:${rgbCss(brighten(wl2rgb(v)))}"></span>${v} nm`, on: set("lam") });
    const s1 = slider(ui.controls, { label: "上方介质 n₁", min: 1, max: 1.8, step: 0.01, value: st.n1, fmt: (v) => v.toFixed(2), on: set("n1") });
    const s2 = slider(ui.controls, { label: "薄膜 n₂", min: 1, max: 1.8, step: 0.01, value: st.n2, fmt: (v) => v.toFixed(2), on: set("n2") });
    const s3 = slider(ui.controls, { label: "下方介质 n₃", min: 1, max: 1.8, step: 0.01, value: st.n3, fmt: (v) => v.toFixed(2), on: set("n3") });
    const sT = slider(ui.controls, { label: "劈尖角 θ", min: 0.5, max: 6, step: 0.1, value: st.th, fmt: (v) => `${v.toFixed(1)}×10⁻⁴ rad`, on: set("th") });
    const sR = slider(ui.controls, { label: "透镜曲率半径 R", min: 0.5, max: 5, step: 0.1, value: st.R, fmt: (v) => `${v.toFixed(1)} m`, on: set("R") });
    sR.hide(true);
    const preset = (a, b2, c) => () => { s1.set(a); s2.set(b2); s3.set(c); };
    buttons(ui.controls, [
      { label: "玻璃 | 空气 | 玻璃", on: preset(1.5, 1.0, 1.5) },
      { label: "n₁ < n₂ < n₃", on: preset(1.0, 1.38, 1.5) },
    ]);
    const R = readouts(ui.readouts, [
      ["top", "上表面反射 n₁→n₂"], ["bot", "下表面反射 n₂→n₃"], ["extra", "附加光程差"], ["edge", "棱边 / 中心"],
      ["de", "相邻条纹厚度差 λ/(2n₂)"], ["l", "条纹间距 λ/(2n₂θ)"], ["rk", "前三条暗环半径", true],
    ]);
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");

    function draw() {
      const { ctx, w: W, h: H, dpr } = S;
      ctx.clearRect(0, 0, W, H);
      const lam = st.lam * 1e-9;
      const noRefl = Math.abs(st.n2 - st.n1) < 1e-6 || Math.abs(st.n3 - st.n2) < 1e-6;
      const topLoss = st.n2 > st.n1;
      const botLoss = st.n3 > st.n2;
      const extra = topLoss !== botLoss ? 0.5 : 0;
      const Ie = (e) => (noRefl ? 0.5 : Math.cos(PI * ((2 * st.n2 * e) / lam + extra)) ** 2);
      const col = brighten(wl2rgb(st.lam));
      const darkE = (count) => {
        const out = [];
        for (let m = 0; out.length < count && m < 400; m++) {
          const e = ((m + 0.5 - extra) * lam) / (2 * st.n2);
          if (e > 1e-15) out.push(e);
        }
        return out;
      };

      if (st.mode === "wedge") {
        const th = st.th * 1e-4;
        const l = lam / (2 * st.n2 * th);
        const Lv = 10.5 * l;
        const x0 = 40;
        const iw = W - 80;
        const iy = 40;
        const ih = 104;
        const n = Math.max(2, Math.round(iw * dpr));
        off.width = n;
        off.height = 1;
        const img = octx.createImageData(n, 1);
        for (let i = 0; i < n; i++) {
          const v = Math.pow(Ie(th * ((i + 0.5) / n) * Lv), 0.8);
          img.data[i * 4] = 255 * col[0] * v;
          img.data[i * 4 + 1] = 255 * col[1] * v;
          img.data[i * 4 + 2] = 255 * col[2] * v;
          img.data[i * 4 + 3] = 255;
        }
        octx.putImageData(img, 0, 0);
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, x0, iy, iw, ih);
        ctx.restore();
        ctx.strokeStyle = "rgba(236,231,220,0.2)";
        ctx.strokeRect(x0 - 0.5, iy - 0.5, iw + 1, ih + 1);
        txt(ctx, "反射光干涉条纹（俯视）", x0, iy - 16, { size: 12, color: COL.ink, font: "sans", weight: 500 });
        // 比例尺
        const pxmm = iw / (Lv * 1000);
        const bars = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
        const bl = bars.reduce((best, b) => (Math.abs(b * pxmm - iw * 0.14) < Math.abs(best * pxmm - iw * 0.14) ? b : best), 1);
        line(ctx, x0 + iw - bl * pxmm, iy + ih + 14, x0 + iw, iy + ih + 14, COL.ink2, 2);
        txt(ctx, `${bl} mm`, x0 + iw - bl * pxmm - 8, iy + ih + 14, { align: "right", size: 11 });

        // 截面图（角度放大）
        const by = H - 64;
        const rise = Math.min(70, (H - 64) - (iy + ih + 70));
        ctx.save();
        ctx.fillStyle = "rgba(160,200,255,0.10)";
        ctx.strokeStyle = "rgba(160,200,255,0.4)";
        ctx.fillRect(x0, by, iw, 16);
        ctx.strokeRect(x0, by, iw, 16);
        ctx.fillStyle = `rgba(${Math.round(col[0] * 255)},${Math.round(col[1] * 255)},${Math.round(col[2] * 255)},${0.06 + 0.12 * (st.n2 - 1)})`;
        ctx.beginPath();
        ctx.moveTo(x0, by);
        ctx.lineTo(x0 + iw, by);
        ctx.lineTo(x0 + iw, by - rise);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "rgba(160,200,255,0.10)";
        ctx.beginPath();
        ctx.moveTo(x0, by);
        ctx.lineTo(x0 + iw, by - rise);
        ctx.lineTo(x0 + iw, by - rise - 16);
        ctx.lineTo(x0, by - 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        darkE(12).forEach((e) => {
          const x = e / th;
          if (x > Lv) return;
          const px = x0 + (x / Lv) * iw;
          line(ctx, px, iy + ih + 2, px, by - (rise * x) / Lv, "rgba(236,231,220,0.16)", 1, [2, 4]);
        });
        txt(ctx, "棱边 e = 0", x0, by + 30, { size: 11, color: COL.ink2, font: "sans" });
        if (W >= 620) txt(ctx, "截面示意：θ 已放大；虚线对应暗纹位置", x0 + iw, by + 30, { size: 11, color: COL.muted, font: "sans", align: "right" });
        else txt(ctx, "θ 已放大；虚线 = 暗纹位置", x0, by + 48, { size: 11, color: COL.muted, font: "sans" });
        txt(ctx, `n₁ = ${st.n1.toFixed(2)}`, x0 + iw - 6, by - rise - 28, { size: 11, align: "right" });
        txt(ctx, `n₂ = ${st.n2.toFixed(2)}`, x0 + iw - 6, by - rise / 2 + 4, { size: 11, align: "right", color: COL.ink });
        txt(ctx, `n₃ = ${st.n3.toFixed(2)}`, x0 + iw - 6, by + 8, { size: 11, align: "right" });
        R.set("l", `${num(l * 1000, 3)} mm`);
      } else {
        const wide = W >= 620;
        const Sz = wide ? Math.min(H - 70, W * 0.46, 340) : Math.min(W - 40, 280);
        const ox = wide ? 30 : (W - Sz) / 2;
        const oy = 42;
        const rv = Math.sqrt((9.5 * st.R * lam) / st.n2);
        const n = Math.round(Sz * dpr);
        off.width = n;
        off.height = n;
        const img = octx.createImageData(n, n);
        for (let j = 0; j < n; j++) {
          for (let i = 0; i < n; i++) {
            const dx = (i + 0.5) / n - 0.5;
            const dy = (j + 0.5) / n - 0.5;
            const rr = Math.hypot(dx, dy) * 2;
            const p = (j * n + i) * 4;
            if (rr > 1) {
              img.data[p + 3] = 0;
              continue;
            }
            const r = rr * rv;
            const v = Math.pow(Ie((r * r) / (2 * st.R)), 0.8);
            img.data[p] = 255 * col[0] * v;
            img.data[p + 1] = 255 * col[1] * v;
            img.data[p + 2] = 255 * col[2] * v;
            img.data[p + 3] = 255;
          }
        }
        octx.putImageData(img, 0, 0);
        ctx.drawImage(off, ox, oy, Sz, Sz);
        dot(ctx, ox + Sz / 2, oy + Sz / 2, Sz / 2, "rgba(236,231,220,0.2)", 1);
        txt(ctx, "反射光牛顿环（俯视）", ox, oy - 16, { size: 12, color: COL.ink, font: "sans", weight: 500 });
        const P = wide
          ? plot(ox + Sz + 54, oy + 20, W - (ox + Sz + 54) - 30, Sz * 0.62, 0, rv * 1000, 0, 1.12)
          : plot(44, oy + Sz + 46, W - 80, H - (oy + Sz + 46) - 34, 0, rv * 1000, 0, 1.12);
        axes(ctx, P, { yl: "I（相对）" });
        txt(ctx, "r / mm", P.x + P.w, P.Y(0) + 28, { align: "right", size: 11 });
        const stp = niceStep((rv * 1000) / 4);
        for (let r = 0; r <= rv * 1000 + 1e-9; r += stp) txt(ctx, r.toFixed(stp < 0.1 ? 2 : stp < 1 ? 1 : 0), P.X(r), P.Y(0) + 13, { align: "center", size: 10.5, color: COL.muted });
        path(ctx, sample(P, (rmm) => Ie((rmm / 1000) ** 2 / (2 * st.R)), 0.5), rgbCss(col), 1.6);
        const de = darkE(3);
        de.forEach((e, i) => {
          const rmm = Math.sqrt(2 * st.R * e) * 1000;
          line(ctx, P.X(rmm), P.y, P.X(rmm), P.Y(0), "rgba(255,111,145,0.45)", 1, [3, 3]);
          txt(ctx, `暗${i + 1}`, P.X(rmm), P.y - 8, { align: "center", size: 11, color: COL.optics, font: "sans" });
        });
        if (wide) {
          const cy0 = P.y + P.h + 74;
          const cw = P.w;
          const plateY = Math.min(H - 40, cy0 + 60);
          ctx.save();
          ctx.fillStyle = "rgba(160,200,255,0.10)";
          ctx.strokeStyle = "rgba(160,200,255,0.4)";
          ctx.fillRect(P.x, plateY, cw, 14);
          ctx.strokeRect(P.x, plateY, cw, 14);
          const mid = P.x + cw / 2;
          const half = cw * 0.42;
          const sag = Math.min(46, plateY - cy0);
          ctx.beginPath();
          ctx.moveTo(mid - half, plateY - sag);
          ctx.quadraticCurveTo(mid, plateY + sag, mid + half, plateY - sag);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          txt(ctx, "截面示意：曲率已放大，e = r²/(2R)", P.x, plateY + 30, { size: 11, color: COL.muted, font: "sans" });
        }
        const rk = de.map((e) => `${num(Math.sqrt(2 * st.R * e) * 1000, 3)}`);
        R.set("rk", `${rk.join("、")} mm（${extra ? "r = √(kRλ/n₂)" : "r = √((k+½)Rλ/n₂)"}）`);
      }

      R.set("top", noRefl && Math.abs(st.n2 - st.n1) < 1e-6 ? "无反射" : topLoss ? "有半波损失" : "无半波损失");
      R.set("bot", noRefl && Math.abs(st.n3 - st.n2) < 1e-6 ? "无反射" : botLoss ? "有半波损失" : "无半波损失");
      R.set("extra", noRefl ? "—（有一个界面不反射，不形成干涉）" : extra ? "λ/2（恰好一次）" : "0（两次或零次，抵消）");
      R.set("edge", noRefl ? "—" : extra ? "暗" : "亮");
      R.set("de", `${num((st.lam / (2 * st.n2)), 1)} nm`);
      R.show("l", st.mode === "wedge");
      R.show("rk", st.mode === "newton");
    }
    return {
      frame() {
        if (!dirty && !S.dirty) return;
        draw();
        dirty = false;
        S.dirty = false;
      },
      touch() {
        dirty = true;
      },
    };
  }

  /* =========================================================
     Lab 7 · 偏振：马吕斯 + 布儒斯特
     ========================================================= */
  function labPolar(ui) {
    const st = { mode: "malus", al: 60, mid: false, be: 45, n1: 1.0, n2: 1.5, i: 56.3 };
    let dirty = true;
    const set = (k) => (v) => { st[k] = v; dirty = true; };
    const S = makeCanvas(ui.canvas, (w) => (w < 620 ? 470 : 430));
    seg(ui.controls, { options: [["malus", "马吕斯定律"], ["brewster", "布儒斯特定律"]], value: "malus", on: (v) => { st.mode = v; layout(); } });
    const gM = h("div", "lab-controls");
    const gB = h("div", "lab-controls");
    ui.controls.append(gM, gB);
    slider(gM, { label: "检偏器 P₂ 的角度 α", min: 0, max: 180, step: 1, value: st.al, fmt: (v) => `${v}°`, on: set("al") });
    const sBe = slider(gM, { label: "中间偏振片的角度 β", min: 0, max: 180, step: 1, value: st.be, fmt: (v) => `${v}°`, on: set("be") });
    sBe.disable(true);
    check(gM, "在 P₁ 和 P₂ 之间插入第三块偏振片", false, (v) => { st.mid = v; sBe.disable(!v); dirty = true; });
    slider(gB, { label: "入射侧 n₁", min: 1, max: 1.8, step: 0.01, value: st.n1, fmt: (v) => v.toFixed(2), on: set("n1") });
    slider(gB, { label: "折射侧 n₂", min: 1, max: 2, step: 0.01, value: st.n2, fmt: (v) => v.toFixed(2), on: set("n2") });
    const sI = slider(gB, { label: "入射角 i", min: 0, max: 89.5, step: 0.1, value: st.i, fmt: (v) => `${v.toFixed(1)}°`, on: set("i") });
    buttons(gB, [{ label: "跳到布儒斯特角 i_B", on: () => sI.set(Math.round(deg(Math.atan(st.n2 / st.n1)) * 10) / 10) }]);
    const R = readouts(ui.readouts, [
      ["I1", "过 P₁ 后（自然光）"], ["Im", "过中间片后"], ["I2", "过 P₂ 后"], ["fm", "计算式", true],
      ["iB", "布儒斯特角 i_B = arctan(n₂/n₁)"], ["g", "折射角 γ"], ["sum", "i + γ"], ["Rs", "反射率 R_s（⊥ 入射面）"], ["Rp", "反射率 R_p（∥ 入射面）"], ["state", "反射光", true],
    ]);
    function layout() {
      gM.hidden = st.mode !== "malus";
      gB.hidden = st.mode !== "brewster";
      ["I1", "Im", "I2", "fm"].forEach((k) => R.show(k, st.mode === "malus"));
      ["iB", "g", "sum", "Rs", "Rp", "state"].forEach((k) => R.show(k, st.mode === "brewster"));
      dirty = true;
    }
    layout();

    function polarizer(ctx, x, y, angDeg, label, sub) {
      const r = 34;
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fillStyle = "rgba(236,231,220,0.05)";
      ctx.fill();
      ctx.strokeStyle = "rgba(236,231,220,0.5)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.clip();
      const a = rad(angDeg);
      for (let q = -3; q <= 3; q++) {
        const ox = Math.cos(a) * q * 8;
        const oy = Math.sin(a) * q * 8;
        line(ctx, x + ox - Math.sin(a) * r, y + oy + Math.cos(a) * r, x + ox + Math.sin(a) * r, y + oy - Math.cos(a) * r, "rgba(236,231,220,0.14)", 1);
      }
      ctx.restore();
      line(ctx, x - Math.sin(a) * (r + 6), y + Math.cos(a) * (r + 6), x + Math.sin(a) * (r + 6), y - Math.cos(a) * (r + 6), COL.ink, 2);
      txt(ctx, label, x, y + r + 18, { align: "center", size: 12, color: COL.ink, font: "sans" });
      txt(ctx, sub, x, y + r + 35, { align: "center", size: 11, color: COL.muted });
    }
    function glyph(ctx, x, y, kind, angDeg, I) {
      if (kind === "nat") {
        [0, 45, 90, 135].forEach((a) => dblArrow(ctx, x, y, rad(a), 15, COL.osc, 1.4));
        return;
      }
      if (I < 0.002) {
        txt(ctx, "无光", x, y, { align: "center", size: 11, color: COL.muted, font: "sans" });
        return;
      }
      dblArrow(ctx, x, y, rad(angDeg), 18 * Math.sqrt(2 * I), COL.osc, 1.8);
    }
    const fI = (v) => (Math.abs(v - 0.5) < 1e-9 ? "I₀/2" : Math.abs(v) < 5e-4 ? "0" : `${v.toFixed(3)} I₀`);

    function drawMalus() {
      const { ctx, w: W, h: H } = S;
      const y = 112;
      const xs = { src: 50, p1: W * 0.28, pm: W * 0.5, p2: st.mid ? W * 0.72 : W * 0.6, scr: W - 50 };
      const a1 = 0;
      const I1 = 0.5;
      const Im = st.mid ? I1 * Math.cos(rad(st.be - a1)) ** 2 : I1;
      const prev = st.mid ? st.be : a1;
      const I2 = Im * Math.cos(rad(st.al - prev)) ** 2;
      const segs = [[xs.src, xs.p1, 1]];
      if (st.mid) segs.push([xs.p1, xs.pm, I1], [xs.pm, xs.p2, Im]);
      else segs.push([xs.p1, xs.p2, I1]);
      segs.push([xs.p2, xs.scr, I2]);
      segs.forEach(([a, b2, I]) => {
        ctx.fillStyle = `rgba(255,236,200,${0.05 + 0.55 * I})`;
        ctx.fillRect(a, y - 7, b2 - a, 14);
      });
      const gy = y - 62;
      glyph(ctx, (xs.src + xs.p1) / 2, gy, "nat", 0, 1);
      if (st.mid) {
        glyph(ctx, (xs.p1 + xs.pm) / 2, gy, "lin", a1, I1);
        glyph(ctx, (xs.pm + xs.p2) / 2, gy, "lin", st.be, Im);
      } else glyph(ctx, (xs.p1 + xs.p2) / 2, gy, "lin", a1, I1);
      glyph(ctx, (xs.p2 + xs.scr) / 2, gy, "lin", st.al, I2);
      const iy = y + 92;
      txt(ctx, "I₀", (xs.src + xs.p1) / 2, iy, { align: "center", size: 12, color: COL.ink });
      if (st.mid) {
        txt(ctx, fI(I1), (xs.p1 + xs.pm) / 2, iy, { align: "center", size: 12, color: COL.ink });
        txt(ctx, fI(Im), (xs.pm + xs.p2) / 2, iy, { align: "center", size: 12, color: COL.ink });
      } else txt(ctx, fI(I1), (xs.p1 + xs.p2) / 2, iy, { align: "center", size: 12, color: COL.ink });
      txt(ctx, fI(I2), (xs.p2 + xs.scr) / 2, iy, { align: "center", size: 12, color: COL.osc, weight: 500 });
      dot(ctx, xs.src, y, 9, "rgba(255,236,200,0.9)");
      txt(ctx, "自然光", xs.src, y + 52, { align: "center", size: 11, color: COL.muted, font: "sans" });
      polarizer(ctx, xs.p1, y, a1, "P₁ 起偏器", "0°");
      if (st.mid) polarizer(ctx, xs.pm, y, st.be, "中间片", `β = ${st.be}°`);
      polarizer(ctx, xs.p2, y, st.al, "P₂ 检偏器", `α = ${st.al}°`);
      ctx.fillStyle = `rgba(255,236,200,${0.08 + 1.3 * I2})`;
      ctx.fillRect(xs.scr - 4, y - 36, 8, 72);

      const P = plot(56, y + 120, W - 110, H - (y + 120) - 40, 0, 180, 0, 0.56);
      [30, 60, 90, 120, 150, 180].forEach((q) => {
        line(ctx, P.X(q), P.y, P.X(q), P.y + P.h, COL.grid, 1);
        txt(ctx, `${q}°`, P.X(q), P.Y(0) + 13, { align: "center", size: 10.5, color: COL.muted });
      });
      axes(ctx, P, { yl: "I / I₀" });
      txt(ctx, "α", P.x + P.w + 12, P.Y(0) + 28, { align: "right", size: 11 });
      txt(ctx, "0.5", P.x - 6, P.Y(0.5), { align: "right", size: 10.5, color: COL.muted });
      const f = (a) => (st.mid ? 0.5 * Math.cos(rad(st.be)) ** 2 * Math.cos(rad(a - st.be)) ** 2 : 0.5 * Math.cos(rad(a)) ** 2);
      path(ctx, sample(P, f, 1), COL.osc, 2);
      line(ctx, P.X(st.al), P.y, P.X(st.al), P.y + P.h, "rgba(236,231,220,0.3)", 1, [3, 4]);
      dot(ctx, P.X(st.al), P.Y(I2), 4.5, COL.ink);

      R.set("I1", "I₀/2（不用马吕斯定律）");
      R.show("Im", st.mid);
      R.set("Im", `I₁cos²β = ${fI(Im)}`);
      R.set("I2", fI(I2));
      R.set("fm", st.mid ? `I = (I₀/2)·cos²${st.be}°·cos²(${st.al}° − ${st.be}°)` : `I = (I₀/2)·cos²${st.al}°`);
    }

    function fres(n1, n2, iDeg) {
      const i = rad(iDeg);
      const ci = Math.cos(i);
      const sg = (n1 / n2) * Math.sin(i);
      if (sg >= 1) return { tir: true, rs: 1, rp: 1, Rs: 1, Rp: 1 };
      const g = Math.asin(sg);
      const ct = Math.cos(g);
      const rs = (n1 * ci - n2 * ct) / (n1 * ci + n2 * ct);
      const rp = (n2 * ci - n1 * ct) / (n2 * ci + n1 * ct);
      const ts = (2 * n1 * ci) / (n1 * ci + n2 * ct);
      const tp = (2 * n1 * ci) / (n2 * ci + n1 * ct);
      return { tir: false, g, rs, rp, ts, tp, Rs: rs * rs, Rp: rp * rp };
    }
    function marks(ctx, x1, y1, x2, y2, as, ap) {
      const L = Math.hypot(x2 - x1, y2 - y1);
      const ux = (x2 - x1) / L;
      const uy = (y2 - y1) / L;
      [0.3, 0.62].forEach((f) => {
        const px = x1 + (x2 - x1) * f;
        const py = y1 + (y2 - y1) * f;
        if (as > 0.04) dot(ctx, px - ux * 10, py - uy * 10, 1.5 + 3 * as, COL.osc);
        if (ap > 0.04) {
          const hl = 11 * ap;
          line(ctx, px + ux * 8 - uy * hl, py + uy * 8 + ux * hl, px + ux * 8 + uy * hl, py + uy * 8 - ux * hl, COL.wave, 2);
        }
      });
    }
    function drawBrewster() {
      const { ctx, w: W, h: H } = S;
      const wide = W >= 620;
      const LW = wide ? Math.min(W * 0.5, 420) : W;
      const DH = wide ? H : 270;
      const ox = LW / 2;
      const oy = DH / 2;
      const Lr = Math.min(LW / 2 - 24, DH / 2 - 44);
      const iB = deg(Math.atan(st.n2 / st.n1));
      const F = fres(st.n1, st.n2, st.i);
      ctx.fillStyle = "rgba(63,208,201,0.06)";
      ctx.fillRect(0, oy, LW, DH - oy);
      line(ctx, 8, oy, LW - 8, oy, "rgba(236,231,220,0.45)", 1.2);
      line(ctx, ox, oy - Lr - 6, ox, oy + Lr + 6, "rgba(236,231,220,0.25)", 1, [4, 4]);
      txt(ctx, `n₁ = ${st.n1.toFixed(2)}`, 14, oy - 16, { size: 12, color: COL.ink2 });
      txt(ctx, `n₂ = ${st.n2.toFixed(2)}`, 14, oy + 18, { size: 12, color: COL.ink2 });
      const i = rad(st.i);
      const ix = ox - Lr * Math.sin(i), iy = oy - Lr * Math.cos(i);
      const rx = ox + Lr * Math.sin(i), ry = oy - Lr * Math.cos(i);
      arrow(ctx, ix, iy, ox, oy, COL.ink, 2, 9);
      marks(ctx, ix, iy, ox, oy, 1, 1);
      const mr = Math.max(Math.abs(F.rs), Math.abs(F.rp), 1e-9);
      ctx.save();
      ctx.globalAlpha = 0.45 + 0.55 * Math.min(1, Math.sqrt((F.Rs + F.Rp) / 2) * 3);
      arrow(ctx, ox, oy, rx, ry, COL.ink, 2, 9);
      ctx.restore();
      marks(ctx, ox, oy, rx, ry, Math.abs(F.rs) / mr, Math.abs(F.rp) / mr);
      ctx.save();
      ctx.strokeStyle = "rgba(236,231,220,0.6)";
      ctx.beginPath();
      ctx.arc(ox, oy, 30, -PI / 2 - i, -PI / 2, false);
      ctx.stroke();
      ctx.restore();
      txt(ctx, "i", ox - 38 * Math.sin(i / 2) - 4, oy - 40 * Math.cos(i / 2), { size: 12, color: COL.ink, align: "center" });
      if (!F.tir) {
        const tx = ox + Lr * Math.sin(F.g), ty = oy + Lr * Math.cos(F.g);
        arrow(ctx, ox, oy, tx, ty, COL.ink, 2, 9);
        const mt = Math.max(F.ts, F.tp);
        marks(ctx, ox, oy, tx, ty, F.ts / mt, F.tp / mt);
        ctx.save();
        ctx.strokeStyle = "rgba(236,231,220,0.6)";
        ctx.beginPath();
        ctx.arc(ox, oy, 30, PI / 2 - F.g, PI / 2, false);
        ctx.stroke();
        ctx.restore();
        txt(ctx, "γ", ox + 40 * Math.sin(F.g / 2) + 4, oy + 40 * Math.cos(F.g / 2), { size: 12, color: COL.ink, align: "center" });
        if (Math.abs(st.i - iB) < 0.35) {
          const ar = Math.atan2(ry - oy, rx - ox);
          const at = Math.atan2(ty - oy, tx - ox);
          const s1 = 16;
          const p1 = [ox + s1 * Math.cos(ar), oy + s1 * Math.sin(ar)];
          const p2 = [ox + s1 * Math.cos(at), oy + s1 * Math.sin(at)];
          const p3 = [p1[0] + p2[0] - ox, p1[1] + p2[1] - oy];
          path(ctx, [p1, p3, p2], COL.osc, 1.4);
          txt(ctx, "90°", p3[0] + 16, p3[1], { size: 11, color: COL.osc });
        }
      } else {
        txt(ctx, "全反射，没有折射光", ox + 12, oy + 40, { size: 12, color: COL.optics, font: "sans" });
      }
      dot(ctx, 18, DH - 22, 3.5, COL.osc);
      txt(ctx, "⊥ 入射面（s）", 28, DH - 22, { size: 11, color: COL.osc, font: "sans" });
      line(ctx, 130, DH - 28, 130, DH - 16, COL.wave, 2);
      txt(ctx, "∥ 入射面（p）", 140, DH - 22, { size: 11, color: COL.wave, font: "sans" });

      const P = wide ? plot(LW + 54, 52, W - LW - 88, H - 104, 0, 90, 0, 1) : plot(44, DH + 40, W - 80, H - DH - 74, 0, 90, 0, 1);
      [15, 30, 45, 60, 75, 90].forEach((q) => {
        line(ctx, P.X(q), P.y, P.X(q), P.y + P.h, COL.grid, 1);
        txt(ctx, `${q}°`, P.X(q), P.Y(0) + 13, { align: "center", size: 10.5, color: COL.muted });
      });
      axes(ctx, P, { yl: "反射率 R" });
      txt(ctx, "i", P.x + P.w + 12, P.Y(0) + 28, { align: "right", size: 11 });
      [0.5, 1].forEach((q) => txt(ctx, String(q), P.x - 6, P.Y(q), { align: "right", size: 10.5, color: COL.muted }));
      path(ctx, sample(P, (a) => fres(st.n1, st.n2, Math.min(a, 89.99)).Rs, 1), COL.osc, 2);
      path(ctx, sample(P, (a) => fres(st.n1, st.n2, Math.min(a, 89.99)).Rp, 1), COL.wave, 2);
      line(ctx, P.X(iB), P.y, P.X(iB), P.y + P.h, "rgba(255,111,145,0.6)", 1, [4, 4]);
      txt(ctx, `i_B = ${iB.toFixed(1)}°`, P.X(iB) + 6, P.y + 10, { size: 11, color: COL.optics });
      line(ctx, P.X(st.i), P.y, P.X(st.i), P.y + P.h, "rgba(236,231,220,0.35)", 1);
      dot(ctx, P.X(st.i), P.Y(F.Rs), 4, COL.osc);
      dot(ctx, P.X(st.i), P.Y(F.Rp), 4, COL.wave);
      txt(ctx, "R_s", P.x + 14, P.y + 10, { size: 11, color: COL.osc });
      txt(ctx, "R_p", P.x + 52, P.y + 10, { size: 11, color: COL.wave });

      R.set("iB", `${iB.toFixed(2)}°`);
      R.set("g", F.tir ? "—（全反射）" : `${deg(F.g).toFixed(2)}°`);
      R.set("sum", F.tir ? "—" : `${(st.i + deg(F.g)).toFixed(2)}°`);
      R.set("Rs", `${(F.Rs * 100).toFixed(2)} %`);
      R.set("Rp", `${(F.Rp * 100).toFixed(3)} %`);
      R.set(
        "state",
        F.tir ? "全反射" : F.Rp < 2e-5 && F.Rs > 1e-6 ? "线偏振：只剩垂直于入射面的振动；折射光为部分偏振" : st.i < 0.05 ? "正入射：反射光仍是自然光" : "部分偏振（垂直于入射面的振动占优）"
      );
    }
    return {
      frame() {
        if (!dirty && !S.dirty) return;
        S.ctx.clearRect(0, 0, S.w, S.h);
        if (st.mode === "malus") drawMalus();
        else drawBrewster();
        dirty = false;
        S.dirty = false;
      },
      touch() {
        dirty = true;
      },
    };
  }

  /* =========================================================
     实验室框架
     ========================================================= */
  const INFO = {
    shm: {
      title: "旋转矢量 ↔ 简谐振动",
      desc: "振幅矢量以角速度 ω 逆时针旋转，端点在 x 轴上的投影 P 就在做简谐振动。下方记录 P 的位置（时间轴向下），右侧是 x、v、a 三条曲线。",
      note: "x = A cos(ωt + φ)，v = −Aω sin(ωt + φ)，a = −ω²x。v、a 箭头长度按各自最大值归一化，只表示方向和相对大小。",
      make: labShm,
    },
    superpose: {
      title: "同方向振动的合成",
      desc: "同频：两个旋转矢量以同一 ω 一起转，夹角不变，合矢量长度就是合振幅。拍：两个频率接近的振动叠加，合振幅随时间缓慢起伏。",
      note: "同频：A² = A₁² + A₂² + 2A₁A₂cos(φ₂ − φ₁)。拍：两振幅都取 1，x = 2cos(πΔν·t)·cos(π(ν₁+ν₂)t)，包络起伏的频率是 |ν₂ − ν₁|。时间轴已放慢。",
      make: labSuperpose,
    },
    wave: {
      title: "平面简谐波：波形图 vs 振动图",
      desc: "上图是同一时刻所有质点的位置（横轴 x），下图是同一个质点在各个时刻的位置（横轴 t）。暂停后先预测 P 往哪动，再单步验证。",
      note: "y = A cos[2π(t/T ∓ x/λ) + φ]，沿 +x 传播取减号。y 单位 cm，x 单位 m。质点只沿 y 方向振动，不随波迁移；v 箭头按最大值归一化。",
      make: labWave,
    },
    standing: {
      title: "驻波与半波损失",
      desc: "入射波向右传播，在 x = 6 m 处反射，两列波叠加成驻波。切换反射端类型，看反射点是波节还是波腹。",
      note: "入射波 y₁ = A cos(ωt − kx)；反射波相位由边界条件决定：固定端合位移恒为 0（相当于半波损失），自由端是波腹。x′ 为到反射端的距离。",
      make: labStanding,
    },
    diffraction: {
      title: "双缝 · 单缝 · 光栅",
      desc: "三种情况由同一个式子描述：单缝衍射调制 × 多缝干涉。调 a 和 d，看缺级出现在哪里。",
      note: "I = I₀(sinβ/β)²·[sinNα/(N sinα)]²，β = πa sinθ/λ，α = πd sinθ/λ（单缝去掉后一项，双缝 N = 2）。屏上位置按 x = f tanθ 计算。虚线为单缝衍射包络。",
      make: labDiff,
    },
    thinfilm: {
      title: "等厚干涉：劈尖与牛顿环",
      desc: "厚度相同处光程差相同，所以条纹沿等厚线分布。改三个折射率，看半波损失如何决定棱边（中心）的明暗。",
      note: "两束反射光按等幅近似：I ∝ cos²(πδ/λ)，δ = 2n₂e（+λ/2，仅当两个界面中恰好一个有半波损失）。垂直入射；截面图中的角度和曲率已放大。",
      make: labFilm,
    },
    polar: {
      title: "偏振：马吕斯定律与布儒斯特定律",
      desc: "马吕斯：角度都相对 P₁ 的偏振化方向。布儒斯特：拖动入射角，看反射光中平行于入射面的振动在哪个角度消失。",
      note: "反射率由菲涅耳公式计算。点表示垂直于入射面的振动（s），短线表示入射面内的振动（p），大小为同一束光内的相对振幅。",
      make: labPolar,
    },
  };

  const panels = {};
  const insts = {};
  let tabsEl = null;
  let stageEl = null;
  let active = null;
  let visible = false;

  function build(id) {
    const info = INFO[id];
    const meta = (window.COURSE.labs || []).find((l) => l.id === id) || {};
    const p = h("div", "lab-panel");
    p.dataset.lab = id;
    p.id = `lab-${id}`;
    p.setAttribute("role", "tabpanel");
    const head = h("div", "lab-head");
    head.append(h("h3", "", info.title), h("span", "lh-lessons", meta.lessons || ""), h("p", "", info.desc));
    const body = h("div", "lab-body");
    const canvas = h("div", "lab-canvas");
    const side = h("aside", "lab-side");
    const controls = h("div", "lab-controls");
    const ro = h("dl", "lab-readouts");
    side.append(controls, ro);
    body.append(canvas, side);
    p.append(head, body, h("p", "lab-note", info.note));
    stageEl.append(p);
    panels[id] = p;
    insts[id] = info.make({ canvas, controls, readouts: ro });
  }

  function show(id) {
    if (!INFO[id]) return;
    if (!panels[id]) build(id);
    Object.entries(panels).forEach(([k, p]) => (p.hidden = k !== id));
    tabsEl.querySelectorAll(".lab-tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.lab === id)));
    active = insts[id];
    if (active.touch) active.touch();
    allCanvases.forEach((s) => s.resize());
  }

  function init({ tabs, stage, labs }) {
    tabsEl = tabs;
    stageEl = stage;
    tabs.innerHTML = labs
      .map(
        (l, i) =>
          `<button class="lab-tab" type="button" role="tab" data-lab="${l.id}" aria-controls="lab-${l.id}"><span class="lt-no">${String(i + 1).padStart(2, "0")}</span><b>${l.name}</b><small>${l.sub} · ${l.lessons}</small></button>`
      )
      .join("");
    tabs.querySelectorAll(".lab-tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.lab)));
    show(labs[0].id);
    const io = new IntersectionObserver((en) => en.forEach((e) => (visible = e.isIntersecting)), { rootMargin: "120px" });
    io.observe(stage);
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (active && visible && !document.hidden) active.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => Object.values(insts).forEach((x) => x.touch && x.touch()));
  }

  /* =========================================================
     首屏：双波源水波干涉
     ========================================================= */
  function hero(canvas) {
    const ctx = canvas.getContext("2d");
    const off = document.createElement("canvas");
    const octx = off.getContext("2d");
    const CELL = 4;
    const K = TAU / 15;
    const OMEGA = 2.4;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const s1 = { x: 0.82, y: 0.3 };
    const s2 = { x: 0.82, y: 0.58 };
    let W = 0, H = 0, gw = 0, gh = 0, img = null, r1, r2, a1, a2;
    let t = 0;
    let vis = true;
    let drag = false;

    function precompute() {
      const n = gw * gh;
      r1 = new Float32Array(n);
      r2 = new Float32Array(n);
      a1 = new Float32Array(n);
      a2 = new Float32Array(n);
      const x1 = s1.x * gw, y1 = s1.y * gh, x2 = s2.x * gw, y2 = s2.y * gh;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const i = y * gw + x;
          const d1 = Math.hypot(x - x1, y - y1);
          const d2 = Math.hypot(x - x2, y - y2);
          r1[i] = d1 * K;
          r2[i] = d2 * K;
          a1[i] = 1 / Math.sqrt(1 + d1 * 0.1);
          a2[i] = 1 / Math.sqrt(1 + d2 * 0.1);
        }
      }
    }
    function resize() {
      const r = canvas.getBoundingClientRect();
      if (!r.width || !r.height) return;
      W = r.width;
      H = r.height;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      gw = Math.max(40, Math.round(W / CELL));
      gh = Math.max(30, Math.round(H / CELL));
      off.width = gw;
      off.height = gh;
      img = octx.createImageData(gw, gh);
      if (W < 860 && !drag) {
        s1.x = s2.x = 0.86;
        s1.y = 0.08;
        s2.y = 0.22;
      }
      precompute();
      render();
    }
    function render() {
      if (!img) return;
      const d = img.data;
      const ph = OMEGA * t;
      const n = gw * gh;
      for (let i = 0; i < n; i++) {
        const v = a1[i] * Math.cos(r1[i] - ph) + a2[i] * Math.cos(r2[i] - ph);
        const m = clamp((v + 1.3) / 2.6, 0, 1);
        const b = m * m;
        const hi = Math.max(0, b - 0.62) * 1.6;
        const p = i * 4;
        d[p] = 10 + 53 * b + 150 * hi;
        d[p + 1] = 12 + 196 * b + 20 * hi;
        d[p + 2] = 15 + 186 * b + 25 * hi;
        d[p + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(off, 0, 0, W, H);
      [s1, s2].forEach((s, k) => {
        dot(ctx, s.x * W, s.y * H, 5, COL.ink);
        dot(ctx, s.x * W, s.y * H, 10, "rgba(236,231,220,0.5)", 1);
        if (W >= 860) txt(ctx, k ? "S₂" : "S₁", s.x * W + 16, s.y * H, { size: 12, color: COL.ink });
      });
    }
    function setFromEvent(e) {
      const r = canvas.getBoundingClientRect();
      s2.x = clamp((e.clientX - r.left) / r.width, 0.02, 0.98);
      s2.y = clamp((e.clientY - r.top) / r.height, 0.02, 0.98);
      precompute();
      if (reduce) render();
    }
    canvas.addEventListener("pointerdown", (e) => {
      drag = true;
      canvas.classList.add("dragging");
      canvas.setPointerCapture(e.pointerId);
      setFromEvent(e);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (drag) setFromEvent(e);
    });
    const end = () => {
      drag = false;
      canvas.classList.remove("dragging");
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    new ResizeObserver(resize).observe(canvas);
    new IntersectionObserver((en) => en.forEach((e) => (vis = e.isIntersecting))).observe(canvas);
    resize();
    if (!reduce) {
      let last = performance.now();
      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        if (vis && !document.hidden) {
          t += dt;
          render();
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  window.Labs = { init, show, hero };
})();
