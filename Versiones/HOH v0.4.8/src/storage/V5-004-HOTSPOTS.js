// ========================================
// HOTSPOT OPERATIONS HUB V5
// MODULO: HOTSPOTS
// CODIGO: HSP
// VERSION: 5.0.0
// ========================================
const express=require('express');
const router=express.Router();
const {readJson,saveJson,getNextId}=require('../storage/dataStore');
router.get('/api/hotspots',(req,res)=>res.json(readJson('hotspots.json',[])));
router.post('/api/hotspots',(req,res)=>{const data=readJson('hotspots.json',[]);const item={hotspotId:getNextId(data,'hotspotId'),nombre:req.body.nombre,imei:req.body.imei,simId:req.body.simId||null,tiendaId:req.body.tiendaId||null,estado:'ACTIVO'};data.push(item);saveJson('hotspots.json',data);res.status(201).json(item);});
module.exports=router;
