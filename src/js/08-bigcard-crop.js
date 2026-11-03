(function(){
  var big=document.getElementById('bigcard');if(!big)return;
  function crop(){big.style.setProperty('--crop',Math.max(0,-big.getBoundingClientRect().left)+'px')}
  crop();window.addEventListener('resize',crop);window.addEventListener('load',crop);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(crop);
})();
