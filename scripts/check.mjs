import { readFile,access,readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root=fileURLToPath(new URL('../dist/',import.meta.url));
const pages=(await readdir(root)).filter(name=>name.endsWith('.html'));
const documents=Object.fromEntries(await Promise.all(pages.map(async name=>[name,await readFile(path.join(root,name),'utf8')])));
const html=Object.values(documents).join('\n');
const css=await readFile(path.join(root,'styles.css'),'utf8');
let anchorCount=0;
for(const [name,document] of Object.entries(documents)){
  const ids=[...document.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]);
  const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
  if(duplicates.length)throw new Error(`${name}: IDs duplicados: ${duplicates.join(', ')}`);
  const anchors=[...document.matchAll(/href="#([^"]+)"/g)].map(match=>match[1]);
  for(const anchor of anchors)if(!ids.includes(anchor))throw new Error(`${name}: ancla sin destino: ${anchor}`);
  anchorCount+=anchors.length;
  if(!document.includes('lang="es"'))throw new Error(`${name}: falta idioma español`);
  if((document.match(/aria-current="page"/g)||[]).length!==2)throw new Error(`${name}: falta la pestaña activa de escritorio o móvil`);
  for(const page of pages)if(!document.includes(`href="${page}"`))throw new Error(`${name}: falta enlace a ${page}`);
}
const assets=new Set([
  ...[...html.matchAll(/(?:src|href)="(?!https?:|mailto:|tel:|data:|#)([^"]+)"/g)].map(match=>match[1]),
  ...[...css.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map(match=>match[1])
]);
for(const asset of assets)await access(path.join(root,asset));
const mapLibraryRoot=path.join(root,'vendor','maplibre');
await access(path.join(mapLibraryRoot,'maplibre-gl.js'));
await access(path.join(mapLibraryRoot,'maplibre-gl.css'));
await access(path.join(mapLibraryRoot,'LICENSE.txt'));
if((await readFile(path.join(root,'delivery-map.js'),'utf8')).includes('tile.openstreetmap.org'))throw new Error('El mapa no debe volver al proveedor bloqueado');
const catalogCode=await readFile(path.join(root,'menu-data.js'),'utf8');
const catalog=vm.runInNewContext(catalogCode+'; ({products,menuCategories})');
const branches=vm.runInNewContext(await readFile(path.join(root,'order-data.js'),'utf8')+'; orderBranches');
if(branches.length!==3||new Set(branches.map(b=>b.id)).size!==3)throw new Error('Deben existir tres sucursales para los pedidos');
for(const branch of branches){
  if(!/^591\d{8}$/.test(branch.phone))throw new Error(`WhatsApp inválido: ${branch.id}`);
  if(!documents['ubicaciones.html'].includes(`tel:+${branch.phone}`))throw new Error(`El teléfono de pedidos no coincide con Ubicaciones: ${branch.id}`);
}
const productIds=new Set();
for(const product of catalog.products){
  if(productIds.has(product.id))throw new Error(`Producto duplicado: ${product.id}`);
  productIds.add(product.id);
  if(!catalog.menuCategories.some(c=>c.id===product.category))throw new Error(`Categoría inválida: ${product.id}`);
  if(!Number.isFinite(product.price)||product.price<=0)throw new Error(`Precio inválido: ${product.id}`);
  if(!product.serving||!product.description)throw new Error(`Producto incompleto: ${product.id}`);
  await access(path.join(root,product.photo));
}
if(catalog.products.length!==45||catalog.menuCategories.length!==7)throw new Error('La carta de referencia tiene 45 productos en 7 categorías');
for(const match of html.matchAll(/data-add="([^"]+)"/g))if(!productIds.has(match[1]))throw new Error(`Producto destacado inexistente: ${match[1]}`);
if(pages.length!==6)throw new Error('Deben existir seis páginas independientes');
if(documents['index.html'].includes('id="menu-grid"'))throw new Error('El menú debe estar en su propia página');
if(!documents['colaboraciones.html'].includes('id="collaboration-form"'))throw new Error('Falta el formulario de colaboraciones');
for(const [name,document] of Object.entries(documents))if(!document.includes('id="order-branch"')||!document.includes('id="send-order"'))throw new Error(`${name}: falta el formulario de pedido por sucursal`);
if(!css.includes('prefers-reduced-motion'))throw new Error('Falta la alternativa de movimiento reducido');
console.log(`Verificación correcta: ${pages.length} páginas, navegación completa, ${anchorCount} anclas válidas, ${catalog.products.length} productos, ${catalog.menuCategories.length} categorías y todas las fotos locales.`);
