/* Cursor: real mouse only. The native pointer is a spade (40-cursor.css); over buttons, links and data-cur="heart" sections a heart follows the mouse instead. Text fields keep the native text cursor. */
(function(){
  if(!matchMedia('(pointer:fine)').matches||!matchMedia('(hover:hover)').matches) return;
  var still=matchMedia('(prefers-reduced-motion:reduce)').matches,
      HEART='a,button:not(:disabled),summary,label,[role=button],.tab,.xp9-top,[data-cur=heart]',
      TXT='input:not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]),textarea,select,[contenteditable]',
      k=still?1:.5, m={x:-100,y:-100}, h={x:-100,y:-100}, seen=false,
      el=document.createElement('div');
  el.className='cu-h';el.setAttribute('aria-hidden','true');
  el.innerHTML='<svg viewBox="0 0 32 32"><path d="M16 28C6 20 3 14 3 9.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 1.5C29 14 26 20 16 28Z"/></svg>';
  document.body.appendChild(el);
  document.documentElement.classList.add('cur');
  addEventListener('mousemove',function(e){m.x=e.clientX;m.y=e.clientY;if(!seen){seen=true;h.x=m.x;h.y=m.y}},{passive:true});
  document.addEventListener('mouseover',function(e){
    var t=e.target,c=t.closest?t:t.parentElement;
    el.classList.toggle('on',!!c&&!c.closest(TXT)&&!!c.closest(HEART));
  },{passive:true});
  document.documentElement.addEventListener('mouseleave',function(){el.classList.remove('on')});
  (function loop(){
    h.x+=(m.x-h.x)*k;h.y+=(m.y-h.y)*k;
    el.style.transform='translate('+h.x.toFixed(1)+'px,'+h.y.toFixed(1)+'px)';
    requestAnimationFrame(loop);
  })();
})();
