var Fe=Object.defineProperty;var Ie=(t,e,r)=>e in t?Fe(t,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):t[e]=r;var p=(t,e,r)=>Ie(t,typeof e!="symbol"?e+"":e,r);import{c as Oe,aq as b,ar as ve,as as Re,at as Pe,au as Ve,av as Te,aw as Ae,ax as W,r as d,ay as Ne,j as X,az as Ge,aA as ke,aB as le,aC as Y,Y as ze,aD as He,aE as We,aF as Xe,aG as fe,aH as Ye,aI as je,aJ as qe,aK as Z,aL as Ke}from"./index-CswphSY3.js";import{useUserStore as Ze}from"./userStore-fXitae2j.js";const $e=Oe(t=>({splashActive:!1,authTransitioning:!1,setSplashActive:e=>t({splashActive:e}),setAuthTransitioning:e=>t({authTransitioning:e})})),Je=t=>{const e=Math.min(Math.max(t,0),1);return e<.5?4*e*e*e:1-Math.pow(-2*e+2,3)/2},Qe=(t,e)=>t>=e?{kx:1,ky:e/t}:{kx:t/e,ky:1},et=(t,e,r,a,o)=>{const n=.5+(t-r.fx)*r.z,i=.5+(e-r.fy)*r.z;return{x:.5+(n-.5)/a,y:.5+(i-.5)/o}},tt=(t,e)=>{const r=(t-b[0])/(ve*.5),a=(e-b[1])/(Re*.5)*Pe;return Math.hypot(r,a)},rt=()=>Math.max(...[[0,0],[1,0],[0,1],[1,1]].map(([e,r])=>tt(e,r)))*1.05,ue=(t,e,r,a)=>{const o=Je(t),n=e[0],i=e[1],l=n,f=i+Ve,u=1-o,E=u*u*n+2*u*o*l+o*o*r.fx,A=u*u*i+2*u*o*f+o*o*r.fy,v=a+(r.z-a)*o;return{fx:E,fy:A,z:v}},he=12/820,me=t=>{const e=Math.min(Math.max(t,0),1);return e*e*(3-2*e)},at=t=>{let e=t>>>0;return()=>{e|=0,e=e+1831565813|0;let r=Math.imul(e^e>>>15,1|e);return r=r+Math.imul(r^r>>>7,61|r)^r,((r^r>>>14)>>>0)/4294967296}},ot=(t,e=7)=>{const r=at(e),a=(c,L)=>c+(L-c)*r(),o=new Float32Array(t),n=new Float32Array(t),i=new Float32Array(t),l=new Float32Array(t),f=new Float32Array(t),u=new Float32Array(t),E=new Float32Array(t),A=new Float32Array(t),v=new Float32Array(t),g=new Float32Array(t);for(let c=0;c<t;c++)o[c]=a(0,Math.PI*2),n[c]=r(),i[c]=a(.5,1.1),l[c]=a(1,2.3)*he,f[c]=a(.2,1.2)*he,u[c]=a(.3,1.3)/820,E[c]=a(0,Math.PI*2),A[c]=a(.5,1.05),v[c]=a(-.015,.02),g[c]=a(.5,.85);return{count:t,ang:o,phase:n,life:i,rise:l,rout:f,jamp:u,jph:E,brt:A,roff:v,big:g,outUV:new Float32Array(t*2),outB:new Float32Array(t),outSize:new Float32Array(t),activeCount:0}},nt=(t,e,r)=>{let a=0;for(let o=0;o<t.count;o++){const n=t.life[o],i=((r/n+t.phase[o])%1+1)%1,l=me(i/.25)*me((1-i)/.5);if(l<.02)continue;const f=i*n,u=t.ang[o],E=Math.cos(u),A=Math.sin(u),v=e+t.roff[o];let g=b[0]+ve*v*E/2,c=b[1]+Re*v*A/2/Pe;c-=t.rise[o]*f,g+=t.rout[o]*f*E+t.jamp[o]*Math.sin(6*f+t.jph[o]),c+=t.rout[o]*f*A,t.outUV[a*2]=g,t.outUV[a*2+1]=c,t.outB[a]=t.brt[o]*l,t.outSize[a]=t.big[o],a++}t.activeCount=a},it=.999,st=({elapsedMs:t,progress:e,revealP0:r,holdMs:a=Te,revealMs:o=Ae})=>{const n=Math.min(1,Math.max(0,e));let i=r,l=0;t>=a&&(i<0&&(i=n),l=Math.min(1,(t-a)/o));const f=i<0?0:i>=.999?1:Math.min(1,Math.max(0,(n-i)/(1-i)));return{maskProgress:Math.max(l,f),revealP0:i}},ct=t=>t>=it,lt=`
attribute vec2 aPos;      // fullscreen triangle in NDC
varying vec2 vUV;         // screen UV, y=0 at top
void main() {
  vUV = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`,ft=`
precision highp float;
varying vec2 vUV;

uniform sampler2D uReal;
uniform sampler2D uBlue;
uniform sampler2D uDepth;
uniform float uProgress;   // 0..1 mask growth
uniform float uTime;       // seconds
uniform vec3  uCam;        // focal.x, focal.y, zoom
uniform vec2  uCover;      // cover-fit kx, ky
uniform vec2  uArena;      // reveal center (image UV)
uniform float uMaxR;       // reveal radius that clears the whole image

const float MAP_ASPECT = 0.5625;
const float ELL_EX = 1.0;
const float ELL_EY = 0.6;
const float EDGE = 0.05;
const float RING_W = 0.075;
const float WAVE_ELL = 0.042;
const float EDGE_DEPTH = 0.30;
const float TALL_LO = 0.34;
const float DEPTH_REF = 1.0;
const float REF_AMP = 0.0329268;   // 27/820
const float CA = 0.0036585;        // 3/820
const float BLUR_R = 0.0091463;    // 7.5/820
const float CREST_LIFT = 0.0463415;// 38/820
const float CREST_REF = 0.0560976; // 46/820
const float CREST_GLINT = 0.407843;// 104/255
const vec3  RING_GLOW = vec3(0.470588, 0.921569, 0.666667);
const float RING_GLOW_STR = 0.10;
const float ECHO_SP = 0.11;
const float ECHO_W = 0.05;
const float PHASE_RATE = 5.0;
const int   TAPS = 5;

// image-UV -> ell metric components (x,y) around the arena center
vec2 ellVec(vec2 uv) {
  float x = (uv.x - uArena.x) / (ELL_EX * 0.5);
  float y = (uv.y - uArena.y) / (ELL_EY * 0.5) * MAP_ASPECT;
  return vec2(x, y);
}

// Lightweight composited color at an arbitrary image UV, using a passed-in
// (constant) effective reveal radius — the taps span <1% UV so ignoring the
// per-tap wave/depth variation is imperceptible and keeps cost bounded.
vec3 contentAt(vec2 uv, float rwEff) {
  vec2 ev = ellVec(uv);
  float e = length(ev);
  float mm = clamp((rwEff + EDGE - e) / (2.0 * EDGE), 0.0, 1.0);
  mm = mm * mm * (3.0 - 2.0 * mm);
  return mix(texture2D(uBlue, uv).rgb, texture2D(uReal, uv).rgb, mm);
}

void main() {
  // screen -> plane (cover fit) -> image UV (camera)
  vec2 plane = 0.5 + (vUV - 0.5) * uCover;
  vec2 img = uCam.xy + (plane - 0.5) / uCam.z;

  // outside the map: solid blueprint edge tone (avoids clamp smear)
  vec2 ev = ellVec(img);
  float ell = length(ev);
  float ang = atan(ev.y, ev.x);

  float T = uTime * PHASE_RATE;
  float wave = 0.55 * sin(2.0 * ang + 1.5 * T)
             + 0.35 * sin(3.0 * ang - 2.1 * T)
             + 0.10 * sin(5.0 * ang + 1.0 * T);

  float depth = texture2D(uDepth, img).r;
  float tall = clamp((depth - TALL_LO) / (1.0 - TALL_LO), 0.0, 1.0);
  tall = tall * tall * (3.0 - 2.0 * tall);

  float Rw = uProgress * uMaxR + WAVE_ELL * wave;
  float rwEff = Rw + EDGE_DEPTH * tall;
  float m = clamp((rwEff + EDGE - ell) / (2.0 * EDGE), 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);

  float s = (ell - rwEff) / RING_W;
  float ring = exp(-0.5 * s * s);
  float crest = ring * tall;

  // base composited color (with the crest vertical lift on the real map)
  vec3 realLift = texture2D(uReal, img + vec2(0.0, CREST_LIFT * crest)).rgb;
  vec3 baseContent = mix(texture2D(uBlue, img).rgb, realLift, m);

  // refraction magnitude (+ echoes) and combined ring weight
  float dref = 0.5 + DEPTH_REF * depth;
  float refract = REF_AMP * dref * (-s) * exp(-0.5 * s * s)
                + CREST_REF * crest * (-sign(s));
  float ringw = ring;
  for (int i = 1; i <= 3; i++) {
    float Ri = rwEff - float(i) * ECHO_SP;
    float si = (ell - Ri) / ECHO_W;
    float ri = exp(-0.5 * si * si);
    float amp = pow(0.6, float(i)) * (1.0 - min(uProgress, 1.0) * 0.85);
    refract += REF_AMP * 0.7 * amp * dref * (-si) * exp(-0.5 * si * si);
    ringw += ri * amp;
  }

  // Fast path: away from the ring band the refraction / blur / chromatic loop
  // contributes nothing, so skip its ~15 texture taps. This is the vast
  // majority of pixels — the interior, the exterior, and the WHOLE screen once
  // the reveal completes (the drone/fade run essentially free).
  float rr = clamp(ringw, 0.0, 1.0);
  if (rr < 0.004) {
    gl_FragColor = vec4(baseContent, 1.0);
    return;
  }

  // unit radial (in visually-square space) for displacement direction
  vec2 dir = normalize(vec2(img.x - uArena.x, (img.y - uArena.y) * MAP_ASPECT) + 1e-6);

  // per-channel (chromatic) 5-tap circular blur through the refracting ring
  vec3 outc = vec3(0.0);
  float caps[3];
  caps[0] = CA; caps[1] = 0.0; caps[2] = -CA;
  for (int ch = 0; ch < 3; ch++) {
    float rc = refract + caps[ch] * ringw;
    float acc = 0.0;
    for (int t = 0; t < TAPS; t++) {
      float a = float(t) * 1.2566371; // 2pi/5
      vec2 tapv = vec2(cos(a), sin(a)) * (BLUR_R * ringw);
      vec2 dispV = dir * (-rc) + tapv;
      vec2 dispUV = vec2(dispV.x, dispV.y / MAP_ASPECT);
      vec3 c = contentAt(img + dispUV, rwEff);
      acc += (ch == 0) ? c.r : ((ch == 1) ? c.g : c.b);
    }
    if (ch == 0) outc.r = acc / float(TAPS);
    else if (ch == 1) outc.g = acc / float(TAPS);
    else outc.b = acc / float(TAPS);
  }

  vec3 glow = ring * RING_GLOW * RING_GLOW_STR;
  vec3 glint = crest * CREST_GLINT * vec3(0.75, 1.0, 0.85);
  vec3 color = mix(baseContent, outc + glow, rr) + glint;

  gl_FragColor = vec4(color, 1.0);
}
`,ut=`
attribute vec2 aPos;    // screen UV, y=0 top
attribute float aB;     // brightness
attribute float aSize;  // size factor
uniform float uPointScale;
varying float vB;
void main() {
  vB = aB;
  gl_Position = vec4(aPos.x * 2.0 - 1.0, 1.0 - aPos.y * 2.0, 0.0, 1.0);
  gl_PointSize = aSize * uPointScale;
}
`,ht=`
precision highp float;
uniform vec3 uColor;
varying float vB;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.0, d);   // soft round sprite
  gl_FragColor = vec4(uColor * vB, 1.0) * a;  // additive (blend ONE, ONE)
}
`,de=(t,e,r)=>{const a=t.createShader(e);if(!a)throw new Error("createShader failed");if(t.shaderSource(a,r),t.compileShader(a),!t.getShaderParameter(a,t.COMPILE_STATUS)){const o=t.getShaderInfoLog(a);throw t.deleteShader(a),new Error(`shader compile error: ${o??"unknown"}`)}return a},Ee=(t,e,r)=>{const a=t.createProgram();if(!a)throw new Error("createProgram failed");if(t.attachShader(a,de(t,t.VERTEX_SHADER,e)),t.attachShader(a,de(t,t.FRAGMENT_SHADER,r)),t.linkProgram(a),!t.getProgramParameter(a,t.LINK_STATUS)){const o=t.getProgramInfoLog(a);throw t.deleteProgram(a),new Error(`program link error: ${o??"unknown"}`)}return a},j=(t,e)=>{const r=t.createTexture();if(!r)throw new Error("createTexture failed");return t.bindTexture(t.TEXTURE_2D,r),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_S,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_WRAP_T,t.CLAMP_TO_EDGE),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MIN_FILTER,t.LINEAR),t.texParameteri(t.TEXTURE_2D,t.TEXTURE_MAG_FILTER,t.LINEAR),t.texImage2D(t.TEXTURE_2D,0,t.RGBA,t.RGBA,t.UNSIGNED_BYTE,e),r};class mt{constructor(e,r){p(this,"gl");p(this,"revealProg");p(this,"particleProg");p(this,"quadBuf");p(this,"partBuf");p(this,"texReal");p(this,"texBlue");p(this,"texDepth");p(this,"disposed",!1);p(this,"rl");p(this,"pl");this.gl=e,this.revealProg=Ee(e,lt,ft),this.particleProg=Ee(e,ut,ht);const a=new Float32Array([-1,-1,3,-1,-1,3]),o=e.createBuffer();if(!o)throw new Error("createBuffer failed");this.quadBuf=o,e.bindBuffer(e.ARRAY_BUFFER,o),e.bufferData(e.ARRAY_BUFFER,a,e.STATIC_DRAW);const n=e.createBuffer();if(!n)throw new Error("createBuffer failed");this.partBuf=n,e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),this.texReal=j(e,r.real),this.texBlue=j(e,r.blue),this.texDepth=j(e,r.depth),e.useProgram(this.revealProg),e.uniform1i(e.getUniformLocation(this.revealProg,"uReal"),0),e.uniform1i(e.getUniformLocation(this.revealProg,"uBlue"),1),e.uniform1i(e.getUniformLocation(this.revealProg,"uDepth"),2),this.rl={aPos:e.getAttribLocation(this.revealProg,"aPos"),uProgress:e.getUniformLocation(this.revealProg,"uProgress"),uTime:e.getUniformLocation(this.revealProg,"uTime"),uCam:e.getUniformLocation(this.revealProg,"uCam"),uCover:e.getUniformLocation(this.revealProg,"uCover"),uArena:e.getUniformLocation(this.revealProg,"uArena"),uMaxR:e.getUniformLocation(this.revealProg,"uMaxR")},e.useProgram(this.particleProg),e.uniform3f(e.getUniformLocation(this.particleProg,"uColor"),W[0],W[1],W[2]),this.pl={aPos:e.getAttribLocation(this.particleProg,"aPos"),aB:e.getAttribLocation(this.particleProg,"aB"),aSize:e.getAttribLocation(this.particleProg,"aSize"),uPointScale:e.getUniformLocation(this.particleProg,"uPointScale")}}render(e){if(this.disposed)return;const r=this.gl,{drawingBufferWidth:a,drawingBufferHeight:o}=r;if(r.viewport(0,0,a,o),r.clearColor(0,0,0,1),r.clear(r.COLOR_BUFFER_BIT),r.disable(r.BLEND),r.useProgram(this.revealProg),r.bindBuffer(r.ARRAY_BUFFER,this.quadBuf),r.enableVertexAttribArray(this.rl.aPos),r.vertexAttribPointer(this.rl.aPos,2,r.FLOAT,!1,0,0),r.activeTexture(r.TEXTURE0),r.bindTexture(r.TEXTURE_2D,this.texReal),r.activeTexture(r.TEXTURE1),r.bindTexture(r.TEXTURE_2D,this.texBlue),r.activeTexture(r.TEXTURE2),r.bindTexture(r.TEXTURE_2D,this.texDepth),r.uniform1f(this.rl.uProgress,e.progress),r.uniform1f(this.rl.uTime,e.timeSec),r.uniform3f(this.rl.uCam,e.camFx,e.camFy,e.camZoom),r.uniform2f(this.rl.uCover,e.coverKx,e.coverKy),r.uniform2f(this.rl.uArena,e.arenaX,e.arenaY),r.uniform1f(this.rl.uMaxR,e.maxR),r.drawArrays(r.TRIANGLES,0,3),e.particleCount>0){r.enable(r.BLEND),r.blendFunc(r.ONE,r.ONE),r.useProgram(this.particleProg),r.bindBuffer(r.ARRAY_BUFFER,this.partBuf),r.bufferData(r.ARRAY_BUFFER,e.particleData.subarray(0,e.particleCount*4),r.DYNAMIC_DRAW);const n=16;r.enableVertexAttribArray(this.pl.aPos),r.vertexAttribPointer(this.pl.aPos,2,r.FLOAT,!1,n,0),r.enableVertexAttribArray(this.pl.aB),r.vertexAttribPointer(this.pl.aB,1,r.FLOAT,!1,n,8),r.enableVertexAttribArray(this.pl.aSize),r.vertexAttribPointer(this.pl.aSize,1,r.FLOAT,!1,n,12),r.uniform1f(this.pl.uPointScale,e.pointScale),r.drawArrays(r.POINTS,0,e.particleCount),r.disable(r.BLEND)}}dispose(){if(this.disposed)return;this.disposed=!0;const e=this.gl;e.deleteProgram(this.revealProg),e.deleteProgram(this.particleProg),e.deleteBuffer(this.quadBuf),e.deleteBuffer(this.partBuf),e.deleteTexture(this.texReal),e.deleteTexture(this.texBlue),e.deleteTexture(this.texDepth)}}const xe="/zero-nav-explorations/zero-city-loader.webp?v=10001",K="/zero-nav-explorations/blueprint.webp",_e="/zero-nav-explorations/depth.webp";Z(xe);Z(K);Z(_e);const dt=4096,pe=15e3,q=async t=>{const e=new Image;e.src=t;let r;const a=new Promise((u,E)=>{r=setTimeout(()=>E(new Error(`texture decode timed out after ${pe}ms: ${t}`)),pe)});try{await Promise.race([e.decode(),a])}finally{r&&clearTimeout(r)}const o=Math.min(1,dt/Math.max(e.naturalWidth,e.naturalHeight)),n=Math.max(1,Math.round(e.naturalWidth*o)),i=Math.max(1,Math.round(e.naturalHeight*o)),l=document.createElement("canvas");l.width=n,l.height=i;const f=l.getContext("2d");if(!f)throw new Error("2d context failed");return f.drawImage(e,0,0,n,i),l},Et=()=>{const t=document.createElement("canvas");t.width=2,t.height=2;const e=t.getContext("2d");return e&&(e.fillStyle="#0a3d33",e.fillRect(0,0,t.width,t.height)),t},Pt=({progress:t,onDone:e,forceFinish:r=!1,manageAppReadyFlag:a=!0,timingScale:o=1,zoomTargetCompanyId:n=null})=>{const i=d.useRef(null),l=d.useRef(null),f=d.useRef(null),u=d.useRef(t);u.current=t;const E=d.useRef(e);E.current=e;const A=d.useRef(r);A.current=r;const v=d.useRef(o);v.current=o;const g=d.useRef(n);g.current=n;const c=d.useRef(!1),L=d.useCallback(()=>{c.current||(c.current=!0,E.current())},[]),F=$e(h=>h.setSplashActive);return d.useEffect(()=>{if(a)return F(!0),()=>F(!1)},[F,a]),d.useEffect(()=>{r&&L()},[r,L]),d.useEffect(()=>{const h=f.current;if(!h)return;let I=0,S=null,O=!1,$=!1;const ge=je/qe,J=rt(),y=ot(fe),C=new Float32Array(fe*4),B=[.5,.5],M=v.current>0?v.current:1,Le=Te*M,we=Ae*M,Se=Ye*M,V=We*M,ye=Xe*M,Me=Ke*M,Q=g.current;Ne();const ee=()=>{var s,R,P;return Q??((P=(R=(s=ze.getState().user)==null?void 0:s.currentScenario)==null?void 0:R.company_data)==null?void 0:P.id)},te=()=>{const s=Ge(ee());return{fx:s.fx,fy:s.fy,z:s.z||ke}};let N=te();const be=()=>Q!=null||!!Ze.getState().userName,Ce=()=>He(ee());let x="reveal",G=performance.now(),k=0,z=0,H=0,re=-1,U=le,ae=!1;const Ue=()=>{const s=Math.min(window.devicePixelRatio||1,2),R=Math.round(h.clientWidth*s),P=Math.round(h.clientHeight*s);(h.width!==R||h.height!==P)&&(h.width=R,h.height=P)},oe=()=>{if(O)return;if(A.current){L();return}const s=performance.now(),R=(s-G)/1e3,P=Math.min(Math.max(u.current,0),1);let w={fx:B[0],fy:B[1],z:Y},T=P,D=1;if(x==="reveal"){const _=st({elapsedMs:s-G,progress:P,revealP0:re,holdMs:Le,revealMs:we});re=_.revealP0,T=_.maskProgress,ct(P)&&T>=le&&(U=T,be()&&Ce()?(N=te(),x="drone",k=s):(ae=!0,x="settle",z=s))}if(x==="drone"){const _=Math.min(1,(s-k)/V);T=U+(1-U)*_;const m=Math.min((s-k)/Se,1);w=ue(m,B,N,Y),m>=1&&(x="fade",H=s)}if(x==="settle"){const _=Math.min(1,(s-z)/V);T=U+(1-U)*_,s-z>=V+ye&&(x="fade",H=s)}x==="fade"&&(T=1,ae||(w=ue(1,B,N,Y)),D=Math.max(0,1-(s-H)/Me)),Ue();const{kx:ne,ky:ie}=Qe(h.width/h.height,ge);let se=0;if(x==="reveal"){nt(y,T*J,R);const _=y.activeCount;for(let m=0;m<_;m++){const De=y.outUV[m*2],Be=y.outUV[m*2+1],ce=et(De,Be,w,ne,ie);C[m*4]=ce.x,C[m*4+1]=ce.y,C[m*4+2]=y.outB[m],C[m*4+3]=y.outSize[m]}se=_}if(S==null||S.render({progress:T,timeSec:R,camFx:w.fx,camFy:w.fy,camZoom:w.z,coverKx:ne,coverKy:ie,arenaX:b[0],arenaY:b[1],maxR:J,pointScale:Math.min(window.devicePixelRatio||1,2)*5,particleData:C,particleCount:se}),$||($=!0,l.current&&(l.current.style.display="none")),i.current&&(i.current.style.opacity=String(D)),x==="fade"&&D<=0){L();return}I=requestAnimationFrame(oe)};return(async()=>{try{const[s,R,P]=await Promise.all([q(xe).catch(D=>(console.warn("[MapRevealLoader] real texture decode failed; using placeholder",D),null)),q(K),q(_e)]);if(O)return;const w=s??R??Et(),T=h.getContext("webgl",{antialias:!0,premultipliedAlpha:!1})??h.getContext("experimental-webgl",{antialias:!0});if(!T)throw new Error("WebGL unavailable");S=new mt(T,{real:w,blue:R,depth:P}),G=performance.now(),I=requestAnimationFrame(oe)}catch(s){console.error("[MapRevealLoader] init failed",s),L()}})(),()=>{O=!0,cancelAnimationFrame(I),S==null||S.dispose()}},[L]),X.jsxs("div",{ref:i,style:{position:"fixed",inset:0,zIndex:999999,background:"#0a3d33"},children:[X.jsx("img",{ref:l,src:K,alt:"","aria-hidden":!0,draggable:!1,style:{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}),X.jsx("canvas",{ref:f,style:{position:"absolute",inset:0,width:"100%",height:"100%",display:"block"}})]})};export{Pt as MapRevealLoader,Pt as default};
