/* CTA experiments. Each one starts only when its section is near the viewport and sleeps while it is off-screen,
   so nothing here costs anything until you scroll down to it. */
(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches,all=document.querySelectorAll('.xp');
  if(!all.length||!('IntersectionObserver' in window))return;

  /* .in marks sections on screen: CSS pauses marquee/seal animations without it */
  var vis=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('in',e.isIntersecting)})});
  all.forEach(function(s){vis.observe(s)});

  /* run init(section) once, shortly before the section is reached */
  var boot=new IntersectionObserver(function(es){es.forEach(function(e){
    if(!e.isIntersecting)return;boot.unobserve(e.target);INIT[e.target.dataset.xp](e.target)})},{rootMargin:'400px 0px'});
  function lazy(cls,n){var s=document.querySelector('.'+cls);if(s){s.dataset.xp=n;boot.observe(s)}}
  /* run fn on each animation frame (at most once per frame) while the section is on screen */
  function whileOn(sec,start,stop){new IntersectionObserver(function(es){(es[0].isIntersecting?start:stop)()}).observe(sec)}

  var INIT={

    /* 9: bold draw. Click or drag the top card up: it flies out of the deck, flips and lands on it. */
    p9:function(st){
      var top=document.getElementById('xp9top'),card=document.getElementById('xp9c'),face=card.querySelector('.f'),h=document.getElementById('xp9h'),p=document.getElementById('xp9p'),
          /* one draw in three wins one of the three offers; the other two send the person to the free calculator. Edit WIN, MISS and WIN_CHANCE to change this. */
          WIN_CHANCE=1/3,
          WIN=[['استشارة مجانية','احجز استشارتك المجانية وتكلم معنا عن علامتك'],['تحليل حساباتك بالسوشل ميديا','نراجع حساباتك ونعطيك ملاحظات واضحة تبني عليها'],['ودك بخصم؟ واجهنا في صكة بلوت','اربح الصكة معنا واحصل على خصم على خدماتنا']],
          MISS=['جرب حاسبة ميزانية التسويق','وزع ميزانيتك التسويقية في دقائق مع حاسبتنا المجانية، واعرف أين يذهب كل ريال.'],
          SU=['♠︎','♥︎','♦︎','♣︎'],drawn=false,d=null,from=null;
      function T(x,y,s,r){return'translate('+x+'px,'+y+'px) rotate('+r+'deg) scale('+s+')'}
      function draw(){
        if(drawn)return;drawn=true;
        var fr=top.getBoundingClientRect(),win=Math.random()<WIN_CHANCE,w=win?WIN[Math.random()*WIN.length|0]:null,su=SU[Math.random()*4|0],red=su==='♥︎'||su==='♦︎';
        face.className='f'+(red?' r':'');
        face.innerHTML='<b>A<i>'+su+'</i></b><span class="p">'+su+'</span>';
        if(win){h.textContent=w[0];p.textContent=w[1]+'. تواصل معنا متى ما تحب ونفعل عرضك.'}
        else{h.textContent=MISS[0];p.textContent=MISS[1]}
        top.style.transform='';st.classList.add('drawn');st.parentNode.classList.add('xp9-done');card.classList.add('on');
        var to=card.getBoundingClientRect(),dx=fr.left+fr.width/2-(to.left+to.width/2),dy=fr.top+fr.height/2-(to.top+to.height/2),s=fr.width/to.width;
        from=[dx,dy,s];
        if(!RM){
          card.animate([{transform:T(dx,dy,s,0)},{transform:T(dx*.4,dy*.4-90,1.12,-12),offset:.5},{transform:'rotate(-4deg)'}],{duration:900,easing:'cubic-bezier(.3,.8,.3,1)'});
          card.firstChild.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(180deg)',offset:.15},{transform:'rotateY(0deg)'}],{duration:900,easing:'ease-out'})}
        card.removeAttribute('aria-hidden');if(!RM)setTimeout(function(){burst(card)},650)}
      /* a puff of suits from the drawn card */
      function burst(el){
        var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
        for(var i=0;i<14;i++){
          var n=document.createElement('span'),a=i/14*6.283+Math.random()*.3,k=r.width*(.7+Math.random()*.6);
          n.textContent=SU[i%4];n.setAttribute('aria-hidden','true');n.style.cssText='position:fixed;left:0;top:0;z-index:60;pointer-events:none;font:700 '+(18+Math.random()*18|0)+'px/1 sans-serif;color:#f4dabf;text-shadow:2px 2px 0 #17120f';document.body.appendChild(n);
          n.animate([{transform:'translate('+cx+'px,'+cy+'px) scale(.3)',opacity:1},{transform:'translate('+(cx+Math.cos(a)*k)+'px,'+(cy+Math.sin(a)*k+28)+'px) scale(1) rotate('+(Math.random()*160-80|0)+'deg)',opacity:0}],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'}).onfinish=(function(m){return function(){m.remove()}})(n)}}
      /* drag the top card up past a threshold (or just click it) to draw */
      top.addEventListener('pointerdown',function(e){if(drawn)return;top.setPointerCapture(e.pointerId);top.classList.add('drag');d={id:e.pointerId,x:e.clientX,y:e.clientY,m:false,dx:0,dy:0}});
      top.addEventListener('pointermove',function(e){
        if(!d||e.pointerId!==d.id)return;d.dx=e.clientX-d.x;d.dy=Math.min(0,e.clientY-d.y);
        if(Math.abs(d.dx)+Math.abs(d.dy)>6)d.m=true;
        top.style.transform='translate('+d.dx*.6+'px,'+d.dy+'px) rotate('+d.dx*.05+'deg)'});
      function up(){
        if(!d)return;var g=d;d=null;top.classList.remove('drag');
        if(!g.m||-g.dy>70||Math.abs(g.dx)>110)draw();
        else{top.animate([{transform:top.style.transform},{transform:'none'}],{duration:RM?1:300,easing:'cubic-bezier(.3,1.5,.4,1)'});top.style.transform=''}}
      top.addEventListener('pointerup',up);top.addEventListener('pointercancel',up);
      top.addEventListener('click',function(e){if(e.detail===0)draw()});
    }
  };
  lazy('xp9-stage','p9');
})();
