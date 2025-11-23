import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";
import { uploadOnCloudinary } from "../config/cloudinary.js";

const allUsers = asyncHandler(async (req, res) => {
  const keyword = req.query.search
    ? {
        $or: [
          { name: { $regex: req.query.search, $options: "i" } },
          { email: { $regex: req.query.search, $options: "i" } },
        ],
      }
    : {};

  const users = await User.find(keyword).find({ _id: { $ne: req.user._id } });
  res.send(users);
});

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  console.log(name, email, password)

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please Enter all the Feilds");
  }

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }
  let avatarLocalPath;

  if (req.file) {
    if (req.file.path?.length > 0) avatarLocalPath = req.file.path;
  }
  let avatar;

  if(avatarLocalPath)
    avatar = await uploadOnCloudinary(avatarLocalPath);
  if(avatar)avatar = avatar.url;

  const user = await User.create({
    name,
    email,
    password,
    pic: avatar,
  });

  if (user) {
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
      path: '/',
      expires: new Date(Date.now() + 1000 * 50 * 5000),
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    }
    res.
      status(200)
      .cookie('refreshToken', refreshToken, options)
      .json({status:"User Logged In", 
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            isAdmin: user.isAdmin,
          },
          accessToken: accessToken,
      });
  } else {
    res.status(400);
    throw new Error("Check the details and try again!");
  }
});

const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email:email });
  if (user && (await user.matchPassword(password))) {
    
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const options = {
      path: '/',
      expires: new Date(Date.now() + 1000 * 50 * 5000),
      httpOnly: true,
      sameSite: 'lax',
      secure: false
    }
    res.
      status(200)
      .cookie('refreshToken', refreshToken, options)
      .json({status:"User Logged In", 
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic,
            isAdmin: user.isAdmin,
          },
          accessToken: accessToken,
      });

  } else {
    res.status(400);
    throw new Error("Invalid Email or Password");
  }
});

export default { allUsers, registerUser, authUser };
