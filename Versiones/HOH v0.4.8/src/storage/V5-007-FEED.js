// ========================================
// MODULO: FEED OPERATIVO (FLW)
// ========================================
const {readJson,saveJson,getNextId}=require('../storage/dataStore');
function agregarFeed(ticketId,evento,detalle,usuario='SISTEMA'){const data=readJson('feed-operativo.json',[]);const f={feedId:getNextId(data,'feedId'),ticketId,evento,detalle,usuario,fecha:new Date().toISOString()};data.push(f);saveJson('feed-operativo.json',data);return f;}
module.exports={agregarFeed};
