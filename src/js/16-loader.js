/* Hide the page loader once the page is ready to show (shown at least 900 ms so it never flashes).
   "Ready" is the fonts, not the window load event: load also waits for every below-the-fold logo, which on a slow phone connection kept the curtain up (and the hero cards hidden behind it) for seconds. */
(function(){
  var l=document.getElementById('ldr'); if(!l) return;
  var t0=Date.now(), hid=false;
  function hide(){
    if(hid) return; hid=true;
    setTimeout(function(){ l.classList.add('done'); setTimeout(function(){ l.remove(); },800); }, Math.max(0,900-(Date.now()-t0)));
  }
  if(document.readyState==='complete') hide();
  else if(document.fonts&&document.fonts.ready) document.fonts.ready.then(hide);
  else window.addEventListener('load',hide);
  setTimeout(hide,6000);
})();
