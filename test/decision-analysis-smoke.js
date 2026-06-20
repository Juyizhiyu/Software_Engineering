const assert = require('node:assert/strict');
const app = require('../backend-node/app');
const db = require('../backend-node/config/db');

function listen(appInstance) {
    return new Promise(resolve => {
        const server = appInstance.listen(0, () => resolve(server));
    });
}

function close(server) {
    return new Promise((resolve, reject) => {
        server.close(error => (error ? reject(error) : resolve()));
    });
}

async function main() {
    const server = await listen(app);
    const { port } = server.address();

    try {
        const response = await fetch(`http://127.0.0.1:${port}/api/decision/analysis?dimension=overview`);
        const body = await response.json();

        assert.equal(response.status, 200);
        assert.equal(body.success, true);
        assert.ok(Array.isArray(body.data.metrics), 'metrics must be an array');
        assert.ok(body.data.metrics.length > 0, 'metrics should not be empty');
        assert.ok(Array.isArray(body.data.suggestions), 'suggestions must be an array');
        assert.ok(body.data.charts, 'charts must exist');
        assert.ok(Array.isArray(body.data.charts.salesTrend), 'salesTrend must be an array');
        assert.ok(Array.isArray(body.data.charts.riskMatrix), 'riskMatrix must be an array');
        assert.ok(Array.isArray(body.data.charts.costBreakdown), 'costBreakdown must be an array');
        assert.ok(body.data.metadata, 'metadata must exist');
        assert.ok(body.data.metadata.source, 'metadata.source must exist');

        console.log('Decision analysis API smoke test passed.');
    } finally {
        await close(server);
        await db.end();
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
