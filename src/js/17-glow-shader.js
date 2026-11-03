/* Background motion: a fixed WebGL canvas of domain-warped colour fields (wine tones only) with film grain, nudged by the pointer. */
(function(){
  var cv=document.getElementById('glow'); if(!cv) return;
  var gl=cv.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'}); if(!gl){ cv.remove(); return; }
  var vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fs=[
    'precision highp float;',
    'uniform float t;uniform vec2 r;uniform vec2 m;',
    'vec3 cA=vec3(.45,.09,.13);',   /* wine, mid */
    'vec3 cC=vec3(.85,.18,.24);',   /* wine, brighter */
    'vec3 cE=vec3(.10,.02,.04);',   /* wine, softer */
    'float rnd(vec2 s){return fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453);}',
    'vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}',
    'vec2 mod289(vec2 x){return x-floor(x*(1./289.))*289.;}',
    'vec3 perm(vec3 x){return mod289(((x*34.)+1.)*x);}',
    'float sn(vec2 v){',
    '  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);',
    '  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);',
    '  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.);',
    '  vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1; i=mod289(i);',
    '  vec3 p=perm(perm(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));',
    '  vec3 mm=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); mm=mm*mm; mm=mm*mm;',
    '  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;',
    '  mm*=1.79284291400159-.85373472095314*(a0*a0+h*h);',
    '  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw;',
    '  return 130.*dot(mm,g);}',
    'void main(){',
    '  vec2 uv=gl_FragCoord.xy/r; vec2 st=uv; st.x*=r.x/r.y;',
    '  st+=(m-.5)*.18;',
    '  float n1=sn(st*1.2+t*.12); float n2=sn(st*1.6-t*.16+n1);',
    '  vec2 w=st+vec2(n1,n2)*.55;',
    '  float v=.5+.5*sin((w.x*.9+w.y*1.3)*3.2+t*.35);',
    '  v=smoothstep(.1,.9,v);',
    '  vec3 c=mix(cE,cC,v);',
    '  c=mix(c,cA,.35*smoothstep(.3,1.,n1*.5+.5));',
    '  float g=rnd(uv*(fract(t)*7.+100.));',
    '  c+=(g-.5)*.12;',
    '  gl_FragColor=vec4(c,1.);}'
  ].join('\n');
  function sh(type,src){ var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; }
  var pr=gl.createProgram(); gl.attachShader(pr,sh(gl.VERTEX_SHADER,vs)); gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS)){ console.error(gl.getProgramInfoLog(pr)); cv.remove(); return; }
  gl.useProgram(pr);
  var b=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,b); gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  var loc=gl.getAttribLocation(pr,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  var uT=gl.getUniformLocation(pr,'t'), uR=gl.getUniformLocation(pr,'r'), uM=gl.getUniformLocation(pr,'m');
  var mx=.5,my=.5,sx=.5,sy=.5,t0=performance.now(),raf=0,still=matchMedia('(prefers-reduced-motion:reduce)').matches;
  function size(){ var k=Math.min(.7,1100/Math.max(innerWidth,innerHeight)); cv.width=Math.max(2,Math.round(innerWidth*k)); cv.height=Math.max(2,Math.round(innerHeight*k)); gl.viewport(0,0,cv.width,cv.height); }
  function frame(now){
    sx+=(mx-sx)*.04; sy+=(my-sy)*.04;
    gl.uniform1f(uT,(now-t0)/2000); gl.uniform2f(uR,cv.width,cv.height); gl.uniform2f(uM,sx,sy);
    gl.drawArrays(gl.TRIANGLES,0,3);
    raf=still?0:requestAnimationFrame(frame);
  }
  addEventListener('resize',function(){ size(); if(still) frame(performance.now()); });
  addEventListener('pointermove',function(e){ mx=e.clientX/innerWidth; my=1-e.clientY/innerHeight; },{passive:true});
  document.addEventListener('visibilitychange',function(){ if(document.hidden){ cancelAnimationFrame(raf); raf=0; } else if(!raf&&!still) raf=requestAnimationFrame(frame); });
  size(); raf=requestAnimationFrame(frame);
})();
