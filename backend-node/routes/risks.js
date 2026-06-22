const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/analysis', async (req, res) => {
    try {
        const filters = {
            riskLevel: req.query.riskLevel,
            status: req.query.status,
            scope: req.query.scope
        };
        const forceRefresh = req.query.forceRefresh === '1' || req.query.forceRefresh === 'true';
        const analysis = await dataService.getRiskCenterAnalysis(filters, { forceRefresh });
        res.json({ success: true, data: analysis, metadata: analysis.metadata });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const risks = await dataService.getRisks();
        res.json({ success: true, data: risks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
