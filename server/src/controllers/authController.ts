import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel";
import { StandardResponse } from "../utils/standardResponse";
import { CustomError } from "../utils/customError";
import jwt from "jsonwebtoken";
import { LoginSchema, RegisterSchema } from "../utils/zod/zodSchema";

export const userRegister = async (req: Request, res: Response) => {
  const { name, email, password } = RegisterSchema.parse(req.body);

  const saltRounds = parseInt(process.env.SALT_ROUNDS || "10", 10);

  const existingUser = await userModel.findOne({ email });

  if (existingUser) {
    throw new CustomError("User already exists", 400);
  }

  const hashedPassword = await bcrypt.hash(password || "", saltRounds);

  const user = new userModel({
    name,
    email,
    password: hashedPassword,
  });

  await user.save();

  const response = {
    email: user.email,
  };

  res
    .status(201)
    .json(new StandardResponse("User registered successfully", response));
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = LoginSchema.parse(req.body);

  const user = await userModel.findOne({ email });
  if (!user) {
    throw new CustomError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(password || "", user.password || "");
  if (!isMatch) {
    throw new CustomError("Invalid credentials", 401);
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY || "", {
    expiresIn: "7d",
  });

  const response = {
    email: user.email,
    id: user._id,
    token,
  };

  res
    .status(200)
    .json(new StandardResponse("User logged in successfully", response));
};
