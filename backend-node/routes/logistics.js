const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/anomalies', async (req, res) => {
    try {
        const anomalies = await dataService.getLogisticsAnomalies();
        res.json({ success: true, data: anomalies });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
