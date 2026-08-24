const express=require('express');const r=express.Router();const fs=require('fs');r.get('/api/tickets',(q,s)=>s.json(JSON.parse(fs.readFileSync('./data/tickets.json','utf8'))));module.exports=r;
