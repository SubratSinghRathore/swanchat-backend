import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const genToken = async (user_id, user_handle, user_name, res) => {
    const token = jwt.sign({ user_id, user_handle, user_name }, process.env.JWT_TOKEN_PASSWORD, { expiresIn: '7d' });
    res.cookie('jwt', token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        // domain: 'swan-backend.onrender.com'
    })
}

export default genToken;
