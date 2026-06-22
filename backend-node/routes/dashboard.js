const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { withMetadata } = require('../services/responseMeta');

router.get('/summary', async (req, res) => {
    try {
        const { region, date, category } = req.query;
        
        const summary = await dataService.getDashboardSummary({ region, date, category });
        
        res.json({
            success: true,
            data: withMetadata(summary, {
                source: summary.metadata?.source || 'mixed',
                filters: { region: region || null, date: date || null, category: category || null },
                quality: await dataService.getDataQualitySummary()
            })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/overview', async (req, res) => {
    try {
        const overview = await dataService.getDashboardOverview();
        res.json({
            success: true,
            data: withMetadata(overview, {
                source: overview.metadata?.source || 'mixed',
                quality: await dataService.getDataQualitySummary()
            })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
