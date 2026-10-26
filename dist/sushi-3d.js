/* Sushi Bites — textured, instanced WebGL 2 with soft shadow mapping. */
(() => {
  'use strict';
  const canvas = document.getElementById('sushi-canvas');
  if (!canvas) return;
  const experience = document.getElementById('roll-experience');
  const controls = experience.querySelector('.roll-controls');
  const slider = document.getElementById('roll-progress');
  const playButton = document.getElementById('roll-play');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let gl;
  try { gl = canvas.getContext('webgl2', { alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: 'default' }); } catch { return; }
  if (!gl) return;

  const vertex = `#version 300 es
  precision highp float;
  layout(location=0) in vec3 aPosition;
  layout(location=1) in vec3 aNormal;
  layout(location=2) in vec3 aOffset;
  layout(location=3) in vec3 aScale;
  layout(location=4) in vec4 aQuaternion;
  layout(location=5) in vec3 aColor;
  layout(location=6) in float aGroup;
  layout(location=7) in float aMaterial;
  uniform mat4 uViewProjection;
  uniform mat4 uLightMatrix;
  uniform float uAssembly;
  uniform float uRotation;
  uniform float uTime;
  out vec3 vNormal;
  out vec3 vWorld;
  out vec3 vLocal;
  out vec3 vObject;
  out vec3 vColor;
  out vec4 vLight;
  flat out float vMaterial;
  flat out float vSeed;
  vec3 rotateQ(vec3 p,vec4 q){return p+2.0*cross(q.xyz,cross(q.xyz,p)+q.w*p);}
  void main(){
    vec3 center=aOffset;
    float lift=0.0;
    if(aGroup>0.5 && aGroup<1.5) lift=0.72*(1.0-smoothstep(0.06,0.58,uAssembly));
    if(aGroup>1.5 && aGroup<2.5) lift=1.55*(1.0-smoothstep(0.28,0.88,uAssembly));
    if(aGroup>2.5 && aGroup<3.5) lift=1.67*(1.0-smoothstep(0.62,1.0,uAssembly));
    if(aGroup>0.5 && aGroup<3.5) center.xz*=1.0+0.09*(1.0-uAssembly);
    vec3 object=rotateQ(aPosition*aScale,aQuaternion)+center;
    vec3 normal=rotateQ(aNormal/aScale,aQuaternion);
    if(aGroup>=0.0){float vertical=0.5+0.5*uAssembly;object.y=0.15+(object.y-0.15)*vertical;normal.y/=vertical;}
    object.y+=lift;
    mat3 turn=mat3(cos(uRotation),0.0,-sin(uRotation),0.0,1.0,0.0,sin(uRotation),0.0,cos(uRotation));
    vObject=object;
    vWorld=turn*object;
    vNormal=normalize(turn*normal);
    vLocal=aPosition;
    vColor=aColor;
    vMaterial=aMaterial;
    vSeed=dot(aOffset,vec3(12.7,6.13,17.3));
    vLight=uLightMatrix*vec4(vWorld,1.0);
    gl_Position=uViewProjection*vec4(vWorld,1.0);
  }`;

  const fragment = `#version 300 es
  precision highp float;
  in vec3 vNormal;
  in vec3 vWorld;
  in vec3 vLocal;
  in vec3 vObject;
  in vec3 vColor;
  in vec4 vLight;
  flat in float vMaterial;
  flat in float vSeed;
  uniform vec3 uEye;
  uniform float uCrisp;
  uniform float uAssembly;
  uniform float uTextured;
  uniform float uShadowEnabled;
  uniform sampler2D uAtlas;
  uniform sampler2D uShadow;
  out vec4 outColor;
  const float PI=3.14159265;
  float hash(vec3 p){p=fract(p*0.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
  float fbm(vec3 p){return noise(p)*0.57+noise(p*2.03)*0.28+noise(p*4.07)*0.15;}
  vec3 atlas(vec2 uv,vec2 tile){return texture(uAtlas,tile*0.5+vec2(0.004)+clamp(uv,0.0,1.0)*0.492).rgb;}
  vec3 bump(vec3 n,float h){
    vec3 dx=dFdx(vWorld),dy=dFdy(vWorld);
    vec3 rx=cross(dy,n),ry=cross(n,dx);
    float det=dot(dx,rx);
    return normalize(n-sign(det)*(dFdx(h)*rx+dFdy(h)*ry)/max(abs(det),0.0000001));
  }
  float shadow(vec3 n,vec3 light){
    if(uShadowEnabled<0.5)return 1.0;
    vec3 p=vLight.xyz/vLight.w*0.5+0.5;
    if(p.x<0.0||p.x>1.0||p.y<0.0||p.y>1.0||p.z>1.0)return 1.0;
    float bias=max(0.00035,0.0011*(1.0-dot(n,light)));
    vec2 pixel=1.0/vec2(textureSize(uShadow,0));
    vec2 taps[16]=vec2[16](vec2(-0.94,-0.39),vec2(0.95,-0.77),vec2(-0.09,-0.93),vec2(0.34,0.29),vec2(-0.91,0.46),vec2(-0.81,-0.87),vec2(-0.38,0.27),vec2(0.97,0.75),vec2(0.44,-0.98),vec2(0.54,-0.47),vec2(-0.26,-0.42),vec2(0.79,0.19),vec2(-0.24,0.99),vec2(-0.81,0.91),vec2(0.20,0.78),vec2(0.14,-0.14));
    float blockers=0.0,totalDepth=0.0;
    for(int i=0;i<8;i++){
      float d=texture(uShadow,p.xy+taps[i]*pixel*6.0).r;
      if(d<p.z-bias){blockers+=1.0;totalDepth+=d;}
    }
    float separation=blockers>0.0?max(p.z-totalDepth/max(blockers,1.0),0.0):0.0;
    float radius=clamp(1.8+separation*320.0,1.8,22.0)*float(textureSize(uShadow,0).x)/2048.0;
    float sum=0.0;
    for(int i=0;i<16;i++)sum+=p.z-bias<=texture(uShadow,p.xy+taps[i]*pixel*radius).r?1.0:0.0;
    return sum/16.0;
  }
  vec3 brdf(vec3 n,vec3 v,vec3 l,vec3 albedo,float rough,vec3 radiance){
    vec3 h=normalize(v+l);
    float nl=max(dot(n,l),0.0),nv=max(dot(n,v),0.001),nh=max(dot(n,h),0.0),vh=max(dot(v,h),0.0);
    float a=rough*rough,a2=a*a,denom=nh*nh*(a2-1.0)+1.0;
    float d=a2/(PI*denom*denom+0.00005),k=pow(rough+1.0,2.0)/8.0;
    float g=nv/(nv*(1.0-k)+k)*nl/(nl*(1.0-k)+k);
    vec3 f=vec3(0.032)+0.968*pow(1.0-vh,5.0);
    return ((1.0-f)*albedo/PI+d*g*f/(4.0*nv*nl+0.0001))*radiance*nl;
  }
  vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
  void main(){
    if(vMaterial>5.5&&vMaterial<6.5&&uCrisp<0.5)discard;
    vec3 n=normalize(vNormal),view=normalize(uEye-vWorld),p=vObject,color=vColor;
    float rough=0.45,ao=1.0,sss=0.0,micro=fbm(p*45.0),coat=0.0;
    if(vMaterial<0.5){
      vec2 uv=vec2(fract((atan(p.z,p.x)/(2.0*PI)+0.5)*4.0),clamp((p.y-0.12)/1.15,0.0,1.0));
      vec3 tex=atlas(uv,vec2(1,0));
      float luminance=dot(tex,vec3(0.3,0.55,0.15));
      color=mix(color*(0.7+micro*0.7),tex*vec3(0.38,0.43,0.37),uTextured);
      n=bump(n,mix(noise(p*90.0)*0.005,luminance*0.018,uTextured)+fbm(p*28.0)*0.007);
      rough=0.46+micro*0.16;coat=0.16;
      color=mix(color,vec3(0.36,0.16,0.035)*(0.75+micro*0.4),uCrisp);
      rough=mix(rough,0.78,uCrisp);
    }else if(vMaterial<1.5){
      float groove=exp(-pow(vLocal.x*15.0,2.0))*(0.5+0.5*vLocal.y);
      color*=0.95+noise(vLocal*8.0)*0.05;
      n=bump(n,noise(vLocal*14.0)*0.0005-groove*0.0008);
      rough=0.30+0.07*hash(vec3(vSeed));sss=0.14;coat=0.23;
      ao=0.78+0.22*smoothstep(-0.5,0.7,vLocal.y);
    }else if(vMaterial<2.5){
      vec2 uv=vec2(p.x*0.65+0.48,p.z*0.76+0.49);
      vec3 topTex=atlas(uv,vec2(0,0));
      vec3 sideTex=atlas(vec2(p.x*0.67+p.z*0.31+0.5,p.y*0.59),vec2(0,0));
      vec3 tex=mix(sideTex,topTex,smoothstep(0.25,0.8,abs(n.y)));
      float vein=pow(0.5+0.5*sin(p.x*27.0+p.z*14.0+sin(p.z*8.0)*1.4),16.0);
      color=mix(mix(color,vec3(1.0,0.79,0.62),vein*0.8),tex*0.91,uTextured*0.96);
      float fat=smoothstep(0.42,0.75,tex.g);
      n=bump(n,fat*0.002+noise(p*180.0)*0.0008);
      rough=0.23+fat*0.09;sss=0.19;coat=0.45;
    }else if(vMaterial<3.5){
      vec3 topTex=atlas(vec2(vLocal.x*0.38+0.50,vLocal.z*0.40+0.5),vec2(0,1));
      vec3 sideTex=atlas(vec2(p.x*0.5+0.5,p.y*0.6),vec2(0,1));
      vec3 tex=mix(sideTex,topTex,smoothstep(0.25,0.8,abs(n.y)));
      float edge=smoothstep(0.43,0.67,length(p.xz));
      color=mix(color,tex*vec3(0.87,0.94,0.61),uTextured*0.68);
      color=mix(color,vec3(0.21,0.39,0.037),edge*0.76);
      n=bump(n,noise(p*170.0)*0.0008+tex.g*0.002);
      rough=0.46;sss=0.17;
    }else if(vMaterial<4.5){
      color*=0.96+micro*0.04;
      n=bump(n,fbm(p*95.0)*0.0009);
      rough=0.43;sss=0.11;coat=0.06;
    }else if(vMaterial<5.5){
      float radial=length(p.xz);
      float contact=exp(-radial*radial*1.6)*0.55*uAssembly;
      color*=0.86+micro*0.2;
      n=bump(n,noise(p*130.0)*0.0005+sin(radial*190.0)*0.00008);
      rough=0.30;ao=1.0-contact;coat=0.32;
    }else if(vMaterial<6.5){
      color*=0.8+micro*0.4;rough=0.8;
      ao=0.75+0.25*max(vLocal.y,0.0);
    }else if(vMaterial<7.5){
      vec3 topTex=atlas(p.xz*0.35+0.5,vec2(1,1));
      vec3 sideTex=atlas(vec2(fract((atan(p.z,p.x)/(2.0*PI)+0.5)*3.0),p.y*0.65),vec2(1,1));
      vec3 tex=mix(sideTex,topTex,smoothstep(0.25,0.8,abs(n.y)));
      color=mix(color,tex,uTextured*0.8);rough=0.4;sss=0.12;
      n=bump(n,tex.r*0.004);
    }else if(vMaterial<8.5){
      color=mix(color,vec3(0.84,0.94,0.57),noise(p*32.0)*0.35);rough=0.22;sss=0.18;coat=0.32;
    }else{
      color*=0.9+micro*0.15;rough=0.51;
    }
    vec3 albedo=pow(max(color,vec3(0.0)),vec3(2.2));
    vec3 key=normalize(vec3(-3.5,6.0,4.5)),fill=normalize(vec3(4.0,3.0,1.5)),back=normalize(vec3(0.5,3.5,-4.0));
    float shade=shadow(n,key),hemisphere=0.5+0.5*n.y;
    vec3 result=albedo*mix(vec3(0.13,0.15,0.18),vec3(0.49,0.47,0.42),hemisphere)*ao;
    result+=brdf(n,view,key,albedo,rough,vec3(4.5,4.15,3.75))*mix(0.15,1.0,shade);
    result+=brdf(n,view,fill,albedo,rough,vec3(0.85,0.96,1.1));
    result+=brdf(n,view,back,albedo,rough,vec3(1.45,1.18,0.92));
    vec3 refl=reflect(-view,n);
    float softbox=pow(max(dot(refl,normalize(vec3(-2.0,4.0,3.0))),0.0),mix(42.0,5.0,rough));
    float strip=pow(max(dot(refl,normalize(vec3(3.0,2.0,-1.0))),0.0),mix(75.0,12.0,rough));
    float fresnel=0.035+0.965*pow(1.0-max(dot(n,view),0.0),5.0);
    result+=vec3(1.0,0.94,0.84)*(softbox*0.9+strip*0.55)*fresnel*(1.0+coat)*ao;
    result+=albedo*sss*vec3(1.0,0.84,0.66)*(0.4+pow(max(dot(view,-key),0.0),3.0))*mix(0.5,1.0,shade);
    outColor=vec4(pow(aces(result*0.88),vec3(1.0/2.2)),1.0);
  }`;

  const shadowFragment = `#version 300 es
  precision highp float;
  flat in float vMaterial;
  uniform float uCrisp;
  out vec4 outColor;
  void main(){if(vMaterial>5.5&&vMaterial<6.5&&uCrisp<0.5)discard;outColor=vec4(1.0);}`;

  function createProgram(fragmentSource) {
    const program = gl.createProgram();
    for (const [type, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragmentSource]]) {
      const shader = gl.createShader(type); gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(program, shader); gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    return program;
  }
  let program, shadowProgram;
  try { program = createProgram(fragment); shadowProgram = createProgram(shadowFragment); } catch (error) { console.warn('Sushi 3D:', error.message); return; }
  const locations = program => Object.fromEntries(['uViewProjection', 'uLightMatrix', 'uAssembly', 'uRotation', 'uTime', 'uEye', 'uCrisp', 'uAtlas', 'uTextured', 'uShadow', 'uShadowEnabled'].map(name => [name, gl.getUniformLocation(program, name)]));
  const uniforms = locations(program), shadowUniforms = locations(shadowProgram);
  gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0);

  let seed = 18524;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const normalize = v => { const length = Math.hypot(...v) || 1; return v.map(x => x / length); };
  const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
  const dot = (a, b) => a.reduce((sum, value, i) => sum + value*b[i], 0);
  const lerp = (a, b, t) => a + (b-a)*t;
  const ease = t => t*t*(3-2*t);
  const quaternion = (axis, angle) => { const s = Math.sin(angle/2); return [...normalize(axis).map(n => n*s), Math.cos(angle/2)]; };
  const instance = (position, scale, color, group, material, rotation=[0,0,0,1]) => [...position, ...scale, ...rotation, ...color, group, material];
  const meshes = [];
  function mesh(vertices, instances) {
    if (!instances.length) return;
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const vertexBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    for (let i=0; i<2; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribPointer(i, 3, gl.FLOAT, false, 24, i*12); }
    const instanceBuffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, instanceBuffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(instances.flat()), gl.STATIC_DRAW);
    [[3,0],[3,12],[4,24],[3,40],[1,52],[1,56]].forEach(([size, offset], i) => { gl.enableVertexAttribArray(i+2); gl.vertexAttribPointer(i+2, size, gl.FLOAT, false, 60, offset); gl.vertexAttribDivisor(i+2, 1); });
    meshes.push({ vao, vertices: vertices.length/6, count: instances.length, ceramic: instances[0][14] === 5, crumbs: instances[0][14] === 6 });
  }
  function sphere(latitudes=7, longitudes=10, organic=0) {
    const out=[];
    const point=(y,x) => {
      const a=y/latitudes*Math.PI,b=x/longitudes*Math.PI*2;
      const p=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
      const wobble=1+organic*Math.sin(b*3+a*2)*Math.sin(a);
      return [...p.map(n=>n*wobble),...normalize(p)];
    };
    for(let y=0;y<latitudes;y++)for(let x=0;x<longitudes;x++){
      const a=point(y,x),b=point(y+1,x),c=point(y,x+1),d=point(y+1,x+1);
      out.push(...a,...b,...c,...c,...b,...d);
    }
    return out;
  }
  function lathe(profile, segments=160, irregular=0) {
    const out=[];
    const point=(i,a) => {
      const [radius,y]=profile[i];
      const before=profile[Math.max(0,i-1)],after=profile[Math.min(profile.length-1,i+1)];
      const normal=normalize([(after[1]-before[1])*Math.cos(a),before[0]-after[0],(after[1]-before[1])*Math.sin(a)]);
      const wobble=1+irregular*(Math.sin(a*7+0.6)*0.55+Math.sin(a*19+y*5)*0.25+Math.cos(a*37-y*9)*0.12);
      return [radius*Math.cos(a)*wobble,y+irregular*0.3*Math.sin(a*11),radius*Math.sin(a)*wobble,...normal];
    };
    for(let i=0;i<profile.length-1;i++)for(let j=0;j<segments;j++){
      const a=j/segments*Math.PI*2,b=(j+1)/segments*Math.PI*2;
      const p=point(i,a),q=point(i,b),r=point(i+1,a),s=point(i+1,b);
      out.push(...p,...r,...q,...q,...r,...s);
    }
    return out;
  }
  // Tiny radial and vertical folds give the seaweed a thin, crumpled silhouette.
  const noriProfile=[];
  for(let j=0;j<=28;j++) { const y=0.14+j/28*1.10; noriProfile.push([1.018+Math.sin(j*0.63)*0.006,y]); }
  noriProfile.push([1.015,1.27],[1.002,1.27]);
  for(let j=28;j>=0;j--) noriProfile.push([1.002,0.14+j/28*1.10]);
  mesh(lathe(noriProfile,192,0.019),[instance([0,0,0],[1.025,1,0.97],[0.065,0.077,0.035],0,0)]);
  mesh(lathe([[0.65,0.15],[0.985,0.15],[0.985,1.34],[0.65,1.34],[0.65,0.15]],144,0.012),[instance([0,0,0],[1.025,1,0.97],[0.85,0.84,0.77],1,7)]);

  // Jittered Poisson packing avoids the concentric, mechanical rice pattern.
  const grains=[],packed=[];
  for(let attempt=0;attempt<16000 && packed.length<760;attempt++){
    const x=(random()*2-1)*1.014,z=(random()*2-1)*0.965,r=Math.hypot(x/1.025,z/0.97);
    if(r<0.65 || r>1.005 || packed.some(([px,pz])=>(x-px)**2+(z-pz)**2<0.043**2))continue;
    packed.push([x,z]);
    const tint=0.80+random()*0.14,angle=random()*Math.PI*2;
    grains.push(instance([x,1.355+random()*0.034,z],[0.021+random()*0.006,0.014+random()*0.007,0.039+random()*0.013],[tint,tint*0.989,tint*0.947],1,1,quaternion([random()*0.2,1,random()*0.2],angle)));
  }
  for(let row=0;row<3;row++)for(let i=0;i<110;i++){
    const a=(i+random()*0.8)/110*Math.PI*2,r=0.991+random()*0.012,tint=0.82+random()*0.12;
    grains.push(instance([Math.cos(a)*r*1.025,1.24+row*0.048+random()*0.017,Math.sin(a)*r*0.97],[0.026,0.019+random()*0.008,0.052+random()*0.01],[tint,tint*0.985,tint*0.94],1,1,quaternion([0,1,0],-a+random()*1.3)));
  }
  mesh(sphere(7,10,0.045),grains);

  // Beveled, uneven cut faces, rather than smooth candy-like blocks.
  function fillingShape(corners, height=1.23) {
    const outline=[];
    for(let i=0;i<corners.length;i++)for(let j=0;j<4;j++){
      const p0=corners[(i+corners.length-1)%corners.length],p1=corners[i],p2=corners[(i+1)%corners.length],p3=corners[(i+2)%corners.length],t=j/4;
      outline.push([0,1].map(axis=>0.5*((2*p1[axis])+(-p0[axis]+p2[axis])*t+(2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*t*t+(-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*t*t*t)));
    }
    const out=[],bottom=0.15,top=bottom+height;
    const center=outline.reduce((p,q)=>[p[0]+q[0]/outline.length,p[1]+q[1]/outline.length],[0,0]);
    const levels=[0,0.30,0.66,0.92,1];
    const point=(i,t) => {
      const [x,z]=outline[i%outline.length];
      const px=lerp(center[0],x,t),pz=lerp(center[1],z,t);
      const y=top-0.022*Math.pow(t,9)+0.006*Math.sin(px*21)*Math.cos(pz*18)*(1-t*t);
      return [px,y,pz,...normalize([(px-center[0])*Math.pow(t,12)*2,1,(pz-center[1])*Math.pow(t,12)*2])];
    };
    for(let j=0;j<levels.length-1;j++)for(let i=0;i<outline.length;i++){
      const a=point(i,levels[j]),b=point(i+1,levels[j]),c=point(i,levels[j+1]),d=point(i+1,levels[j+1]);
      out.push(...a,...c,...b,...b,...c,...d);
    }
    for(let i=0;i<outline.length;i++){
      const [x,z]=outline[i],[nx,nz]=outline[(i+1)%outline.length];
      const normal=normalize([x-center[0],0,z-center[1]]),next=normalize([nx-center[0],0,nz-center[1]]);
      const a=[x,bottom,z,...normal],b=[nx,bottom,nz,...next],c=[x,top-0.022,z,...normal],d=[nx,top-0.022,nz,...next];
      out.push(...a,...b,...c,...c,...b,...d);
    }
    return out;
  }
  const addFilling=(outline,color,material,height=1.23)=>mesh(fillingShape(outline,height),[instance([0,0,0],[1.12,1,1.12],color,2,material)]);
  addFilling([[-0.58,-0.18],[-0.51,-0.36],[-0.27,-0.52],[-0.02,-0.56],[0.17,-0.47],[0.21,-0.31],[0.12,-0.10],[-0.04,0.04],[-0.28,0.08],[-0.49,0.03]],[1.0,0.43,0.23],2,1.245);
  addFilling([[-0.58,0.06],[-0.43,0.03],[-0.25,0.11],[-0.18,0.27],[-0.29,0.46],[-0.42,0.40],[-0.56,0.23]],[0.96,0.38,0.18],2,1.22);
  addFilling([[0.19,-0.46],[0.38,-0.40],[0.54,-0.23],[0.61,-0.02],[0.55,0.22],[0.38,0.44],[0.28,0.31],[0.24,0.11],[0.32,-0.12]],[0.78,0.86,0.35],3,1.255);
  addFilling([[-0.15,0.10],[0.01,-0.01],[0.18,0.03],[0.24,0.18],[0.19,0.41],[0.03,0.55],[-0.15,0.48],[-0.20,0.29]],[0.94,0.925,0.84],4,1.235);
  addFilling([[0.11,-0.08],[0.24,-0.16],[0.30,-0.04],[0.25,0.09],[0.16,0.08]],[0.71,0.85,0.35],8,1.25);
  addFilling([[-0.22,0.46],[-0.06,0.56],[-0.28,0.55],[-0.42,0.43]],[0.79,0.90,0.57],8,1.22);
  const seeds=[];
  for(let i=0;i<7;i++) seeds.push(instance([(0.18+random()*0.055)*1.12,1.407,(random()*0.09-0.045)*1.12],[0.009,0.004,0.023],[0.95,0.98,0.76],2,8,quaternion([0,1,0],random()*6.28)));
  mesh(sphere(5,8),seeds);
  const sesame=[];
  for(let i=0;i<36;i++){
    const a=random()*6.28,r=0.64+random()*0.30,dark=i%3===0;
    sesame.push(instance([Math.cos(a)*r,1.421+random()*0.016,Math.sin(a)*r],[0.012,0.006,0.025],dark?[0.095,0.075,0.046]:[0.85,0.73,0.51],3,9,quaternion([0,1,0],random()*6.28)));
  }
  mesh(sphere(5,8,0.04),sesame);

  const crumbs=[];
  for(let i=0;i<2300;i++){
    const a=random()*6.283,y=0.15+random()*1.13,r=1.04+random()*0.018,size=0.012+random()*0.022,toast=random();
    crumbs.push(instance([Math.cos(a)*r*1.025,y,Math.sin(a)*r*0.97],[size,0.011+random()*0.029,size*1.45],[0.60+toast*0.31,0.29+toast*0.29,0.07+toast*0.14],4,6,quaternion([random(),random(),random()],random()*6.28)));
  }
  mesh(sphere(3,5,0.17),crumbs);
  // A real curved ceramic profile catches a soft rim highlight.
  const dishProfile=[[0,0.025],[1.12,0.025],[1.40,0.045],[1.61,0.095],[1.76,0.15],[1.82,0.175],[1.855,0.16],[1.86,0.13],[1.80,0.105],[1.58,0.045],[1.1,-0.045],[0.65,-0.065],[0,-0.065]];
  mesh(lathe(dishProfile.reverse(),192),[instance([0,0,0],[1,1,1],[0.115,0.125,0.128],-1,5)]);
  const loose=[];
  for(let i=0;i<8;i++){
    const a=random()*6.28,r=1.12+random()*0.38;
    loose.push(instance([Math.cos(a)*r,0.067,Math.sin(a)*r],[0.024,0.016,0.05],[0.93,0.92,0.86],-1,1,quaternion([0,1,0],random()*6.28)));
  }
  mesh(sphere(6,9),loose);

  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2);return [f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0];}
  function lookAt(eye,target){const z=normalize(eye.map((n,i)=>n-target[i])),x=normalize(cross([0,1,0],z)),y=cross(z,x);return [x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
  function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
  const ortho=[1/3.1,0,0,0,0,1/3.1,0,0,0,0,-2/16,0,0,0,-1,1];
  const lightMatrix=multiply(ortho,lookAt([-3.5,6.95,4.5],[0,0.95,0]));
  const shadowSize=matchMedia('(max-width: 740px)').matches?1024:2048;
  const depthTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,depthTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,shadowSize,shadowSize,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  const shadowFramebuffer=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFramebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,depthTexture,0);
  gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);
  const shadowEnabled=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  const atlasTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlasTexture);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);
  const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');
  if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(8,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

  let progress=1,crisp=0,orbit=0,dragging=false,dragX=0,dragY=0,tilt=0;
  let playing=!motion.matches,visible=true,elapsed=0,lastTime=0,frame=0,width=1,height=1,contextLost=false,textured=false;
  let previousShadow='';
  const steps=[...experience.querySelectorAll('.roll-step-labels span')];
  const captions=['Una fina hoja de nori.','Arroz suave. Grano a grano.','Salmón, palta y queso crema.','Fresco. Hasta el último detalle.'];
  let lastStep=-1,lastPlaying;
  function updateControls(){
    const step=progress<0.18?0:progress<0.56?1:progress<0.88?2:3;
    slider.value=Math.round(progress*100);slider.setAttribute('aria-valuetext',`${Math.round(progress*100)} % armado. ${captions[step]}`);slider.style.setProperty('--progress',`${progress*100}%`);
    if(lastStep!==step){steps.forEach((label,i)=>label.classList.toggle('is-current',i===step));experience.querySelector('.annotation-index').textContent=`0${step+1}`;document.getElementById('roll-ingredient').textContent=captions[step];lastStep=step;}
    if(lastPlaying!==playing){
      playButton.setAttribute('aria-pressed',String(playing));playButton.setAttribute('aria-label',playing?'Pausar animación del sushi':'Reproducir animación del sushi');
      playButton.innerHTML=playing?'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg><span>Pausar</span>':'<svg aria-hidden="true" viewBox="0 0 24 24"><path d="m9 5 10 7-10 7V5Z"/></svg><span>Reproducir</span>';
      lastPlaying=playing;
    }
  }
  const drawMeshes=shadowPass=>{for(const item of meshes){if((shadowPass&&item.ceramic)||(item.crumbs&&crisp<0.5))continue;gl.bindVertexArray(item.vao);gl.drawArraysInstanced(gl.TRIANGLES,0,item.vertices,item.count);}};
  function setTransforms(program,locations,viewProjection,rotation){
    gl.useProgram(program);gl.uniformMatrix4fv(locations.uViewProjection,false,viewProjection);gl.uniformMatrix4fv(locations.uLightMatrix,false,lightMatrix);
    gl.uniform1f(locations.uAssembly,progress);gl.uniform1f(locations.uRotation,rotation);gl.uniform1f(locations.uTime,elapsed);gl.uniform1f(locations.uCrisp,crisp);
  }
  function render(){
    if(contextLost)return;
    const rotation=-0.35+orbit+(motion.matches?0:elapsed*0.055);
    const shadowKey=[progress.toFixed(4),rotation.toFixed(4),crisp].join(':');
    if(shadowEnabled&&previousShadow!==shadowKey){
      gl.bindFramebuffer(gl.FRAMEBUFFER,shadowFramebuffer);gl.viewport(0,0,shadowSize,shadowSize);gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.7,2.0);setTransforms(shadowProgram,shadowUniforms,lightMatrix,rotation);drawMeshes(true);gl.disable(gl.POLYGON_OFFSET_FILL);
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);previousShadow=shadowKey;
    }
    gl.viewport(0,0,canvas.width,canvas.height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const targetY=lerp(1.60,0.77,ease(progress));
    const eye=[2.65,4.85+tilt,4.65];
    const fov=(32.5+4*(1-progress))*Math.max(1,1.15/(width/height))*Math.PI/180;
    setTransforms(program,uniforms,multiply(perspective(fov,width/height,0.1,30),lookAt(eye,[0,targetY,0])),rotation);
    gl.uniform3fv(uniforms.uEye,eye);gl.uniform1f(uniforms.uTextured,Number(textured));gl.uniform1f(uniforms.uShadowEnabled,Number(shadowEnabled));
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlasTexture);gl.uniform1i(uniforms.uAtlas,0);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,depthTexture);gl.uniform1i(uniforms.uShadow,1);
    drawMeshes(false);
  }
  function resize(){
    const rect=canvas.getBoundingClientRect();width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    const pixelRatio=Math.min(devicePixelRatio||1,width<500?1.5:2);
    canvas.width=Math.round(width*pixelRatio);canvas.height=Math.round(height*pixelRatio);render();
  }
  function tick(time){
    frame=0;if(!playing||!visible||document.hidden||contextLost)return;
    const delta=lastTime?Math.min((time-lastTime)/1000,0.06):0;elapsed+=delta;lastTime=time;
    progress=Math.min(1,progress+delta/6);
    updateControls();render();frame=requestAnimationFrame(tick);
  }
  function start(){lastTime=0;if(playing&&visible&&!document.hidden&&!frame&&!contextLost)frame=requestAnimationFrame(tick);}
  function stop(){cancelAnimationFrame(frame);frame=0;lastTime=0;}
  playButton.addEventListener('click',()=>{playing=!playing;if(playing)start();else stop();updateControls();});
  slider.addEventListener('input',()=>{playing=false;stop();progress=Number(slider.value)/100;updateControls();render();});
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;dragging=true;dragX=event.clientX;dragY=event.clientY;canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');});
  canvas.addEventListener('pointermove',event=>{if(!dragging)return;orbit+=(event.clientX-dragX)*0.008;if(event.pointerType==='mouse')tilt=Math.max(-1,Math.min(1.5,tilt+(event.clientY-dragY)*0.008));dragX=event.clientX;dragY=event.clientY;render();});
  const endDrag=()=>{dragging=false;canvas.classList.remove('is-dragging');};
  canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
  canvas.tabIndex=0;
  canvas.addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();if(event.key==='ArrowLeft'||event.key==='ArrowRight')orbit+=event.key==='ArrowLeft'?-0.15:0.15;else tilt=Math.max(-1,Math.min(1.5,tilt+(event.key==='ArrowUp'?0.18:-0.18)));render();}});
  for(const button of experience.querySelectorAll('[data-finish]'))button.addEventListener('click',()=>{crisp=Number(button.dataset.finish);experience.querySelectorAll('[data-finish]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));render();});
  document.addEventListener('visibilitychange',()=>document.hidden?stop():start());
  motion.addEventListener('change',()=>{if(motion.matches){playing=false;stop();progress=1;updateControls();render();}});
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();contextLost=true;stop();experience.classList.remove('scene-ready');controls.hidden=true;});
  if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)start();else stop();},{threshold:0}).observe(canvas);
  if('ResizeObserver'in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  const image=new Image();
  image.onload=()=>{
    if(contextLost)return;
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,atlasTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);
    textured=true;experience.dataset.materials='ready';render();
  };
  if(window.sushiMaterialAtlas)image.src=window.sushiMaterialAtlas;
  controls.hidden=false;experience.classList.add('scene-ready');
  updateControls();resize();start();
})();
