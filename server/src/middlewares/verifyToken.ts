import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { CustomRequest, JwtDecoded } from "../types/interfaces.ts";
import userModel from "../models/userModel";
import { CustomError } from "../utils/customError";

export const verifyToken = async (
  req: CustomRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) {
      throw new CustomError("Not authenticated", 401);
    }

    const verified = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY!
    ) as JwtDecoded;

    const userExists = await userModel.findById(verified.id);

    if (!userExists) {
      throw new CustomError("User not found or blocked", 404);
    }

    req.user = { id: userExists.id };

    next();
  } catch (error) {
    next(error);
  }
};
