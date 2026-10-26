import fs from 'node:fs';
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
  const values={...page,page:page.id,navigation,mobile_navigation:navigation,content:fs.readFileSync(`src/pages/${page.id}.html`,'utf8'),page_script:page.id==='inicio'?'<script src="assets/sushi-material-atlas.js" defer></script>\n  <script src="sushi-3d.js" defer></script>':page.id==='colaboraciones'?'<script src="collaborations.js" defer></script>':''};
  const html=layout.replace(/\{\{(\w+)\}\}/g,(_,key)=>{if(!(key in values))throw new Error('Unknown template variable '+key);return values[key];});
  fs.writeFileSync('dist/'+page.file,html);
}
console.log(`Generadas ${pages.length} páginas con navegación independiente.`);
