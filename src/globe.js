// A dot-matrix globe drawn on 2D canvas, centred on Dubai, with routes flying out of it.
import DOTS from './dots.json';

const RAD = Math.PI / 180;
const DXB = { lat: 25.25, lon: 55.36 };

export function createGlobe(canvas, getCities, reduced) {
  const ctx = canvas.getContext('2d');
  const n = DOTS.length / 2;
  const vec = new Float32Array(n * 3);
  const toVec = (lat, lon) => { const a = lat * RAD, b = lon * RAD; return [Math.cos(a) * Math.sin(b), Math.sin(a), Math.cos(a) * Math.cos(b)]; };
  for (let i = 0; i < n; i++) { const v = toVec(DOTS[i * 2], DOTS[i * 2 + 1]); vec.set(v, i * 3); }

  let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1, running = false, raf = 0, last = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    R = W < 640 ? W * .86 : Math.min(W * .56, H * .92); cx = W / 2; cy = W < 640 ? H * .9 : H * .88;
  };

  const project = (v, lon0, lat0) => {
    const cl = Math.cos(lon0), sl = Math.sin(lon0), ct = Math.cos(lat0), st = Math.sin(lat0);
    const x1 = v[0] * cl - v[2] * sl, z1 = v[0] * sl + v[2] * cl;
    const y2 = v[1] * ct - z1 * st, z2 = v[1] * st + z1 * ct;
    return [x1, y2, z2];
  };

  const arc = (a, b, t) => {
    const dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const w = Math.acos(dot), s = Math.sin(w) || 1;
    const A = Math.sin((1 - t) * w) / s, B = Math.sin(t * w) / s;
    const lift = 1 + Math.sin(Math.PI * t) * Math.min(w * .28, .26);
    return [(A * a[0] + B * b[0]) * lift, (A * a[1] + B * b[1]) * lift, (A * a[2] + B * b[2]) * lift];
  };

  const home = toVec(DXB.lat, DXB.lon);
  const draw = time => {
    const T = time / 1000;
    const lon0 = (DXB.lon + (reduced ? 0 : Math.sin(T * .09) * 11)) * RAD;
    const lat0 = 1 * RAD;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // Atmosphere
    const g = ctx.createRadialGradient(cx, cy, R * .92, cx, cy, R * 1.14);
    g.addColorStop(0, 'rgba(255,176,104,.16)'); g.addColorStop(.42, 'rgba(255,150,90,.05)'); g.addColorStop(1, 'rgba(255,150,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, Math.PI * 2); ctx.fill();
    const body = ctx.createRadialGradient(cx, cy - R * .5, R * .1, cx, cy, R);
    body.addColorStop(0, '#16161a'); body.addColorStop(1, '#040405');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    // Land dots
    const cl = Math.cos(lon0), sl = Math.sin(lon0), ct = Math.cos(lat0), st = Math.sin(lat0);
    const size = Math.max(R / 300, 1);
    for (let i = 0; i < n; i++) {
      const vx = vec[i * 3], vy = vec[i * 3 + 1], vz = vec[i * 3 + 2];
      const x1 = vx * cl - vz * sl, z1 = vx * sl + vz * cl;
      const y2 = vy * ct - z1 * st, z2 = vy * st + z1 * ct;
      if (z2 < .04) continue;
      ctx.fillStyle = `rgba(255,255,255,${(.14 + z2 * .5).toFixed(2)})`;
      ctx.fillRect(cx + x1 * R, cy - y2 * R, size, size);
    }

    // Routes
    const P = v => { const p = project(v, lon0, lat0); return { x: cx + p[0] * R, y: cy - p[1] * R, z: p[2] }; };
    const hp = P(home);
    const cities = getCities();
    cities.forEach((c, i) => {
      const end = c.v || (c.v = toVec(c.lat, c.lon));
      ctx.beginPath(); let started = false;
      for (let t = 0; t <= 1.001; t += .05) {
        const q = P(arc(home, end, t));
        if (q.z < -.05) { started = false; continue; }
        started ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); started = true;
      }
      ctx.strokeStyle = 'rgba(255,190,130,.34)'; ctx.lineWidth = 1; ctx.stroke();
      // Pulse travelling out along the route
      const k = reduced ? .6 : ((T * .16 + i * .137) % 1);
      const head = P(arc(home, end, k));
      if (head.z > 0) {
        const fade = Math.sin(Math.PI * k);
        ctx.fillStyle = `rgba(255,216,170,${fade.toFixed(2)})`;
        ctx.beginPath(); ctx.arc(head.x, head.y, 2.1, 0, Math.PI * 2); ctx.fill();
      }
      const e = P(end);
      if (e.z > .05) {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x, e.y, 2.4, 0, Math.PI * 2); ctx.fill();
        if (W > 620 || i % 2 === 0) {
          const right = e.x >= cx;
          ctx.font = `500 ${W > 620 ? 13 : 11}px "Inter","IBM Plex Sans Arabic",system-ui,sans-serif`;
          ctx.textAlign = right ? 'left' : 'right'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr';
          ctx.fillStyle = 'rgba(255,255,255,.82)';
          ctx.fillText(c.label, e.x + (right ? 9 : -9), e.y + (c.dy || 0));
        }
      }
    });
    // Dubai
    const pulse = reduced ? .5 : (T * .5) % 1;
    ctx.strokeStyle = `rgba(255,190,130,${(1 - pulse) * .8})`; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(hp.x, hp.y, 5 + pulse * 18, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#FFC48A'; ctx.beginPath(); ctx.arc(hp.x, hp.y, 4, 0, Math.PI * 2); ctx.fill();
  };

  const loop = t => {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    if (t - last < 32) return; // 30fps is plenty here
    last = t; draw(t);
  };
  resize();
  addEventListener('resize', () => { resize(); if (!running) draw(performance.now()); });
  new IntersectionObserver(e => {
    const on = e[0].isIntersecting;
    if (on && !running) { running = !reduced; if (reduced) draw(0); else raf = requestAnimationFrame(loop); }
    else if (!on) { running = false; cancelAnimationFrame(raf); }
  }, { rootMargin: '120px' }).observe(canvas);
  return { redraw: () => draw(performance.now()) };
}
