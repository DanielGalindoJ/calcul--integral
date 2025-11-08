/* script.js
 - Partículas de fondo (ligeras)
 - Menú hamburger responsive
 - Scroll-top
 - Dibujo y control de la gráfica en grafica.html
*/

// ---------- Partículas ----------
const canvas = document.getElementById('particles');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
let particles = [];

function resizeCanvas(){
  if(!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', ()=>{ resizeCanvas(); initParticles(); });

class Particle {
  constructor(){
    this.reset();
  }
  reset(){
    this.x = Math.random()*canvas.width;
    this.y = Math.random()*canvas.height;
    this.r = Math.random()*1.8 + 0.6;
    this.vx = (Math.random()-0.5)*0.5;
    this.vy = (Math.random()-0.5)*0.4;
    this.alpha = 0.5 + Math.random()*0.5;
  }
  update(){
    this.x += this.vx;
    this.y += this.vy;
    if(this.x < -10 || this.x > canvas.width+10 || this.y < -10 || this.y > canvas.height+10) this.reset();
  }
  draw(){
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, Math.PI*2);
    ctx.fillStyle = `rgba(0,234,255,${this.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#00eaff';
    ctx.fill();
  }
}

function initParticles(){
  if(!ctx) return;
  particles = [];
  const count = Math.min(100, Math.floor((canvas.width*canvas.height)/90000));
  for(let i=0;i<count;i++) particles.push(new Particle());
}
function animParticles(){
  if(!ctx) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for(const p of particles){ p.update(); p.draw(); }
  requestAnimationFrame(animParticles);
}
initParticles();
animParticles();

// ---------- NAV móvil ----------
const navToggle = document.getElementById('navToggle');
const body = document.body;
if(navToggle){
  navToggle.addEventListener('click', ()=>{
    body.classList.toggle('nav-open');
    navToggle.classList.toggle('open');
  });
  // cerrar menú al clicar enlace
  document.querySelectorAll('.nav a').forEach(a=> a.addEventListener('click', ()=> {
    body.classList.remove('nav-open');
    navToggle.classList.remove('open');
  }));
}

// ---------- Scroll top ----------
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', ()=>{
  if(window.scrollY > 320) scrollTopBtn.style.display = 'block';
  else scrollTopBtn.style.display = 'none';
});
if(scrollTopBtn) scrollTopBtn.addEventListener('click', ()=> window.scrollTo({top:0,behavior:'smooth'}));

// ---------- Gráfica interactiva (solo si existe canvas graficaIntegral) ----------
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
const graficaCanvas = document.getElementById('graficaIntegral');
if(graficaCanvas){
  const ctxG = graficaCanvas.getContext('2d');

  // Ajuste responsivo del canvas
  function sizeGrafica(){
    const styleW = graficaCanvas.clientWidth;
    const styleH = graficaCanvas.clientHeight || Math.round(styleW*0.45);
    graficaCanvas.width = Math.round(styleW * devicePixelRatio);
    graficaCanvas.height = Math.round(styleH * devicePixelRatio);
    graficaCanvas.style.height = styleH + 'px';
    ctxG.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
  }
  sizeGrafica();
  window.addEventListener('resize', ()=>{ sizeGrafica(); drawDefault(); });

  // funciones disponibles
 function f_of(name, x) {
  switch (name) {
    case 'sin': return Math.sin(x);
    case 'cos': return Math.cos(x);
    case 'tan': return Math.tan(x);
    case 'x2': return x * x;
    case 'x3': return (x * x * x) / 10;
    case 'exp': return Math.exp(x / 3);
    case 'ln': return x > 0 ? Math.log(x) : NaN;
    case 'gauss': return Math.exp(-x * x);
    default: return Math.sin(x);
  }
}

const colors = {
  sin: '#00b3ff',
  cos: '#00ff8c',
  tan: '#ffaa00',
  x2: '#ff00ff',
  x3: '#ff4f88',
  exp: '#8cff00',
  ln: '#a6fffa',
  gauss: '#fff566'
};

  // dibujar e integrar por Riemann simple (suma)
  function drawFunction(opts){
    const {fnName,a,b,steps} = opts;
    const w = graficaCanvas.clientWidth;
    const h = graficaCanvas.clientHeight;
    const margin = 40;
    const plotW = w - 2*margin;
    const plotH = h - 2*margin;

    // sample function to determine y-range
    const samples = [];
    const sampleCount = 400;
    for(let i=0;i<=sampleCount;i++){
      const x = a + (i/sampleCount)*(b-a);
      samples.push(f_of(fnName,x));
    }
    const yMin = Math.min(...samples,0);
    const yMax = Math.max(...samples,0);
    const yRange = (yMax - yMin) || 1;

    // map x,y to canvas pixels
    const xToPx = x => margin + ((x - a)/(b - a))*plotW;
    const yToPx = y => margin + (1 - (y - yMin)/yRange)*plotH;

    // clear
    ctxG.clearRect(0,0,w,h);

    // axes
    ctxG.strokeStyle = 'rgba(0,234,255,0.9)';
    ctxG.lineWidth = 1.0;
    // x axis (y=0)
    const zeroY = yToPx(0);
    ctxG.beginPath(); ctxG.moveTo(margin,zeroY); ctxG.lineTo(w-margin,zeroY); ctxG.stroke();
    // y axis (x=a)
    ctxG.beginPath(); ctxG.moveTo(margin,margin); ctxG.lineTo(margin,h-margin); ctxG.stroke();

    // Draw Riemann rectangles (left)
    let area = 0;
    const dx = (b-a)/steps;
    for(let i=0;i<steps;i++){
      const xL = a + i*dx;
      const height = f_of(fnName, xL);
      area += height*dx;
      const xPx = xToPx(xL);
      const wRect = Math.max(1, xToPx(xL+dx) - xPx);
      const yPxTop = yToPx(Math.max(0,height));
      const yPxBottom = yToPx(Math.min(0,height));
      ctxG.fillStyle = 'rgba(0,234,255,0.18)';
      ctxG.fillRect(xPx, yPxTop, wRect, yPxBottom - yPxTop);
      ctxG.strokeStyle = 'rgba(0,234,255,0.06)';
      ctxG.strokeRect(xPx, yPxTop, wRect, yPxBottom - yPxTop);
    }

    // Draw curve
    ctxG.beginPath();
    ctxG.lineWidth = 2;
    ctxG.strokeStyle = 'rgba(255,0,255,0.95)';
    for(let i=0;i<=sampleCount;i++){
      const x = a + (i/sampleCount)*(b-a);
      const xp = xToPx(x);
      const yp = yToPx(f_of(fnName,x));
      if(i===0) ctxG.moveTo(xp,yp); else ctxG.lineTo(xp,yp);
    }
    ctxG.stroke();

    return area;
  }

  // defaults
  const selectFn = document.getElementById('funcSelect');
  const aInput = document.getElementById('aInput');
  const bInput = document.getElementById('bInput');
  const redrawBtn = document.getElementById('redrawBtn');
  const areaNote = document.getElementById('areaNote');

  function drawDefault(){
    sizeGrafica();
    const fnName = selectFn ? selectFn.value : 'sin';
    const a = aInput ? parseFloat(aInput.value) : 0;
    const b = bInput ? parseFloat(bInput.value) : Math.PI;
    const steps = Math.max(40, Math.round((graficaCanvas.clientWidth)/6));
    const area = drawFunction({fnName,a,b,steps});
    if(areaNote) areaNote.textContent = 'Área aproximada ≈ ' + (Math.round(area*1000)/1000).toString();
  }

  // initialize shorcuts
  if(redrawBtn) redrawBtn.addEventListener('click', drawDefault);
  if(selectFn) selectFn.addEventListener('change', drawDefault);
  if(aInput) aInput.addEventListener('change', drawDefault);
  if(bInput) bInput.addEventListener('change', drawDefault);

  // run initial draw
  drawDefault();
}
