/* Cursor: real mouse only. the card is the default: it leans with the movement and flips over cards. Only buttons (and the busy data-cur="heart" sections: work deck, client stories, footer, contact form) show the heart. Over text fields the system cursor stays. Styles in 40-cursor.css. */
(function(){
  if(!matchMedia('(pointer:fine)').matches||!matchMedia('(hover:hover)').matches) return;
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches,
      BTN='button:not(:disabled),.flipbtn,.cta,.ft-cta,.pg-cta,.fq-all,summary,[role=button],.tab,.xp9-top',
      CARD='.pk,.pnl,.slot,.hcard,.pcard,.slot3.f,.cc',
      TXT='input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea,select,[contenteditable]';
  function mk(cls,html){var d=document.createElement('div');d.className='cu '+cls;d.setAttribute('aria-hidden','true');d.innerHTML=html;document.body.appendChild(d);return d}
  var card={el:mk('cu-c','<span class="t"><i class="b">♦&#xFE0E;</i><i class="f">♠&#xFE0E;</i></span>'),x:-100,y:-100,k:still?1:.38},
      heart={el:mk('cu-h','<svg viewBox="0 0 32 32"><path d="M16 28C6 20 3 14 3 9.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 1.5C29 14 26 20 16 28Z"/></svg>'),x:-100,y:-100,k:still?1:.5},
      tilt=card.el.firstChild, m={x:-100,y:-100,vx:0}, seen=false;
  document.documentElement.classList.add('cur');
  addEventListener('mousemove',function(e){
    m.vx=e.clientX-m.x;m.x=e.clientX;m.y=e.clientY;
    if(!seen){seen=true;card.x=heart.x=m.x;card.y=heart.y=m.y}
  },{passive:true});
  document.addEventListener('mouseover',function(e){
    var t=e.target,c=t.closest?t:t.parentElement,z=c&&c.closest('[data-cur]'),area=z?z.dataset.cur:'',
        txt=c&&c.closest(TXT),btn=c&&c.closest(BTN),
        icon=txt?'':(btn?'heart':(area||'card'));
    card.el.classList.toggle('on',icon==='card');
    card.el.classList.toggle('hot',!!(c&&c.closest(CARD)));
    heart.el.classList.toggle('on',icon==='heart');
  },{passive:true});
  document.documentElement.addEventListener('mouseleave',function(){card.el.classList.remove('on');heart.el.classList.remove('on')});
  (function loop(){
    card.x+=(m.x-card.x)*card.k;card.y+=(m.y-card.y)*card.k;
    heart.x+=(m.x-heart.x)*heart.k;heart.y+=(m.y-heart.y)*heart.k;
    card.el.style.transform='translate('+card.x.toFixed(1)+'px,'+card.y.toFixed(1)+'px)';
    heart.el.style.transform='translate('+heart.x.toFixed(1)+'px,'+heart.y.toFixed(1)+'px)';
    tilt.style.transform='rotate('+Math.max(-28,Math.min(28,m.vx*1.2)).toFixed(1)+'deg)';
    m.vx*=.8;
    requestAnimationFrame(loop);
  })();
})();
