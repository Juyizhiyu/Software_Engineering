const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { withMetadata } = require('../services/responseMeta');

router.get('/snapshot', async (req, res) => {
    try {
        const snapshot = await dataService.getOperationsSnapshot();
        res.json({
            success: true,
            data: withMetadata(snapshot, {
                source: snapshot.metadata?.source || 'mixed',
                quality: await dataService.getDataQualitySummary()
            })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
