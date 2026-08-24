const express = require('express');
const router = express.Router();
const {
    getHotspotTickets
} = require('../services/serviceNowService');

router.get('/api/hotspot', async (req, res) => {
    try {
        res.json(await getHotspotTickets());
    } catch (e) {
        console.log('ERROR COMPLETO:', e.response?.data || e);

        res.status(500).json({
            error: e.message,
            detail: e.response?.data || null
        });
    }
});
module.exports = router;