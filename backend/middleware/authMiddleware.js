import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "express-async-handler";

const protect = asyncHandler(async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "")
    if (!token) {
      res.status(401);
      throw new Error("Unautorised Request");
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    if (!user) {
      res.status(401);
      throw new Error("Invalid Access Token");
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Invalid Access Token")
  }
});
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;
    if (!incomingRefreshToken) {
      res.status(401);
      throw new Error("Unautorised Request");
    }
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decodedToken?._id).select("-password")
    if (!user) {
      res.status(401);
      throw new Error("Invalid Refresh Token");
    }

    if(incomingRefreshToken !== user.refreshToken){
      res.status(401);
      throw new Error("Invalid Refresh Token");
    }
    const accessToken = user.generateAccessToken();

    const options = {
      path: '/',
      expires: new Date(Date.now() + 1000 * 50 * 5000),
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    }
    res.
      status(200)
      .cookie('refreshToken', incomingRefreshToken, options)
      .json({status:"Access Token Refreshed!", 
        accessToken: accessToken,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          pic: user.pic,
          isAdmin: user.isAdmin,
        }
      });
  } catch (err) {
    res.status(401);
    throw new Error("Invalid Refresh Token")
  }
});

export default  { protect, refreshAccessToken };
