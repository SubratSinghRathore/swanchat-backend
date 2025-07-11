import express, { response } from "express";
import pool from "../../database/db.connection.js";
import genToken from "../../utils/set.cookie.js";
import axios from 'axios';
import qs from 'qs';
import authMiddleware from "../../middleware/auth.middleware.js";
const router = express();

router.use(express.json())
router.post('/google', async (req, res) => {
    try {
        const code = req.body.code;

        //appending details to get token from code
        const data = qs.stringify({
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'http://localhost:5173',
            grant_type: 'authorization_code'
        })

        //fetching token
        const token = await axios.post('https://oauth2.googleapis.com/token', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })

        // fetching user info from access token
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                'Authorization': `Bearer ${token.data.access_token}`
            }
        })

        //checking user in database
        try {
            const sql = 'SELECT user_id, user_name, user_handle, user_email, provider, google_id, user_profile FROM users WHERE user_email = ? AND provider = ? AND google_id = ?';
            const values = [userInfo.data.email, 'google', userInfo.data.id]
            const [sqlData] = await pool.query(sql, values);

            //if user existst generate and send cookie to user
            if (sqlData.length !== 0) {
                genToken(sqlData[0].user_id, sqlData[0].user_handle, sqlData[0].user_name, res);
                return res.status(200).json({ message: "cookie set successfully" });
            }

            else {
                //creating new handle
                const random = Math.floor(1000 + Math.random() * 9000);
                const genHandle = userInfo.data.given_name + random;

                try {
                    //if user did not exists create new user
                    const sqlToCreateUser = 'INSERT INTO users(user_name, user_handle, user_email, provider, google_id, user_Profile) values (?, ?, ?, ?, ?, ?)';
                    const valuesToCreateUser = [userInfo.data.name, genHandle, userInfo.data.email, 'google', userInfo.data.id, userInfo.data.picture];
                    const [createUser] = await pool.query(sqlToCreateUser, valuesToCreateUser);

                    //sending cookie token
                    genToken(createUser.insertId, genHandle, userInfo.data.name, res);
                    return res.status(200).json({ message: "cookie set successfully" });
                } catch (error) {
                    console.log('error in creating user from google OAuth2.O', error);
                }
            }
        } catch (error) {
            console.log('error in fetchig user info for google OAuth2.O', error)
        }



    } catch (error) {
        return res.status(400).json({ message: 'unauthorize or token expired' })
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    res.status(200).json({info: req.user});
});

export default router;