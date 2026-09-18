const express = require('express');
const router = express.Router();
const fs = require('fs');
const {
    getHistoricalHotspotTickets
} = require(
    '../services/serviceNowService'
);

const FILE = './data/control_folios.json';

function readFolios() {

    try {
        return JSON.parse(
            fs.readFileSync(FILE, 'utf8')
        );
    } catch {
        return [];
    }

}

function saveFolios(data) {

    fs.writeFileSync(
        FILE,
        JSON.stringify(data, null, 2)
    );

}
function detectTipoTicket(t){

    const grupo =
        (
            t.assignment_group?.display_value ||
            ''
        ).toUpperCase();

    if(
        grupo.includes(
            'BLOCK NETWORKS_INTERNET'
        )
    ){
        return 'HOTSPOT';
    }

    if(
        grupo.includes(
            'BLOCK NETWORKS'
        )
    ){
        return 'HOTSPOT';
    }

    if(
        grupo.includes(
            'VENDOR MGNT SUPPORT'
        )
    ){
        return 'VENDOR';
    }

    if(
        grupo.includes(
            'ON SITE SUPPORT'
        )
    ){
        return 'ON_SITE';
    }

    if(
        grupo.includes(
            'OSS'
        )
    ){
        return 'OSS';
    }

    return 'OTROS';

}

router.get('/api/control-folios', (req, res) => {

    res.json(readFolios());

});

router.post('/api/control-folios/sync', (req, res) => {

    const tickets = req.body || [];

    const folios = readFolios();

    tickets.forEach(t => {

        const existente =
            folios.find(
                f => f.number === t.number
            );

        if (existente) {

    existente.estado =
        t.state;

    existente.grupo =
        t.assignment_group?.display_value ||
        '';

    existente.asignado =
        t.assigned_to?.display_value ||
        '';

    existente.sys_updated_on =
    t.sys_updated_on;

existente.ultimaVezVisto =
    new Date().toISOString();

const estado =
    String(t.state || '')
    .toLowerCase();

existente.activo = !(
    estado.includes('resuelto') ||
    estado.includes('cerrado') ||
    estado.includes('cancelado')
);

}

         else {

            folios.push({

    number: t.number,

    sap: t.sap || '',

    estado: t.state,

    grupo:
        t.assignment_group?.display_value ||
        '',

    asignado:
        t.assigned_to?.display_value ||
        '',

    sys_created_on:
        t.sys_created_on,

    sys_updated_on:
        t.sys_updated_on,

    primeraVezVisto:
        new Date().toISOString(),

    ultimaVezVisto:
        new Date().toISOString(),

    activo: !(

    String(t.state || '')
        .toLowerCase()
        .includes('resuelto')

    ||

    String(t.state || '')
        .toLowerCase()
        .includes('cerrado')

    ||

    String(t.state || '')
        .toLowerCase()
        .includes('cancelado')

)

});

        }

    });
    saveFolios(folios);

    res.json({
        ok: true,
        total: folios.length
    });

});
router.post(
    '/api/control-folios/load-history',
    async (req, res) => {

        try {

            const data =
                await getHistoricalHotspotTickets();

            const tickets =
                data.result || [];

            saveFolios(
    tickets.map(t => ({

        tipo:
            detectTipoTicket(t),

        number:
            t.number,

        sap:
            t.sap || '',

        short_description:
            t.short_description || '',

        description:
            t.description || '',

        estado:
            t.state,

        grupo:
            t.assignment_group?.display_value || '',

        asignado:
            t.assigned_to?.display_value || '',

        categoria:
            t.category || '',

        subcategoria:
            t.subcategory || '',

        nivel3:
            t.u_level_3 || '',
            close_code:
    t.close_code || '',

close_notes:
    t.close_notes || '',

        sys_created_on:
            t.sys_created_on,

        sys_updated_on:
            t.sys_updated_on,

        activo:
            !t.isClosed

    }))
);

            res.json({
                ok: true,
                registros:
                    tickets.length
            });

        } catch (e) {

            console.log(
                'ERROR HISTORICO:',
                e
            );

            res.status(500).json({
                error: e.message
            });

        }

    }
);

module.exports = router;