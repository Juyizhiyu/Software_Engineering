const express = require('express');
const router = express.Router();
const dataService = require('../services/dataService');

router.get('/schemas', async (req, res) => {
    try {
        res.json({ success: true, data: dataService.getEntitySchemas() });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/all', async (req, res) => {
    try {
        const data = await dataService.getRawData();
        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

router.get('/:entity', async (req, res) => {
    try {
        const data = await dataService.getEntityData(req.params.entity);
        res.json({ success: true, data });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

router.post('/:entity', async (req, res) => {
    try {
        const record = await dataService.createEntityRecord(req.params.entity, req.body);
        res.status(201).json({ success: true, data: record });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
});

module.exports = router;
