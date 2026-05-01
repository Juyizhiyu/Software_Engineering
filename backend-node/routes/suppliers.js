const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/performance', async (req, res) => {
    try {
        const suppliers = await dataService.getSuppliersPerformance();
        res.json({ success: true, data: suppliers });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
