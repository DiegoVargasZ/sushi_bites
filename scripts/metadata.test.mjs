import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=fileURLToPath(new URL('../',import.meta.url));
test('genera metadatos para el dominio configurado y evita URLs de prueba en producción',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'sushi-bites-metadata-'));
  try{
    fs.cpSync(path.join(root,'src'),path.join(temp,'src'),{recursive:true,filter:source=>!source.includes(path.join('src','assets'))});
    fs.mkdirSync(path.join(temp,'dist'));
    fs.copyFileSync(path.join(root,'dist/order-data.js'),path.join(temp,'dist/order-data.js'));
    fs.writeFileSync(path.join(temp,'site.config.json'),'{"siteUrl":""}');
    const build=(url,args=[])=>spawnSync(process.execPath,[path.join(root,'scripts/build-pages.mjs'),...args],{cwd:temp,env:{...process.env,SITE_URL:url},encoding:'utf8'});
    const read=file=>fs.readFileSync(path.join(temp,'dist',file),'utf8');
    assert.equal(build('', ['--production']).status,1);
    assert.equal(build('').status,0);
    assert.ok(read('menu.html').includes('content="noindex, follow"'));
    assert.ok(!read('menu.html').includes('rel="canonical"'));
    assert.equal(build('https://sushi.example/tienda', ['--production']).status,0);
    const menu=read('menu.html');
    assert.ok(menu.includes('rel="canonical" href="https://sushi.example/tienda/menu.html"'));
    assert.ok(menu.includes('property="og:image" content="https://sushi.example/tienda/assets/hero-sushi.webp"'));
    assert.ok(!menu.includes('noindex'));
    assert.equal((read('sitemap.xml').match(/<url>/g)||[]).length,6);
    assert.ok(read('robots.txt').includes('Sitemap: https://sushi.example/tienda/sitemap.xml'));
    const schema=JSON.parse(menu.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
    assert.equal(schema['@graph'].length,3);
    assert.equal(schema['@graph'][0].telephone,'+59169447617');
    assert.equal(schema['@graph'][2].address.addressLocality,'Quillacollo');
    assert.ok(read('ubicaciones.html').includes('id="central"'));
    for(const url of ['http://sushi.example','https://user:password@sushi.example','https://sushi.example/?test=1','https://sushi.example/#preview'])assert.equal(build(url).status,1);
    assert.equal(build('').status,0);
    assert.ok(!fs.existsSync(path.join(temp,'dist/sitemap.xml')),'una vista previa no conserva un sitemap anterior');
  }finally{
    assert.equal(path.dirname(path.resolve(temp)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('sushi-bites-metadata-'));
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
