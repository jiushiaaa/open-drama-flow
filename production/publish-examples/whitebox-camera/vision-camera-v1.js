import * as T from './node_modules/three/build/three.module.js';
const scene=new T.Scene();scene.background=new T.Color(0x222222);scene.fog=new T.Fog(0x222222,65,160);
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1280,720);renderer.setPixelRatio(1);document.body.append(renderer.domElement);
const camera=new T.PerspectiveCamera(52,1280/720,.1,240);
scene.add(new T.HemisphereLight(0xffffff,0x444444,2));const light=new T.DirectionalLight(0xffffff,2.8);light.position.set(-20,60,20);scene.add(light);
const mat=new T.MeshStandardMaterial({color:0xa8a8a8,roughness:1});const dark=new T.MeshStandardMaterial({color:0x686868,roughness:1});
function box(x,y,z,w,h,d,m=mat){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);scene.add(o);return o;}
box(0,-2,-24,90,3,160,dark);
const columns=[];
for(const z of [14,-2,-18,-34,-50,-66])for(const x of [-16,16]){const h=28;const o=new T.Mesh(new T.CylinderGeometry(2.3,3.2,h,12),mat);o.position.set(x,h/2,z);scene.add(o);box(x,1,z,8,2,8);box(x,h,z,9,2,9);columns.push([x,z]);}
// Grey volumes are layout placeholders only, not appearance references.
box(0,3,-82,30,6,16);box(-12,17,-84,5,28,8);box(12,17,-84,5,28,8);box(0,33,-84,29,4,9);
const ring=new T.Mesh(new T.TorusGeometry(6,.9,12,64),mat);ring.position.set(0,23,-78);scene.add(ring);
for(const z of [10,-22,-54])for(let i=0;i<22;i++){const x=-31+i*3;const y=36-7*Math.sin(i/21*Math.PI);const link=new T.Mesh(new T.TorusGeometry(1.7,.32,8,16),dark);link.position.set(x,y,z);link.rotation.y=i%2?Math.PI/2:0;link.scale.y=1.35;scene.add(link);}
const pos=new T.CatmullRomCurve3([[0,22,33],[1,18,17],[3,13,-2],[2,8,-24],[0,6,-48]].map(p=>new T.Vector3(...p)),false,'catmullrom',.35);
const aim=new T.CatmullRomCurve3([[0,32,0],[0,26,-20],[0,21,-48],[0,20,-78],[0,22,-79]].map(p=>new T.Vector3(...p)),false,'catmullrom',.25);
window.renderAt=(t)=>{const u=T.MathUtils.clamp(t/20,0,1);camera.position.copy(pos.getPoint(u));const target=aim.getPoint(u);camera.lookAt(target);renderer.render(scene,camera);const clearance=Math.min(...columns.map(([x,z])=>Math.hypot(camera.position.x-x,camera.position.z-z)-4.5));return {t,position:camera.position.toArray(),lookAt:target.toArray(),nearestColumnClearance:clearance};};
window.renderAt(0);window.ready=true;
