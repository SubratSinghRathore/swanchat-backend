import express from "express";
import cors from 'cors';
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import auth from './router/authentication/auth.js';
import pool from "./database/db.connection.js";

dotenv.config();
const PORT = process.env.PORT || 8000;
const app = express();
app.use(cookieParser());
app.use(express.json({limit: '10mb'}));
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Custom-Header'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.use('/auth', auth);

app.listen(PORT, () => console.log('listening on port', PORT))
