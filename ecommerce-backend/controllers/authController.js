const User = require("../models/User");

const Session = require("../models/Session");

const jwt = require("jsonwebtoken");

const logger = require("../config/logger");

const emailQueue = require("../queues/emailQueue");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");

const setAuthCookies = require("../utils/setAuthCookies");

const asyncHandler = require("../middlewares/asyncHandler");

const ApiError = require("../utils/ApiError");

const hashToken = require("../utils/hashToken");

const { loginUser, registerUser, forgotPassword, verifyPasswordResetOtp, resetPassword } = require("../services/authService");

const sendResponse = require("../utils/sendResponse");
const emailWorker = require("../workers/emailWorker");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const user = await registerUser(name, email, password);

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  sendResponse(res, 201, "User created successfully.", userResponse);
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await loginUser(
    email,
    password,
    {
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    }
  );

  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };

  setAuthCookies(res, accessToken, refreshToken);

  sendResponse(res, 200, "Login successful.", userResponse);
});

// const refreshAccessToken = asyncHandler(async (req, res) => {
//   const refreshToken = req.cookies.refreshToken;

//   if (!refreshToken) {
//     throw new ApiError(401, "Refresh token not found.");
//   }

//   const refreshTokenHash = hashToken(refreshToken);

//   const user = await User.findOne({
//     refreshTokenHash,
//   });

//   // Refresh token does not match the currently active token.
//   // This can indicate that an old/stolen refresh token is being reused.
//   if (!user) {
//     res.clearCookie("accessToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     throw new ApiError(401, "Invalid refresh token. Please login again.");
//   }

//   // Check expiration
//   if (!user.refreshTokenExpiresAt || user.refreshTokenExpiresAt < new Date()) {
//     user.refreshTokenHash = undefined;
//     user.refreshTokenExpiresAt = undefined;

//     await user.save();

//     res.clearCookie("accessToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     res.clearCookie("refreshToken", {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     throw new ApiError(401, "Refresh token expired. Please login again.");
//   }

//   // Generate new tokens
//   const newAccessToken = generateAccessToken(user);
//   const newRefreshToken = generateRefreshToken();

//   const newRefreshTokenHash = hashToken(newRefreshToken);

//   // Rotate refresh token
//   user.refreshTokenHash = newRefreshTokenHash;

//   user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

//   await user.save();

//   // Set new cookies
//   setAuthCookies(res, newAccessToken, newRefreshToken);

//   sendResponse(res, 200, "Access token refreshed successfully.");
// });

const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new ApiError(401, "Refresh token not found.");
  }

  const refreshTokenHash = hashToken(refreshToken);

  const session = await Session.findOne({
    refreshTokenHash,
  });

  // Refresh token does not match any active session.
  if (!session) {
    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    throw new ApiError(401, "Invalid refresh token. Please login again.");
  }

  // Check session expiration
  if (session.expiresAt < new Date()) {
    await Session.findByIdAndDelete(session._id);

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    throw new ApiError(401, "Refresh token expired. Please login again.");
  }

  // Find the user belonging to this session
  const user = await User.findById(session.user);

  if (!user) {
    await Session.findByIdAndDelete(session._id);

    throw new ApiError(
      401,
      "User associated with this session no longer exists.",
    );
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken(user, session._id);

  const newRefreshToken = generateRefreshToken();

  const newRefreshTokenHash = hashToken(newRefreshToken);

  // Rotate refresh token for this session
  session.refreshTokenHash = newRefreshTokenHash;

  session.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await session.save();

  // Set new cookies
  setAuthCookies(res, newAccessToken, newRefreshToken);

  sendResponse(res, 200, "Access token refreshed successfully.");
});

// const logout = asyncHandler(async(req, res) => {
//     const refreshToken = req.cookies.refreshToken;

//     if(refreshToken){
//         const refreshTokenHash = hashToken(refreshToken);

//         await User.findOneAndUpdate(
//             {
//                 refreshTokenHash
//             },
//             {
//                 $unset: {
//                     refreshTokenHash: 1,
//                     refreshTokenExpiresAt: 1
//                 }
//             }
//         );

//         res.clearCookie("accessToken", {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "strict",
//         });

//         res.clearCookie("refreshToken", {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             sameSite: "strict",
//         });

//         sendResponse(res, 200, "Logout successful.");
//     }
// });

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    const refreshTokenHash = hashToken(refreshToken);

    await Session.findOneAndDelete({
      refreshTokenHash,
    });
  }

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  sendResponse(res, 200, "Logout successful.");
});


const forgotPasswordController = asyncHandler( async (req, res) => {
    const { email } = req.body;

    // const { otp } = await forgotPassword(email);

    // console.log(`Password reset otp for ${email}: ${otp}:`);

    const { otp } = await forgotPassword(email); 

    // if(process.env.NODE_ENV !== "production"){
    //   logger.debug(`Password reset OTP for ${email}: ${otp}`);
    // }else{
    //   logger.info(`Password reset OTP generated for ${email}`);
    // }

    await emailQueue.add("password-reset-otp", {
      type: "password-reset-otp",
      email,
      otp,
    });

    sendResponse(
        res,
        200,
        "If an account exists with this email, an OTP has been sent."
    );
    
});


const verifyPasswordResetOtpController = asyncHandler ( async (req, res) => {
    const { email, otp } = req.body;

    const resetToken = await verifyPasswordResetOtp(email, otp);

    sendResponse(
        res,
        200,
        "OTP verified successfully",
        {
          resetToken
        }
    );
});



const resetPasswordController = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  await resetPassword(resetToken, newPassword);

  sendResponse(res, 200, "Password reset successfully.");
});


const getMySessions = asyncHandler(async (req, res) => {
  const sessions = await Session.find({
    user: req.user._id,
    expiresAt: { $gt: new Date() },
  })
    .select("-refreshTokenHash")
    .sort({ createdAt: -1 });

  const sessionsWithCurrentStatus = sessions.map((session) => ({
    _id: session._id,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    current: session._id.toString() === req.session._id.toString(),
  }));  

  sendResponse(res, 200, "Sessions retrieved successfully.", sessionsWithCurrentStatus);
});


const revokeSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await Session.findOne({
    _id: sessionId,
    user: req.user._id,
  });

  if (!session) {
    throw new ApiError(404, "Session not found.");
  }

  if (session._id.toString() === req.session._id.toString()) {
    throw new ApiError(
      400,
      "You cannot revoke your current session. Use logout instead.",
    );
  }

  await Session.findByIdAndDelete(session._id);

  sendResponse(res, 200, "Session revoked successfully.");
});


const revokeOtherSessions = asyncHandler(async (req, res) => {
  const currentSessionId = req.session._id;

  // if (!currentSessionId) {
  //   throw new ApiError(400, "Current session could not be identified.");
  // }

  await Session.deleteMany({
    user: req.user._id,
    _id: { $ne: currentSessionId },
  });

  sendResponse(res, 200, "All other sessions revoked successfully.");
});


const getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, "Current user retrieved successfully.", req.user);
});


module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPasswordController,
  verifyPasswordResetOtpController,
  resetPasswordController,
  getMySessions,
  revokeSession,
  revokeOtherSessions,
  getMe 
};
