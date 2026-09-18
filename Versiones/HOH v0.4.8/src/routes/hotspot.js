const express = require('express');
const router = express.Router();

const {
    getHotspotTickets,
    getHistoricalHotspotTickets,
    getTicketActivity,
    getTicketAttachments,
    getAttachmentFile
} = require('../services/serviceNowService');
router.get('/api/hotspot', async (req, res) => {

    try {

        res.json(
            await getHotspotTickets()
        );

    } catch (e) {

        console.log(
            'ERROR COMPLETO:',
            e.response?.data || e
        );

        res.status(500).json({
            error: e.message,
            detail: e.response?.data || null
        });

    }

});

router.get(
    '/api/test-activity',
    async (req, res) => {

        try {

            const data =
                await getTicketActivity(
                    '9a17d1b887934350abfb0d070cbb359c'
                );

            console.log(data);

            res.send(
                typeof data === 'string' ?
                data :
                JSON.stringify(data, null, 2)
            );

        } catch (e) {

            console.log(
                'ERROR ACTIVITY:',
                e.response?.data || e
            );

            res.status(500).json({
                error: e.message,
                detail: e.response?.data || null
            });

        }

    }
);
router.get(
    '/api/ticket/:sysId/activity',
    async (req, res) => {

        try {

            const data =
                await getTicketActivity(
                    req.params.sysId
                );

            res.json(data);

        } catch (e) {

            res.status(500).json({
                error: e.message
            });

        }

    }
);
router.get(
    '/api/hotspot-historico',
    async (req, res) => {

        try {

            const data =
                await getHistoricalHotspotTickets();

            res.json(data);

        } catch (e) {

            console.log(
                'ERROR HISTORICO:',
                e.response?.data || e
            );

            res.status(500).json({
                error: e.message
            });

        }

    }
);
router.get(
    '/api/ticket/:sysId/attachments',
    async (req, res) => {

        try {

            const data =
                await getTicketAttachments(
                    req.params.sysId
                );

            res.json(data);

        } catch (e) {

            res.status(500).json({
                error: e.message
            });

        }

    }
);
router.get(
    '/api/attachment/:sysId',
    async (req, res) => {

        try {

            const file =
                await getAttachmentFile(
                    req.params.sysId
                );

            res.setHeader(
                'Content-Type',
                file.headers['content-type']
            );

            res.send(
                file.data
            );

        } catch(e){

            res.status(500).json({
                error: e.message
            });

        }

    }
);
module.exports = router;