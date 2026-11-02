(() => {
  "use strict";
  const C = window.COURSE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const chById = Object.fromEntries(C.chapters.map((c) => [c.id, c]));
  const ALL = C.lessons;
  const byId = Object.fromEntries(ALL.map((l) => [l.id, l]));
  const LESSONS = ALL.filter((l) => !l.checkpoint);
  const STORE = "waves-optics-progress-v1";
  const sum = (arr) => arr.reduce((a, b) => a + b, 0);
  const fmtH = (h) => (Number.isInteger(h) ? String(h) : h.toFixed(1));

  let done = new Set();
  try {
    done = new Set(JSON.parse(localStorage.getItem(STORE) || "[]"));
  } catch (e) {
    done = new Set();
  }

  function renderMath(el) {
    if (!el || typeof window.renderMathInElement !== "function") return;
    window.renderMathInElement(el, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false },
      ],
      throwOnError: false,
    });
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2200);
  }

  const pips = (n, max = 5, ch = "●") =>
    `<span class="pips">${Array.from({ length: max }, (_, i) => `<span class="${i < n ? "on" : "off"}">${ch}</span>`).join("")}</span>`;
  const tagHtml = (tags = []) => tags.map((t) => `<span class="tag" data-t="${t}">${t}</span>`).join("");

  /* ---------------- hero stats ---------------- */
  function renderHeroStats() {
    const total = sum(ALL.map((l) => l.hours));
    const stats = [
      [LESSONS.length, "个课时"],
      ["3 + 1", "次章测 + 综合"],
      [`≈${fmtH(total)} h`, "总时长（估计值）"],
      [C.meta.reviewCount, "道复习题属于这三章"],
    ];
    $("#heroStats").innerHTML = stats.map(([b, s]) => `<div class="stat"><b>${b}</b><span>${s}</span></div>`).join("");
  }

  /* ---------------- phase band ---------------- */
  function renderPhaseBand() {
    const el = $("#phaseBand");
    el.innerHTML = C.phaseBand
      .map(
        (p, i) => `<article class="phase-step ch-${p.ch} reveal" style="--d:${(i * 0.07).toFixed(2)}s">
          <div class="ps-top"><span class="ps-stage">${p.stage}</span><span class="ps-obj">${p.obj}</span></div>
          <div class="ps-phase">${esc(p.phase)}</div>
          <div class="ps-formula">${esc(p.formula)}</div>
          <div class="ps-q">${p.q}</div>
        </article>`
      )
      .join("");
    renderMath(el);
  }

  /* ---------------- knowledge map ---------------- */
  const MAP = { colW: 100, nodeW: 82, nodeH: 50, x0: 40, laneY: { osc: 100, wave: 240, optics: 380 } };
  let selected = "L21";
  const children = {};
  LESSONS.forEach((l) => l.pre.forEach((p) => (children[p] = children[p] || []).push(l.id)));

  function closure(id, next) {
    const out = new Set();
    const stack = [...(next(id) || [])];
    while (stack.length) {
      const k = stack.pop();
      if (out.has(k)) continue;
      out.add(k);
      (next(k) || []).forEach((n) => stack.push(n));
    }
    return out;
  }
  const ancestors = (id) => closure(id, (k) => byId[k].pre);
  const descendants = (id) => closure(id, (k) => children[k]);
  const order = (ids) => [...ids].sort((a, b) => ALL.indexOf(byId[a]) - ALL.indexOf(byId[b]));

  function renderMap() {
    const { colW, nodeW, nodeH, x0, laneY } = MAP;
    const W = x0 + 12 * colW + nodeW + 40;
    const H = 480;
    const svg = $("#mapSvg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const left = (l) => x0 + l.col * colW;
    const cx = (l) => left(l) + nodeW / 2;
    const cy = (l) => laneY[l.ch];
    const out = [];

    const marker = (id, color) =>
      `<marker id="${id}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse"><path d="M1.5 1.5L8.5 5L1.5 8.5" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></marker>`;
    out.push(`<defs>${marker("mDim", "rgba(236,231,220,0.35)")}${marker("mUp", "#ece7dc")}${marker("mDown", "#bdb7ab")}</defs>`);

    // lane tracks + labels
    const labelPos = {
      osc: { x: x0 + 6 * colW + 24, anchor: "start" },
      wave: { x: x0 + 7 * colW + 24, anchor: "start" },
      optics: { x: x0, anchor: "start" },
    };
    C.chapters.forEach((ch, i) => {
      const ls = LESSONS.filter((l) => l.ch === ch.id);
      const y = laneY[ch.id];
      out.push(`<g class="ch-${ch.id}"><line class="mtrack" x1="${cx(ls[0])}" y1="${y}" x2="${cx(ls[ls.length - 1])}" y2="${y}" style="stroke:var(--c)"/></g>`);
      const p = labelPos[ch.id];
      out.push(`<g class="ch-${ch.id}">
        <text class="mlabel-no" x="${p.x}" y="${y - 14}">CH.0${i + 1} · ${ch.no}</text>
        <text class="mlabel-name" x="${p.x}" y="${y + 16}" style="fill:var(--c)">${ch.name}</text>
        <text class="mlabel-en" x="${p.x + 108}" y="${y + 16}">${ch.en}</text>
      </g>`);
    });

    // edges
    const edges = [];
    LESSONS.forEach((t) =>
      t.pre.forEach((pid) => {
        const s = byId[pid];
        let d;
        if (s.ch === t.ch) {
          const dc = t.col - s.col;
          if (Math.abs(dc) === 1) {
            const y = cy(s);
            d = `M${left(s) + nodeW + 1} ${y} L${left(t) - 2} ${y}`;
          } else {
            const above = t.ch !== "optics";
            const hh = Math.min(56, 20 + 7 * Math.abs(dc));
            const yy = above ? cy(s) - nodeH / 2 : cy(s) + nodeH / 2;
            const ctrl = above ? yy - hh : yy + hh;
            const end = above ? yy - 2 : yy + 2;
            d = `M${cx(s) - 6} ${yy} C${cx(s) - 6} ${ctrl} ${cx(t) + 6} ${ctrl} ${cx(t) + 6} ${end}`;
          }
        } else {
          const sy = cy(s) + nodeH / 2;
          const ty = cy(t) - nodeH / 2 - 2;
          const mid = (sy + ty) / 2;
          d = `M${cx(s)} ${sy} C${cx(s)} ${mid + 10} ${cx(t)} ${mid - 10} ${cx(t)} ${ty}`;
        }
        edges.push({ s: pid, t: t.id });
        out.push(`<path class="medge" data-s="${pid}" data-t="${t.id}" d="${d}"/>`);
      })
    );

    // nodes
    LESSONS.forEach((l) => {
      const x = left(l);
      const y = cy(l) - nodeH / 2;
      out.push(`<g class="mnode ch-${l.ch}${done.has(l.id) ? " done" : ""}" data-id="${l.id}" tabindex="0" role="button" aria-label="${l.id} ${l.title}">
        ${l.gate ? `<rect class="gate" x="${x - 4}" y="${y - 4}" width="${nodeW + 8}" height="${nodeH + 8}" rx="13"/>` : ""}
        <rect class="box" x="${x}" y="${y}" width="${nodeW}" height="${nodeH}" rx="10"/>
        <text class="nid" x="${x + nodeW / 2}" y="${y + 17}" text-anchor="middle">${l.id}</text>
        <text class="nt" x="${x + nodeW / 2}" y="${y + 36}" text-anchor="middle">${l.short}</text>
        ${l.minimal ? `<circle class="min" cx="${x + nodeW - 9}" cy="${y + 9}" r="2.6"/>` : ""}
        <circle class="donec" cx="${x + 9}" cy="${y + 9}" r="3.2" style="display:${done.has(l.id) ? "block" : "none"}"/>
      </g>`);
    });
    svg.innerHTML = out.join("");

    $$(".mnode", svg).forEach((g) => {
      g.addEventListener("click", () => selectNode(g.dataset.id));
      g.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectNode(g.dataset.id);
        }
      });
    });

    $("#mapLegend").innerHTML = `
      ${C.chapters.map((c) => `<span class="ch-${c.id}"><i class="lg-swatch"></i>${c.name}</span>`).join("")}
      <span><i class="lg-gate"></i>关卡课</span>
      <span><i class="lg-dot"></i>最小必学路线</span>
      <span><i class="lg-line"></i>先修链</span>
      <span><i class="lg-line dash"></i>会解锁</span>`;
    selectNode(selected, false);
  }

  function selectNode(id, scroll = false) {
    selected = id;
    const anc = ancestors(id);
    const desc = descendants(id);
    $$(".mnode").forEach((g) => {
      const k = g.dataset.id;
      g.classList.toggle("sel", k === id);
      g.classList.toggle("up", anc.has(k));
      g.classList.toggle("down", desc.has(k));
      g.classList.toggle("dim", k !== id && !anc.has(k) && !desc.has(k));
      g.setAttribute("aria-pressed", String(k === id));
    });
    $$(".medge").forEach((p) => {
      const s = p.dataset.s;
      const t = p.dataset.t;
      const up = (t === id || anc.has(t)) && anc.has(s);
      const down = !up && (s === id || desc.has(s)) && desc.has(t);
      p.classList.toggle("up", up);
      p.classList.toggle("down", down);
      p.classList.toggle("dim", !up && !down);
      p.style.markerEnd = up ? "url(#mUp)" : down ? "url(#mDown)" : "url(#mDim)";
    });
    renderDetail(id, anc, desc);
    if (scroll) $("#map").scrollIntoView({ behavior: "smooth" });
  }

  function renderDetail(id, anc, desc) {
    const l = byId[id];
    const ch = chById[l.ch];
    const direct = new Set(l.pre);
    const chip = (k, isDirect) => `<button class="md-chip ch-${byId[k].ch}${isDirect ? " direct" : ""}" data-go="${k}" type="button">${k} ${byId[k].short}</button>`;
    const ancHtml = anc.size
      ? order(anc).map((k) => chip(k, direct.has(k))).join("")
      : `<span class="md-empty">没有先修课，可以直接开始。</span>`;
    const kids = children[id] || [];
    const descHtml = kids.length
      ? order(kids).map((k) => chip(k, true)).join("") +
        (desc.size > kids.length ? `<span class="md-empty">间接影响共 ${desc.size} 课</span>` : "")
      : `<span class="md-empty">这是一条支线的终点。</span>`;
    const lab = l.lab ? C.labs.find((x) => x.id === l.lab) : null;
    const el = $("#mapDetail");
    el.className = `map-detail ch-${l.ch}`;
    el.innerHTML = `
      <div class="md-main">
        <div class="md-top"><span class="md-id">${l.id}</span><span class="md-ch">${ch.no} ${ch.name}${l.gate ? " · 关卡课" : ""}</span></div>
        <h3>${l.title}</h3>
        <p class="md-core">${esc(l.core)}</p>
        <dl class="md-meta">
          <div><dt>数学难度</dt><dd>${pips(l.math)}</dd></div>
          <div><dt>考试重要程度</dt><dd>${pips(l.exam, 5, "★")}</dd></div>
          <div><dt>复习题</dt><dd>${l.review} 题</dd></div>
          <div><dt>预计时间</dt><dd>${fmtH(l.hours)} h</dd></div>
        </dl>
      </div>
      <div class="md-block"><h4>学它之前要先懂（实线框 = 直接先修）</h4><div class="md-chips">${ancHtml}</div></div>
      <div class="md-block"><h4>它会解锁</h4><div class="md-chips">${descHtml}</div></div>
      <div class="md-actions">
        <button class="mini-btn" type="button" data-card="${l.id}">在路线中查看</button>
        ${lab ? `<button class="mini-btn solid" type="button" data-lab="${lab.id}">打开实验：${lab.name}</button>` : ""}
      </div>`;
    renderMath(el);
    $$("[data-go]", el).forEach((b) => b.addEventListener("click", () => selectNode(b.dataset.go)));
    $$("[data-card]", el).forEach((b) => b.addEventListener("click", () => gotoCard(b.dataset.card)));
    $$("[data-lab]", el).forEach((b) => b.addEventListener("click", () => openLab(b.dataset.lab)));
  }

  /* ---------------- route ---------------- */
  const FILTERS = [
    { id: "all", label: "全部", test: () => true, cps: true },
    { id: "minimal", label: "最小必学路线", test: (l) => l.minimal },
    { id: "gate", label: "关卡课", test: (l) => l.gate },
    { id: "review", label: "复习题出现过", test: (l) => l.review > 0 },
    { id: "频", label: "【频】高频", test: (l) => (l.tags || []).includes("频") },
    { id: "混", label: "【混】易混", test: (l) => (l.tags || []).includes("混") },
    { id: "推", label: "【推】推导", test: (l) => (l.tags || []).includes("推") },
    { id: "拓", label: "【拓】拓展", test: (l) => (l.tags || []).includes("拓") },
    { id: "todo", label: "未学完", test: (l) => !done.has(l.id), cps: true },
  ];
  let filter = "all";

  function cardHtml(l, i) {
    const d = `--d:${Math.min(i * 0.04, 0.32).toFixed(2)}s`;
    if (l.checkpoint) {
      return `<article class="lesson-card checkpoint ch-${l.ch}${done.has(l.id) ? " done" : ""} reveal" id="card-${l.id}" data-id="${l.id}" style="${d}">
        <div class="lc-top"><span class="lc-id">${l.id}</span><div class="lc-badges"><span class="badge">章节训练</span></div></div>
        <h4>${l.title}</h4>
        <p class="lc-core">${l.core}</p>
        <dl class="lc-meta"><div><dt>时长</dt><dd>${fmtH(l.hours)} h</dd></div></dl>
        <div class="lc-foot"><label class="lc-check"><input type="checkbox" ${done.has(l.id) ? "checked" : ""} data-done="${l.id}"/>已完成</label></div>
      </article>`;
    }
    const badges = [
      l.gate ? `<span class="badge gate">关卡</span>` : "",
      l.minimal ? `<span class="badge min">必学</span>` : "",
      l.review ? `<span class="badge rev">复习题 ×${l.review}</span>` : "",
    ].join("");
    return `<article class="lesson-card ch-${l.ch}${done.has(l.id) ? " done" : ""} reveal" id="card-${l.id}" data-id="${l.id}" style="${d}">
      <div class="lc-top"><span class="lc-id">${l.id}</span><div class="lc-badges">${badges}</div></div>
      <h4>${l.title}</h4>
      <p class="lc-core">${esc(l.core)}</p>
      <dl class="lc-meta">
        <div><dt>数学</dt><dd>${pips(l.math)}</dd></div>
        <div><dt>考试</dt><dd>${pips(l.exam, 5, "★")}</dd></div>
        <div><dt>时长</dt><dd>${fmtH(l.hours)} h</dd></div>
      </dl>
      ${l.tags.length ? `<div class="lc-tags">${tagHtml(l.tags)}</div>` : ""}
      <div class="lc-foot">
        <label class="lc-check"><input type="checkbox" ${done.has(l.id) ? "checked" : ""} data-done="${l.id}"/>已学完</label>
        <button class="lc-link" type="button" data-map="${l.id}">地图</button>
        ${l.lab ? `<button class="lc-link" type="button" data-lab="${l.lab}">实验</button>` : ""}
      </div>
    </article>`;
  }

  function renderRoute() {
    const groups = [
      ...C.chapters.map((c) => ({ id: c.id, name: `${c.no} ${c.name}`, en: c.en })),
      { id: "all", name: "综合", en: "Synthesis" },
    ];
    $("#routeGroups").innerHTML = groups
      .map((g) => {
        const items = ALL.filter((l) => l.ch === g.id);
        const h = sum(items.map((l) => l.hours));
        return `<div class="route-group ch-${g.id}" data-group="${g.id}">
          <div class="rg-head reveal"><h3>${g.name}</h3><em>${g.en}</em><span>${items.length} 项 · ${fmtH(h)} h</span></div>
          <div class="lesson-grid">${items.map(cardHtml).join("")}</div>
        </div>`;
      })
      .join("");
    renderMath($("#routeGroups"));

    $("#routeGroups").addEventListener("change", (e) => {
      const id = e.target.dataset.done;
      if (!id) return;
      if (e.target.checked) done.add(id);
      else done.delete(id);
      save();
    });
    $("#routeGroups").addEventListener("click", (e) => {
      const m = e.target.closest("[data-map]");
      const lb = e.target.closest("[data-lab]");
      if (m) selectNode(m.dataset.map, true);
      if (lb) openLab(lb.dataset.lab);
    });
    renderFilters();
  }

  function renderFilters() {
    const row = $("#routeFilters");
    row.innerHTML = FILTERS.map((f) => {
      const n = f.cps ? ALL.filter(f.test).length : LESSONS.filter(f.test).length;
      return `<button class="chip" type="button" data-f="${f.id}" aria-pressed="${f.id === filter}">${f.label}<span class="cnt">${n}</span></button>`;
    }).join("");
    $$(".chip", row).forEach((b) =>
      b.addEventListener("click", () => {
        filter = b.dataset.f;
        renderFilters();
        applyFilter();
      })
    );
  }

  function applyFilter() {
    const f = FILTERS.find((x) => x.id === filter);
    $$(".lesson-card").forEach((card) => {
      const l = byId[card.dataset.id];
      const show = l.checkpoint ? !!f.cps && f.test(l) : f.test(l);
      card.hidden = !show;
      if (show) card.classList.add("in");
    });
    $$(".route-group").forEach((g) => {
      g.hidden = !$$(".lesson-card", g).some((c) => !c.hidden);
    });
  }

  function gotoCard(id) {
    if (filter !== "all") {
      filter = "all";
      renderFilters();
      applyFilter();
    }
    const card = $(`#card-${id}`);
    if (!card) return;
    card.classList.add("in");
    card.scrollIntoView({ behavior: "smooth", block: "center" });
    card.classList.remove("flash");
    void card.offsetWidth;
    card.classList.add("flash");
  }

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify([...done]));
    } catch (e) {
      /* 隐私模式下可能写不进 */
    }
    $$(".lesson-card").forEach((c) => {
      const on = done.has(c.dataset.id);
      c.classList.toggle("done", on);
      const box = $("input[data-done]", c);
      if (box) box.checked = on;
    });
    $$(".mnode").forEach((g) => {
      const dot = $("circle.donec", g);
      if (dot) dot.style.display = done.has(g.dataset.id) ? "block" : "none";
    });
    if (filter === "todo") {
      renderFilters();
      applyFilter();
    } else {
      renderFilters();
    }
    updateProgress();
  }

  function ring(frac, size, stroke, color) {
    const r = (size - stroke) / 2;
    const c = 2 * Math.PI * r;
    return `<svg viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(236,231,220,0.12)" stroke-width="${stroke}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round"
        stroke-dasharray="${(frac * c).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>`;
  }

  function updateProgress() {
    const total = ALL.length;
    const n = ALL.filter((l) => done.has(l.id)).length;
    const hAll = sum(ALL.map((l) => l.hours));
    const hDone = sum(ALL.filter((l) => done.has(l.id)).map((l) => l.hours));
    const next = ALL.find((l) => !done.has(l.id));
    $("#navProgress").innerHTML = `${ring(n / total, 26, 3, "#3fd0c9")}<span>${n}/${total}</span>`;
    $("#routeProgress").innerHTML = `
      ${ring(n / total, 54, 5, "#3fd0c9")}
      <div class="rp-text"><b>${n} / ${total} 项 · ${fmtH(hDone)} / ${fmtH(hAll)} h</b>
      <span>${next ? `下一项：${next.id} ${next.title}` : "全部完成"}</span></div>
      <button class="mini-btn" type="button" id="exportBtn">复制进度摘要</button>`;
    $("#exportBtn").addEventListener("click", exportProgress);
  }

  function exportProgress() {
    const doneList = ALL.filter((l) => done.has(l.id));
    const todoGates = LESSONS.filter((l) => l.gate && !done.has(l.id));
    const next = ALL.find((l) => !done.has(l.id));
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const text = [
      "# 学习进度摘要（振动 · 波动 · 波动光学）",
      `- 导出日期：${stamp}`,
      `- 已完成：${doneList.length ? doneList.map((l) => l.id).join("、") : "无"}（${doneList.length}/${ALL.length} 项，${fmtH(sum(doneList.map((l) => l.hours)))}/${fmtH(sum(ALL.map((l) => l.hours)))} h）`,
      `- 下一项：${next ? `${next.id} ${next.title}` : "全部完成"}`,
      `- 未完成的关卡课：${todoGates.length ? todoGates.map((l) => l.id).join("、") : "无"}`,
      "- 已掌握 / 未掌握 / 错题：见 振动波动光学_学习进度.md",
    ].join("\n");
    const ok = () => toast("进度摘要已复制，可以粘贴到新对话");
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, () => fallbackCopy(text, ok));
    } else fallbackCopy(text, ok);
  }
  function fallbackCopy(text, ok) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      ok();
    } catch (e) {
      toast("复制失败，请手动复制");
    }
    ta.remove();
  }

  /* ---------------- tree ---------------- */
  let treeTag = "all";
  function renderTree() {
    const grid = $("#treeGrid");
    grid.innerHTML = C.tree
      .map((col, ci) => {
        const ch = chById[col.ch];
        return `<div class="tree-col ch-${col.ch} reveal" style="--d:${(ci * 0.08).toFixed(2)}s">
          <div class="tc-head"><small>CH.0${ci + 1}</small><h3>${ch.name}</h3><em>${ch.en}</em></div>
          ${col.sections
            .map(
              (s) => `<details class="tsec" open><summary>${s.name}<span class="tcount">${s.items.length}</span></summary>
                <ul>${s.items
                  .map((it) => `<li class="titem" data-tags="${(it.g || []).join(",")}">${esc(it.t)}${it.g ? `<span class="tags">${tagHtml(it.g)}</span>` : ""}</li>`)
                  .join("")}</ul></details>`
            )
            .join("")}
        </div>`;
      })
      .join("");
    renderMath(grid);
    renderTreeFilters();
  }
  function renderTreeFilters() {
    const row = $("#treeFilters");
    const items = $$(".titem");
    const opts = [["all", "全部"], ...Object.entries(C.tags).map(([k, v]) => [k, `【${k}】${v}`])];
    row.innerHTML = opts
      .map(([k, label]) => {
        const n = k === "all" ? items.length : items.filter((i) => i.dataset.tags.split(",").includes(k)).length;
        return `<button class="chip" type="button" data-tag="${k}" aria-pressed="${k === treeTag}">${label}<span class="cnt">${n}</span></button>`;
      })
      .join("");
    $$(".chip", row).forEach((b) =>
      b.addEventListener("click", () => {
        treeTag = b.dataset.tag;
        const grid = $("#treeGrid");
        grid.classList.toggle("filtering", treeTag !== "all");
        $$(".titem").forEach((i) => i.classList.toggle("match", treeTag !== "all" && i.dataset.tags.split(",").includes(treeTag)));
        $$(".tsec").forEach((d) => (d.open = true));
        renderTreeFilters();
      })
    );
  }

  /* ---------------- pitfalls ---------------- */
  function renderPitfalls() {
    const core = $("#coreList");
    core.innerHTML = C.core.map((c) => `<li><b>${esc(c.t)}</b><span>${esc(c.why)}</span><small>${c.at}</small></li>`).join("");
    const grid = $("#flipGrid");
    grid.innerHTML = C.mistakes
      .map(
        (m, i) => `<button class="flip reveal" type="button" aria-pressed="false" style="--d:${Math.min(i * 0.05, 0.35).toFixed(2)}s">
          <span class="flip-inner">
            <span class="flip-face flip-front"><span class="flip-k"><b>错误想法</b><span>${String(i + 1).padStart(2, "0")}</span></span><span class="flip-txt">${esc(m.wrong)}</span><span class="flip-hint">先说出错在哪，再点击翻面</span></span>
            <span class="flip-face flip-back"><span class="flip-k"><b>正确理解</b><span>${String(i + 1).padStart(2, "0")}</span></span><span class="flip-txt">${esc(m.right)}</span></span>
          </span>
        </button>`
      )
      .join("");
    $$(".flip", grid).forEach((b) =>
      b.addEventListener("click", () => {
        const on = !b.classList.contains("on");
        b.classList.toggle("on", on);
        b.setAttribute("aria-pressed", String(on));
      })
    );
    $("#extraNote").innerHTML = "另外两个常见错误：" + C.extraMistakes.map(esc).join("；") + "。";
    renderMath(core);
    renderMath(grid);
    renderMath($("#extraNote"));
  }

  /* ---------------- time ---------------- */
  function renderTime() {
    const rows = [...C.chapters.map((c) => ({ id: c.id, name: c.name })), { id: "all", name: "综合" }].map((g) => {
      const items = ALL.filter((l) => l.ch === g.id);
      return { ...g, lesson: sum(items.filter((l) => !l.checkpoint).map((l) => l.hours)), test: sum(items.filter((l) => l.checkpoint).map((l) => l.hours)) };
    });
    const max = Math.max(...rows.map((r) => r.lesson + r.test));
    const total = sum(rows.map((r) => r.lesson + r.test));
    $("#timeBars").innerHTML = `
      ${rows
        .map(
          (r) => `<div class="tb-row ch-${r.id}"><span class="tb-name">${r.name}</span>
            <div class="tb-track"><span class="tb-seg lesson" style="width:${((r.lesson / max) * 100).toFixed(1)}%"></span><span class="tb-seg test" style="width:${((r.test / max) * 100).toFixed(1)}%"></span></div>
            <span class="tb-val">${fmtH(r.lesson + r.test)} h</span></div>`
        )
        .join("")}
      <div class="tb-legend"><span><i></i>讲授课时</span><span><i class="t"></i>章节训练 / 综合</span></div>
      <div class="tb-total"><span>完整路线合计（⚠️估计值）</span><b>≈ ${fmtH(total)} h</b></div>`;

    const minimal = LESSONS.filter((l) => l.minimal);
    const minH = sum(minimal.map((l) => l.hours));
    $("#pace").innerHTML = `
      <h3>按你的节奏换算</h3>
      <p>拖动每周可投入的学习时间，看两条路线大约要几周。</p>
      <label class="ctl"><span class="ctl-head"><span class="ctl-name">每周学习时间</span><output class="ctl-val" id="paceVal"></output></span>
        <input type="range" id="paceIn" min="2" max="21" step="1" value="8"/></label>
      <div class="pace-out">
        <div class="pace-card"><small>完整路线 · ${fmtH(total)} h</small><b id="paceFull"></b><span>周</span></div>
        <div class="pace-card"><small>最小必学路线 · ${fmtH(minH)} h</small><b id="paceMin"></b><span>周（不含章测）</span></div>
      </div>
      <div class="route-list"><b>最小必学路线</b>（时间紧时用）：<code>${minimal.map((l) => l.id).join(" ")}</code></div>`;
    const inp = $("#paceIn");
    const upd = () => {
      const h = +inp.value;
      $("#paceVal").textContent = `${h} h / 周（约每天 ${(h / 7).toFixed(1)} h）`;
      $("#paceFull").textContent = (total / h).toFixed(1);
      $("#paceMin").textContent = (minH / h).toFixed(1);
    };
    inp.addEventListener("input", upd);
    upd();
  }

  function renderFooter() {
    $("#evidenceList").innerHTML = C.evidence.map((e) => `<li>${esc(e)}</li>`).join("");
    $("#footerMeta").textContent = `课程大纲 v1 · 更新于 ${C.meta.updated}`;
    $("#localFiles").hidden = !["localhost", "127.0.0.1", ""].includes(location.hostname);
  }

  /* ---------------- labs bridge ---------------- */
  function openLab(id) {
    if (window.Labs) window.Labs.show(id);
    $("#lab").scrollIntoView({ behavior: "smooth" });
  }

  /* ---------------- reveal + scroll spy ---------------- */
  function setupReveal() {
    const els = $$(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }),
      { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
    );
    els.forEach((e) => io.observe(e));
    // 兜底：防止任何元素停在透明状态
    setTimeout(() => els.forEach((e) => e.classList.add("in")), 4000);

    const links = $$(".nav-links a");
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (en.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${en.target.id}`));
        }),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    $$("main .section").forEach((s) => spy.observe(s));
  }

  /* ---------------- boot ---------------- */
  renderHeroStats();
  renderPhaseBand();
  renderMap();
  renderRoute();
  renderTree();
  renderPitfalls();
  renderTime();
  renderFooter();
  updateProgress();
  if (window.Labs) {
    window.Labs.init({ tabs: $("#labTabs"), stage: $("#labStage"), labs: C.labs });
    window.Labs.hero($("#rippleCanvas"));
  }
  setupReveal();
})();
