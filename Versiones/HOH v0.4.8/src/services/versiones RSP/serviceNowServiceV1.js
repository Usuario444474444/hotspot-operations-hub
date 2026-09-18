const axios = require('axios');
require('dotenv').config();

const GROUPS = [
    '504e74213b969290f8624147f4e45af9',
    'f95329bc3bb51610f8624147f4e45adf',
    'b149290f1b595610a0db53111b4bcbcf',
    '5f29a10f1b595610a0db53111b4bcbc9'
];

async function getHotspotTickets() {

    const auth = Buffer.from(
        `${process.env.SNOW_USER}:${process.env.SNOW_PASSWORD}`
    ).toString('base64');

    const query =
        `assignment_groupIN${GROUPS.join(',')}^ORDERBYDESCsys_created_on`;

    const response = await axios({
        method: 'GET',
        url: `${process.env.SNOW_INSTANCE}/api/now/table/incident`,
        headers: {
            Authorization: `Basic ${auth}`,
            Accept: 'application/json'
        },
        params: {
            sysparm_query: query,
            sysparm_limit: 10000,
            sysparm_display_value: true,
            sysparm_fields: 'number,sys_id,short_description,state,assignment_group,assigned_to,sys_created_on,sys_updated_on,opened_at,priority'
        }
    });

    console.log('QUERY:', query);
    console.log('TOTAL:', response.data.result?.length);

    return response.data;
}

module.exports = {
    getHotspotTickets
};