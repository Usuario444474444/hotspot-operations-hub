// ========================================
// HOTSPOT OPERATIONS HUB
// MODULO: SERVICENOW SERVICE
// CODIGO: SVC
// VERSION: 10.0.0
// ========================================
const axios = require('axios');
require('dotenv').config();
const GROUPS=['504e74213b969290f8624147f4e45af9','f95329bc3bb51610f8624147f4e45adf','b149290f1b595610a0db53111b4bcbcf','5f29a10f1b595610a0db53111b4bcbc9'];
const CLOSED_STATES=['cerrado','resuelto','closed','resolved'];
function normalize(v){return String(v||'').trim().toLowerCase();}
function isClosed(state){return CLOSED_STATES.some(x=>normalize(state).includes(x));}
function extractSAP(ticket){const m=(ticket.short_description||'').match(/(\d{8,10})/);return m?m[1]:null;}
async function getHotspotTickets(){const auth=Buffer.from(`${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`).toString('base64');const response=await axios({method:'GET',url:`${process.env.SNOW_INSTANCE}/api/now/table/incident`,headers:{Authorization:`Basic ${auth}`,Accept:'application/json'},params:{sysparm_query:`assignment_groupIN${GROUPS.join(',')}^ORDERBYDESCsys_created_on`,sysparm_limit:10000,sysparm_display_value:true,sysparm_fields:'number,sys_id,short_description,state,assignment_group,assigned_to,priority,sys_created_on,sys_updated_on,opened_at,category,subcategory,u_subcategory3,u_subcategory4,caller_id,cmdb_ci'}});
return {result:(response.data?.result||[]).map(t=>({...t,sap:extractSAP(t),isClosed:isClosed(t.state)}))};}
module.exports={getHotspotTickets,isClosed,extractSAP};
