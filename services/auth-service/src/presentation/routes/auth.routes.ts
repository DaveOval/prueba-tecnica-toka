import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { validateRequest, validateLoginRequest } from "../middlewares/validateRequest.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";

export function createAuthRoutes(authController: AuthController): Router {
    const router = Router();

    // Rutas públicas
    router.post('/register', validateRequest, authController.register);
    router.post('/login', validateLoginRequest, authController.login);
    
    // Rutas protegidas (solo admin)
    router.get('/users', authenticate, authorize('admin'), authController.getAllUsers);
    router.patch('/activate/:userId', authenticate, authorize('admin'), authController.activate);
    router.patch('/deactivate/:userId', authenticate, authorize('admin'), authController.deactivate);
    router.patch('/change-role/:userId', authenticate, authorize('admin'), authController.changeRole);
    router.delete('/:userId', authenticate, authorize('admin'), authController.delete);

    return router;
}