const RM=matchMedia('(prefers-reduced-motion:reduce)').matches,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

/* scroll reveal + triggers */
const io=new IntersectionObserver(es=>es.forEach(e=>{
  if(!e.isIntersecting)return;
  e.target.classList.add('vis');io.unobserve(e.target);
  if(e.target.id==='bars')bars();
  if(e.target.classList.contains('stats'))count();
}),{threshold:.2});
$$('.rv').forEach(e=>io.observe(e));

/* hero terminal */
const lines=[
 ['u','›  Who founded Tesla?'],
 ['t','⚡ router.match("factual")'],
 ['r','   ↳ web search enabled'],
 ['t','⚡ web.verify("TESLA")'],
 ['r','   ↳ source attached'],
 ['d','✓ Web verified. +50 credits awarded.']
];
const tb=$('#tbody');
function typeTerm(){
  tb.innerHTML='';let li=0;
  (function next(){
    if(li>=lines.length){tb.insertAdjacentHTML('beforeend','\n<span class="cur"></span>');setTimeout(typeTerm,7000);return}
    const [c,t]=lines[li++];
    const sp=document.createElement('div');sp.className=c;sp.style.marginBottom='10px';tb.appendChild(sp);
    let i=0;
    (function ch(){
      if(RM){sp.textContent=t;next();return}
      sp.textContent=t.slice(0,++i);
      if(i<t.length)setTimeout(ch,c==='r'?8:16);else setTimeout(next,c==='u'?450:320);
    })();
  })();
}
typeTerm();

/* stat counters */
function count(){
  $$('.stat b').forEach(b=>{
    const n=+b.dataset.n,s=b.dataset.s||'';let st=null;
    const f=t=>{st??=t;const k=Math.min((t-st)/1200,1),v=n*(1-Math.pow(1-k,3));b.textContent=Math.round(v)+s;if(k<1)requestAnimationFrame(f)};
    if(!RM)requestAnimationFrame(f);
  });
}

/* demo: web search on vs off */
const A1="✅ WEB VERIFIED | Source attached. +50 Credits Awarded!";
const A2="ℹ️ No penalty — disabled by user. Falling back to model knowledge.";
let rt;
function race(){
  clearInterval(rt);
  const r1=$('#r1'),r2=$('#r2');
  r1.textContent=r2.textContent='';
  $('#t1').textContent=$('#t2').textContent='streaming…';
  $('#p1').style.width=$('#p2').style.width='0';
  const t0=performance.now(),rate=45,done={};
  rt=setInterval(()=>{
    const s=(performance.now()-t0)/1000;
    const a=Math.min(A1.length,Math.floor(s*rate)),b=Math.min(A2.length,Math.floor(s*rate));
    r1.textContent=A1.slice(0,a);r2.textContent=A2.slice(0,b);
    $('#p1').style.width=a/A1.length*100+'%';$('#p2').style.width=b/A2.length*100+'%';
    if(a>=A1.length&&!done.a){done.a=1;$('#t1').textContent='verified · +50'}
    if(b>=A2.length&&!done.b){done.b=1;$('#t2').textContent='fallback · 0'}
    if(done.a&&done.b)clearInterval(rt);
  },30);
}
new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){race();o.disconnect()}},{threshold:.4}).observe($('#r1'));
$('#again').onclick=race;
$('#rewatch').onclick=()=>setTimeout(race,600);

/* credit bars */
function bars(){
  $$('#bars .bar i').forEach(i=>i.style.width=i.dataset.w+'%');
  const vals=$$('#bars .brow span:last-child');let st=null;
  const f=t=>{st??=t;const k=Math.min((t-st)/1600,1);
    vals.forEach(v=>v.textContent=(v.dataset.p||'')+Math.round(+v.dataset.v*k));
    if(k<1)requestAnimationFrame(f)};
  requestAnimationFrame(f);
}
new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){$('#line').classList.add('vis');o.disconnect()}},{threshold:.3}).observe($('#line'));

/* bento dot fields */
for(let i=0;i<40;i++){const e=document.createElement('i');e.style.animationDelay=(-i*.07)+'s';if(i<28)e.style.opacity=.3;$('#mem').appendChild(e)}
for(let i=0;i<12;i++){const e=document.createElement('i');e.style.animationDelay=(-i*.1)+'s';$('#turns').appendChild(e)}
for(let i=0;i<20;i++){const e=document.createElement('i');e.style.animationDelay=(-i*.08)+'s';$('#par').appendChild(e)}

/* neural field */
const cv=$('#cv'),cx=cv.getContext('2d'),nf=$('#nf');
let W,H,P=[],m={x:-999,y:-999};
function rs(){
  const r=nf.getBoundingClientRect(),d=devicePixelRatio||1;
  W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;cx.setTransform(d,0,0,d,0,0);
  P=Array.from({length:Math.round(W*H/9000)},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,o:Math.random()<.22}));
}
rs();addEventListener('resize',rs);
nf.addEventListener('pointermove',e=>{const r=nf.getBoundingClientRect();m.x=e.clientX-r.left;m.y=e.clientY-r.top});
nf.addEventListener('pointerleave',()=>m={x:-999,y:-999});
function draw(){
  cx.clearRect(0,0,W,H);
  for(const p of P){
    if(!RM){p.x+=p.vx;p.y+=p.vy}
    if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
    const dx=p.x-m.x,dy=p.y-m.y,dd=Math.hypot(dx,dy);
    if(dd<140&&dd>0){p.x+=dx/dd*(140-dd)*.02;p.y+=dy/dd*(140-dd)*.02}
  }
  for(let i=0;i<P.length;i++){
    const a=P[i];
    for(let j=i+1;j<P.length;j++){
      const b=P[j],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<120){
        const near=Math.hypot(a.x-m.x,a.y-m.y)<170;
        cx.strokeStyle=near?`rgba(255,154,60,${.7*(1-d/120)})`:`rgba(255,95,162,${.28*(1-d/120)})`;
        cx.lineWidth=near?1.3:.7;cx.beginPath();cx.moveTo(a.x,a.y);cx.lineTo(b.x,b.y);cx.stroke();
      }
    }
    cx.fillStyle=a.o?'#ff9a3c':'rgba(255,95,162,.75)';
    cx.shadowColor=a.o?'#ff9a3c':'#ff5fa2';cx.shadowBlur=a.o?12:4;
    cx.beginPath();cx.arc(a.x,a.y,a.o?3.2:1.8,0,7);cx.fill();cx.shadowBlur=0;
  }
  requestAnimationFrame(draw);
}
draw();

/* time-on-page counter */
const born=Date.now();
setInterval(()=>{const s=Math.floor((Date.now()-born)/1000);$('#tokc').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')},RM?60000:1000);

/* model card tilt */
const mc=$('#mc');
if(!RM&&matchMedia('(hover:hover)').matches){
  mc.addEventListener('pointermove',e=>{const r=mc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;mc.style.transform=`perspective(900px) rotateY(${x*12}deg) rotateX(${-y*12}deg) rotate(-1deg)`});
  mc.addEventListener('pointerleave',()=>mc.style.transform='');
}

/* code tabs */
const C={
ts:[
 `<span class="k">const</span> res = <span class="k">await</span> fetch(<span class="s2">"http://localhost:5000/chat"</span>, {`,
 `  method: <span class="s2">"POST"</span>,`,
 `  headers: { <span class="s2">"Content-Type"</span>: <span class="s2">"application/json"</span> },`,
 `  body: JSON.stringify({`,
 `    message: <span class="s2">"Who founded Tesla?"</span>,`,
 `    history: [],`,
 `    web_search_enabled: <span class="k">true</span>,`,
 `  }),`,
 `})`,
 `<span class="k">const</span> { reply, thought, credits } = <span class="k">await</span> res.json()`],
py:[
 `curl -X POST http://localhost:5000/chat \\`,
 `  -H <span class="s2">"Content-Type: application/json"</span> \\`,
 `  -d <span class="s2">'{</span>`,
 `<span class="s2">    "message": "Who founded Tesla?",</span>`,
 `<span class="s2">    "history": [],</span>`,
 `<span class="s2">    "web_search_enabled": true</span>`,
 `<span class="s2">  }'</span>`,
 ``,
 `<span class="k"># returns</span> reply, thought, response_time, credits`]
};
function setTab(t){
  $('#code').innerHTML=C[t].map(l=>`<span class="ln">${l||' '}</span>`).join('');
  $$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
}
$$('.tab').forEach(b=>b.onclick=()=>setTab(b.dataset.t));
setTab('ts');

/* FAQ accordion */
$$('.q button').forEach(b=>b.onclick=()=>{
  const q=b.parentElement,o=q.classList.contains('open');
  $$('.q').forEach(x=>{x.classList.remove('open');x.querySelector('button').setAttribute('aria-expanded','false')});
  if(!o){q.classList.add('open');b.setAttribute('aria-expanded','true')}
});

/* custom cursor: dot + trailing ring + soft glow */
if(!RM&&matchMedia('(hover:hover) and (pointer:fine)').matches){
  const root=document.documentElement;
  const mk=c=>{const d=document.createElement('div');d.className=c;d.setAttribute('aria-hidden','true');document.body.appendChild(d);return d};
  const dot=mk('cur-dot'),ring=mk('cur-ring'),glow=mk('cur-glow');
  let mx=innerWidth/2,my=innerHeight/2,rx=mx,ry=my,gx=mx,gy=my;
  root.classList.add('has-cur');
  addEventListener('pointermove',e=>{
    mx=e.clientX;my=e.clientY;root.classList.add('cur-on');
    const hov=!!e.target.closest('a,button,.fc,.q,.stat,.mc,.tab');
    ring.classList.toggle('hov',hov);dot.classList.toggle('hov',hov);
  });
  addEventListener('pointerdown',()=>ring.classList.add('down'));
  addEventListener('pointerup',()=>ring.classList.remove('down'));
  document.addEventListener('pointerleave',()=>root.classList.remove('cur-on'));
  document.addEventListener('pointerenter',()=>root.classList.add('cur-on'));
  (function loop(){
    rx+=(mx-rx)*.18;ry+=(my-ry)*.18;gx+=(mx-gx)*.07;gy+=(my-gy)*.07;
    dot.style.transform=`translate(${mx}px,${my}px)`;
    ring.style.transform=`translate(${rx}px,${ry}px)`;
    glow.style.transform=`translate(${gx}px,${gy}px)`;
    requestAnimationFrame(loop);
  })();
}