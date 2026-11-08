import"./chunk-IHRIUEAN.js";import{AdditiveBlending as F,BufferAttribute as L,BufferGeometry as R,Mesh as V,OrthographicCamera as B,PlaneGeometry as _,Points as H,SRGBColorSpace as C,Scene as O,ShaderMaterial as E,TextureLoader as W,Vector2 as M,WebGLRenderer as q}from"https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js";var z=`
  // Diagonal light band from the upper left, its edge softly breathing over time.
  float shaft(vec2 p, float t) {
    vec2 dir = normalize(vec2(0.82, -0.57));
    float d = dot(p - vec2(-0.15, 1.05), vec2(-dir.y, dir.x));
    float along = dot(p - vec2(-0.15, 1.05), dir);
    float width = 0.26 + 0.035 * sin(t * 0.21) + 0.02 * sin(along * 6.0 + t * 0.35);
    float band = smoothstep(width, 0.0, abs(d - 0.05 * sin(t * 0.12)));
    return band * smoothstep(1.6, 0.1, along);
  }
`;function D(i){let c=i.querySelector("img"),h=c?.currentSrc||c?.src;if(!h)return()=>{};let r=document.createElement("canvas");r.setAttribute("aria-hidden","true");let n;try{n=new q({canvas:r,antialias:!1,alpha:!1,powerPreference:"low-power"})}catch{return()=>{}}n.setPixelRatio(Math.min(devicePixelRatio,1.75)),n.outputColorSpace=C;let a=new O,l=new B(-1,1,1,-1,0,10);l.position.z=1;let t={uTex:{value:null},uImgAspect:{value:1376/768},uViewAspect:{value:1},uTime:{value:0},uPointer:{value:new M},uIn:{value:0}},G=new V(new _(2,2),new E({uniforms:t,vertexShader:"varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",fragmentShader:`
      precision highp float;
      uniform sampler2D uTex; uniform float uImgAspect, uViewAspect, uTime, uIn; uniform vec2 uPointer;
      varying vec2 vUv;
      ${z}
      float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
      void main() {
        vec2 uv = vUv - 0.5;
        // object-fit: cover
        if (uViewAspect > uImgAspect) uv.y *= uImgAspect / uViewAspect; else uv.x *= uViewAspect / uImgAspect;
        float zoom = 1.06 - 0.02 * uIn;
        uv = uv / zoom + 0.5 + uPointer * vec2(-0.012, 0.009);
        vec3 col = texture2D(uTex, uv).rgb;
        float s = shaft(vec2(vUv.x, vUv.y), uTime) * uIn;
        vec3 warm = vec3(1.0, 0.9, 0.74);
        float lum = dot(col, vec3(0.299, 0.587, 0.114));
        col += warm * s * (0.10 + 0.22 * lum);
        col = mix(col, col * vec3(1.02, 0.99, 0.95), 0.5);
        float v = smoothstep(1.15, 0.35, length((vUv - 0.5) * vec2(1.0, 1.2)));
        col *= mix(0.86, 1.0, v);
        col += (hash(vUv * 900.0 + fract(uTime)) - 0.5) * 0.018;
        gl_FragColor = vec4(col, 1.0);
      }`}));a.add(G);let u=innerWidth<700?90:170,g=new Float32Array(u*3);for(let e=0;e<u*3;e++)g[e]=Math.random();let v=new R;v.setAttribute("position",new L(new Float32Array(u*3),3)),v.setAttribute("seed",new L(g,3));let w=new H(v,new E({uniforms:{...t,uPx:{value:n.getPixelRatio()}},transparent:!0,depthWrite:!1,blending:F,vertexShader:`
      uniform float uTime, uIn, uPx; uniform vec2 uPointer; attribute vec3 seed; varying float vGlow;
      ${z}
      void main() {
        float depth = 0.25 + seed.z * 0.75;
        vec2 p = vec2(seed.x, fract(seed.y + uTime * (0.006 + 0.01 * depth)));
        p.x += 0.02 * sin(uTime * 0.3 + seed.y * 30.0);
        vec2 uv = p;
        p = p * 2.0 - 1.0 + uPointer * 0.04 * depth;
        vGlow = shaft(uv, uTime) * uIn * (0.35 + 0.65 * depth) * smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
        gl_Position = vec4(p, 0.0, 1.0);
        gl_PointSize = (1.2 + 3.2 * depth) * uPx;
      }`,fragmentShader:`
      precision mediump float; varying float vGlow;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * vGlow;
        gl_FragColor = vec4(vec3(1.0, 0.94, 0.82) * a, a);
      }`}));w.frustumCulled=!1,a.add(w);let d=()=>{let e=i.getBoundingClientRect();n.setSize(Math.max(1,e.width),Math.max(1,e.height),!1),t.uViewAspect.value=e.width/Math.max(1,e.height)},x=new M,y=e=>{let o=i.getBoundingClientRect();x.set((e.clientX-o.left)/o.width*2-1,(e.clientY-o.top)/o.height*2-1)},s=0,m=!0,f=!1,U=performance.now(),A=()=>{if(s=0,!m||document.hidden){f=!1;return}let e=(performance.now()-U)/1e3;t.uTime.value=e,t.uIn.value=Math.min(1,t.uIn.value+.012),t.uPointer.value.lerp(x,.045),n.render(a,l),s=requestAnimationFrame(A)},p=()=>{f||(f=!0,s=requestAnimationFrame(A))},P=new IntersectionObserver(([e])=>{m=e.isIntersecting,m&&p()}),b=()=>{document.hidden||p()},T=new W;T.setCrossOrigin("anonymous");let I=!1;T.load(h,e=>{if(I){e.dispose();return}e.colorSpace=C,t.uTex.value=e;let o=e.image;o?.width&&(t.uImgAspect.value=o.width/o.height),c.after(r),d(),n.render(a,l),i.classList.add("has-gl"),addEventListener("resize",d),addEventListener("pointermove",y,{passive:!0}),document.addEventListener("visibilitychange",b),P.observe(i),p()},void 0,()=>S());function S(){I=!0,cancelAnimationFrame(s),P.disconnect(),removeEventListener("resize",d),removeEventListener("pointermove",y),document.removeEventListener("visibilitychange",b),i.classList.remove("has-gl"),r.remove(),n.dispose()}return S}export{D as default};
