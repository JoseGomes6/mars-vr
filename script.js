/* A Journey Across Mars */

const SCENES = [
  {
    id: "perseverance",
    title: "PERSEVERANCE",
    location: "Mars · Perseverance rover, Sol 1500",
    image: "assets/scenes/perseverance.jpg",
    heading: 30,
    portal: {
      label: "CONTINUE TO GALE CRATER →",
      to: "curiosity",
      icon: "forward",
      yaw: -44,
      pitch: -5,
    },
    panel: {
      yaw: -6,
      pitch: 11,
      title: "Perseverance on Mars",
      text: "Perseverance landed in Jezero crater in February 2021 to search for signs of ancient microbial life and to collect rock samples for a future return to Earth. This selfie celebrates 1,500 Martian days (sols) on the planet.",
      tags: ["Landed 2021", "Sol 1500", "NASA / JPL"],
    },
  },
  {
    id: "curiosity",
    title: "CURIOSITY",
    location: "Mars · Gale Crater",
    image: "assets/scenes/curiosity.jpg",
    heading: -50,
    portal: {
      label: "ENTER RAUNA CRATER →",
      to: "rauna",
      icon: "forward",
      yaw: -48,
      pitch: -8,
    },
    panel: {
      yaw: -8,
      pitch: 14,
      title: "Curiosity in the Dust",
      text: "Curiosity landed in Gale crater in August 2012 to find out whether Mars was ever able to support life. This self-portrait was assembled from photos taken in 2018 (sol 2082), while a dust storm darkened the Martian sky.",
      tags: ["Landed 2012", "Gale crater", "Sol 2082"],
    },
  },
  {
    id: "rauna",
    title: "RAUNA CRATER",
    location: "Mars · Mare Acidalium",
    image: "assets/scenes/rauna.jpg",
    heading: 0,
    portal: {
      label: "RETURN TO JEZERO →",
      to: "perseverance",
      icon: "return",
      yaw: 34,
      pitch: -12,
    },
    panel: {
      yaw: -30,
      pitch: 12,
      title: "A View from Orbit Data",
      text: "This is not a photograph: it was rendered by Kevin M. Gill from elevation and image data of Rauna Crater taken by the HiRISE camera on NASA’s Mars Reconnaissance Orbiter, showing how the crater would look from the ground.",
      tags: ["HiRISE · MRO", "Rendered view", "Mare Acidalium"],
    },
  },
];

const PORTAL_RADIUS = 4.6;
const PANEL_RADIUS = 3.5;
const PANEL_W = 2.4;
const FUSE_MS = 1800;
const FADE_OUT_MS = 800;
const FADE_IN_MS = 1000;

const C = {
  ink: "#140b08",
  ink2: "#26140e",
  cream: "#f6e9dc",
  sand: "#e0c3a8",
  accent: "#e0793a",
  accentSoft: "#f2a56b",
  teal: "#7fd1c7",
  hud: "#6fdcff",
  hudText: "#e8f4ff",
  hudDim: "#9fb4c9",
};
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO =
  'ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';
const SANS =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const PX_PER_M = 500;

const $ = (id) => document.getElementById(id);

function sph(yaw, pitch, r) {
  const t = THREE.MathUtils.degToRad(yaw),
    p = THREE.MathUtils.degToRad(pitch);
  return `${(r * Math.sin(t) * Math.cos(p)).toFixed(3)} ${(r * Math.sin(p)).toFixed(3)} ${(-r * Math.cos(t) * Math.cos(p)).toFixed(3)}`;
}

const faceViewer = (yaw, pitch) => `${pitch} ${-yaw} 0`;

function el(tag, attrs = {}, parent) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
}

const smooth = (k) => k * k * (3 - 2 * k);
const tween = (ms, fn) =>
  new Promise((resolve) => {
    const t0 = performance.now();
    (function step(now) {
      const k = Math.min(1, (now - t0) / ms);
      fn(smooth(k));
      k < 1 ? requestAnimationFrame(step) : resolve();
    })(t0);
  });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function refreshRaycasters() {
  document
    .querySelectorAll("[raycaster]")
    .forEach(
      (e) => e.components.raycaster && e.components.raycaster.refreshObjects(),
    );
}

function addHover(target, grow = 1.12, scaleEl = target) {
  const to = (s) =>
    scaleEl.setAttribute("animation__hover", {
      property: "scale",
      to: `${s} ${s} ${s}`,
      dur: 200,
      easing: "easeOutQuad",
    });
  target.addEventListener("mouseenter", () => to(grow));
  target.addEventListener("mouseleave", () => to(1));
}

AFRAME.registerComponent("canvas-plane", {
  schema: {
    width: { default: 1 },
    height: { default: 1 },
    additive: { default: false },
  },
  init() {
    const tex = new THREE.CanvasTexture(this.el.canvasSource);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      side: THREE.DoubleSide,
      toneMapped: false,
      depthWrite: false,
    });
    if (this.data.additive) mat.blending = THREE.AdditiveBlending;
    this.el.setObject3D(
      "mesh",
      new THREE.Mesh(
        new THREE.PlaneGeometry(this.data.width, this.data.height),
        mat,
      ),
    );
  },
  remove() {
    this.el.removeObject3D("mesh");
  },
});

function canvasPlane(parent, canvas, wM, hM, attrs = {}, additive = false) {
  const e = document.createElement("a-entity");
  e.canvasSource = canvas;
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  e.setAttribute("canvas-plane", { width: wM, height: hM, additive });
  parent.appendChild(e);
  return e;
}

function makeCanvas(wM, hM) {
  const c = document.createElement("canvas");
  c.width = Math.round(wM * PX_PER_M);
  c.height = Math.round(hM * PX_PER_M);
  return c;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function spaced(ctx, px) {
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

function wrapLines(ctx, text, maxW) {
  const lines = [];
  let line = "";
  text.split(" ").forEach((word) => {
    const t = line ? `${line} ${word}` : word;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = word;
    } else line = t;
  });
  if (line) lines.push(line);
  return lines;
}

const probeCtx = document.createElement("canvas").getContext("2d");

function glowCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
  g.addColorStop(0, "rgba(111,220,255,0)");
  g.addColorStop(0.55, "rgba(111,220,255,0.26)");
  g.addColorStop(0.78, "rgba(111,220,255,0.10)");
  g.addColorStop(1, "rgba(111,220,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return c;
}

function portalRingCanvas() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const ctx = c.getContext("2d");
  ctx.translate(256, 256);
  glow(ctx, C.hud, 12);
  ctx.strokeStyle = C.hud;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(0, 0, 214, i * 2.094 + 0.18, i * 2.094 + 1.62);
    ctx.stroke();
  });
  noGlow(ctx);
  ctx.strokeStyle = "rgba(111,220,255,.55)";
  ctx.lineWidth = 3;
  ctx.lineCap = "butt";
  for (let i = 0; i < 72; i++) {
    // ticks, longer every 6th
    const a = (i / 72) * Math.PI * 2,
      r0 = 238,
      r1 = i % 6 === 0 ? 254 : 246;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.stroke();
  }
  return c;
}

function portalIconCanvas(kind) {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  glow(ctx, C.hud, 14);
  ctx.strokeStyle = C.hudText;
  ctx.lineWidth = 13;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (kind === "return") {
    const r = 58,
      a0 = Math.PI * 0.2,
      a1 = Math.PI * 1.7;
    ctx.beginPath();
    ctx.arc(128, 128, r, a0, a1);
    ctx.stroke();
    const ex = 128 + r * Math.cos(a1),
      ey = 128 + r * Math.sin(a1);
    const dx = -Math.sin(a1),
      dy = Math.cos(a1);
    const nx = -dy,
      ny = dx;
    ctx.beginPath();
    ctx.moveTo(ex - dx * 14 + nx * 20, ey - dy * 14 + ny * 20);
    ctx.lineTo(ex + dx * 14, ey + dy * 14);
    ctx.lineTo(ex - dx * 14 - nx * 20, ey - dy * 14 - ny * 20);
    ctx.stroke();
  } else {
    [0, 46].forEach((dy) => {
      ctx.globalAlpha = dy ? 0.55 : 1;
      ctx.beginPath();
      ctx.moveTo(78, 100 + dy);
      ctx.lineTo(128, 50 + dy);
      ctx.lineTo(178, 100 + dy);
      ctx.stroke();
    });
  }
  return c;
}

function labelCanvas(text) {
  const font = `600 32px ${MONO}`;
  probeCtx.font = font;
  spaced(probeCtx, 4);
  const w = (probeCtx.measureText(text).width + 100) / PX_PER_M,
    h = 0.3;
  const c = makeCanvas(w, h),
    ctx = c.getContext("2d");
  const m = 6;
  chamfer(ctx, m, m, c.width - 2 * m, c.height - 2 * m, 22);
  ctx.fillStyle = "rgba(5,9,20,.9)";
  ctx.fill();
  glow(ctx, C.hud, 10);
  ctx.strokeStyle = "rgba(111,220,255,.9)";
  ctx.lineWidth = 3;
  ctx.stroke();
  noGlow(ctx);
  ctx.font = font;
  spaced(ctx, 4);
  ctx.fillStyle = C.hudText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, c.width / 2 + 2, c.height / 2 + 2);
  return { canvas: c, w, h };
}

function seeded(seed) {
  let x = seed;
  return () => ((x = (x * 16807) % 2147483647) - 1) / 2147483646;
}

function chamfer(ctx, x, y, w, h, cut) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - cut, y);
  ctx.lineTo(x + w, y + cut);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + cut, y + h);
  ctx.lineTo(x, y + h - cut);
  ctx.closePath();
}

function glow(ctx, colour, blur) {
  ctx.shadowColor = colour;
  ctx.shadowBlur = blur;
}
function noGlow(ctx) {
  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";
}

function panelCanvas(index, scene) {
  const { title, text, tags } = scene.panel;
  const w = PANEL_W * PX_PER_M,
    padX = 68,
    bodyPx = 31,
    lineH = 46;

  probeCtx.font = `400 ${bodyPx}px ${SANS}`;
  spaced(probeCtx, 0);
  const lines = wrapLines(probeCtx, text, w - padX * 2);
  const bodyTop = 262;
  const tagsY = bodyTop + lines.length * lineH + 22;
  const h = tagsY + 48 + 74;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const m = 8,
    cut = 40;

  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, "rgba(5,9,20,.9)");
  bg.addColorStop(1, "rgba(14,24,46,.88)");
  chamfer(ctx, m, m, w - 2 * m, h - 2 * m, cut);
  ctx.fillStyle = bg;
  ctx.fill();

  ctx.save();
  chamfer(ctx, m, m, w - 2 * m, h - 2 * m, cut);
  ctx.clip();
  const rnd = seeded(index * 977 + 13);
  for (let i = 0; i < 70; i++) {
    ctx.fillStyle = `rgba(210,235,255,${(0.12 + rnd() * 0.4).toFixed(2)})`;
    const r = 0.8 + rnd() * 1.7;
    ctx.beginPath();
    ctx.arc(m + rnd() * (w - 2 * m), m + rnd() * (h - 2 * m), r, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(111,220,255,.035)";
  for (let y = m; y < h; y += 7) ctx.fillRect(m, y, w - 2 * m, 1);
  const sheen = ctx.createLinearGradient(0, 0, 0, 160);
  sheen.addColorStop(0, "rgba(111,220,255,.12)");
  sheen.addColorStop(1, "rgba(111,220,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(m, m, w - 2 * m, 160);
  ctx.restore();

  chamfer(ctx, m, m, w - 2 * m, h - 2 * m, cut);
  ctx.strokeStyle = "rgba(111,220,255,.35)";
  ctx.lineWidth = 2;
  ctx.stroke();
  glow(ctx, C.hud, 14);
  ctx.strokeStyle = C.hud;
  ctx.lineWidth = 5;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(m + 70, m);
  ctx.lineTo(m, m);
  ctx.lineTo(m, m + 70);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(w - m - 70, h - m);
  ctx.lineTo(w - m, h - m);
  ctx.lineTo(w - m, h - m - 70);
  ctx.stroke();
  noGlow(ctx);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  glow(ctx, C.hud, 10);
  ctx.fillStyle = C.hud;
  ctx.fillRect(padX, 62, 14, 14);
  noGlow(ctx);
  ctx.font = `600 23px ${MONO}`;
  spaced(ctx, 5);
  ctx.fillStyle = C.hud;
  ctx.fillText(
    `MISSION LOG ${String(index + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`,
    padX + 30,
    77,
  );
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(159,180,201,.8)";
  ctx.font = `400 21px ${MONO}`;
  spaced(ctx, 4);
  ctx.fillText("360° VIEW", w - 190, 77);

  ctx.textAlign = "left";
  ctx.font = `600 50px ${SANS}`;
  spaced(ctx, 3);
  ctx.fillStyle = C.hudText;
  ctx.fillText(title.toUpperCase(), padX, 160);
  ctx.fillStyle = "rgba(111,220,255,.22)";
  ctx.fillRect(padX, 196, w - 2 * padX, 2);
  glow(ctx, C.hud, 10);
  ctx.fillStyle = C.hud;
  ctx.fillRect(padX, 194, 130, 6);
  noGlow(ctx);

  ctx.font = `400 ${bodyPx}px ${SANS}`;
  spaced(ctx, 0);
  ctx.fillStyle = C.hudText;
  ctx.globalAlpha = 0.88;
  lines.forEach((l, i) => ctx.fillText(l, padX, bodyTop + i * lineH));
  ctx.globalAlpha = 1;

  let x = padX;
  ctx.font = `600 21px ${MONO}`;
  spaced(ctx, 2);
  tags.forEach((t) => {
    const label = t.toUpperCase();
    const tw = ctx.measureText(label).width + 44;
    chamfer(ctx, x, tagsY, tw, 48, 12);
    ctx.fillStyle = "rgba(111,220,255,.09)";
    ctx.fill();
    ctx.strokeStyle = "rgba(111,220,255,.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = C.hud;
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + 22, tagsY + 26);
    x += tw + 14;
  });

  ctx.fillStyle = "rgba(111,220,255,.3)";
  for (let tx = padX, i = 0; tx < w - padX - 80; tx += 22, i++)
    ctx.fillRect(tx, h - 46, 2, i % 5 === 0 ? 14 : 7);
  return { canvas: c, w: PANEL_W, h: h / PX_PER_M };
}

function closeButtonCanvas() {
  const c = makeCanvas(0.4, 0.4),
    ctx = c.getContext("2d");
  chamfer(ctx, 14, 14, 172, 172, 36);
  ctx.fillStyle = "rgba(5,9,20,.95)";
  ctx.fill();
  glow(ctx, C.hud, 14);
  ctx.strokeStyle = C.hud;
  ctx.lineWidth = 6;
  ctx.stroke();
  noGlow(ctx);
  ctx.strokeStyle = C.hudText;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(72, 72);
  ctx.lineTo(128, 128);
  ctx.moveTo(128, 72);
  ctx.lineTo(72, 128);
  ctx.stroke();
  return c;
}

function infoButtonCanvas() {
  const c = makeCanvas(0.5, 0.5),
    ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(5,9,20,.95)";
  ctx.beginPath();
  ctx.arc(125, 125, 112, 0, 7);
  ctx.fill();
  glow(ctx, C.hud, 16);
  ctx.strokeStyle = C.hud;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(125, 125, 104, 0, 7);
  ctx.stroke();
  noGlow(ctx);
  ctx.strokeStyle = "rgba(111,220,255,.45)";
  ctx.lineWidth = 4;
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(125, 125, 118, i * 2.09 + 0.2, i * 2.09 + 1.5);
    ctx.stroke();
  });
  ctx.fillStyle = C.hudText;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 120px ${MONO}`;
  ctx.fillText("i", 125, 132);
  return c;
}

function buildPortal(world, scene) {
  const { portal } = scene;
  const root = el(
    "a-entity",
    {
      position: sph(portal.yaw, portal.pitch, PORTAL_RADIUS),
      rotation: faceViewer(portal.yaw, portal.pitch),
    },
    world,
  );
  const body = el(
    "a-entity",
    {
      animation:
        "property: position; from: 0 -0.03 0; to: 0 0.04 0; dir: alternate; loop: true; dur: 3600; easing: easeInOutSine",
    },
    root,
  );

  canvasPlane(body, glowCanvas(), 1.9, 1.9, { position: "0 0 -0.01" }, true); // soft light

  el(
    "a-ring",
    {
      "radius-inner": 0.5,
      "radius-outer": 0.52,
      color: C.hud,
      shader: "flat",
      position: "0 0 0.005",
      material: "transparent: true; opacity: 0.5",
      animation:
        "property: scale; from: 1 1 1; to: 1.45 1.45 1.45; dur: 2600; loop: true; easing: easeOutQuad",
      animation__fade:
        "property: components.material.material.opacity; from: 0.5; to: 0; dur: 2600; loop: true; easing: easeOutQuad",
    },
    body,
  );

  canvasPlane(body, portalRingCanvas(), 1.28, 1.28, {
    position: "0 0 0.008",
    animation:
      "property: rotation; to: 0 0 -360; dur: 60000; loop: true; easing: linear",
  });

  const orbit = el(
    "a-entity",
    {
      animation:
        "property: rotation; to: 0 0 360; dur: 40000; loop: true; easing: linear",
    },
    body,
  );
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    el(
      "a-sphere",
      {
        radius: 0.01 + (i % 3) * 0.004,
        "segments-width": 8,
        "segments-height": 6,
        color: i % 4 === 0 ? C.hudText : C.hud,
        shader: "flat",
        position: `${(Math.cos(a) * 0.74).toFixed(3)} ${(Math.sin(a) * 0.74).toFixed(3)} 0.01`,
        material: `transparent: true; opacity: ${0.4 + (i % 4) * 0.15}`,
      },
      orbit,
    );
  }

  const ring = el(
    "a-ring",
    {
      "radius-inner": 0.42,
      "radius-outer": 0.445,
      color: C.hud,
      shader: "flat",
      position: "0 0 0.01",
    },
    body,
  );
  const disc = el(
    "a-circle",
    {
      class: "clickable",
      radius: 0.42,
      color: "#050914",
      shader: "flat",
      material: "transparent: true; opacity: 0.72; side: double",
    },
    body,
  );
  const icon = canvasPlane(body, portalIconCanvas(portal.icon), 0.5, 0.5, {
    position: "0 0 0.02",
  });

  const progress = el(
    "a-ring",
    {
      "radius-inner": 0.58,
      "radius-outer": 0.62,
      color: C.accent,
      shader: "flat",
      visible: false,
      position: "0 0 0.02",
      "theta-start": 90,
      "theta-length": 0.1,
    },
    body,
  );

  const label = labelCanvas(portal.label);
  const labelEl = canvasPlane(root, label.canvas, label.w, label.h, {
    position: "0 -0.95 0.02",
  });

  const hoverOn = () => {
    ring.setAttribute("color", C.hudText);
    disc.setAttribute("material", "opacity", 0.88);
    labelEl.setAttribute("animation__hover", {
      property: "scale",
      to: "1.08 1.08 1.08",
      dur: 200,
    });
    icon.setAttribute("animation__hover", {
      property: "scale",
      to: "1.2 1.2 1.2",
      dur: 250,
    });
  };
  const hoverOff = () => {
    ring.setAttribute("color", C.hud);
    disc.setAttribute("material", "opacity", 0.7);
    labelEl.setAttribute("animation__hover", {
      property: "scale",
      to: "1 1 1",
      dur: 200,
    });
    icon.setAttribute("animation__hover", {
      property: "scale",
      to: "1 1 1",
      dur: 250,
    });
    progress.removeAttribute("animation__fuse");
    progress.setAttribute("geometry", "thetaLength", 0.1);
    progress.setAttribute("visible", false);
  };
  addHover(disc, 1.1, root);
  disc.addEventListener("mouseenter", hoverOn);
  disc.addEventListener("mouseleave", hoverOff);
  disc.addEventListener("fusing", () => {
    progress.setAttribute("visible", true);
    progress.setAttribute("animation__fuse", {
      property: "geometry.thetaLength",
      from: 0.1,
      to: 360,
      dur: FUSE_MS,
      easing: "linear",
    });
  });
  disc.addEventListener("click", () => {
    root.setAttribute("animation__burst", {
      property: "scale",
      to: "1.5 1.5 1.5",
      dur: FADE_OUT_MS,
      easing: "easeInQuad",
    });
    changeScene(portal.to);
  });
}

let panelOpen = true;
let panelEntities = null;

function setPanelOpen(open) {
  panelOpen = open;
  if (!panelEntities) return;
  const { panel, closeBtn, infoBtn } = panelEntities;
  panel.setAttribute("visible", open);
  closeBtn.setAttribute("class", open ? "clickable" : "");
  infoBtn.setAttribute("visible", !open);
  infoBtn.setAttribute("class", open ? "" : "clickable");
  refreshRaycasters();
}

function buildPanel(world, scene, index) {
  const { yaw, pitch } = scene.panel;
  const root = el(
    "a-entity",
    {
      position: sph(yaw, pitch, PANEL_RADIUS),
      rotation: faceViewer(yaw, pitch),
    },
    world,
  );

  const pc = panelCanvas(index, scene);
  const panel = el("a-entity", {}, root);
  canvasPlane(panel, pc.canvas, pc.w, pc.h);

  const closeBtn = canvasPlane(panel, closeButtonCanvas(), 0.26, 0.26, {
    class: "clickable",
    position: `${pc.w / 2 - 0.19} ${pc.h / 2 - 0.19} 0.03`,
  });
  const infoBtn = canvasPlane(root, infoButtonCanvas(), 0.4, 0.4, {
    visible: false,
    animation__pulse:
      "property: scale; from: 1 1 1; to: 1.08 1.08 1.08; dir: alternate; loop: true; dur: 1400; easing: easeInOutSine",
  });

  addHover(closeBtn, 1.18);
  addHover(infoBtn, 1.15, infoBtn);
  closeBtn.addEventListener("click", () => setPanelOpen(false));
  infoBtn.addEventListener("click", () => setPanelOpen(true));

  panelEntities = { panel, closeBtn, infoBtn };
  setPanelOpen(true);
}

let currentIndex = -1;
let busy = false;

const loadImage = (src) =>
  new Promise((res) => {
    const i = new Image();
    i.onload = i.onerror = res;
    i.src = src;
  });

function showScene(index) {
  const scene = SCENES[index];
  const world = $("world");
  world.innerHTML = "";
  panelEntities = null;

  $("sky").setAttribute("rotation", `0 ${scene.heading - 90} 0`);
  $("sky").setAttribute("material", {
    shader: "flat",
    src: scene.image,
    color: "#fff",
  });

  $("hud-count").textContent =
    `${String(index + 1).padStart(2, "0")} / ${String(SCENES.length).padStart(2, "0")}`;
  $("hud-title").textContent = scene.title;
  $("hud-location").textContent = scene.location;
  document.title = `${scene.title} · A Journey Across Mars`;
  buildPanel(world, scene, index);
  buildPortal(world, scene);
  currentIndex = index;
  setTimeout(refreshRaycasters, 60);
}

async function changeScene(id) {
  const index =
    typeof id === "number" ? id : SCENES.findIndex((s) => s.id === id);
  if (busy || index < 0 || index === currentIndex) return;
  busy = true;
  const fade = (o) => $("fade").setAttribute("material", "opacity", o);
  const first = currentIndex < 0;
  await Promise.all([
    first ? Promise.resolve() : tween(FADE_OUT_MS, (k) => fade(k)),
    loadImage(SCENES[index].image),
  ]);
  showScene(index);
  await wait(250);
  await tween(FADE_IN_MS, (k) => fade(1 - k));
  busy = false;
}

window.addEventListener("DOMContentLoaded", () => {
  const sceneEl = $("scene");
  const reticle = $("reticle");
  let inVR = false,
    controllers = 0;

  SCENES.forEach((s) => loadImage(s.image));

  const updateReticle = () => {
    const on = inVR && controllers === 0;
    reticle.setAttribute("visible", on);
    reticle.setAttribute("raycaster", "enabled", on);
  };
  sceneEl.addEventListener("enter-vr", () => {
    inVR = true;
    updateReticle();
  });
  sceneEl.addEventListener("exit-vr", () => {
    inVR = false;
    updateReticle();
  });
  ["hand-l", "hand-r"].forEach((id) => {
    const h = $(id);
    h.addEventListener("controllerconnected", () => {
      controllers++;
      updateReticle();
    });
    h.addEventListener("controllerdisconnected", () => {
      controllers = Math.max(0, controllers - 1);
      updateReticle();
    });
  });

  const begin = () => {
    $("intro").classList.add("hidden");
    $("hud").classList.remove("hidden");
    const hint = $("hint");
    hint.classList.remove("hidden");
    setTimeout(() => hint.classList.add("hidden"), 7000);
    changeScene(0);
  };
  const whenReady = (fn) =>
    sceneEl.hasLoaded
      ? fn()
      : sceneEl.addEventListener("loaded", fn, { once: true });

  $("start").addEventListener("click", () => whenReady(begin));
  $("btn-menu").addEventListener("click", () => {
    $("intro").classList.remove("hidden");
    $("hud").classList.add("hidden");
    $("hint").classList.add("hidden");
  });
  $("btn-info").addEventListener("click", () => setPanelOpen(!panelOpen));
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyI" && !$("hud").classList.contains("hidden"))
      setPanelOpen(!panelOpen);
  });

  if (navigator.xr && navigator.xr.isSessionSupported) {
    navigator.xr
      .isSessionSupported("immersive-vr")
      .then((ok) => {
        if (!ok) return;
        const btn = $("start-vr");
        btn.hidden = false;
        btn.addEventListener("click", () =>
          whenReady(() => {
            begin();
            sceneEl.enterVR();
          }),
        );
      })
      .catch(() => {});
  }
});
