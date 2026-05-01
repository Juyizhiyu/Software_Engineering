const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/', async (req, res) => {
    try {
        const risks = await dataService.getRisks();
        res.json({ success: true, data: risks });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
