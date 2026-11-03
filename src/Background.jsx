import { Component, Suspense, lazy, useEffect, useRef, useState } from 'react';
const Spline = lazy(() => import('@splinetool/react-spline'));
export const defaults = { mode: 'gradient', gradientColor: '#7B1FA2', gradientColor2: '#FFFFFF', gradientEffect: 'aurora', desktopImage: '', mobileImage: '', sceneBackground: '#101014', cursorColor: '#FFFFFF', cursorSize: 'large', robotColor: '#242428', eyeColor: '#00E5FF' };
export function backgroundSettings(value) {
  const bg = { ...defaults, ...value };
  if (!['gradient', 'image', '3d'].includes(bg.mode)) bg.mode = 'gradient';
  for (const key of ['gradientColor', 'gradientColor2', 'sceneBackground', 'cursorColor', 'robotColor', 'eyeColor']) if (!/^#[\da-f]{6}$/i.test(bg[key])) bg[key] = defaults[key];
  for (const key of ['desktopImage', 'mobileImage']) if (typeof bg[key] !== 'string' || !/^(\/[^/]|https?:\/\/|data:image\/(png|jpeg|webp|gif);base64,)/i.test(bg[key])) bg[key] = '';
  if (!['linear','radial','aurora'].includes(bg.gradientEffect)) bg.gradientEffect = defaults.gradientEffect;
  if (!['large','medium','small'].includes(bg.cursorSize)) bg.cursorSize = defaults.cursorSize;
  return bg;
}
class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <div className="scene-message">Não foi possível carregar o 3D. Experimente o degradê.</div> : this.props.children; }
}
export function HeroBackground({ settings: bg }) {
  const ref = useRef(null);
  const app = useRef(null);
  const gaze = useRef([]);
  const [status, setStatus] = useState('Carregando experiência 3D…');
  useEffect(() => {
    if (bg.mode !== 'image' || !ref.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const layer = ref.current;
    const shell = layer.parentElement;
    let frame;
    const update = () => {
      frame = null;
      const rect = shell.getBoundingClientRect();
      const distance = Math.max(0, Math.min(-rect.top, rect.height));
      layer.style.transform = 'translate3d(0,' + distance * 0.4 + 'px,0)';
      layer.dataset.parallaxOffset = String(distance * 0.4);
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', scroll);
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); window.removeEventListener('resize', scroll); layer.style.transform = ''; };
  }, [bg.mode, bg.desktopImage, bg.mobileImage]);
  function recolor(instance) {
    app.current = instance;
    instance.setZoom(0.65);
    ref.current.dataset.sceneObjects = JSON.stringify(instance.getAllObjects().map(item => item.name));
    gaze.current = instance.getAllObjects().filter(item => /head|eye|cabe[cç]a|olho/i.test(item.name)).map(item => ({ item, x: item.rotation.x, y: item.rotation.y }));
    ref.current.dataset.gazeObjects = String(gaze.current.length);
    let count = 0;
    for (const item of instance.getAllObjects()) {
      if ((/robot|body|head|arm|hand|finger|leg|chest|bot/i.test(item.name) || (item.material && !/floor|ground|plane|background|light|camera/i.test(item.name))) && 'color' in item) {
        try { item.color = bg.robotColor; count++; } catch { /* Some Spline materials are read-only. */ }
      }
    }
    const eyes = instance.getAllObjects().filter(item => /eye|olho|iris|pupil|visor/i.test(item.name) && !/eyebrow/i.test(item.name));
    ref.current.dataset.eyeObjects = String(eyes.length);
    for (const eye of eyes) {
      eye.color = bg.eyeColor;
      instance.setMaterial(eye, three => new three.MeshStandardNodeMaterial({ color: bg.eyeColor, emissive: bg.eyeColor, emissiveIntensity: 3, roughness: 0.25 })).catch(() => { /* Color remains available on classic WebGL. */ });
    }
    setStatus('');
    try { instance.setBackgroundColor(bg.sceneBackground); } catch {}
  }
  useEffect(() => { if (app.current && bg.mode === '3d') recolor(app.current); }, [bg.robotColor, bg.eyeColor, bg.sceneBackground, bg.mode]);
  useEffect(() => {
    if (bg.mode !== '3d' || !ref.current) return;
    const parent = ref.current.closest('.hero-shell');
    const move = e => { ref.current?.style.setProperty('--spotlight-opacity', '1'); const r = parent.getBoundingClientRect(); ref.current?.style.setProperty('--cursor-x', `${e.clientX}px`); ref.current?.style.setProperty('--cursor-y', `${e.clientY}px`); const x = Math.max(-1, Math.min(1, (e.clientX-r.left)/r.width*2-1)); const y = Math.max(-1, Math.min(1, (e.clientY-r.top)/Math.min(r.height, innerHeight)*2-1)); for (const target of gaze.current) { target.item.rotation.y = target.y + x * 0.4; target.item.rotation.x = target.x + y * 0.22; } };
    const leave = () => ref.current?.style.setProperty('--spotlight-opacity', '0');
    parent.addEventListener('pointermove', move);
    parent.addEventListener('pointerleave', leave);
    return () => { parent.removeEventListener('pointermove', move); parent.removeEventListener('pointerleave', leave); };
  }, [bg.mode]);
  if (bg.mode === 'image') return <div ref={ref} className="hero-image-background" aria-hidden="true"><picture><source media="(max-width: 767px)" srcSet={bg.mobileImage || bg.desktopImage} />{(bg.desktopImage || bg.mobileImage) && <img src={bg.desktopImage || bg.mobileImage} alt="" fetchPriority="high" />}</picture></div>;
  if (bg.mode !== '3d') return null;
  return <div ref={ref} className="hero-3d-background" style={{ '--cursor-color': bg.cursorColor, '--cursor-radius': ({large:'180px',medium:'120px',small:'65px'})[bg.cursorSize] }}><div className="cursor-spotlight" /><div className="spline-scene"><SceneBoundary><Suspense fallback={<div className="scene-message">Carregando experiência 3D…</div>}><Spline scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode" onLoad={recolor} onError={() => setStatus('Não foi possível carregar a cena 3D.')} /></Suspense></SceneBoundary>{status && <span className="scene-message" role="status">{status}</span>}</div></div>;
}
