import { Router } from "express";
import {
  sendMsg,
  getMessages,
  deleteMessage,
  updateMessage,
  markMessageAsRead,
} from "../controllers/messageController";
import { errorCatch } from "../utils/errorCatch";
import { verifyToken } from "../middlewares/verifyToken";

const router = Router();

router.post("/send", verifyToken, errorCatch(sendMsg));
router.get("/conversation/:otherUserId", verifyToken, errorCatch(getMessages));
router.put("/:messageId/read", verifyToken, errorCatch(markMessageAsRead));
router.put("/:messageId", verifyToken, errorCatch(updateMessage));
router.delete("/:messageId", verifyToken, errorCatch(deleteMessage));

export default router;
