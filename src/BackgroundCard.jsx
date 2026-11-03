import { useRef, useState } from 'react';
import { backgroundSettings, defaults } from './Background.jsx';
export function BackgroundCard({ value, onChange }) {
  const bg = backgroundSettings(value);
  const [error, setError] = useState('');
  const requests = useRef({});
  const latest = useRef(bg); latest.current = bg;
  const change = (key, val) => onChange({ ...latest.current, [key]: val });
  async function upload(key, file) {
    const request = Symbol(); requests.current[key] = request;
    if (!file) return;
    if (!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 2 * 1024 * 1024) { setError('Escolha PNG, JPEG, WebP ou GIF de até 2 MB.'); return; }
    try {
      const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
      const image = new Image(); image.src = data; await image.decode();
      if (requests.current[key] === request) { change(key, data); setError(''); }
    } catch { setError('Não foi possível ler a imagem.'); }
  }
  const color = (key, label) => <label className="background-field" key={key}>{label}<div className="background-color"><input type="color" aria-label={label} value={bg[key]} onChange={e => change(key, e.target.value)} /><code>{bg[key]}</code></div></label>;
  return <section className="cms-card cms-form background-card"><h3>Background</h3><p className="cms-help">Personalize o fundo da abertura do site. Salve e abra o site para testar.</p><label className="background-field">Tipo de background<select value={bg.mode} onChange={e => change('mode', e.target.value)}><option value="gradient">A · Degradê em movimento</option><option value="image">B · Imagem com parallax</option><option value="3d">C · Efeito 3D</option></select></label>
    {bg.mode === 'gradient' && <>{color('gradientColor','Primeira cor do degradê')}{color('gradientColor2','Segunda cor do degradê')}<label className="background-field">Efeito do degradê<select value={bg.gradientEffect} onChange={e => change('gradientEffect',e.target.value)}><option value="linear">Linear · ondas de cor</option><option value="radial">Radial · luz pulsante</option><option value="aurora">Aurora · manchas fluidas</option></select></label><p className="cms-help">Movimento suave e lento. Respeita a preferência por movimento reduzido.</p></>}
    {bg.mode === 'image' && <>{[['desktopImage','Background desktop'],['mobileImage','Background mobile']].map(([key,label]) => <div className="background-field" key={key}><label>{label}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => { upload(key,e.target.files?.[0]); e.target.value = ''; }} /></label>{bg[key] && <><img className="background-preview" src={bg[key]} alt={`Prévia de ${label.toLowerCase()}`} /><button type="button" className="cms-button" onClick={() => { requests.current[key] = Symbol(); change(key,''); }}>Remover {label.toLowerCase()}</button></>}</div>)}<p className="cms-help">Até 2 MB por imagem. Sem imagem mobile, usamos a desktop. O efeito parallax acompanha a rolagem.</p></>}
    {bg.mode === '3d' && <>{color('sceneBackground','Cor de fundo 3D')}{color('cursorColor','Cor da luz do cursor')}<label className="background-field">Tamanho da luz do cursor<select value={bg.cursorSize} onChange={e => change('cursorSize',e.target.value)}><option value="large">Grande</option><option value="medium">Médio</option><option value="small">Pequeno</option></select></label>{color('robotColor','Cor do robô 3D')}{color('eyeColor','Cor dos olhos · LED')}<p className="cms-help">Cena Spline do exemplo anexado. Requer internet e WebGL. As cores do robô dependem dos materiais editáveis na cena.</p></>}
    {error && <p role="alert">{error}</p>}<button type="button" className="cms-button" onClick={() => onChange({...defaults})}>Voltar ao degradê padrão</button>
  </section>;
}
