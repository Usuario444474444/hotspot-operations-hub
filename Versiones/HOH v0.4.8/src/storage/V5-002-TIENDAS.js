// ========================================
// HOTSPOT OPERATIONS HUB V5
// MODULO: TIENDAS
// CODIGO: TND
// VERSION: 5.0.0
// ========================================
const express=require('express');
const router=express.Router();
const {readJson,saveJson,getNextId}=require('../storage/dataStore');
router.get('/api/tiendas',(req,res)=>res.json(readJson('tiendas.json',[])));
router.get('/api/tiendas/:id',(req,res)=>{
 const tiendas=readJson('tiendas.json',[]);
 const tienda=tiendas.find(x=>x.tiendaId===Number(req.params.id));
 if(!tienda)return res.status(404).json({error:'Tienda no encontrada'});
 res.json(tienda);
});
router.post('/api/tiendas',(req,res)=>{
 const tiendas=readJson('tiendas.json',[]);
 const nueva={tiendaId:getNextId(tiendas,'tiendaId'),clave:req.body.clave,nombre:req.body.nombre,ciudad:req.body.ciudad,estado:'Activa'};
 tiendas.push(nueva); saveJson('tiendas.json',tiendas); res.status(201).json(nueva);
});
module.exports=router;
