// ========================================
// MODULO: TIMELINE (TML)
// ========================================
const {readJson,saveJson,getNextId}=require('../storage/dataStore');
function agregarEvento(ticketId,tipo,detalle){const data=readJson('timeline.json',[]);const e={eventoId:getNextId(data,'eventoId'),ticketId,tipo,detalle,fecha:new Date().toISOString()};data.push(e);saveJson('timeline.json',data);return e;}
module.exports={agregarEvento};
