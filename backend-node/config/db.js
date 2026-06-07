const mysql = require('mysql2');
require('dotenv').config(); 

const pool = mysql.createPool({
  host: 'localhost',         
  user: 'root',              
  password: '123456',
  database: 'supply_chain_bi',
  waitForConnections: true,
  connectionLimit: 10,       
  queueLimit: 0
});

const promisePool = pool.promise();

console.log('MySQL 数据库连接池初始化成功！[库名: supply_chain_bi]');

module.exports = promisePool;