import { Request, Response } from "express";
import { CustomRequest } from "../types/interfaces";
import { StandardResponse } from "../utils/standardResponse";
import msgModel from "../models/msgModel";
import { CustomError } from "../utils/customError";
import { io, isUserOnline } from "../config/socket";

// Send message
export const sendMsg = async (req: CustomRequest, res: Response) => {
  const { receiver, content } = req.body;
  const sender = req.user?.id;

  if (!receiver || !content || !sender) {
    return res
      .status(400)
      .json(new StandardResponse("Missing required fields", null, 400));
  }

  const recentMessage = await msgModel
    .findOne({
      sender,
      receiver,
      content,
    })
    .sort({ createdAt: -1 });

  if (
    recentMessage &&
    Date.now() - new Date(recentMessage.createdAt).getTime() < 1000
  ) {
    return res
      .status(429)
      .json(
        new StandardResponse(
          "Please wait before sending another message",
          null,
          429
        )
      );
  }

  const message = new msgModel({ sender, receiver, content, status: "sent" });
  await message.save();

  const populatedMessage = await message.populate("sender receiver", "name");

  if (isUserOnline(receiver.toString())) {
    io.to(receiver.toString()).emit("new-message", populatedMessage);
  }
  io.to(sender.toString()).emit("new-message", populatedMessage);

  res
    .status(201)
    .json(new StandardResponse("Message sent successfully", populatedMessage));
};

// Get messages
export const getMessages = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.id;
  const { otherUserId } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;

  if (!userId || !otherUserId) {
    return res
      .status(400)
      .json(new StandardResponse("Missing required parameters", null, 400));
  }

  const messagesQuery = msgModel
    .find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    })
    .sort({ createdAt: -1 });

  const totalMessages = await messagesQuery.clone().countDocuments();
  const messages = await messagesQuery
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("sender receiver", "username profilePic");

  res.status(200).json(
    new StandardResponse("Messages retrieved successfully", {
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMessages / limit),
        hasMore: page * limit < totalMessages,
      },
    })
  );
};

// Delete message
export const deleteMessage = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.id;
  const { messageId } = req.params;

  const message = await msgModel.findById(messageId);

  if (!message) {
    throw new CustomError("Message not found", 404);
  }

  if (message.sender.toString() !== userId) {
    throw new CustomError("Unauthorized to delete this message", 403);
  }

  await message.deleteOne();

  io.to(message.receiver.toString()).emit("message-deleted", messageId);
  io.to(message.sender.toString()).emit("message-deleted", messageId);

  res
    .status(200)
    .json(new StandardResponse("Message deleted successfully", null));
};

// Update message
export const updateMessage = async (req: CustomRequest, res: Response) => {
  const userId = req.user?.id;
  const { messageId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new CustomError("Content is required", 400);
  }

  const message = await msgModel.findById(messageId);

  if (!message) {
    throw new CustomError("Message not found", 404);
  }

  if (message.sender.toString() !== userId) {
    throw new CustomError("Unauthorized to update this message", 403);
  }

  message.content = content;
  await message.save();

  const updatedMessage = await (
    await message.populate("sender", "name ")
  ).populate("receiver", "name ");

  io.to(message.receiver.toString()).emit("message-updated", updatedMessage);
  io.to(message.sender.toString()).emit("message-updated", updatedMessage);

  res
    .status(200)
    .json(new StandardResponse("Message updated successfully", updatedMessage));
};

// Mark message as read
export const markMessageAsRead = async (req: CustomRequest, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  const message = await msgModel.findById(messageId);
  if (!message) {
    return res
      .status(404)
      .json(new StandardResponse("Message not found", null, 404));
  }

  if (message.receiver.toString() !== userId) {
    return res
      .status(403)
      .json(new StandardResponse("Unauthorized", null, 403));
  }

  message.status = "read";
  await message.save();

  io.to(message.sender.toString()).emit("message-status-update", {
    messageId,
    status: "read",
  });

  res.status(200).json(new StandardResponse("Message marked as read", message));
};
