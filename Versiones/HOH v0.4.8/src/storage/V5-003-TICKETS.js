// ========================================
// HOTSPOT OPERATIONS HUB V5
// MODULO: TICKETS
// CODIGO: TKT
// VERSION: 5.0.0
// ========================================
const express=require('express');
const router=express.Router();
const {readJson,saveJson,getNextId}=require('../storage/dataStore');
router.get('/api/tickets',(req,res)=>res.json(readJson('tickets.json',[])));
router.get('/api/tickets/:id',(req,res)=>{
 const tickets=readJson('tickets.json',[]);
 const ticket=tickets.find(x=>x.ticketId===Number(req.params.id));
 if(!ticket)return res.status(404).json({error:'Ticket no encontrado'});
 res.json(ticket);
});
router.post('/api/tickets',(req,res)=>{
 const tickets=readJson('tickets.json',[]);
 const nuevo={ticketId:getNextId(tickets,'ticketId'),fechaCreacion:new Date().toISOString(),tienda:req.body.tienda,contacto:req.body.contacto,telefono:req.body.telefono,problema:req.body.problema,descripcion:req.body.descripcion,estado:'ABIERTO',strike:0,comentarios:[]};
 tickets.push(nuevo); saveJson('tickets.json',tickets); res.status(201).json(nuevo);
});
router.put('/api/tickets/:id/cerrar',(req,res)=>{
 const tickets=readJson('tickets.json',[]);
 const t=tickets.find(x=>x.ticketId===Number(req.params.id));
 if(!t)return res.status(404).json({error:'Ticket no encontrado'});
 t.estado='CERRADO'; t.fechaCierre=new Date().toISOString();
 saveJson('tickets.json',tickets); res.json(t);
});
module.exports=router;
