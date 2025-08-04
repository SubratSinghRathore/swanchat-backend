import express from "express";
import * as z from "zod";
import pool from "../../database/db.connection.js";
import authMiddleware from "../../middleware/auth.middleware.js";
const router = express();

router.post('/image', authMiddleware, async (req, res) => {
    try {
        //Extracting user data from user request
        const origin = req.user;

        //Zod validation schema
        const zodSchema = z.object({
            post_uri: z.string().url()
        });

        //Zod validation
        const zodData = zodSchema.safeParse(req.body)

        if (!zodData.success) {
            return res.status(400).json({ message: zodData.error.message })
        }

        //Storing post on database
        const sql = 'INSERT INTO posts(post_url, post_origin) VALUES(?, ?)';
        const values = [zodData.data.post_uri, origin.user_id];
        const [postResp] = await pool.query(sql, values);

        //Sending success response back
        if (postResp.affectedRows === 1) {
            return res.status(200).json({ message: "post saved successfully"});
        }
        else {
            return res.status(500).json({ message: "Internal server error"});
        }
    } catch (error) {
        console.log("error in storing post on database", error);
        return res.status(500).json({ message: "Internal server error" });
    }
});

export default router;