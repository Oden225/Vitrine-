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

/* ---------- 2. Film des outils (skill ui-story-motion, js/ui-story.js) ---------- */
const DEV='En développement';
const CHAPTERS=[
  {name:'NormoDose', tags:['En service','Web et Android','Posologie'], fiche:'#cr-01', url:'https://oden225.github.io/Pediadose/', urlLabel:'Ouvrir NormoDose',
   desc:"Aide au calcul de posologie : dose au poids chez l'enfant, adaptation aux situations particulières chez l'adulte. Utilisable hors connexion.",
   cta:'+ Nouveau calcul',
   screens:[
    {src:'img/normodose-calcul.webp', alt:"NormoDose : calcul de l'amoxicilline IV chez un enfant de 25 kg", hotspots:[
      {x:.30,y:.23,zoom:2.2,rx:12,ry:-14,label:'Enfant : dose au poids'},
      {x:.17,y:.33,zoom:2.5,rx:10,ry:12,label:'Poids saisi : 25 kg'},
      {x:.30,y:.90,zoom:2.4,rx:-8,ry:-10,label:'835 mg par injection'}]}],
   result:{title:'Calcul de dose', meta:'Amoxicilline IV · enfant de 25 kg', value:'835 mg par injection'}},
  {name:'VisiteMed', tags:['En service','Application web','Délégués'], fiche:'#cr-02', url:'https://oden225.github.io/visitmed/', urlLabel:'Ouvrir VisiteMed',
   desc:'Répertoire des produits présentés par les délégués médicaux, pour garder une trace claire et prescrire en toute indépendance.',
   cta:'+ Nouveau produit',
   screens:[
    {src:'img/visitemed-produit.webp', alt:'VisiteMed : saisie d’un nouveau produit', hotspots:[
      {x:.42,y:.15,zoom:2.3,rx:12,ry:-12,label:'Mode visite : plusieurs produits'},
      {x:.45,y:.67,zoom:2.3,rx:10,ry:12,label:'Classe thérapeutique'}]},
    {src:'img/visitemed-donnees.webp', alt:'VisiteMed : export et sauvegarde des données', hotspots:[
      {x:.5,y:.64,zoom:2.3,rx:-6,ry:10,label:'Journal des prescriptions'}]}],
   result:{title:'Fiche produit', meta:'DCI, classe, présentations, prix', value:'Produit enregistré'}},
  {name:'Échographie', title:"Comptes rendus d'échographie", tags:['En service en clinique','Imagerie'], fiche:'#cr-03',
   desc:'Le médecin saisit ses mesures, le compte rendu se met en page tout seul, prêt à imprimer. Les champs oubliés sont signalés.',
   cta:'+ Nouvel examen',
   screens:[
    {src:'img/echographie.webp', alt:"Saisie d'une échographie pelvienne avec le compte rendu généré à droite", hotspots:[
      {x:.10,y:.28,zoom:2.0,rx:10,ry:-12,label:"Cinq modèles d'examen"},
      {x:.78,y:.72,zoom:2.0,rx:8,ry:12,label:'Compte rendu mis en page'},
      {x:.40,y:.92,zoom:2.4,rx:-8,ry:10,label:'Enregistrer et imprimer'}]}],
   result:{title:'Compte rendu', meta:'Échographie pelvienne', value:'Prêt à imprimer'}},
  {name:'Laboratoire', title:'Résultats de laboratoire', tags:['En service en clinique','Biologie'], fiche:'#cr-04',
   desc:'Le biologiste coche les examens, la feuille de résultats se compose avec les valeurs de référence adaptées au patient.',
   cta:'+ Nouvelle feuille',
   screens:[
    {src:'img/laboratoire.webp', alt:'Laboratoire : examens à cocher et feuille de numération formule sanguine', hotspots:[
      {x:.10,y:.20,zoom:2.4,rx:10,ry:-12,label:'Examens à cocher'},
      {x:.75,y:.45,zoom:2.2,rx:8,ry:12,label:'Normes homme, femme, enfant'},
      {x:.47,y:.97,zoom:2.4,rx:-8,ry:-10,label:'Observation proposée'}]}],
   result:{title:'Feuille de résultats', meta:'Numération formule sanguine', value:'Prête à imprimer'}},
  {name:'Syndromik', tags:[DEV,'Raisonnement'], devTag:DEV, fiche:'#cr-05',
   desc:'Des signes aux pathologies, hors connexion : le médecin coche les signes, les syndromes évoqués sont classés par recoupement.',
   cta:'Combiner des signes',
   screens:[
    {src:'img/syndromik-signes.webp', alt:'Syndromik : combinaison de cinq signes cochés', hotspots:[
      {x:.30,y:.33,zoom:2.2,rx:12,ry:-12,label:'Signes cochés'},
      {x:.50,y:.595,zoom:2.2,rx:8,ry:12,label:'Recherche par recoupement'}]},
    {src:'img/syndromik-syndrome.webp', alt:'Syndromik : fiche du syndrome méningé', hotspots:[
      {x:.35,y:.86,zoom:2.4,rx:-6,ry:10,label:'Pathologie probable'}]}],
   result:{title:'Recherche par recoupement', meta:'5 signes cochés', value:'Syndrome méningé : 4 signes sur 5'}},
  {name:'RDVmed', tags:[DEV,'Suivi patients'], devTag:DEV, fiche:'#cr-06',
   desc:'Suivi des rendez-vous et relance des patients par WhatsApp, SMS ou appel. Captures avec des patients fictifs.',
   cta:'+ Nouveau suivi',
   screens:[
    {src:'img/rdvmed-aujourdhui.webp', alt:"RDVmed : écran Aujourd'hui avec un patient en retard (patients fictifs)", hotspots:[
      {x:.30,y:.395,zoom:2.4,rx:8,ry:12,label:'Retards en premier'},
      {x:.66,y:.573,zoom:2.5,rx:-8,ry:-10,label:'Relance WhatsApp, SMS, appel'}]},
    {src:'img/rdvmed-a-venir.webp', alt:'RDVmed : passages programmés (patients fictifs)', hotspots:[
      {x:.40,y:.168,zoom:2.3,rx:10,ry:-10,label:'Filtres par motif'}]}],
   result:{title:'Relance du patient', meta:'WhatsApp, SMS ou appel', value:'Patient relancé'}}
];

siteMotion();
counters();
const root=document.getElementById('story');
if(root && window.createUIStory) window.story=createUIStory(root,CHAPTERS,{hold:1000,labels:{prev:'Outil précédent',next:'Outil suivant',pause:'Mettre en pause',play:'Lire le film',chapter:'Outil',fiche:'Voir la fiche',open:'Ouvrir'}});
})();
