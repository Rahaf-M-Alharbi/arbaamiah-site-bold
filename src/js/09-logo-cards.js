(function(){
  var n2=document.getElementById('next2'),big=document.getElementById('bigcard'),lgl=document.getElementById('lgl'),grid=document.getElementById('lgg');
  var lh=lgl&&lgl.querySelector('.lgh');
  if(!n2||!big||!lgl)return;
  var SU=['s','h','c','d'],R=['A','K','Q','J','10','9','8','7'];
  /* put the company logo in as <img src> by replacing a name here, e.g. {n:'اسم الشركة',src:'logo.svg'} */
  var L=[{n:'شعار ١'},{n:'شعار ٢'},{n:'شعار ٣'},{n:'شعار ٤'},{n:'شعار ٥'},{n:'شعار ٦'},{n:'شعار ٧'},{n:'شعار ٨'}];
  var els=L.map(function(l,k){
    var e=PlayingCard.create({rank:R[k],suit:SU[k%4],cls:'lgc logo',html:PlayingCard.logo(l)});
    e.style.zIndex=8-k;
    grid.appendChild(e);return e;
  });
  var ROT=[-7,5,-3,8,-6,4,-9,6],G=[];
  function clamp(x){return Math.max(0,Math.min(1,x))}
  function inOut(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function out(t){return 1-Math.pow(1-t,3)}
  var W,H,cw,sx,sy;
  var ch;
  function layout(){
    var st=lgl.parentNode;W=st.clientWidth;H=st.clientHeight;
    var cols=W<760?2:4,rows=8/cols,gap=Math.max(10,W*.014),pad=Math.max(16,W*.03),pt=W<760?Math.max(pad,72):pad;
    cw=(W-2*pad-gap*(cols-1))/cols;ch=(H-pt-pad-gap*(rows-1))/rows;
    els.forEach(function(e,k){
      var c=k%cols,r=Math.floor(k/cols);
      G[k]={x:pad+cw/2+c*(cw+gap),y:pt+ch/2+r*(ch+gap)};
    });
  }
  function update(){
    var H0=window.innerHeight,top=n2.getBoundingClientRect().top,
        q=clamp((-top-.8*H0)/(1.7*H0)),fl=document.getElementById('flyer'),fc=fl&&fl.firstElementChild;
    lgl.style.opacity=q>0?1:0;lgl.classList.toggle('on',q>=.98);if(fl)fl.style.opacity=1-inOut(clamp(q/.12));
    var br=fc?fc.getBoundingClientRect():{left:W/2-cw/4,top:H/2-ch/4,width:cw/2,height:ch/2},stR=lgl.parentNode.getBoundingClientRect(),
        ox=br.left+br.width/2-stR.left,oy=br.top+br.height/2-stR.top,sw=br.width,sh=br.height;
    els.forEach(function(e,k){
      var t=out(clamp((q-.08-k*.07)/.45)),x=ox+(G[k].x-ox)*t,y=oy+(G[k].y-oy)*t,
          rz=0,w=sw+(cw-sw)*t,h=sh+(ch-sh)*t;
      e.style.opacity=q>0?1:0;
      e.style.width=w+'px';e.style.height=h+'px';e.style.transform='translate('+(x-w/2)+'px,'+(y-h/2)+'px) rotate('+rz+'deg)';
    });
  }
  var tick=false;
  function req(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;update()})}}
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',function(){layout();update()});
  layout();update();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout();update()});
})();
