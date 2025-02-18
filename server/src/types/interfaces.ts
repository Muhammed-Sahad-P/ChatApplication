import type { Request } from "express";

export interface CustomRequest extends Request {
  user?: {
    id: string;
  };
}

export interface JwtDecoded {
  id: string;
  role: "user" | "admin";
}
