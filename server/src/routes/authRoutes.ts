import express from "express";
import { errorCatch } from "../utils/errorCatch";
import {
  userRegister,
  login,
  getAllUsers,
} from "../controllers/authController";

const router = express.Router();

router.post("/register", errorCatch(userRegister));
router.post("/login", errorCatch(login));
router.get("/users", errorCatch(getAllUsers));

export default router;
