const mysql = require('mysql2/promise');
require('dotenv').config();

const hasDatabaseConfig = Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
const pool = hasDatabaseConfig ? mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    namedPlaceholders: true
}) : null;

async function query(sql, params = {}) {
    if (!pool) throw new Error('MySQL is not configured. Copy .env.example to .env and set DB_* variables.');
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function transaction(work) {
    if (!pool) throw new Error('MySQL is not configured.');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const result = await work(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = { hasDatabaseConfig, pool, query, transaction };
