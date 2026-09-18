// ========================================
// MODULO: MOVIMIENTOS (MOV)
// ========================================
const {readJson,saveJson,getNextId}=require('../storage/dataStore');
function registrarMovimiento(tipo,payload={}){const data=readJson('movimientos.json',[]);const mov={movimientoId:getNextId(data,'movimientoId'),tipo,fecha:new Date().toISOString(),...payload};data.push(mov);saveJson('movimientos.json',data);return mov;}
module.exports={registrarMovimiento};
