const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const dataService = require('../services/dataService');

router.post('/chat', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question || !String(question).trim()) {
            return res.status(400).json({ success: false, message: 'question is required' });
        }

        const normalizedContext = await dataService.loadAll();
        const summary = await dataService.getDashboardSummary();
        const overview = await dataService.getDashboardOverview();

        const result = await aiService.analyzeWithAgent(question, {
            summary,
            overview,
            datasets: normalizedContext
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
