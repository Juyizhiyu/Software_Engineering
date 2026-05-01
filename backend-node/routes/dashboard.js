const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/summary', async (req, res) => {
    try {
        const summary = await dataService.getDashboardSummary();
        res.json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/overview', async (req, res) => {
    try {
        const overview = await dataService.getDashboardOverview();
        res.json({ success: true, data: overview });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
