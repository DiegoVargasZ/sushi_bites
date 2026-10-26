import fs from 'node:fs';
import vm from 'node:vm';
const config=JSON.parse(fs.readFileSync('site.config.json','utf8'));
let siteUrl=(process.env.SITE_URL??config.siteUrl??'').trim();
if(siteUrl){
  const parsed=new URL(siteUrl);
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.search||parsed.hash)throw new Error('SITE_URL debe ser una URL HTTPS pública sin credenciales, consulta ni fragmento.');
  siteUrl=parsed.href.replace(/\/$/,'')+'/';
}
if(process.argv.includes('--production')&&!siteUrl)throw new Error('Configura siteUrl en site.config.json o SITE_URL con el dominio definitivo antes de generar producción.');
const absolute=file=>siteUrl?new URL(file,siteUrl).href:null;
const escape=value=>value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const branches=vm.runInNewContext(fs.readFileSync('dist/order-data.js','utf8')+'; orderBranches');
// Use the same verified addresses and contacts as the checkout.
const restaurantSchema=JSON.stringify({'@context':'https://schema.org','@graph':branches.map(branch=>({
  '@type':'Restaurant',
  name:branch.name,
  telephone:'+'+branch.phone,
  address:{'@type':'PostalAddress',streetAddress:branch.address.split(',')[0],addressLocality:branch.id==='quillacollo'?'Quillacollo':'Cochabamba',addressRegion:'Cochabamba',addressCountry:'BO'},
  servesCuisine:['Japonesa','Nikkei','Sushi'],
  currenciesAccepted:'BOB',
  ...(siteUrl?{'@id':absolute('ubicaciones.html#'+branch.id),url:absolute('ubicaciones.html#'+branch.id),hasMenu:absolute('menu.html'),image:absolute('assets/hero-sushi.webp'),logo:absolute('assets/logo-oficial.webp')}:{})
}))}).replace(/</g,'\\u003c');
const pages=[
  {id:'inicio',file:'index.html',label:'Inicio',title:'Buen sushi. Buen mood.',description:'Ehomakis crocantes, burgers de arroz y fusiones Nikkei de Sushi Bites en Bolivia.'},
  {id:'menu',file:'menu.html',label:'Menú',title:'Menú completo',description:'Explora las 45 opciones de Sushi Bites: fusiones Nikkei, rolls fritos, Ehomakis, Emperadores, mochis, bebidas y salsas.'},
  {id:'ubicaciones',file:'ubicaciones.html',label:'Ubicaciones',title:'Ubicaciones',description:'Encuentra Sushi Bites Central, Hupermall y Quillacollo. Direcciones, contacto y cómo llegar.'},
  {id:'nosotros',file:'nosotros.html',label:'Nosotros',title:'Nosotros',description:'Conoce la esencia de Sushi Bites y sus fusiones inspiradas en Japón.'},
  {id:'preguntas',file:'preguntas.html',label:'Preguntas',title:'Preguntas frecuentes',description:'Consulta cómo preparar tu pedido, las variedades de sushi, los alérgenos y la entrega.'},
  {id:'colaboraciones',file:'colaboraciones.html',label:'Colaboraciones',title:'Colaboraciones',description:'¿Haces contenido de comida en Bolivia? Cuéntanos tu propuesta de colaboración para Sushi Bites.'}
];
const layout=fs.readFileSync('src/layout.html','utf8');
for(const page of pages){
  const navigation=pages.map(p=>`<a href="${p.file}"${p.id===page.id?' class="active" aria-current="page"':''}>${p.label}${p.id==='colaboraciones'?'<span class="nav-collab-dot" aria-hidden="true"></span>':''}</a>`).join('');
  const urlMetadata=siteUrl?`<link rel="canonical" href="${escape(absolute(page.id==='inicio'?'':page.file))}">\n  <meta property="og:url" content="${escape(absolute(page.id==='inicio'?'':page.file))}">\n  <meta property="og:image" content="${escape(absolute('assets/hero-sushi.webp'))}">\n  <meta property="og:image:width" content="1536">\n  <meta property="og:image:height" content="1024">\n  <meta property="og:image:alt" content="Sushi de salmón, arroz y alga nori de Sushi Bites">\n  <meta name="twitter:image" content="${escape(absolute('assets/hero-sushi.webp'))}">`:'<meta name="robots" content="noindex, follow">';
  const values={...page,page:page.id,navigation,mobile_navigation:navigation,url_metadata:urlMetadata,restaurant_schema:`<script type="application/ld+json">${restaurantSchema}</script>`,content:fs.readFileSync(`src/pages/${page.id}.html`,'utf8'),page_script:page.id==='inicio'?'<script src="assets/sushi-material-atlas.js" defer></script>\n  <script src="sushi-3d.js" defer></script>':page.id==='colaboraciones'?'<script src="collaborations.js" defer></script>':''};
  const html=layout.replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in values))throw new Error('Unknown template variable '+key);return values[key];});
  fs.writeFileSync('dist/'+page.file,html);
}
fs.writeFileSync('dist/robots.txt',siteUrl?`User-agent: *\nAllow: /\n\nSitemap: ${absolute('sitemap.xml')}\n`:'User-agent: *\nAllow: /\n');
if(siteUrl)fs.writeFileSync('dist/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(page=>`<url><loc>${escape(absolute(page.id==='inicio'?'':page.file))}</loc></url>`).join('')}</urlset>\n`);
else if(fs.existsSync('dist/sitemap.xml'))fs.unlinkSync('dist/sitemap.xml');
console.log(`Generadas ${pages.length} páginas con navegación independiente.`);
