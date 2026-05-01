const fs = require('fs/promises');
const path = require('path');

const dataDir = path.join(__dirname, '../data');

class JsonRepository {
    constructor(filename) {
        this.filePath = path.join(dataDir, filename);
    }

    async findAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Error reading ${this.filePath}:`, error);
            return [];
        }
    }

    async findById(idField, idValue) {
        const items = await this.findAll();
        return items.find(item => item[idField] === idValue);
    }

    async saveAll(items) {
        const json = `${JSON.stringify(items, null, 2)}\n`;
        await fs.writeFile(this.filePath, json, 'utf-8');
        return items;
    }

    async append(item) {
        const items = await this.findAll();
        items.push(item);
        await this.saveAll(items);
        return item;
    }
}

module.exports = {
    ordersRepo: new JsonRepository('orders.json'),
    inventoryRepo: new JsonRepository('inventory.json'),
    suppliersRepo: new JsonRepository('suppliers.json'),
    logisticsRepo: new JsonRepository('logistics.json'),
    costsRepo: new JsonRepository('costs.json'),
    risksRepo: new JsonRepository('risks.json')
};
