(function(){var m=document.getElementById('mini');if(!m)return;
function parse(c){var r=c.match(/[\d.]+/g)||[];return{a:r[3]===undefined?1:+r[3],l:(.2126*r[0]+.7152*r[1]+.0722*r[2])/255}}
function lumAt(x,y){var els=document.elementsFromPoint(x,y);for(var i=0;i<els.length;i++){var e=els[i];if(m.contains(e))continue;while(e&&e.nodeType===1){var p=parse(getComputedStyle(e).backgroundColor);if(p.a>.5)return p.l;e=e.parentElement}}return 0}
var tick=false;function upd(){tick=false;m.classList.toggle('on-dark',lumAt(innerWidth/2,40)<.45)}
function req(){if(!tick){tick=true;requestAnimationFrame(upd)}}
addEventListener('scroll',req,{passive:true});addEventListener('resize',req);upd();
})();
