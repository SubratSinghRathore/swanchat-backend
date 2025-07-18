import authMiddleware from "../../middleware/auth.middleware.js";
import cloudinary from "../../utils/cloudinary.config.js";
import express from 'express';
const router = express();

// middleware implementation remaining
// generating one time signature for cloudinary
router.get('/signature', async (req, res) => {
    try {
        const folderTo = req.query.folder;
        const folder = folderTo;
        const timestamp = Math.round(new Date().getTime() / 1000);
        if (folder === "post") {
            const signature = cloudinary.utils.api_sign_request({
                timestamp, folder
            }, cloudinary.config().api_secret);

            return res.status(200).json({
                info: {
                    timestamp,
                    signature,
                    folder,
                    apiKey: cloudinary.config().api_key,
                    cloudName: cloudinary.config().cloud_name,
                }
            });
        } else if (folder === "profile") {
            const signature = cloudinary.utils.api_sign_request({
                timestamp, folder
            }, cloudinary.config().api_secret);

            return res.status(200).json({
                info: {
                    timestamp,
                    signature,
                    folder,
                    apiKey: cloudinary.config().api_key,
                    cloudName: cloudinary.config().cloud_name,
                }
            });
        } else {
            return res.status(400).json({ message: "invalid or client error" });
        }

    } catch (error) {
        console.log('error in getting cloudinary signature', error);
        return res.status(500).json({ message: 'internal server error' });
    }

});

export default router;