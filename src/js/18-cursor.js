/* Cursor: real mouse only. Each area shows exactly one icon instead of the native pointer: data-cur="card" (a card that leans and flips over cards) or data-cur="heart" (a small solid heart). Buttons and links always get the heart, even inside card areas. Areas without data-cur keep the native spade pointer. Styles in 40-cursor.css. */
(function(){
  if(!matchMedia('(pointer:fine)').matches||!matchMedia('(hover:hover)').matches) return;
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches,
      BTN='a,button:not(:disabled),summary,label,[role=button],.tab',
      CARD='.hcard,.pcard,.slot3.f,.xp9-top,.wk-deck,.wk-rail',
      TXT='input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea,select,[contenteditable]';
  function mk(cls,html){var d=document.createElement('div');d.className='cu '+cls;d.setAttribute('aria-hidden','true');d.innerHTML=html;document.body.appendChild(d);return d}
  var card={el:mk('cu-c','<span class="t"><i class="b">♦&#xFE0E;</i><i class="f">♠&#xFE0E;</i></span>'),x:-100,y:-100,k:still?1:.38},
      heart={el:mk('cu-h','<svg viewBox="0 0 32 32"><path d="M16 28C6 20 3 14 3 9.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 1.5C29 14 26 20 16 28Z"/></svg>'),x:-100,y:-100,k:still?1:.5},
      tilt=card.el.firstChild, m={x:-100,y:-100,vx:0,vy:0}, seen=false;
  document.documentElement.classList.add('cur');
  addEventListener('mousemove',function(e){
    m.vx=e.clientX-m.x;m.vy=e.clientY-m.y;m.x=e.clientX;m.y=e.clientY;
    if(!seen){seen=true;card.x=heart.x=m.x;card.y=heart.y=m.y}
  },{passive:true});
  document.addEventListener('mouseover',function(e){
    var t=e.target,c=t.closest?t:t.parentElement,z=c&&c.closest('[data-cur]'),area=z?z.dataset.cur:'',
        txt=c&&c.closest(TXT),btn=c&&c.closest(BTN),crd=c&&c.closest(CARD),
        icon=txt||!area?'':(btn?'heart':area);
    card.el.classList.toggle('on',icon==='card');
    card.el.classList.toggle('hot',!!crd);
    heart.el.classList.toggle('on',icon==='heart');
    heart.el.classList.toggle('hot',!!(btn||crd));
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
