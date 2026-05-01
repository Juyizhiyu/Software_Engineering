const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/snapshot', async (req, res) => {
    try {
        const snapshot = await dataService.getOperationsSnapshot();
        res.json({ success: true, data: snapshot });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
