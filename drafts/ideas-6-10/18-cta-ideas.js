/* Five "press a card, reveal a free consultation" ideas (see 32-cta-ideas.css). Each starts once, shortly before its section is reached. */
(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches,secs=document.querySelectorAll('.xpi');
  if(!secs.length||!('IntersectionObserver' in window))return;
  var SP=['♠︎','♥︎','♦︎','♣︎'];
  var SV=[['A',SP[0],'المحتوى'],['K',SP[1],'التصميم'],['Q',SP[2],'الإعلانات'],['J',SP[3],'النمو'],['10',SP[0],'جلسة أولى']];
  var WIN='استشارة مجانية: ٣٠ دقيقة علينا، بلا التزام.';
  function faceS(s){return '<span class="f'+(s[1]===SP[1]||s[1]===SP[2]?' r':'')+'"><b>'+s[0]+'<i>'+s[1]+'</i></b><strong>'+s[2]+'</strong><span class="p">'+s[1]+'</span></span>'}
  function faceP(t,sub){return '<span class="f pz"><b>★</b><strong>'+t+'</strong><small>'+sub+'</small><span class="p">★</span></span>'}
  function card(face,cls,label,st){return '<button type="button" class="bc '+(cls||'')+'" aria-label="'+(label||'ورقة')+'"'+(st?' style="'+st+'"':'')+'><span class="in"><span class="b">٤٠٠</span>'+face+'</span></button>'}
  function q(sec,sel){return sec.querySelector(sel)}
  function msg(sec,t){q(sec,'.xi-msg').textContent=t||''}
  function show(sec){q(sec,'.xi-btns').classList.add('xi-show')}
  function hide(sec){q(sec,'.xi-btns').classList.remove('xi-show');msg(sec,'')}
  function win(sec){msg(sec,WIN);show(sec)}
  function anim(el,kf,o){return el.animate(kf,{duration:RM?1:o.d,easing:o.e||'ease-out',delay:RM?0:(o.delay||0),fill:o.fill||'none'})}
  function wait(fn,ms){setTimeout(fn,RM?0:ms)}
  /* a puff of stars and suits from the middle of an element */
  function burst(el){
    if(RM)return;
    var r=el.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,G=['★'].concat(SP);
    for(var i=0;i<18;i++){
      var s=document.createElement('span'),a=i/18*6.283+Math.random()*.3,d=r.width*(.7+Math.random()*.7);
      s.className='xi-burst';s.textContent=G[i%G.length];s.style.fontSize=(18+Math.random()*20|0)+'px';document.body.appendChild(s);
      var k=s.animate([{transform:'translate('+cx+'px,'+cy+'px) scale(.3) rotate(0)',opacity:1},{transform:'translate('+(cx+Math.cos(a)*d)+'px,'+(cy+Math.sin(a)*d+30)+'px) scale(1) rotate('+(Math.random()*160-80|0)+'deg)',opacity:0}],{duration:900+Math.random()*500,easing:'cubic-bezier(.2,.7,.3,1)'});
      k.onfinish=(function(n){return function(){n.remove()}})(s)}}

  var INIT={
    /* 1: pick one of three. The one you press turns out to be the gift; the others show a service. */
    1:function(sec){
      var row=q(sec,'.xi1-row'),R=[-3,0,3];
      function build(){
        row.classList.remove('picked');
        row.innerHTML=[SV[0],SV[1],SV[2]].map(function(s,i){return card(faceS(s),'','ورقة '+(i+1),'--r:'+R[i]+'deg')}).join('')}
      row.addEventListener('click',function(e){
        var c=e.target.closest('.bc');if(!c||row.classList.contains('picked'))return;
        row.classList.add('picked');
        c.querySelector('.f').outerHTML=faceP('هديّتك','استشارة مجانية');c.classList.add('on');
        wait(function(){burst(c);win(sec);
          [].forEach.call(row.children,function(x){if(x!==c)x.classList.add('on','dim')})},650)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 2: scratch card. Rub the ink away with a finger or the mouse; at about half cleared the gift shows. */
    2:function(sec){
      var sc=q(sec,'.xi2-sc'),cv=q(sec,'.xi2-cv'),ctx=cv.getContext('2d'),W=0,H=0,last=null,n=0,open=false,fam='';
      function paint(){
        var w=sc.clientWidth,h=sc.clientHeight;if(!w||open||last)return;
        if(W===w*2&&H===h*2)return;
        W=cv.width=w*2;H=cv.height=h*2;fam=getComputedStyle(sc).fontFamily;
        ctx.globalCompositeOperation='source-over';ctx.fillStyle='#17120f';ctx.fillRect(0,0,W,H);
        ctx.strokeStyle='rgba(244,218,191,.2)';ctx.lineWidth=3;
        for(var y=20;y<H;y+=60)for(var x=(y/60%2?50:20);x<W;x+=60){ctx.beginPath();ctx.arc(x,y,12,0,6.283);ctx.stroke()}
        ctx.fillStyle='#f4dabf';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.font='700 '+Math.round(H*.2)+'px '+fam;ctx.fillText('اكشط هنا',W/2,H*.46);
        ctx.font='700 '+Math.round(H*.1)+'px '+fam;ctx.fillText('٤٠٠',W/2,H*.7)}
      function reveal(){if(open)return;open=true;sc.classList.add('open');sc.removeAttribute('tabindex');wait(function(){burst(sc);win(sec)},350)}
      function cleared(){
        var d=ctx.getImageData(0,0,W,H).data,c=0,t=0;
        for(var i=3;i<d.length;i+=4*53){t++;if(d[i]<40)c++}return c/t}
      function at(e){var r=sc.getBoundingClientRect();return [(e.clientX-r.left)*2,(e.clientY-r.top)*2]}
      function rub(e){
        var p=at(e);ctx.globalCompositeOperation='destination-out';ctx.strokeStyle='#000';ctx.lineCap=ctx.lineJoin='round';ctx.lineWidth=H*.16;
        ctx.beginPath();ctx.moveTo(last[0],last[1]);ctx.lineTo(p[0]+.1,p[1]);ctx.stroke();last=p;
        if(++n%10===0&&cleared()>.42)reveal()}
      sc.addEventListener('pointerdown',function(e){if(open)return;sc.setPointerCapture(e.pointerId);last=at(e);rub(e)});
      sc.addEventListener('pointermove',function(e){if(last&&!open)rub(e)});
      function up(){last=null;if(!open&&n&&cleared()>.42)reveal()}
      sc.addEventListener('pointerup',up);sc.addEventListener('pointercancel',up);
      sc.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();reveal()}});
      function again(){hide(sec);open=false;last=null;n=0;W=H=0;sc.classList.remove('open');sc.setAttribute('tabindex','0');paint()}
      q(sec,'.xi-again').addEventListener('click',again);
      if('ResizeObserver' in window)new ResizeObserver(paint).observe(sc);
      paint()
    },

    /* 3: card, then a ticket. The card turns over and a ticket slides out from under it. */
    3:function(sec){
      var st=q(sec,'.xi3-st'),busy=false;
      function build(){
        busy=false;st.classList.remove('out');
        st.innerHTML='<div class="xi3-tk" aria-hidden="true"><b>استشارة مجانية</b><span>٣٠ دقيقة علينا · بلا التزام</span></div>'+card(faceP('مفاجأة','انظر تحتها'),'','اقلب الورقة')}
      st.addEventListener('click',function(e){
        var c=e.target.closest('.bc');if(!c||busy)return;busy=true;c.classList.add('on');
        wait(function(){st.classList.add('out');wait(function(){burst(q(st,'.xi3-tk'));win(sec)},900)},500)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 4: one of five. The ones you leave fall away and yours moves to the middle and turns over. */
    4:function(sec){
      var row=q(sec,'.xi4-row');
      function build(){row.classList.remove('picked');row.innerHTML=SV.map(function(s,i){return card(faceS(s),'','ورقة '+(i+1))}).join('')}
      row.addEventListener('click',function(e){
        var c=e.target.closest('.bc');if(!c||row.classList.contains('picked'))return;
        row.classList.add('picked');
        var rr=row.getBoundingClientRect(),cr=c.getBoundingClientRect();
        [].forEach.call(row.children,function(x){if(x!==c)x.classList.add('gone')});
        c.querySelector('.f').outerHTML=faceP('هديّتك','استشارة مجانية');c.classList.add('sel');
        c.style.transform='translate('+(rr.left+rr.width/2-cr.left-cr.width/2)+'px,'+(rr.top+rr.height/2-cr.top-cr.height/2)+'px) scale(1.3)';
        wait(function(){c.classList.add('on');wait(function(){burst(c);win(sec)},550)},450)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    },

    /* 5: pull from the deck. Press the pile; the top card rises, turns over, and it is the gift. */
    5:function(sec){
      var dk=q(sec,'.xi5-dk');
      function build(){
        dk.classList.remove('drawn');
        dk.innerHTML=[4,3,2,1,0].map(function(k){return card(k?faceS(SV[k%5]):faceP('هديّتك','استشارة مجانية'),'',k?'ورقة':'اسحب ورقة','--k:'+k)}).join('')}
      dk.addEventListener('click',function(){
        if(dk.classList.contains('drawn'))return;dk.classList.add('drawn');
        var t=dk.lastChild;
        anim(t,[{transform:'translate(0,0)'},{transform:'translate(0,-34%) scale(1.12)',offset:.45},{transform:'translate(0,-16%) scale(1.2)'}],{d:900,fill:'forwards'});
        wait(function(){t.classList.add('on');wait(function(){burst(t);win(sec)},600)},350)});
      q(sec,'.xi-again').addEventListener('click',function(){hide(sec);build()});
      build()
    }
  };
  var boot=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;boot.unobserve(e.target);INIT[e.target.dataset.i](e.target)})},{rootMargin:'400px 0px'});
  secs.forEach(function(s){boot.observe(s)});
})();
