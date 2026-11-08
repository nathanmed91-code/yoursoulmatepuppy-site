// The one 3D moment on the site: the hero photo becomes a quiet scene. A shaft of morning window
// light drifts across it, dust motes catch that light, and the frame leans gently toward the
// pointer. Loaded only on capable devices with motion allowed; the plain photo is the fallback.
import {
  AdditiveBlending, BufferAttribute, BufferGeometry, Mesh, OrthographicCamera, PlaneGeometry, Points,
  SRGBColorSpace, Scene, ShaderMaterial, TextureLoader, Vector2, WebGLRenderer,
} from "https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js";

const SHAFT = /* glsl */ `
  // Diagonal light band from the upper left, its edge softly breathing over time.
  float shaft(vec2 p, float t) {
    vec2 dir = normalize(vec2(0.82, -0.57));
    float d = dot(p - vec2(-0.15, 1.05), vec2(-dir.y, dir.x));
    float along = dot(p - vec2(-0.15, 1.05), dir);
    float width = 0.26 + 0.035 * sin(t * 0.21) + 0.02 * sin(along * 6.0 + t * 0.35);
    float band = smoothstep(width, 0.0, abs(d - 0.05 * sin(t * 0.12)));
    return band * smoothstep(1.6, 0.1, along);
  }
`;

export default function startHero(stage: HTMLElement): () => void {
  const photo = stage.querySelector("img") as HTMLImageElement | null;
  const src = photo?.currentSrc || photo?.src;
  if (!src) return () => {};

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  } catch {
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 10);
  camera.position.z = 1;

  const uniforms = {
    uTex: { value: null as any },
    uImgAspect: { value: 1376 / 768 },
    uViewAspect: { value: 1 },
    uTime: { value: 0 },
    uPointer: { value: new Vector2() },
    uIn: { value: 0 },
  };

  const plate = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      precision highp float;
      uniform sampler2D uTex; uniform float uImgAspect, uViewAspect, uTime, uIn; uniform vec2 uPointer;
      varying vec2 vUv;
      ${SHAFT}
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main() {
        vec2 uv = vUv - 0.5;
        // object-fit: cover
        if (uViewAspect > uImgAspect) uv.y *= uImgAspect / uViewAspect; else uv.x *= uViewAspect / uImgAspect;
        float zoom = 1.06 - 0.02 * uIn;
        uv = uv / zoom + 0.5 + uPointer * vec2(-0.012, 0.009);
        vec3 col = texture2D(uTex, uv).rgb;
        float s = shaft(vec2(vUv.x, vUv.y), uTime) * uIn;
        vec3 warm = vec3(1.0, 0.9, 0.74);
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col += warm * s * (0.10 + 0.22 * lum);
        col = mix(col, col * vec3(1.02, 0.99, 0.95), 0.5);
        float v = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(1.0, 1.2)));
        col *= mix(0.86, 1.0, v);
        col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.018;
        gl_FragColor = vec4(col, 1.0);
      }`,
  }));
  scene.add(plate);

  // Dust motes: drift slowly upward and only glow where the light shaft touches them.
  const COUNT = innerWidth < 700 ? 90 : 170;
  const seeds = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT * 3; i++) seeds[i] = Math.random();
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(COUNT * 3), 3));
  geo.setAttribute("seed", new BufferAttribute(seeds, 3));
  const motes = new Points(geo, new ShaderMaterial({
    uniforms: { ...uniforms, uPx: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: AdditiveBlending,
    vertexShader: /* glsl */ `
      uniform float uTime, uIn, uPx; uniform vec2 uPointer; attribute vec3 seed; varying float vGlow;
      ${SHAFT}
      void main() {
        float depth = 0.25 + seed.z * 0.75;
        vec2 p = vec2(seed.x, fract(seed.y + uTime * (0.006 + 0.01 * depth)));
        p.x += 0.02 * sin(uTime * 0.3 + seed.y * 30.0);
        vec2 uv = p;
        p = p * 2.0 - 1.0 + uPointer * 0.04 * depth;
        vGlow = shaft(uv, uTime) * uIn * (0.35 + 0.65 * depth) * smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
        gl_Position = vec4(p, 0.0, 1.0);
        gl_PointSize = (1.2 + 3.2 * depth) * uPx;
      }`,
    fragmentShader: /* glsl */ `
      precision mediump float; varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vGlow;
        gl_FragColor = vec4(vec3(1.0, 0.94, 0.82) * a, a);
      }`,
  }));
  motes.frustumCulled = false;
  scene.add(motes);

  const resize = () => {
    const r = stage.getBoundingClientRect();
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    uniforms.uViewAspect.value = r.width / Math.max(1, r.height);
  };

  const target = new Vector2();
  const onPointer = (e: PointerEvent) => {
    const r = stage.getBoundingClientRect();
    target.set(((e.clientX - r.left) / r.width) * 2 - 1, ((e.clientY - r.top) / r.height) * 2 - 1);
  };

  let raf = 0;
  let visible = true;
  let running = false;
  const t0 = performance.now();
  const tick = () => {
    raf = 0;
    if (!visible || document.hidden) { running = false; return; }
    const t = (performance.now() - t0) / 1000;
    uniforms.uTime.value = t;
    uniforms.uIn.value = Math.min(1, uniforms.uIn.value + 0.012);
    uniforms.uPointer.value.lerp(target, 0.045);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };
  const run = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); });
  const onVis = () => { if (!document.hidden) run(); };

  const loader = new TextureLoader();
  loader.setCrossOrigin("anonymous");
  let disposed = false;
  loader.load(src, (tex) => {
    if (disposed) { tex.dispose(); return; }
    tex.colorSpace = SRGBColorSpace;
    uniforms.uTex.value = tex;
    const im = tex.image as HTMLImageElement;
    if (im?.width) uniforms.uImgAspect.value = im.width / im.height;
    photo!.after(canvas);
    resize();
    renderer.render(scene, camera);
    stage.classList.add("has-gl");
    addEventListener("resize", resize);
    addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVis);
    io.observe(stage);
    run();
  }, undefined, () => cleanup());

  function cleanup() {
    disposed = true;
    cancelAnimationFrame(raf);
    io.disconnect();
    removeEventListener("resize", resize);
    removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVis);
    stage.classList.remove("has-gl");
    canvas.remove();
    renderer.dispose();
  }
  return cleanup;
}
