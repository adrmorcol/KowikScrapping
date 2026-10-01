import mysql from 'mysql2/promise';
import { config } from './config.js';

// Pool de conexiones: mantiene varias abiertas y las reparte entre las peticiones
export const db = mysql.createPool({
  ...config.db,
  connectionLimit: 10,
});
