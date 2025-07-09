import express, { response } from "express";
import axios from 'axios';
import qs from 'qs';
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

        console.log(userInfo.data)
    } catch (error) {
        return res.status(400).json({message: 'unauthorize or token expired'})
    }
})

export default router;