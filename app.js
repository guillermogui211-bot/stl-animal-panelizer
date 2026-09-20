import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { STLLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/STLLoader.js';

const $ = (id) => document.getElementById(id);
let scene, camera, renderer, controls, model, geometry, pieces = [], selected = null;
const loader = new STLLoader();

initViewer();
$('helpBtn').onclick = () => $('helpDialog').showModal();
$('closeHelp').onclick = () => $('helpDialog').close();
$('fileInput').onchange = (e) => e.target.files[0] && loadFile(e.target.files[0]);
$('applyBtn').onclick = generatePieces;
$('svgBtn').onclick = exportSVG;
$('csvBtn').onclick = exportCSV;
$('resetBtn').onclick = reset;
['dragenter','dragover'].forEach(type => $('dropzone').addEventListener(type, e => { e.preventDefault(); $('dropzone').classList.add('drag'); }));
['dragleave','drop'].forEach(type => $('dropzone').addEventListener(type, e => { e.preventDefault(); $('dropzone').classList.remove('drag'); }));
$('dropzone').addEventListener('drop', e => e.dataTransfer.files[0] && loadFile(e.dataTransfer.files[0]));

function initViewer() {
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x10151d);
  camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000); camera.position.set(0, 0, 180);
  renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); $('viewer').appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true;
  scene.add(new THREE.HemisphereLight(0xbfd9ff, 0x222733, 2)); const light = new THREE.DirectionalLight(0xffffff, 2); light.position.set(2, 4, 5); scene.add(light);
  window.addEventListener('resize', resize); resize(); animate();
}
function resize() { const box = $('viewer').getBoundingClientRect(); camera.aspect = box.width / Math.max(box.height, 1); camera.updateProjectionMatrix(); renderer.setSize(box.width, box.height); }
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
function setStatus(text, error=false) { $('status').textContent = text; $('status').className = `status${error ? ' error' : ''}`; }

function loadFile(file) {
  if (!file.name.toLowerCase().endsWith('.stl')) return setStatus('Elige un archivo con extensión .stl', true);
  $('fileName').textContent = file.name; setStatus('Leyendo STL…');
  const reader = new FileReader(); reader.onload = () => {
    try { geometry = loader.parse(reader.result); geometry.center(); geometry.computeVertexNormals(); showModel(); $('applyBtn').disabled = false; setStatus('Modelo cargado. Ajusta los parámetros y genera las piezas.'); }
    catch (e) { setStatus('No se pudo leer este STL. Prueba otro archivo.', true); console.error(e); }
  }; reader.readAsArrayBuffer(file);
}
function showModel() {
  if (model) scene.remove(model);
  const material = new THREE.MeshStandardMaterial({ color: 0x718096, metalness: .55, roughness: .42, flatShading: true, side: THREE.DoubleSide });
  model = new THREE.Mesh(geometry, material); scene.add(model); fitCamera(model); 
}
function fitCamera(object) { const box = new THREE.Box3().setFromObject(object), size = box.getSize(new THREE.Vector3()), max = Math.max(size.x,size.y,size.z); camera.position.set(max*1.4, max*.7, max*1.8); controls.target.set(0,0,0); controls.update(); }
function generatePieces() {
  if (!geometry) return;
  const targetHeight = Number($('height').value) || 600;
  const box = new THREE.Box3().setFromBufferAttribute(geometry.getAttribute('position'));
  const sourceHeight = box.max.y - box.min.y; const scale = targetHeight / sourceHeight;
  const pos = geometry.getAttribute('position'), triCount = pos.count / 3;
  const detail = $('detail').value, stride = detail === 'low' ? 4 : detail === 'high' ? 1 : 2;
  pieces = [];
  for (let i=0; i<triCount; i += stride) { const a = vertex(pos,i*3).multiplyScalar(scale), b=vertex(pos,i*3+1).multiplyScalar(scale), c=vertex(pos,i*3+2).multiplyScalar(scale); if (triangleArea(a,b,c) < .8) continue; pieces.push({ id: pieces.length+1, side:'I', a,b,c, zone: zoneFor(a,b,c) }); }
  if ($('mirror').checked) { const originals = pieces.slice(); originals.forEach(p => pieces.push({ ...p, id: pieces.length+1, side:'D', a:mirror(p.a), b:mirror(p.b), c:mirror(p.c) })); }
  renderPieces(); colorModel(); $('svgBtn').disabled = $('csvBtn').disabled = pieces.length === 0; setStatus(`${pieces.length} piezas preparadas. Revisa el modelo y prueba primero con cartón.`);
}
function vertex(attr, index) { return new THREE.Vector3().fromBufferAttribute(attr,index); }
function mirror(v) { return new THREE.Vector3(-v.x,v.y,v.z); }
function triangleArea(a,b,c) { return new THREE.Vector3().subVectors(b,a).cross(new THREE.Vector3().subVectors(c,a)).length()/2; }
function zoneFor(a,b,c) { const p=a.clone().add(b).add(c).multiplyScalar(1/3); const y=p.y; if (y > 170) return 'cuerno/frente'; if (y < -130) return 'cuello'; if (p.z > 50 && y < 40) return 'hocico/nariz'; return y > 60 ? 'frente/ojos' : 'mejilla'; }
function renderPieces() { const grid=$('partsGrid'); grid.innerHTML=''; $('count').textContent=`${pieces.length} piezas`; pieces.forEach(p => { const card=document.createElement('button'); card.className='part'; card.innerHTML=`<b>${String(p.id).padStart(3,'0')}</b><span>${p.side==='I'?'Izquierda':'Derecha'}</span><small>${p.zone}</small>`; card.onclick=()=>selectPiece(p,card); grid.appendChild(card); }); }
function selectPiece(p,card) { document.querySelectorAll('.part.selected').forEach(x=>x.classList.remove('selected')); card.classList.add('selected'); selected=p; setStatus(`Pieza ${String(p.id).padStart(3,'0')} · ${p.zone} · lado ${p.side}`); }
function colorModel() { if (!model) return; model.material.color.set(0x718096); }
function svgPoint(v, minX, minY, scale) { return `${((v.x-minX)*scale+20).toFixed(2)},${((v.y-minY)*scale+20).toFixed(2)}`; }
function exportSVG() { if (!pieces.length) return; const minX=Math.min(...pieces.flatMap(p=>[p.a.x,p.b.x,p.c.x])), minY=Math.min(...pieces.flatMap(p=>[p.a.y,p.b.y,p.c.y])); const maxX=Math.max(...pieces.flatMap(p=>[p.a.x,p.b.x,p.c.x])), maxY=Math.max(...pieces.flatMap(p=>[p.a.y,p.b.y,p.c.y])); const scale=1, w=maxX-minX+40,h=maxY-minY+40; const polygons=pieces.map(p=>{const pts=[svgPoint(p.a,minX,minY,scale),svgPoint(p.b,minX,minY,scale),svgPoint(p.c,minX,minY,scale)].join(' '); const cx=(p.a.x+p.b.x+p.c.x)/3-minX+20,cy=(p.a.y+p.b.y+p.c.y)/3-minY+20; return `<polygon points="${pts}" fill="none" stroke="#111" stroke-width="0.5"/><text x="${cx.toFixed(2)}" y="${cy.toFixed(2)}" font-size="4" text-anchor="middle">${String(p.id).padStart(3,'0')}</text>`;}).join(''); download(new Blob([`<svg xmlns="http://www.w3.org/2000/svg" width="${w}mm" height="${h}mm" viewBox="0 0 ${w} ${h}">${polygons}</svg>`],{type:'image/svg+xml'}),'plantillas-toro.svg'); }
function exportCSV() { const rows=['numero,lado,zona,area_aprox_mm2']; pieces.forEach(p=>rows.push(`${p.id},${p.side},"${p.zone}",${triangleArea(p.a,p.b,p.c).toFixed(2)}`)); download(new Blob([rows.join('\n')],{type:'text/csv'}),'lista-piezas.csv'); }
function download(blob,name) { const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); URL.revokeObjectURL(a.href); }
function reset() { pieces=[]; geometry=null; if(model) scene.remove(model); $('fileInput').value=''; $('fileName').textContent='Todavía no hay ningún archivo'; $('applyBtn').disabled=true; $('svgBtn').disabled=$('csvBtn').disabled=true; $('partsGrid').innerHTML='<div class="empty">Aquí aparecerán las piezas numeradas.</div>'; $('count').textContent='0 piezas'; setStatus('Carga un archivo STL para comenzar.'); }
