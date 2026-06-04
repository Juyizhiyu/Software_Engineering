require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;
const FRONTEND_DIST = path.join(__dirname, '..', 'frontend', 'dist');

const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const risksRoutes = require('./routes/risks');
const suppliersRoutes = require('./routes/suppliers');
const logisticsRoutes = require('./routes/logistics');
const costsRoutes = require('./routes/costs');
const assistantRoutes = require('./routes/assistant');
const dataRoutes = require('./routes/data');
const operationsRoutes = require('./routes/operations');
const authRouter = require('./routes/auth');
const aiAnalysisRoutes = require('./routes/aiAnalysis');

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/auth', authRouter);
app.use('/api/ai', aiAnalysisRoutes);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'ok',
            service: 'node-backend',
            port: Number(PORT)
        }
    });
});

// ---- 前端静态文件（生产构建） ----
const fs = require('fs');
if (fs.existsSync(FRONTEND_DIST)) {
    app.use(express.static(FRONTEND_DIST));
    // SPA fallback: 所有非 /api 路由返回 index.html
    app.get('/{*path}', (req, res) => {
        if (req.path.startsWith('/api')) return;
        res.sendFile(path.join(FRONTEND_DIST, 'index.html'));
    });
    console.log(`Frontend static files served from: ${FRONTEND_DIST}`);
} else {
    console.warn(`WARNING: Frontend dist not found at ${FRONTEND_DIST}`);
    console.warn(`Run 'cd frontend && npm run build' to build the frontend.`);
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
