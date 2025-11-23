import express from 'express';
import userControllers from "../controllers/userControllers.js"
import authMiddleware from '../middleware/authMiddleware.js'
import { upload } from '../middleware/multerMiddleware.js';
const {
  registerUser,
  authUser,
  allUsers,
} = userControllers;
const { protect, refreshAccessToken } = authMiddleware;

const router = express.Router();

router.route("/").get(protect, allUsers);

router.route("/vefify").get(protect);

router.post("/refresh", refreshAccessToken);

router.post('/register',upload.single('file'),registerUser);

router.post("/login", authUser);

export default router
