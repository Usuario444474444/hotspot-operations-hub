const express=require('express');const r=express.Router();const fs=require('fs');r.get('/api/tiendas',(q,s)=>s.json(JSON.parse(fs.readFileSync('./data/tiendas.json','utf8'))));module.exports=r;
