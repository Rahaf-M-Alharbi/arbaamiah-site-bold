(function(){
  var sec=document.getElementById('hnd'),st=document.getElementById('hst'),card=document.getElementById('hCard'),txt=document.getElementById('hTxt'),hb=document.querySelector('.hnd .hbar');
  var W,H,hw,cw,range;
  function clamp(x){return Math.max(0,Math.min(1,x))}
  function io(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function lerp(a,b,t){return a+(b-a)*t}
  function layout(){
    W=st.clientWidth;H=st.clientHeight;
    hw=Math.min(560,W*.62);cw=W>760?Math.min(210,W*.3,H*.3):Math.min(110,W*.24,H*.2);
    st.style.setProperty('--hw',hw+'px');st.style.setProperty('--cw',cw+'px');
    range=sec.offsetHeight-H;
  }
  function update(){
    var p=range>0?clamp(-sec.getBoundingClientRect().top/range):0,
        cx=W>760?W*.18:Math.max(cw*.95,W*.2),
        a=io(clamp(p/.18)),         /* hands approach */
        fall=io(clamp((p-.08)/.4)), /* card passes */
        out=io(clamp((p-.74)/.2));   /* top hand withdraws */
    /* card: pinched by the top hand, tumbles down, caught in the bottom hand */
    var wide=W>760,y0=(wide?H*.3:Math.max(H*.1,cw*.85+84))+lerp(0,H*.05,a),y1=wide?H*.6:H*.26,cy=lerp(y0,y1,fall),
        rot=lerp(-16,14,fall)+Math.sin(Math.PI*fall)*10,ry=360*fall;
    card.style.transform='translate('+(cx-cw/2)+'px,'+(cy-cw*.7)+'px) rotate('+rot+'deg) rotateY('+ry+'deg)';
    var t=clamp((p-.38)/.14);
    if(hb)hb.style.opacity=t;
    txt.style.opacity=t;txt.style.transform=(W>760?'translateY(calc(-50% + '+((1-t)*24)+'px))':'translateY('+((1-t)*24)+'px)');
  }
  var tick=false;function req(){if(!tick){tick=true;requestAnimationFrame(function(){tick=false;update()})}}
  window.addEventListener('scroll',req,{passive:true});window.addEventListener('resize',function(){layout();update()});
  layout();update();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){layout();update()});
})();
