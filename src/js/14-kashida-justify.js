(function(){
var SEL='.sec2 p,.dk-head p,.wk-head p,.ctf-t p,.ft p';
var DUAL='بتثجحخسشصضطظعغفقكلمنهيئ',AR=/[\u0621-\u064A]/,TW='\u0640';
var cv=document.createElement('canvas').getContext('2d');
function slots(w){var o=[];for(var i=1;i<w.length-1;i++){var a=w[i-1],b=w[i];if(DUAL.indexOf(a)>-1&&AR.test(b)&&!(a==='ل'&&'اأإآ'.indexOf(b)>-1))o.push(i)}
 if(!o.length&&w.length>2&&DUAL.indexOf(w[0])>-1&&AR.test(w[1]))o.push(1);return o}
function run(p){
 var t=p.getAttribute('data-kj');if(t===null){t=p.textContent.replace(/\s+/g,' ').trim();p.setAttribute('data-kj',t)}
 var W=p.clientWidth;if(!W||W<120)return;p._kjw=W;
 var cs=getComputedStyle(p);cv.font=cs.fontStyle+' '+cs.fontWeight+' '+cs.fontSize+' '+cs.fontFamily;
 var sp=cv.measureText(' ').width,tw=cv.measureText(TW).width;if(!tw)return;
 var words=t.split(' '),lines=[],cur=[],cw=0;
 words.forEach(function(w){var ww=cv.measureText(w).width,add=cur.length?sp+ww:ww;if(cur.length&&cw+add>W){lines.push(cur);cur=[w];cw=ww}else{cur.push(w);cw+=add}});
 if(cur.length)lines.push(cur);
 var out='';
 lines.forEach(function(L,li){
  var last=li===lines.length-1,txt=L.slice();
  if(!last&&L.length>1){
   var wd=cv.measureText(L.join(' ')).width,n=Math.floor((W-wd)/tw),ext=txt.map(function(){return 0});
   var sl=L.map(slots),tot=sl.reduce(function(a,b){return a+(b.length?1:0)},0);
   if(tot&&n>0){var k=0,guard=0;while(n>0&&guard++<400){var wi=k%L.length;if(sl[wi].length&&ext[wi]<6){ext[wi]++;n--}k++}}
   txt=L.map(function(w,wi){if(!ext[wi])return w;var s2=sl[wi],pos=s2[Math.floor(s2.length/2)];return w.slice(0,pos)+new Array(ext[wi]+1).join(TW)+w.slice(pos)});
  }
  out+='<span class="kj-l'+(last?' kj-e':'')+'" aria-hidden="true">'+txt.join(' ')+'</span>';
 });
 p.innerHTML='<span class="kj-sr">'+t+'</span>'+out;
}
function all(){document.querySelectorAll(SEL).forEach(run)}
var tm;function later(){clearTimeout(tm);tm=setTimeout(all,120)}
addEventListener('resize',later);addEventListener('load',all);
if(window.ResizeObserver){var ro=new ResizeObserver(function(es){es.forEach(function(e){if(Math.abs(e.contentRect.width-(e.target._kjw||0))>1)run(e.target)})});document.querySelectorAll(SEL).forEach(function(p){ro.observe(p)})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(all);
all();
})();
