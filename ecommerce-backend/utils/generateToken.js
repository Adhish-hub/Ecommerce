// const jwt = require("jsonwebtoken");

// const generateToken = (res, user) => {
//     const token = jwt.sign(
//         {
//             id: user._id,
//             email: user.email,
//         },
//         process.env.JWT_SECRET,
//         {
//             expiresIn: process.env.JWT_EXPIRES_IN,
//         }
//     );

//     const cookieOptions = {
//         httpOnly: true,
//         expires: new Date(
//             Date.now() + 7 * 24 * 60 * 60 * 1000
//         ),

//         secure: process.env.NODE_ENV === "production",
//         sameSite: "strict",
//     };

//     res.cookie("token", token, cookieOptions);

//     return token;
// };

// module.exports = generateToken;

const jwt = require("jsonwebtoken");

const crypto = require("crypto");

const generateAccessToken = (user, sessionId) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            role: user.role,
            sessionId,
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "15m",
        }
    );
};

const generateRefreshToken = () => {
    return crypto.randomBytes(64).toString("hex");
};

module.exports = { generateAccessToken, generateRefreshToken };