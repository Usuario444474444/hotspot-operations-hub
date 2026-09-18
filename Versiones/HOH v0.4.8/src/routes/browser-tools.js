const express=require('express');
const router=express.Router();
const fs=require('fs');
const path=require('path');
function read(f){const p=path.join(process.cwd(),'data',f);return JSON.parse(fs.readFileSync(p,'utf8'));}
function save(f,d){const p=path.join(process.cwd(),'data',f);fs.writeFileSync(p,JSON.stringify(d,null,2));}
router.get('/api/demo/crear-tienda',(req,res)=>{
 const tiendas=read('tiendas.json');
 const item={tiendaId:Date.now(),clave:'SPGG001',nombre:'San Pedro',ciudad:'San Pedro'};
 tiendas.push(item); save('tiendas.json',tiendas); res.json(item);
});
router.get('/api/demo/crear-ticket',(req,res)=>{
 const tickets=read('tickets.json');
 const item={ticketId:Date.now(),tienda:'SPGG001',contacto:'Brian',telefono:'8112345678',problema:'SIN_SESION',descripcion:'Prueba V5',estado:'ABIERTO'};
 tickets.push(item); save('tickets.json',tickets); res.json(item);
});
module.exports=router;
