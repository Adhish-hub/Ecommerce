const jwt = require("jsonwebtoken")

const User = require("../models/User");

const Session = require("../models/Session");

const asyncHandler = require("./asyncHandler");

const ApiError = require("../utils/ApiError");

const protect = asyncHandler(async (req, res, next) => {
  
        const token = req.cookies.accessToken;

        if(!token){
            
            throw new ApiError(
                401,
                "Authentication required."
            );
        }

        // const decoded = jwt.verify(
        //     token,
        //     process.env.JWT_SECRET
        // );
        let decoded;

        try{
            decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );
        }catch(error){
            throw new ApiError(
                401,
                "Invalid or expired token."
            );
        }
0
        if (!decoded.sessionId) {
            throw new ApiError(401, "Invalid session.");
        }

        const session = await Session.findOne({
           _id: decoded.sessionId,
           user: decoded.id,
           expiresAt: { $gt: new Date() },
        });

        if (!session) {
          throw new ApiError(
            401,
            "Session expired or revoked. Please login again.",
          );
        }

        const user = await User.findById(decoded.id).select("-password");

        if(!user){
            
            throw new ApiError(
                401,
                "User no longer exists."
            )
        }

        req.user = user;
        req.session = session;

        next();
   
});

module.exports = { protect };

//Why is there still a small try/catch?

//Because jwt.verify() throws a JWT-specific error.

//We want to convert that error into our application's ApiError.