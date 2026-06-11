import jwt from "jsonwebtoken";
import ENV from "../config/env.js";
import { getRedis } from "../config/db.js";
import User from "../models/userModel.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      return res
        .status(403)
        .json({ success: false, message: "Please Login - no token" });
    }

    let decodedData;
    try {
      decodedData = jwt.verify(token,ENV.ACCESS_SECRET)
    } catch (error) {
      return res.status(401).json({ success: false, message: "token expired" });
    }

    const redis = getRedis();

    const cacheUser = await redis.get(`user:${decodedData._id}`);
    if (cacheUser) {
      req.user = JSON.parse(cacheUser);
      return next();
    }

    const user = await User.findById(decodedData._id);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "No user with this id",
      });
    }

    await redis.setEx(`user:${user._id}`, 3600, JSON.stringify(user));

    req.user = user;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
