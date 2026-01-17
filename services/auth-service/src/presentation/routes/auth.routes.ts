import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { validateRequest, validateLoginRequest } from "../middlewares/validateRequest.js";

export function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    router.post('/register', validateRequest, authController.register);
    router.post('/login', validateLoginRequest, authController.login);

    return router;
}