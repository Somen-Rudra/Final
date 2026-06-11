import sendMail from "../config/sendMail.js";
import TryCatch from "../middlewares/TryCatch.js";
import sanitize from "mongo-sanitize";
import User from "../models/userModel.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { loginSchema, registerSchema } from "../config/zod.js";
import { getOtpHtml, getVerifyEmailHtml } from "../config/html.js";
import { getRedis } from "../config/db.js";
import {
  generateAccessToken,
  generateToken,
  revokeRefreshToken,
  verifyRefreshToken,
} from "../config/generateToken.js";

export const registerUser = TryCatch(async (req, res) => {
  const sanitizeBody = sanitize(req.body);

  const validation = registerSchema.safeParse(sanitizeBody);

  if (!validation.success) {
    const zodError = validation.error;

    let firstErrorMessage = "Validation Error";
    let allErrors = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation Error",
        code: issue.code,
      }));
      firstErrorMessage = allErrors[0]?.message || "Validation Error";
    }
    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      error: allErrors,
    });
  }

  const { name, email, password } = validation.data;

  const redis = getRedis();

  const rateLimitKey = `register-rate-limit:${req.ip}:${email}`;

  if (await redis.get(rateLimitKey)) {
    return res.status(429).json({
      success: false,
      message: "Too many requests, try again later",
    });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "User already exists" });
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const verifyToken = crypto.randomBytes(32).toString("hex");

  const verifyKey = `verify:${verifyToken}`;

  const dataToStore = JSON.stringify({
    name,
    email,
    password: hashedPassword,
  });

  await redis.set(verifyKey, dataToStore, { EX: 300 });

  const subject = "Verify your email for Account Creation";
  const html = getVerifyEmailHtml({ email, token: verifyToken });

  await sendMail({ email, subject, html });

  await redis.set(rateLimitKey, "true", { EX: 60 });

  res.json({
    success: true,
    message: "A verification link have been sent.It will expire in 5 minutes",
  });
});

export const verifyUser = TryCatch(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    return res
      .status(400)
      .json({ success: false, message: "Verification token is required" });
  }

  const verifyKey = `verify:${token}`;
  const redis = getRedis();

  const userDataJson = await redis.get(verifyKey);
  if (!userDataJson) {
    return res.status(400).json({
      success: false,
      message: "Verification Link is expired.",
    });
  }

  await redis.del(verifyKey);

  const userData = JSON.parse(userDataJson);

  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: "User already exists",
    });
  }

  const newUser = await User.create({
    name: userData.name,
    email: userData.email,
    password: userData.password,
  });

  res.status(201).json({
    success: true,
    message: "Email verified successfully! your account has been created",
    user: { _id: newUser._id, name: newUser.name, email: newUser.email },
  });
});

export const loginUser = TryCatch(async (req, res) => {
  const sanitizeBody = sanitize(req.body);

  const validation = loginSchema.safeParse(sanitizeBody);

  if (!validation.success) {
    const zodError = validation.error;

    let firstErrorMessage = "Validation Error";
    let allErrors = [];

    if (zodError?.issues && Array.isArray(zodError.issues)) {
      allErrors = zodError.issues.map((issue) => ({
        field: issue.path ? issue.path.join(".") : "unknown",
        message: issue.message || "Validation Error",
        code: issue.code,
      }));
      firstErrorMessage = allErrors[0]?.message || "Validation Error";
    }
    return res.status(400).json({
      success: false,
      message: firstErrorMessage,
      error: allErrors,
    });
  }

  const { email, password } = validation.data;

  const redis = getRedis();
  const rateLimitKey = `login-rate-limit:${req.ip}:${email}`;

  if (await redis.get(rateLimitKey)) {
    return res.status(429).json({
      success: false,
      message: "Too many requests, try again later",
    });
  }

  const user = await User.findOne({ email }).select("password");
  if (!user) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Credentials" });
  }

  const comparePassword = await bcrypt.compare(password, user.password);
  if (!comparePassword) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid Credentials" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpKey = `otp:${email}`;
  await redis.set(otpKey, JSON.stringify(otp), { EX: 300 });

  const subject = "Otp for verification";

  const html = getOtpHtml({ email, otp });

  await sendMail({ email, subject, html });

  await redis.set(rateLimitKey, "true", {
    EX: 60,
  });

  res.json({
    success: true,
    message: "OTP sent on your email.It will be valid for 5 min",
  });
});

export const verifyOtp = TryCatch(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Please provide all details",
    });
  }

  const redis = getRedis();
  const otpKey = `otp:${email}`;

  const storedOtpString = await redis.get(otpKey);

  if (!storedOtpString) {
    return res.status(400).json({
      success: false,
      messsage: "Invalid OTP",
    });
  }

  const storedOtp = JSON.parse(storedOtpString);

  if (storedOtp !== otp) {
    return res.status(400).json({
      success: false,
      messsage: "Invalid OTP",
    });
  }

  await redis.del(otpKey);

  let user = await User.findOne({ email });
// -----******************---------------****************--------------
  const tokenData = await generateToken(user._id, res);

  res
    .status(200)
    .json({ success: true, message: `Welcome ${user.name}`, user });
});

export const myProfile = TryCatch(async (req, res) => {
  const user = req.user;

  res.json({ success: true, user });
});

export const refreshToken = TryCatch(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid refresh token" });
  }

  const decode = await verifyRefreshToken(refreshToken);

  if (!decode) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid refresh token" });
  }

  await generateAccessToken(decode._id, res);

  res.status(200).json({ success: true, message: "Token refreshed" });
});

export const logoutUser = TryCatch(async (req, res) => {
  const userId = req.user._id;
  const redis = getRedis();
  await revokeRefreshToken(userId);
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await redis.del(`user:${userId}`);

  res.status(200).json({ success: true, message: "Logged out successfully" });
});
