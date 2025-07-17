import express, { response } from "express";
import pool from "../../database/db.connection.js";
import genToken from "../../utils/set.cookie.js";
import axios from 'axios';
import bcrypt from 'bcryptjs';
import * as z from 'zod';
import qs from 'qs';
import authMiddleware from "../../middleware/auth.middleware.js";
const router = express();

router.use(express.json())

//Signup and Signin by google
router.post('/google', async (req, res) => {
    try {
        const code = req.body.code;

        //appending details to get token from code
        const data = qs.stringify({
            code: code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'https://localhost:5173',
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
                    await genToken(createUser.insertId, genHandle, userInfo.data.name, res);
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

//Verify user by cookie and sending back their data
router.get('/me', authMiddleware, async (req, res) => {
    res.status(200).json({ info: req.user });
});

//Signup by manual way
router.post('/signup', async (req, res) => {

    try {
        //zod validation
        const userZod = z.object({
            user_name: z.string().min(6).max(25),
            user_handle: z.string().min(6).max(25),
            user_email: z.string().email(),
            user_password: z.string().min(8)
        });

        // Retriving data from zod
        const zodData = userZod.safeParse(req.body);

        //checking validation
        if (!zodData.success) {
            return res.status(400).json({ message: zodData.error.message });
        }

        //hashing the password
        const salt = await bcrypt.genSalt(10);
        const hashPassword = await bcrypt.hash(zodData.data.user_password, salt);

        // OTP verification should do here
        // user need to verify OTP in between time period

        //storing user data to database
        try {
            const sql = 'INSERT INTO users(user_name, user_handle, user_email, user_password, provider) values(?, ?, ?, ?, ?)';
            const values = [zodData.data.user_name, zodData.data.user_handle, zodData.data.user_email, hashPassword, 'local'];
            const [newUser] = await pool.query(sql, values);

            if (parseInt(newUser.affectedRows) === 1) {
                //sending cookie token
                await genToken(newUser.insertId, zodData.data.user_handle, zodData.data.user_name, res);
                return res.status(200).json({ message: "cookie set successfully" });
            };
        } catch (error) {
            console.log('error in signup caused in sql query', error);
            return res.status(500).json({ message: 'invalid credentials or internal server error' });
        }
    } catch (error) {
        console.log('error in signup route', error);
        res.status(500).json({ message: 'invalid credentials or internal server error' });
    }

});

//SignIn by manual way
router.post('/login', async (req, res) => {
    try {
        //zod validation
        const userZod = z.object({
            user_handle_or_user_email: z.string(),
            user_password: z.string().min(8)
        });

        // Retriving data from zod
        const zodData = userZod.safeParse(req.body);

        //checking validation
        if (!zodData.success) {
            return res.status(400).json({ message: zodData.error.message });
        }

        // Finding user by email
        try {
            const sql = 'SELECT * FROM users WHERE user_email = ?';
            const values = [zodData.data.user_handle_or_user_email];
            const [foundUser] = await pool.query(sql, values);
            if (foundUser.length > 0) {
                // Looping for password match
                for (var i = 0; i < foundUser.length; i++) {
                    const match = await bcrypt.compare(zodData.data.user_password, foundUser[i].user_password);
                    if (match) {
                        //Sending cookie token
                        genToken(foundUser[i].user_id, foundUser[i].user_handle, foundUser[i].user_name, res);
                        return res.status(200).json({ message: "cookie set successfully" });
                    }
                }
            }
        } catch (error) {
            console.log('error in finding user by email', error);
        }

        //Finding user by handle
        try {
            const sql = 'SELECT * FROM users WHERE user_handle = ?';
            const values = [zodData.data.user_handle_or_user_email];
            const [foundUser] = await pool.query(sql, values);

            if (foundUser.length > 0) {
                const match = await bcrypt.compare(zodData.data.user_password, foundUser[0].user_password);
                if (match) {
                    // Sending cookie token
                    genToken(foundUser[0].user_id, foundUser[0].user_handle, foundUser[0].user_name, res);
                    return res.status(200).json({ message: "cookie set successfully" });
                }
            }
        } catch (error) {
            console.log('error in finding user by handle', error);
        }
        return res.status(400).json({ message: 'Invalid Credentials' });
    } catch (error) {
        console.log('error in login route', error);
    }
});

// Logout route
router.post("/logout", async (req, res) => {
    res.cookie('jwt', '', {
        maxAge: 0,
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        domain: 'swanchat-backend.onrender.com'
    });
    res.status(200).json({ msg: 'logout successfully' });
})

export default router;