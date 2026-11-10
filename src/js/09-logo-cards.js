(function(){
  var n2=document.getElementById('next2'),big=document.getElementById('bigcard'),lgl=document.getElementById('lgl'),grid=document.getElementById('lgg');
  if(!n2||!big||!lgl)return;
  var SU=['s','h','c','d'],R=['A','K','Q','J','10','9','8','7','6','5','4','3','2'];
  /* put the company logo in as <img src> by replacing a name here, e.g. {n:'اسم الشركة',src:'logo.svg'} */
  var L=[{n:'MFAZA Developments',src:'assets/img/logo-mafaz.webp'},{n:'DIGI HUB',src:'assets/img/logo-digi-hub.webp'},{n:'زهيد',src:'assets/img/logo-zaheed.webp',cls:'lt'},
    {n:'بنار',src:'assets/img/logo-bunar.webp',cls:'lt'},{n:'مظلة التميز',src:'assets/img/logo-mazallat-al-tamayyuz.webp',cls:'lt'},{n:'المحامي عيسى بن علي',src:'assets/img/logo-lawyer.webp'},
    {n:'غصون نجد',src:'assets/img/card-logo-ghsoon-najd.webp',cls:'dk'},{n:'HERO',src:'assets/img/card-logo-hero.webp',cls:'lt'},
    {n:'وزارة الموارد البشرية والتنمية الاجتماعية',src:'assets/img/logo-hrsd.webp',cls:'lt'},{n:'فاخر',src:'assets/img/logo-fakhr.webp',cls:'lt'},{n:'بن السيف',src:'assets/img/logo-alsaif.webp',cls:'lt'},{n:'Clean Ups',src:'assets/img/logo-clean-ups.webp',cls:'lt'}];/* cls 'lt': light background, blends into the cream card */
  var els=L.map(function(l,k){
    var e=PlayingCard.create({rank:R[k%R.length],suit:SU[k%4],cls:'lgc logo',html:PlayingCard.logo(l)});
    grid.appendChild(e);return e;
  });
  /* one-row carousel: each logo once; the track glides to the far end and back, by however much it overflows */
  function span(){var l=els[els.length-1],d=l.offsetLeft+l.offsetWidth-lgl.clientWidth;grid.style.setProperty('--lgd',-Math.max(0,d)+'px')}
  span();window.addEventListener('resize',span);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(span);
  window.addEventListener('load',span);
  function clamp(x){return Math.max(0,Math.min(1,x))}
  function update(){
    var fl=document.getElementById('flyer'),top=n2.getBoundingClientRect().top,H0=window.innerHeight,
        q=clamp((.9*H0-top)/(.5*H0));
    if(fl)fl.style.opacity=1-q;
  }
  var tick=false;
  function req(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;update()})}}
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',req);
  update();
})();
