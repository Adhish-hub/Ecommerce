const User = require("../models/User");

const Session = require("../models/Session");

const bcrypt = require("bcrypt");

const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");

const hashToken = require("../utils/hashToken");

const ApiError = require("../utils/ApiError");

const { generateOtp, hashOtp } = require("../utils/otp");

const generateResetToken = require("../utils/generateResetToken");

const registerUser = async ( name, email, password ) => {

    const existingUser = await User.findOne({ email });

    if(existingUser){
        throw new ApiError(
            400,
            "User already exists."
        );
    }

    const hashedPassword = await bcrypt.hash( password, 10 );

    const user = await User.create({

        name,
        email,
        password: hashedPassword,
        role: "customer",
    });

    return user;
}; 



const loginUser = async (email, password, sessionInfo = {}) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password.");
  }

  // const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken();

  const refreshTokenHash = hashToken(refreshToken);

  // user.refreshTokenHash = refreshTokenHash;

  // user.refreshTokenExpiresAt = new Date(
  //     Date.now() + 7 * 24 * 60 * 60 * 1000
  // );

  // await user.save();

  // await Session.create({
  //     user: user._id,
  //     refreshTokenHash,
  //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  // });

  // await Session.create({
  //   user: user._id,
  //   refreshTokenHash,
  //   expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  //   userAgent: sessionInfo.userAgent || null,
  //   ipAddress: sessionInfo.ipAddress || null,
  // });

  const session = await Session.create({
    user: user._id,
    refreshTokenHash,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: sessionInfo.userAgent || null,
    ipAddress: sessionInfo.ipAddress || null,
  });

  // Maximum number of active sessions allowed
  const MAX_SESSIONS = 5;

  const activeSessions = await Session.find({
    user: user._id,
    expiresAt: {
      $gt: new Date(),
    },
  })
    .sort({ createdAt: 1 })
    .select("_id");

  // Remove oldest sessions if limit is exceeded
  if (activeSessions.length > MAX_SESSIONS) {
    const sessionsToDelete = activeSessions.slice(
      0,
      activeSessions.length - MAX_SESSIONS,
    );

    await Session.deleteMany({
      _id: {
        $in: sessionsToDelete.map((session) => session._id),
      },
    });
  }

  const accessToken = generateAccessToken(user, session._id);

  //the code below will return everything the comntroller needs.
  return {
    user,
    accessToken,
    refreshToken,
  };
};;

const forgotPassword = async (email) => {
    const user = await User.findOne({ email });

    if(!user){
        throw new ApiError(
            404,
            "User not found."
        );
    }

    const otp = generateOtp();

    const otpHash = hashOtp(otp);

    user.resetPasswordOtpHash = otpHash;

    user.resetPasswordOtpExpiresAt = new Date(
        Date.now() + 10 * 60 * 1000
    );

    user.resetPasswordOtpAttempts = 0;

    await user.save();

    return { user, otp };
};


const verifyPasswordResetOtp = async (email, otp) => {
    const user = await User.findOne({ email });

    if(!user){
        throw new ApiError(
            400,
            "Invalid or expired OTP."
        );
    }

    if(
        !user.resetPasswordOtpHash ||
        !user.resetPasswordOtpExpiresAt
    ){
        throw new ApiError(
            400,
            "Invalid or expired OTP."
        );
    }

    if(user.resetPasswordOtpExpiresAt < new Date()){
        throw new ApiError(
            400,
            "Expired OTP."
        );
    }

    if (user.resetPasswordOtpAttempts >= 5) {
      throw new ApiError(
        429,
        "Too many OTP attempts. Please request a new OTP.",
      );
    }

    const otpHash = hashOtp(otp);

    if(otpHash !== user.resetPasswordOtpHash){
         user.resetPasswordOtpAttempts += 1;

        await user.save();

        throw new ApiError(
            400,
            "Invalid OTP."
        );

    }

    const resetToken = generateResetToken();

    const resetTokenHash = hashToken(resetToken);

    user.passwordResetTokenHash = resetTokenHash;

    user.passwordResetTokenExpiresAt = new Date(
        Date.now() + 10 * 60 * 1000
    );

    user.resetPasswordOtpHash = null;

    user.resetPasswordOtpExpiresAt = null;

    user.resetPasswordOtpAttempts = 0;

    await user.save()

    return resetToken;
};

const resetPassword = async (resetToken, newPassword) => {
  const resetTokenHash = hashToken(resetToken);

  const user = await User.findOne({
    passwordResetTokenHash: resetTokenHash,
    passwordResetTokenExpiresAt: {
      $gt: new Date(),
    },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired token.");
  }

  if (
    !user.passwordResetTokenExpiresAt ||
    user.passwordResetTokenExpiresAt < new Date()
  ) {
    throw new ApiError(400, "Invalid or expired token.");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;

  // Consume the reset token
  user.passwordResetTokenHash = null;
  user.passwordResetTokenExpiresAt = null;

  user.resetPasswordOtpHash = null;
  user.resetPasswordOtpExpiresAt = null;
  user.resetPasswordOtpAttempts = 0;

  // Invalidate all existing sessions
  await Session.deleteMany({
    user: user._id,
  });

  await user.save();

  return user;
};

module.exports = { loginUser, registerUser, forgotPassword, verifyPasswordResetOtp, resetPassword };