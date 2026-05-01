require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const PORT = process.env.PORT || 3000;

const dashboardRoutes = require('./routes/dashboard');
const inventoryRoutes = require('./routes/inventory');
const risksRoutes = require('./routes/risks');
const suppliersRoutes = require('./routes/suppliers');
const logisticsRoutes = require('./routes/logistics');
const costsRoutes = require('./routes/costs');
const assistantRoutes = require('./routes/assistant');
const dataRoutes = require('./routes/data');
const operationsRoutes = require('./routes/operations');

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/risks', risksRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/costs', costsRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/operations', operationsRoutes);

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
