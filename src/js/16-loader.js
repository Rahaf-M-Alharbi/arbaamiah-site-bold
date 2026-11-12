/* Hide the page loader once the page is ready to show (shown at least 900 ms so it never flashes).
   "Ready" is the three font faces the hero draws with, not document.fonts.ready and not the window load event: ready also waits for every other face the page uses (about 80 KB each) and load waits for every below-the-fold logo, which on a slow phone connection kept the curtain up (and the hero cards hidden behind it) for seconds. The other faces swap in when they arrive. */
(function(){
  var l=document.getElementById('ldr'); if(!l) return;
  var t0=Date.now(), hid=false;
  function hide(){
    if(hid) return; hid=true;
    setTimeout(function(){ l.classList.add('done'); setTimeout(function(){ l.remove(); },800); }, Math.max(0,900-(Date.now()-t0)));
  }
  if(document.readyState==='complete') hide();
  else if(document.fonts&&document.fonts.load) Promise.all(['700 1em "Thmanyah Serif Display"','700 1em "Thmanyah Sans"','500 1em "Thmanyah Sans"'].map(function(f){return document.fonts.load(f)})).then(hide,hide);
  else window.addEventListener('load',hide);
  setTimeout(hide,6000);
})();
