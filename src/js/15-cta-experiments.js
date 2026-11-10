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
          /* one draw in three wins one of the three offers (with a shareable card image); the other two send the person to the free calculator. Edit WIN, MISS and WIN_CHANCE to change this. */
          WIN_CHANCE=1/3,
          WIN=[['استشارة مجانية','احجز استشارتك المجانية وتكلم معنا عن علامتك'],['تحليل حساباتك بالسوشل ميديا','نراجع حساباتك ونعطيك ملاحظات واضحة تبني عليها'],['ودك بخصم؟ واجهنا في صكة بلوت','اربح الصكة معنا واحصل على خصم على خدماتنا']],
          MISS=['جرب الحاسبة المجانية','وزع ميزانيتك التسويقية في دقائق مع حاسبتنا المجانية، واعرف أين يذهب كل ريال.'],
          btns=document.querySelector('.xp9-btns'),calc=btns&&btns.querySelector('a[href="budget.html"]'),shareBtn=null,shareBlob=null,wonTitle='',
          SU=['♠︎','♥︎','♦︎','♣︎'],drawn=false,d=null,from=null;
      function T(x,y,s,r){return'translate('+x+'px,'+y+'px) rotate('+r+'deg) scale('+s+')'}
      function draw(){
        if(drawn)return;drawn=true;
        var fr=top.getBoundingClientRect(),win=Math.random()<WIN_CHANCE,w=win?WIN[Math.random()*WIN.length|0]:null,su=SU[Math.random()*4|0],red=su==='♥︎'||su==='♦︎';
        face.className='f'+(red?' r':'');
        face.innerHTML='<b>A<i>'+su+'</i></b><span class="p">'+su+'</span>';
        if(win){h.textContent=w[0];p.textContent=w[1]+'. شارك ورقتك على إكس وأشر إلينا @arbaamia ونفعل عرضك.';wonTitle=w[0];showButtons(true);makeImage(w[0],su,red).then(function(b){shareBlob=b})}
        else{h.textContent=MISS[0];p.textContent=MISS[1];showButtons(false)}
        top.style.transform='';st.classList.add('drawn');st.parentNode.classList.add('xp9-done');card.classList.add('on');
        var to=card.getBoundingClientRect(),dx=fr.left+fr.width/2-(to.left+to.width/2),dy=fr.top+fr.height/2-(to.top+to.height/2),s=fr.width/to.width;
        from=[dx,dy,s];
        if(!RM){
          card.animate([{transform:T(dx,dy,s,0)},{transform:T(dx*.4,dy*.4-90,1.12,-12),offset:.5},{transform:'rotate(-4deg)'}],{duration:900,easing:'cubic-bezier(.3,.8,.3,1)'});
          card.firstChild.animate([{transform:'rotateY(180deg)'},{transform:'rotateY(180deg)',offset:.15},{transform:'rotateY(0deg)'}],{duration:900,easing:'ease-out'})}
        card.removeAttribute('aria-hidden');if(!RM)setTimeout(function(){burst(card)},650)}
      /* after a win the share button replaces the calculator button; after a miss the calculator button stays */
      function showButtons(win){
        if(calc)calc.hidden=win;
        if(win&&btns&&!shareBtn){
          shareBtn=document.createElement('button');shareBtn.type='button';shareBtn.className='xp9-share';shareBtn.setAttribute('aria-label','شاركنا فوزك على إكس');shareBtn.title='شاركنا فوزك على إكس';
          shareBtn.innerHTML='<span class="xp9-circ"><svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></span><span class="xp9-sl">شاركنا فوزك على إكس</span>';
          shareBtn.onclick=share;btns.insertBefore(shareBtn,btns.firstChild)}
        if(shareBtn)shareBtn.hidden=!win}
      function toast(t){var e=document.createElement('div');e.setAttribute('role','status');e.textContent=t;e.style.cssText='position:fixed;inset-inline:16px;bottom:16px;max-width:420px;margin:0 auto;padding:12px 16px;border:3px solid #17120f;border-radius:12px;background:#f4dabf;color:#17120f;font:700 14px/1.5 sans-serif;text-align:center;z-index:90';document.body.appendChild(e);setTimeout(function(){e.remove()},3200)}
      /* the card image to post: 4:5, the card with the won offer, our handle and site at the bottom */
      function makeImage(title,su,red){
        var load=function(f){return document.fonts&&document.fonts.load?document.fonts.load(f):Promise.resolve()};
        return Promise.all([load("700 60px 'Thmanyah Serif Display'"),load("700 40px 'Thmanyah Sans'")]).then(function(){
          var W=1080,H=1350,c=document.createElement('canvas');c.width=W;c.height=H;var x=c.getContext('2d'),INK='#17120f',CREAM='#f4dabf',WINE='#6c171e',SER="'Thmanyah Serif Display',serif",SANS="'Thmanyah Sans',sans-serif";
          function rr(a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath()}
          x.fillStyle=WINE;x.fillRect(0,0,W,H);
          x.direction='rtl';x.textAlign='center';x.fillStyle=CREAM;x.font='700 62px '+SER;x.fillText('ربحت من أربعمية',W/2,120);
          x.save();x.translate(W/2,H/2-40);x.rotate(-.04);
          var cw=700,ch=900;x.fillStyle=INK;rr(-cw/2+18,-ch/2+18,cw,ch,40);x.fill();
          x.fillStyle=CREAM;rr(-cw/2,-ch/2,cw,ch,40);x.fill();x.lineWidth=12;x.strokeStyle=INK;x.stroke();
          x.lineWidth=5;rr(-cw/2+30,-ch/2+30,cw-60,ch-60,24);x.stroke();
          var col=red?WINE:INK;x.fillStyle=col;
          /* draw a glyph so its ink (not its text box) is centred on cx,cy: the suit signs sit off-centre in their line box */
          function glyph(t,cx,cy,font){x.font=font;var m=x.measureText(t);x.fillText(t,cx-(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2,cy+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2)}
          x.direction='ltr';x.textAlign='left';x.textBaseline='alphabetic';
          /* corner index, repeated upside down in the opposite corner like a real card */
          function index(){glyph('A',0,0,'700 130px '+SER);glyph(su,0,92,'700 78px '+SANS)}
          x.save();x.translate(-cw/2+84,-ch/2+96);index();x.restore();
          x.save();x.translate(cw/2-84,ch/2-96);x.rotate(Math.PI);index();x.restore();
          /* the suit: centred horizontally, in the middle of the space above the offer text */
          x.globalAlpha=.92;glyph(su,0,-110,'700 380px '+SANS);x.globalAlpha=1;
          /* divider with a small suit, then the offer, centred in the lower third */
          x.lineWidth=4;x.strokeStyle=col;x.beginPath();x.moveTo(-170,130);x.lineTo(-40,130);x.moveTo(40,130);x.lineTo(170,130);x.stroke();
          glyph(su,0,130,'700 36px '+SANS);
          x.textAlign='center';x.direction='rtl';x.fillStyle=WINE;x.font='700 54px '+SER;
          var words=title.split(' '),lines=[],cur='';words.forEach(function(w){var t=cur?cur+' '+w:w;if(x.measureText(t).width>cw-300&&cur){lines.push(cur);cur=w}else cur=t});lines.push(cur);
          var y0=250+(lines.length>1?0:25);lines.forEach(function(l,i){x.fillText(l,0,y0+i*72)});
          x.restore();
          x.direction='rtl';x.textAlign='center';x.fillStyle=CREAM;x.font='700 78px '+SER;x.fillText('أربعمية',W/2,H-150);
          x.direction='ltr';x.font='600 42px '+SANS;x.fillText('@arbaamia  ·  arbaamia.sa',W/2,H-80);
          return new Promise(function(res){c.toBlob(res,'image/png')})})
      }
      /* share: the phone share sheet with the image when the browser supports it; otherwise download the image and open a prepared post on X */
      function share(){
        var text='ربحت «'+wonTitle+'» من @arbaamia 🃏 اسحب ورقتك وجرب حظك: https://arbaamia.sa/';
        function go(blob){
          var file=new File([blob],'arbaamiah-card.png',{type:'image/png'});
          if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],text:text}).catch(function(){});return}
          var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='arbaamiah-card.png';document.body.appendChild(a);a.click();a.remove();
          toast('نزلنا صورة ورقتك. أرفقها بتغريدتك ونفعل عرضك.');
          window.open('https://x.com/intent/post?text='+encodeURIComponent(text),'_blank','noopener')}
        if(shareBlob)go(shareBlob);else makeImage(wonTitle,'♠︎',false).then(go)}
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
