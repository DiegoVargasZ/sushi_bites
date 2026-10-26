import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {randomUUID} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';

const code=readFileSync(new URL('../dist/cart-store.js',import.meta.url),'utf8')+'; cartStore';
const legacy='sushi-bites-cart-menu-v2';
const prefix='sushi-bites-cart-menu-v3:change:';
const plain=value=>JSON.parse(JSON.stringify(value));
function storage(seed={}){
  const entries=new Map(Object.entries(seed));
  return {entries,get length(){return entries.size;},getItem:key=>entries.get(key)??null,setItem:(key,value)=>entries.set(key,String(value)),key:index=>[...entries.keys()][index]??null};
}
function tab(localStorage){return vm.runInNewContext(code,{localStorage,products:[{id:'maracuya'},{id:'soya'}],crypto:{randomUUID}});}

test('conserva bolsas existentes, valida productos y limita cantidades',()=>{
  const saved=storage({[legacy]:JSON.stringify({maracuya:150,soya:-3,unknown:2})});
  assert.deepEqual(plain(tab(saved).read()),{maracuya:99});
  assert.equal(saved.entries.size,1,'leer no debe escribir el carrito');
});
test('dos pestañas abiertas conservan maracuyá y soya y sus cambios posteriores',()=>{
  const saved=storage(),a=tab(saved),b=tab(saved);
  a.read();b.read();
  a.change('maracuya',1);b.change('soya',1);
  assert.deepEqual(plain(a.read()),{maracuya:1,soya:1});
  a.change('maracuya',-1);b.change('soya',1);
  assert.deepEqual(plain(tab(saved).read()),{soya:2});
});
test('escrituras simultáneas desde lecturas anteriores no se sobrescriben',()=>{
  const saved=storage(),waiting=[];
  const deferred={...saved,get length(){return saved.length;},setItem:(key,value)=>waiting.push([key,value])};
  const a=tab(deferred),b=tab(deferred);
  a.change('maracuya',1);b.change('maracuya',1);
  for(const [key,value] of waiting)saved.setItem(key,value);
  assert.equal(tab(saved).read().maracuya,2);
  assert.equal(waiting.length,2);
  assert.notEqual(waiting[0][0],waiting[1][0]);
});
test('dos restas simultáneas llegan a cero y la siguiente suma funciona',()=>{
  const saved=storage({[legacy]:'{"maracuya":1}'}),waiting=[];
  const deferred={...saved,get length(){return saved.length;},setItem:(key,value)=>waiting.push([key,value])};
  tab(deferred).change('maracuya',-1);tab(deferred).change('maracuya',-1);
  for(const [key,value] of waiting)saved.setItem(key,value);
  const restored=tab(saved);
  assert.deepEqual(plain(restored.read()),{});
  assert.equal(restored.change('maracuya',1).maracuya,1);
});
test('el límite de 99 y la eliminación no producen cantidades inválidas',()=>{
  const saved=storage({[legacy]:'{"maracuya":98}'}),a=tab(saved),b=tab(saved);
  a.change('maracuya',1);b.change('maracuya',1);
  assert.equal(a.read().maracuya,99);
  for(let i=0;i<100;i++)b.change('maracuya',-1);
  assert.deepEqual(plain(a.read()),{});
  assert.equal(a.change('maracuya',1).maracuya,1);
});
test('registros dañados no impiden guardar nuevos productos',()=>{
  const saved=storage({[legacy]:'{bad',[prefix+'bad']:'null',[prefix+'broken']:'{'}),a=tab(saved);
  a.change('soya',1);
  assert.deepEqual(plain(tab(saved).read()),{soya:1});
});
test('la bolsa funciona en memoria con almacenamiento bloqueado o lleno',()=>{
  const blocked={getItem(){throw new Error('blocked');},setItem(){throw new Error('blocked');}};
  const a=tab(blocked);
  a.change('maracuya',1);a.change('soya',1);a.change('maracuya',1);
  assert.deepEqual(plain(a.read()),{maracuya:2,soya:1});
  const full=storage({[legacy]:'{"soya":2}'});
  full.setItem=()=>{throw new Error('quota');};
  const b=tab(full);
  assert.deepEqual(plain(b.change('soya',-1)),{soya:1});
});
