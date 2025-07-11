import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import pool from '../database/db.connection.js';

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        } else {
            const decoded = jwt.verify(token, process.env.JWT_TOKEN_PASSWORD);
            const sqlForAuthentication = 'SELECT user_id, user_handle, user_name, user_email, user_profile FROM users WHERE user_id = ? AND user_handle = ? AND user_name = ?';
            const valuesForAuthentication = [decoded.user_id, decoded.user_handle, decoded.user_name];
            const [userDetailsMatch] = await pool.query(sqlForAuthentication, valuesForAuthentication);
            if (userDetailsMatch === 0) {
                return res.status(401).json({
                    msg: 'unotrized : user not found or invalid cookie'
                })
            } else {
                req.user = userDetailsMatch[0];
                next();
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            msg: "unauthorize user invalid or server error"
        });
    }
}

export default authMiddleware;