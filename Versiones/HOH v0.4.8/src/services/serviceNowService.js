// ========================================
// HOTSPOT OPERATIONS HUB
// MODULO: SERVICENOW SERVICE
// CODIGO: SVC
// VERSION: 10.0.0
// ========================================
const axios = require('axios');
require('dotenv').config();
const GROUPS=['3749290f1b595610a0db53111b4bcb13','504e74213b969290f8624147f4e45af9'];
const CLOSED_STATES=['cerrado','resuelto','closed','resolved'];
function normalize(v){return String(v||'').trim().toLowerCase();}
function isClosed(state){return CLOSED_STATES.some(x=>normalize(state).includes(x));}
function extractSAP(ticket){const m=(ticket.short_description||'').match(/(\d{8,10})/);return m?m[1]:null;}
async function getHotspotTickets(){const auth=Buffer.from(`${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`).toString('base64');const response=await axios({method:'GET',url:`${process.env.SNOW_INSTANCE}/api/now/table/incident`,headers:{Authorization:`Basic ${auth}`,Accept:'application/json'},params:{sysparm_query:`active=true^assignment_groupIN${GROUPS.join(',')}^ORDERBYDESCsys_created_on`,sysparm_limit:10000,sysparm_display_value:true,sysparm_fields:'assignment_group,assigned_to,number,sys_id,short_description,description,state,assignment_group,assigned_to,priority,sys_created_on,sys_updated_on,opened_at,category,subcategory,u_subcategory3,u_subcategory4,caller_id,cmdb_ci'}});
return {result:(response.data?.result||[]).map(t=>({...t,sap:extractSAP(t),isClosed:isClosed(t.state)}))};}
async function getHistoricalHotspotTickets(){

    const auth =
        Buffer.from(
            `${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`
        ).toString('base64');

    const response =
        await axios({

            method:'GET',

            url:
`${process.env.SNOW_INSTANCE}/api/now/table/incident`,

            headers:{
                Authorization:`Basic ${auth}`,
                Accept:'application/json'
            },

            params:{

                sysparm_query:
'assignment_group=3749290f1b595610a0db53111b4bcb13^ORassignment_group=504e74213b969290f8624147f4e45af9^ORDERBYDESCsys_created_on',

                sysparm_limit:10000,

                sysparm_display_value:true,

                sysparm_fields:
'assignment_group,assigned_to,number,sys_id,short_description,description,state,priority,sys_created_on,sys_updated_on,opened_at,closed_at,category,subcategory,u_level_3,caller_id,cmdb_ci,close_code,close_notes'

            }

        });
console.log(
    'TOTAL HOTSPOT:',
    response.data?.result?.length
);
    return {

        result:
            (response.data?.result || [])
            .map(t => ({
                ...t,
                sap: extractSAP(t),
                isClosed: isClosed(t.state)
            }))

    };

}
async function getTicketActivity(sysId){

    const auth =
        Buffer.from(
            `${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`
        ).toString('base64');

  const response =
    await axios({

        method: 'GET',

        url:
`${process.env.SNOW_INSTANCE}/api/now/table/incident/${sysId}`,

        headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/json'
        },

        params: {
    sysparm_display_value: true,
    sysparm_fields:
'number,state,assignment_group,assigned_to,comments_and_work_notes,comments,work_notes,close_notes,close_code,cause,hold_reason'
}

    });


  
        console.log('STATUS:', response.status);
console.log('CONTENT-TYPE:', response.headers['content-type']);
console.log('DATA:', response.data);
    return response.data;

}
async function getTicketAttachments(sysId){

    const auth =
        Buffer.from(
            `${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`
        ).toString('base64');

    const response =
        await axios({

            method: 'GET',

            url:
`${process.env.SNOW_INSTANCE}/api/now/table/sys_attachment`,

            headers: {
                Authorization: `Basic ${auth}`,
                Accept: 'application/json'
            },

            params: {

                sysparm_query:
                    `table_name=incident^table_sys_id=${sysId}`,

                sysparm_limit: 100

            }

        });

    return response.data;

}
async function getAttachmentFile(sysId){

    const auth =
        Buffer.from(
            `${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`
        ).toString('base64');

    const response =
        await axios({

            method: 'GET',

            url:
`${process.env.SNOW_INSTANCE}/api/now/attachment/${sysId}/file`,

            responseType: 'arraybuffer',

            headers: {
                Authorization: `Basic ${auth}`,
                Accept: '*/*'
            }

        });

    return response;

}

module.exports = {
    getHotspotTickets,
    getHistoricalHotspotTickets,
    getTicketActivity,
    getTicketAttachments,
    getAttachmentFile,
    isClosed,
    extractSAP
};