import { Request, Response } from "express";
import { CustomRequest } from "../types/interfaces";
import { StandardResponse } from "../utils/standardResponse";
import msgModel from "../models/msgModel";
import { CustomError } from "../utils/customError";
import { io } from "../config/socket";

export const sendMsg = async (req: CustomRequest, res: Response) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user?.id;

    if (!receiver || !content || !sender) {
      throw new CustomError("Missing required fields", 400);
    }

    const message = new msgModel({ sender, receiver, content });
    await message.save();

    const populatedMessage = await (
      await message.populate("sender", "name")
    ).populate("receiver", "name ");

    io.to(receiver.toString()).emit("new-message", populatedMessage);
    io.to(sender.toString()).emit("new-message", populatedMessage);

    res
      .status(201)
      .json(
        new StandardResponse("Message sent successfully", populatedMessage)
      );
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to send message", 500);
  }
};

export const getMessages = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { otherUserId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId || !otherUserId) {
      throw new CustomError("Missing required parameters", 400);
    }

    const messages = await msgModel
      .find({
        $or: [
          { sender: userId, receiver: otherUserId },
          { sender: otherUserId, receiver: userId },
        ],
      })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("sender", "username profilePic")
      .populate("receiver", "username profilePic");

    const totalMessages = await msgModel.countDocuments({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    });

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
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to retrieve messages", 500);
  }
};

export const deleteMessage = async (req: CustomRequest, res: Response) => {
  try {
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
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to delete message", 500);
  }
};

export const updateMessage = async (req: CustomRequest, res: Response) => {
  try {
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
      .json(
        new StandardResponse("Message updated successfully", updatedMessage)
      );
  } catch (error) {
    if (error instanceof CustomError) {
      throw error;
    }
    throw new CustomError("Failed to update message", 500);
  }
};
