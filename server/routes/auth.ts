import { Router } from "express";
import type { IStorage } from "../storage";
import { registerAuthRoutes as registerBaseAuthRoutes } from "../auth-routes";
import type { Express } from "express";

export function registerAuthRoutes(app: Express, storage: IStorage) {
  registerBaseAuthRoutes(app, storage);
}
