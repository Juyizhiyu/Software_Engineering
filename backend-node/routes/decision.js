const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');
const { withMetadata } = require('../services/responseMeta');

router.get('/analysis', async (req, res) => {
    try {
        const filters = {
            region: req.query.region || undefined,
            date: req.query.date || undefined,
            category: req.query.category || undefined,
            riskLevel: req.query.riskLevel || undefined,
            dimension: req.query.dimension || undefined
        };
        const forceRefresh = req.query.forceRefresh === '1' || req.query.forceRefresh === 'true';
        const analysis = await dataService.getDecisionAnalysis(filters, { forceRefresh });
        res.json({
            success: true,
            data: withMetadata(analysis, {
                source: analysis.metadata?.source || 'mixed',
                quality: await dataService.getDataQualitySummary()
            })
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
