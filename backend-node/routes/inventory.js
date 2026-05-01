const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/analysis', async (req, res) => {
    try {
        const analysis = await dataService.getInventoryAnalysis();
        res.json({ success: true, data: analysis });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
