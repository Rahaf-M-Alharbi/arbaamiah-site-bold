/* Hide the page loader once everything has loaded (shown at least 900 ms so it never flashes). */
(function(){
  var l=document.getElementById('ldr'); if(!l) return;
  var t0=Date.now(), hid=false;
  function hide(){
    if(hid) return; hid=true;
    setTimeout(function(){ l.classList.add('done'); setTimeout(function(){ l.remove(); },800); }, Math.max(0,900-(Date.now()-t0)));
  }
  if(document.readyState==='complete') hide(); else window.addEventListener('load',hide);
  setTimeout(hide,6000);
})();
