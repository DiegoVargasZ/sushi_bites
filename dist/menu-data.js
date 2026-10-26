/* Carta transcrita de la imagen del menú facilitada por el propietario.
   Los precios de esa referencia prevalecen sobre otras versiones de la carta. */
"use strict";
const menuCategories = [
  {id:"fusiones",name:"Fusiones Nikkei",description:"Burgers de arroz, bowls, tacos y ramen. Japón con nuestro toque."},
  {id:"fritos",name:"Rolls fritos",description:"Ehomakis dorados por fuera. Todo el sabor por dentro."},
  {id:"ehomakis",name:"Ehomakis",description:"El clásico envuelto en nori, en su versión sin freír."},
  {id:"emperadores",name:"Emperadores",description:"Un roll con actitud. Queso, pulpo y camote crocante."},
  {id:"postres",name:"Postres",description:"Un final suave, dulce y hecho para disfrutar."},
  {id:"bebidas",name:"Bebidas",description:"El acompañamiento de tu próximo antojo."},
  {id:"salsas",name:"Salsas",description:"Ese toque extra. Elige tu favorita."}
];
const products = [];
function menuProduct(id,name,category,price,description,serving,allergens=[],badge="") {
  products.push({id,name,category,price,description,serving,allergens,badge,
    meta:menuCategories.find(c=>c.id===category).name.toUpperCase(),photo:`assets/menu/${id}.jpg`});
}
menuProduct("burger-normal","Sushi Burger (Normal)","fusiones",49,"Pan de arroz japonés dorado, queso crema, palta fresca, cebollín, salmón y camarón.","1 burger",["Pescado","Crustáceos","Lácteos"],"ARROZ CROCANTE");
menuProduct("burger-emperador","Sushi Burger (Emperador)","fusiones",58,"Nuestra burger de arroz con salmón, camarón, palta y cebollín. Extra de queso, pulpo, camote y sésamo.","1 burger",["Pescado","Crustáceos","Moluscos","Lácteos","Sésamo"],"MODO EMPERADOR");
menuProduct("sushi-bowl","Sushi Bowl","fusiones",65,"Arroz japonés, queso crema, palta, cebollín, salmón y camarón premium. Versión Emperador con queso extra, pulpo y crocante de camote.","1 bowl",["Pescado","Crustáceos","Lácteos"]);
menuProduct("sushi-tacos","Sushi Tacos","fusiones",65,"Cuatro tacos de alga nori crujiente, arroz japonés, palta y un mix de kanikama, salmón, pulpo y pollo. Terminados con sésamo tostado.","4 tacos",["Pescado","Moluscos","Sésamo"],"CUATRO BOCADOS, UN PLAN");
menuProduct("chicken-bowl","Chicken Bowl","fusiones",45,"Arroz japonés, pechuga de pollo al estilo japonés, hongos salteados, queso crema, jengibre encurtido, vegetales encurtidos y sésamo tostado.","1 bowl",["Lácteos","Sésamo"]);
menuProduct("chicken-ramen","Chicken Ramen","fusiones",45,"Fideos de ramen en caldo ligeramente picante, pollo a la plancha con salsa de la casa, champiñones salteados y toppings crocantes.","1 bowl",["Gluten","Huevo"],"UN ABRAZO EN UN BOWL");
const rollFlavors = [
  {id:"ebi",name:"Ebi",fried:49,fresh:44,emperor:58,base:"Camarón, queso crema, mango, pepino y palta.",freshText:"Camarón salteado en ajo y especias, pepino, queso crema y arroz japonés, envuelto en alga nori.",allergens:["Crustáceos","Lácteos"]},
  {id:"furai",name:"Furai",fried:47,fresh:42,emperor:56,base:"Salmón, queso crema, melón, pepino y palta.",freshText:"Salmón marinado en limón y ajo, pepino, queso crema y fruta de temporada, envuelto en arroz japonés y alga nori.",allergens:["Pescado","Lácteos"]},
  {id:"gratin",name:"Gratin",fried:40,fresh:35,emperor:49,base:"Kanikama, palta, parmesano, zanahoria y queso crema.",freshText:"Kanikama con queso crema, zanahoria y pepino, topping de parmesano gratinado, alga nori y arroz japonés.",allergens:["Pescado","Lácteos"]},
  {id:"karaage",name:"Karaage",fried:38,fresh:33,emperor:47,base:"Pollo frito, queso crema, palta y zanahoria.",freshText:"Pollo estilo karaage marinado en especias japonesas, pepino fresco, queso crema y arroz japonés, envuelto en alga nori.",allergens:["Lácteos","Gluten"]},
  {id:"spicy",name:"Spicy",fried:47,fresh:42,emperor:56,base:"Salmón, salsa picante, cebollín, queso crema y palta.",freshText:"Salmón picante mezclado con especias, pepino, queso crema y arroz japonés, envuelto en alga nori.",allergens:["Pescado","Lácteos"]},
  {id:"niku",name:"Niku",fried:40,fresh:35,emperor:49,base:"Carne, palta, papa frita y cheddar gratinado.",freshText:"Carne molida sazonada, tocino crujiente, queso crema, arroz japonés y BBQ, envuelto en alga nori.",allergens:["Lácteos"]}
];
for(const r of rollFlavors) menuProduct(`${r.id}-frito`,`${r.name} Ehomaki (Frito)`,"fritos",r.fried,`Alga nori y arroz japonés. ${r.base} Frito hasta quedar crocante.`,"1 ehomaki",[...new Set([...r.allergens,"Gluten"])],r.id==="furai"?"CRUNCH EN CADA BOCADO":"");
for(const r of rollFlavors) menuProduct(r.id,`${r.name} Ehomaki`,"ehomakis",r.fresh,r.freshText+" Versión sin freír.","1 ehomaki",r.allergens);
for(const r of rollFlavors) {
  const freshEmperor=["spicy","niku"].includes(r.id);
  menuProduct(`${r.id}-emperador`,`${r.name} (Emperador)`,"emperadores",r.emperor,
    freshEmperor?r.freshText+" Versión sin freír.":`Alga nori y arroz japonés. ${r.base} Con extra de queso, pulpo, camote frito, pimiento y sésamo.`,
    "1 emperador",freshEmperor?r.allergens:[...new Set([...r.allergens,"Moluscos","Lácteos","Sésamo","Gluten"])],"MODO EMPERADOR");
}
menuProduct("mochi-frutilla","Mochi de Frutilla","postres",12,"Mochi suave y elástico de frutilla, relleno con mermelada casera de frutilla y crema chantilly.","1 mochi",["Lácteos"]);
menuProduct("mochi-maracuya","Mochi de Maracuyá","postres",12,"Mochi suave y elástico de maracuyá, relleno con mermelada casera de maracuyá y crema chantilly.","1 mochi",["Lácteos"]);
menuProduct("mochi-cafe","Mochi de Café y Dulce de Leche","postres",12,"Mochi de café con relleno de dulce de leche y una cremosa mezcla de chantilly.","1 mochi",["Lácteos"]);
for(const [id,name,price,description] of [
  ["del-valle","Jugo del Valle",10,"Jugo del Valle en botella de 500 ml."],
  ["pacha","Jugos Pacha",10,"Canela, mocochinchi o chicha morada. Confirma el sabor disponible al pedir."],
  ["sprite","Sprite",10,"Gaseosa sabor limón, 500 ml."],
  ["sprite-zero","Sprite Zero",10,"Gaseosa sin azúcar, 500 ml."],
  ["coca-cola","Coca-Cola",10,"Sabor original, 500 ml."],
  ["coca-cola-zero","Coca-Cola Sin Azúcar",10,"Coca-Cola sin azúcar, 500 ml."],
  ["fanta-naranja","Fanta Sabor Naranja",10,"Gaseosa sabor naranja, 500 ml."],
  ["fanta-papaya","Fanta Sabor Papaya",10,"Gaseosa sabor papaya, 500 ml."],
  ["fanta-guarana","Fanta Sabor Guaraná",10,"Gaseosa sabor guaraná, 500 ml."],
  ["fanta-mandarina","Fanta Sabor Mandarina",10,"Gaseosa sabor mandarina, 500 ml."],
  ["agua-gas","Agua con Gas",10,"Agua con gas, 500 ml."],
  ["agua","Agua",8,"Agua sin gas, 500 ml."]
]) menuProduct(id,name,"bebidas",price,description,id==="pacha"?"1 botella":"500 ml");
for(const [id,name] of [["acevichada","Acevichada"],["bbq","BBQ"],["maracuya","Maracuyá"],["picante","Picante"],["soya","Soya"],["teriyaki","Teriyaki"]])
  menuProduct(id,`Salsa ${name}`,"salsas",1.5,`Salsa ${name.toLowerCase()} en su envase individual.`,"1 envase",["soya","teriyaki"].includes(id)?["Soya","Gluten"]:[]);
