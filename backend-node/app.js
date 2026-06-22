require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const risksRoutes = require('./routes/risks');
const suppliersRoutes = require('./routes/suppliers');
const logisticsRoutes = require('./routes/logistics');
const costsRoutes = require('./routes/costs');
const assistantRoutes = require('./routes/assistant');
const dataRoutes = require('./routes/data');
const operationsRoutes = require('./routes/operations');
const decisionRoutes = require('./routes/decision');
const authRouter = require('./routes/auth');
const aiAnalysisRoutes = require('./routes/aiAnalysis');
const dataService = require('./services/dataService');
const aiService = require('./services/aiService');

const app = express();
const FRONTEND_DIST = path.join(__dirname, '..', 'ui', 'dist');

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/decision', decisionRoutes);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiAnalysisRoutes);

app.get('/api/health', async (req, res) => {
    const [database, ai, dataQuality] = await Promise.all([
        dataService.checkDatabaseHealth(),
        aiService.healthCheck(),
        dataService.getDataQualitySummary()
    ]);

    res.json({
        success: true,
        data: {
            status: 'ok',
            service: 'node-backend',
            port: Number(process.env.PORT || 3000),
            node: { online: true },
            database,
            ai,
            dataQuality,
            metadata: {
                source: database.online ? 'mysql' : 'json',
                updatedAt: new Date().toISOString(),
                fallbackReason: database.online ? null : database.error
            }
        }
    });
});

if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    app.get('/{*path}', (req, res) => {
        if (req.path.startsWith('/api')) return;
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
}

module.exports = app;
