/* Animations du site + vitrine animée des outils. Aucune dépendance. */
(function(){
'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease='cubic-bezier(.2,.7,.2,1)';

/* ---------- 1. Animations du site ---------- */
function siteMotion(){
  if(reduce) return;
  document.querySelectorAll('[data-anim="rise"]').forEach((el,i)=>{
    el.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:800,delay:120+i*110,easing:ease,fill:'backwards'});
  });
  const ph=document.querySelector('[data-anim="float"]');
  if(ph){
    ph.animate([{opacity:0,transform:'translateY(40px) rotate(2deg)'},{opacity:1,transform:'none'}],{duration:1100,delay:300,easing:ease,fill:'backwards'});
    ph.animate([{transform:'translateY(0)'},{transform:'translateY(-10px)'},{transform:'translateY(0)'}],{duration:5000,delay:1400,iterations:Infinity,easing:'ease-in-out'});
  }
  const ecg=document.querySelector('[data-anim="ecg"]');
  if(ecg){
    const L=ecg.getTotalLength();
    ecg.style.strokeDasharray=`${L*.22} ${L}`;
    ecg.animate([{strokeDashoffset:L*.22},{strokeDashoffset:-L}],{duration:4200,iterations:Infinity,easing:'linear'});
  }

  // apparition au défilement (seulement ce qui est sous la ligne de flottaison au chargement)
  const below=el=>el.getBoundingClientRect().top>innerHeight;
  const targets=el=>el.dataset.anim==='stagger'?[...el.children]:[el];
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    io.unobserve(e.target);
    const stagger=e.target.dataset.anim==='stagger';
    targets(e.target).forEach((t,i)=>{
      t.style.opacity='';
      t.animate([{opacity:0,transform:`translateY(${stagger?24:32}px)`},{opacity:1,transform:'none'}],{duration:stagger?800:900,delay:stagger?i*110:0,easing:ease,fill:'backwards'});
    });
  }),{threshold:.12});
  document.querySelectorAll('[data-anim="reveal"],[data-anim="stagger"]').forEach(el=>{
    if(!below(el)) return;
    targets(el).forEach(t=>{ t.style.opacity='0'; });  // masqué jusqu'à son apparition
    io.observe(el);
  });
}

// chiffres qui défilent quand ils deviennent visibles
function counters(){
  const els=document.querySelectorAll('[data-count]');
  if(reduce) return;
  const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting) return;
    io.unobserve(e.target);
    const el=e.target, end=+el.dataset.count, suf=el.dataset.suffix||'', t0=performance.now()+250, d=1100;
    el.textContent='0'+suf;
    const tick=now=>{
      const p=Math.min(1,Math.max(0,(now-t0)/d));
      el.textContent=Math.round(end*(1-Math.pow(1-p,3)))+suf;
      if(p<1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }),{threshold:.6});
  els.forEach(el=>io.observe(el));
}

/* ---------- 2. Vitrine animée des outils ---------- */
const DEV='En développement';
const PROJECTS=[
  {title:'NormoDose', tags:['En service','Web et Android','Posologie'], fiche:'#cr-01', url:'https://oden225.github.io/Pediadose/', urlLabel:'Ouvrir NormoDose',
   desc:"Aide au calcul de posologie : dose au poids chez l'enfant, adaptation aux situations particulières chez l'adulte. Utilisable hors connexion.",
   screens:[
    {src:'img/normodose-calcul.webp', alt:"NormoDose : calcul de l'amoxicilline IV chez un enfant de 25 kg", hotspots:[
      {x:.30,y:.23,zoom:2.2,rx:12,ry:-14,label:'Enfant : dose au poids'},
      {x:.17,y:.33,zoom:2.5,rx:10,ry:12,label:'Poids saisi : 25 kg'},
      {x:.30,y:.90,zoom:2.4,rx:-8,ry:-10,label:'835 mg par injection'}]},
    {src:'img/normodose-profil.webp', alt:'NormoDose : écran Profil et réglages', hotspots:[
      {x:.80,y:.49,zoom:2.5,rx:12,ry:-10,label:'Thème permanence ou garde'},
      {x:.45,y:.645,zoom:2.3,rx:8,ry:12,label:'Poids retenu 30 minutes'}]}]},
  {title:'VisiteMed', tags:['En service','Application web','Délégués'], fiche:'#cr-02', url:'https://oden225.github.io/visitmed/', urlLabel:'Ouvrir VisiteMed',
   desc:'Répertoire des produits présentés par les délégués médicaux, pour garder une trace claire et prescrire en toute indépendance.',
   screens:[
    {src:'img/visitemed-produit.webp', alt:'VisiteMed : saisie d’un nouveau produit', hotspots:[
      {x:.42,y:.15,zoom:2.3,rx:12,ry:-12,label:'Mode visite : plusieurs produits'},
      {x:.45,y:.67,zoom:2.3,rx:10,ry:12,label:'Classe thérapeutique'},
      {x:.45,y:.765,zoom:2.4,rx:-8,ry:-10,label:'Forme et dosage'}]},
    {src:'img/visitemed-donnees.webp', alt:'VisiteMed : export et sauvegarde des données', hotspots:[
      {x:.5,y:.40,zoom:2.2,rx:12,ry:-10,label:'Sauvegarde exportable'},
      {x:.5,y:.64,zoom:2.3,rx:-6,ry:10,label:'Journal des prescriptions'}]}]},
  {title:"Comptes rendus d'échographie", tags:['En service en clinique','Imagerie'], fiche:'#cr-03',
   desc:'Le médecin saisit ses mesures, le compte rendu se met en page tout seul, prêt à imprimer. Les champs oubliés sont signalés.',
   screens:[
    {src:'img/echographie.webp', alt:"Saisie d'une échographie pelvienne avec le compte rendu généré à droite", hotspots:[
      {x:.10,y:.28,zoom:2.0,rx:10,ry:-12,label:"Cinq modèles d'examen"},
      {x:.78,y:.72,zoom:2.0,rx:8,ry:12,label:'Compte rendu mis en page'},
      {x:.94,y:.095,zoom:2.6,rx:-6,ry:-10,label:'Champs oubliés signalés'},
      {x:.40,y:.92,zoom:2.4,rx:-8,ry:10,label:'Enregistrer et imprimer'}]}]},
  {title:'Résultats de laboratoire', tags:['En service en clinique','Biologie'], fiche:'#cr-04',
   desc:'Le biologiste coche les examens, la feuille de résultats se compose avec les valeurs de référence adaptées au patient.',
   screens:[
    {src:'img/laboratoire.webp', alt:'Laboratoire : examens à cocher et feuille de numération formule sanguine', hotspots:[
      {x:.10,y:.20,zoom:2.4,rx:10,ry:-12,label:'Examens à cocher'},
      {x:.75,y:.45,zoom:2.2,rx:8,ry:12,label:'Normes homme, femme, enfant'},
      {x:.47,y:.97,zoom:2.4,rx:-8,ry:-10,label:'Observation proposée'}]}]},
  {title:'Syndromik', tags:[DEV,'Raisonnement'], fiche:'#cr-05',
   desc:'Des signes aux pathologies, hors connexion : le médecin coche les signes, les syndromes évoqués sont classés par recoupement.',
   screens:[
    {src:'img/syndromik-signes.webp', alt:'Syndromik : combinaison de cinq signes cochés', hotspots:[
      {x:.30,y:.33,zoom:2.2,rx:12,ry:-12,label:'Signes cochés'},
      {x:.50,y:.595,zoom:2.2,rx:8,ry:12,label:'Recherche par recoupement'},
      {x:.30,y:.75,zoom:2.4,rx:-8,ry:-10,label:'4 signes sur 5'}]},
    {src:'img/syndromik-syndrome.webp', alt:'Syndromik : fiche du syndrome méningé', hotspots:[
      {x:.50,y:.11,zoom:2.3,rx:10,ry:-10,label:'Signe, syndrome, pathologie'},
      {x:.35,y:.86,zoom:2.4,rx:-6,ry:10,label:'Pathologie probable'}]}]},
  {title:'RDVmed', tags:[DEV,'Suivi patients'], fiche:'#cr-06',
   desc:'Suivi des rendez-vous et relance des patients par WhatsApp, SMS ou appel. Captures avec des patients fictifs.',
   screens:[
    {src:'img/rdvmed-aujourdhui.webp', alt:"RDVmed : écran Aujourd'hui avec un patient en retard (patients fictifs)", hotspots:[
      {x:.45,y:.25,zoom:2.1,rx:12,ry:-12,label:'Les 14 prochains jours'},
      {x:.30,y:.44,zoom:2.4,rx:8,ry:12,label:'Retards en premier'},
      {x:.66,y:.605,zoom:2.5,rx:-8,ry:-10,label:'Relance WhatsApp, SMS, appel'}]},
    {src:'img/rdvmed-a-venir.webp', alt:'RDVmed : passages programmés (patients fictifs)', hotspots:[
      {x:.40,y:.23,zoom:2.3,rx:10,ry:-10,label:'Filtres par motif'},
      {x:.86,y:.30,zoom:2.6,rx:-6,ry:10,label:'Rendez-vous dans 2 jours'}]}]}
];

function createShowcase(root,projects,opts={}){
  const o=Object.assign({cell:26,hold:1200,autoplay:true},opts);
  const $=s=>root.querySelector(s);
  const stage=$('.ps-stage'), panel=$('.ps-panel'), img=panel.querySelector('img'), px=$('.ps-px'), sheen=panel.querySelector('.sheen'),
        cursor=$('.ps-cursor'), ripple=$('.ps-ripple'), callout=$('.ps-callout'),
        meta=$('.ps-meta'), title=$('.ps-title'), desc=$('.ps-desc'), feats=$('.ps-feats'), actions=$('.ps-actions'), dots=$('.ps-dots'), pauseBtn=$('.ps-pause');
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  let pi=0, runId=0, userPaused=!o.autoplay||reduce, visible=false, box={W:0,H:0,w:0,h:0,l:0,t:0};
  const OVER={x:.5,y:.5,zoom:.92,rx:14,ry:-18};

  // n'interrompt que nos propres animations (jamais les transitions CSS)
  const go=(el,to,opt={})=>{
    el.getAnimations().filter(a=>!(a instanceof CSSTransition)&&!(a instanceof CSSAnimation)).forEach(a=>{try{a.commitStyles()}catch(e){} a.cancel();});
    const cs=getComputedStyle(el), from={}; for(const k in to) from[k]=cs[k];
    const a=el.animate([from,to],Object.assign({fill:'forwards',easing:'cubic-bezier(.65,0,.35,1)'},opt,{duration:reduce?1:(opt.duration||600)}));
    return a.finished.then(()=>{try{a.commitStyles()}catch(e){} a.cancel();}).catch(()=>{});
  };

  // taille de l'écran dans la scène selon son format (portrait ou paysage)
  function layout(){
    const W=stage.clientWidth, H=stage.clientHeight, a=(img.naturalWidth||16)/(img.naturalHeight||10);
    let h=H*.84, w=h*a; if(w>W*.74){w=W*.74; h=w/a;}
    box={W,H,w,h,l:(W-w)/2,t:(H-h)/2};
    Object.assign(panel.style,{width:w+'px',height:h+'px',left:box.l+'px',top:box.t+'px'});
  }
  // transform qui amène le point (x,y) de l'écran au centre de la scène
  const camT=h=>{const dx=box.W/2-(box.l+h.x*box.w), dy=box.H*.56-(box.t+h.y*box.h);
    return {transformOrigin:`${h.x*100}% ${h.y*100}%`,transform:`translate(${dx}px,${dy}px) rotateX(${h.rx??10}deg) rotateY(${h.ry??-12}deg) scale(${h.zoom??2})`};};
  const cam=(h,d=900)=>go(panel,camT(h),{duration:d});
  const cursorTo=(x,y,d=650)=>go(cursor,{transform:`translate(${x}px,${y}px)`,opacity:1},{duration:d,easing:'cubic-bezier(.5,0,.2,1)'});

  async function pixelSwap(src,alive){
    if(reduce){ img.src=src; await img.decode().catch(()=>{}); layout(); return; }
    const cols=Math.max(6,Math.round(box.w/o.cell)), rows=Math.max(6,Math.round(box.h/o.cell));
    px.style.gridTemplateColumns=`repeat(${cols},1fr)`; px.style.gridTemplateRows=`repeat(${rows},1fr)`; px.style.gap='2px';
    px.innerHTML='<i></i>'.repeat(cols*rows);
    const cells=[...px.children], cx=(cols-1)/2, cy=(rows-1)/2, maxd=Math.hypot(cx,cy);
    const delay=i=>{const c=i%cols, r=(i/cols)|0; return (1-Math.hypot(c-cx,r-cy)/maxd)*260+((c*7+r*13)%5)*18;};
    await Promise.all(cells.map((c,i)=>c.animate([{transform:'scale(0)'},{transform:'scale(1.05)'}],{duration:240,delay:delay(i),fill:'forwards',easing:'ease-out'}).finished));
    if(!alive()) return;
    img.src=src; await img.decode().catch(()=>{}); layout();
    await Promise.all(cells.map((c,i)=>c.animate([{transform:'scale(1.05)'},{transform:'scale(0)'}],{duration:260,delay:(300-delay(i))*.9,fill:'forwards',easing:'ease-in'}).finished));
    px.innerHTML='';
  }

  function renderInfo(){
    const p=projects[pi];
    meta.innerHTML=(p.tags||[]).map(t=>`<span${t===DEV?' class="dev"':''}>${t}</span>`).join('');
    title.textContent=p.title; desc.textContent=p.desc||'';
    const all=p.screens.flatMap(s=>s.hotspots||[]);
    feats.innerHTML=all.map(h=>`<li>${h.label}</li>`).join('');
    actions.innerHTML=(p.fiche?`<a class="ps-link primary" href="${p.fiche}">Voir la fiche</a>`:'')+
      (p.url?`<a class="ps-link ghost" href="${p.url}" target="_blank" rel="noopener">${p.urlLabel||'Ouvrir'} →</a>`:'');
    [...dots.children].forEach((b,i)=>b.setAttribute('aria-current',i===pi));
    img.alt=p.screens[0].alt||p.title;
  }
  const featOn=label=>[...feats.children].forEach(li=>li.classList.toggle('on',li.textContent===label));

  async function run(first){
    const id=++runId, alive=()=>id===runId;
    while(alive()){
      const p=projects[pi];
      for(let si=0; si<p.screens.length && alive(); si++){
        const s=p.screens[si];
        if(!first||si>0){ await go(cursor,{opacity:0},{duration:200}); await cam(OVER,600); if(!alive())return; await pixelSwap(s.src,alive); if(!alive())return; }
        first=false; img.alt=s.alt||p.title; panel.style.transformOrigin='50% 50%';
        await cam(OVER,700);
        sheen.animate([{transform:'translateX(-60%)'},{transform:'translateX(60%)'}],{duration:reduce?1:1100,easing:'ease-in-out'});
        await sleep(500); if(!alive()) return;
        if(userPaused) return;
        go(cursor,{transform:`translate(${box.W*.82}px,${box.H*.9}px)`,opacity:0},{duration:1});
        for(const h of (s.hotspots||[])){
          if(!alive()) return;
          const cx=box.W/2, cy=box.H*.56;
          await Promise.all([cam(h,1000), sleep(250).then(()=>cursorTo(cx+4,cy+6,800))]);
          if(!alive()) return;
          cursor.animate([{scale:'1'},{scale:'.82'},{scale:'1'}],{duration:220});
          Object.assign(ripple.style,{left:cx+'px',top:cy+'px'});
          ripple.animate([{opacity:.7,transform:'scale(.2)'},{opacity:0,transform:'scale(1.6)'}],{duration:520,easing:'ease-out'});
          callout.getAnimations().forEach(x=>x.cancel()); callout.textContent=h.label; featOn(h.label);
          callout.animate([{opacity:0,transform:'translate(-50%,calc(-100% - 6px)) scale(.92)'},{opacity:1,transform:'translate(-50%,calc(-100% - 22px)) scale(1)'}],{duration:260,fill:'forwards',easing:'cubic-bezier(.34,1.56,.64,1)'});
          Object.assign(callout.style,{left:cx+'px',top:cy+'px'});
          await sleep(o.hold);
          callout.animate([{opacity:1},{opacity:0}],{duration:180,fill:'forwards'});
        }
        featOn(null);
        await cam(OVER,800); if(!alive()) return;
        await sleep(300);
      }
      if(!alive()) return;
      pi=(pi+1)%projects.length; renderInfo();
    }
  }

  function stop(){ runId++; }
  function start(first){ if(!userPaused&&visible) run(first); }
  async function goTo(i){
    stop(); const id=runId;
    callout.getAnimations().forEach(a=>a.cancel()); callout.style.opacity=0; featOn(null);
    pi=(i+projects.length)%projects.length; renderInfo();
    await go(cursor,{opacity:0},{duration:150}); await cam(OVER,500);
    await pixelSwap(projects[pi].screens[0].src,()=>id===runId);
    if(id===runId){ await cam(OVER,500); if(id===runId) start(true); }
  }
  function setPaused(p){
    userPaused=p; pauseBtn.innerHTML=`<svg><use href="#i-${p?'play':'pause'}"/></svg>`;
    pauseBtn.setAttribute('aria-label',p?'Lire la visite':'Mettre en pause');
    if(p){ stop(); go(cursor,{opacity:0},{duration:150}); callout.style.opacity=0; featOn(null); cam(OVER,600);} else start(true);
  }

  dots.innerHTML=projects.map((p,i)=>`<button type="button" aria-label="Outil ${i+1} : ${p.title}"></button>`).join('');
  [...dots.children].forEach((b,i)=>b.addEventListener('click',()=>goTo(i)));
  $('.ps-prev').addEventListener('click',()=>goTo(pi-1));
  $('.ps-next').addEventListener('click',()=>goTo(pi+1));
  pauseBtn.addEventListener('click',()=>setPaused(!userPaused));
  if(reduce){ pauseBtn.hidden=true; }

  renderInfo();
  img.src=projects[0].screens[0].src;
  img.decode().catch(()=>{}).then(()=>{layout(); panel.style.transformOrigin='50% 50%'; Object.assign(panel.style,camT(OVER));
    new ResizeObserver(()=>{layout(); if(userPaused||reduce) Object.assign(panel.style,camT(OVER));}).observe(stage);
    new IntersectionObserver(es=>{const v=es[0].isIntersecting; if(v&&!visible){visible=true; start(true);} else if(!v&&visible){visible=false; stop();}},{threshold:.35}).observe(stage);
  });
  // mode repérage : ouvrir la page avec #reperage, cliquer sur l'écran affiche ses coordonnées de point d'intérêt
  function reperage(){
    setPaused(true); panel.getAnimations().forEach(a=>a.cancel());
    Object.assign(panel.style,{transform:'none',transformOrigin:'50% 50%',cursor:'crosshair'});
    panel.addEventListener('click',e=>{const r=panel.getBoundingClientRect();
      const x=((e.clientX-r.left)/r.width).toFixed(2), y=((e.clientY-r.top)/r.height).toFixed(2);
      callout.getAnimations().forEach(a=>a.cancel()); callout.textContent=`{x:${x},y:${y}}`;
      Object.assign(callout.style,{left:(e.clientX-stage.getBoundingClientRect().left)+'px',top:(e.clientY-stage.getBoundingClientRect().top)+'px',opacity:1,transform:'translate(-50%,calc(-100% - 12px))'});
      console.log(`{x:${x},y:${y}}`);});
  }
  if(location.hash==='#reperage') img.decode().catch(()=>{}).then(()=>setTimeout(reperage,50));
  return {goTo,setPaused,reperage};
}

siteMotion();
counters();
const root=document.getElementById('pshow');
if(root) window.showcase=createShowcase(root,PROJECTS,{hold:1200,cell:26,autoplay:true});
})();
