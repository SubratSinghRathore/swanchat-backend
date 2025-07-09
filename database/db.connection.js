import dotenv from 'dotenv';
dotenv.config();
import mysql from 'mysql2';

const pool = mysql.createPool({
    host: process.env.MY_SQL_HOST,
    user: process.env.MY_SQL_USER,
    password: process.env.MY_SQL_PASSWORD,
    database: process.env.MY_SQL_DATABASE
}).promise();

console.log('database connected');

export default pool;