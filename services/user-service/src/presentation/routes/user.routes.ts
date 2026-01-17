import { Router } from "express";
import { UserController } from "../controllers/UserController.js";
import { validateCreateUserProfile, validateUpdateUserProfile } from "../middlewares/validateRequest.js";

export function createUserRoutes(userController: UserController): Router {
    const router = Router();

    router.post('/', validateCreateUserProfile, userController.create);
    router.get('/', userController.getAll);
    router.get('/:id', userController.getById);
    router.put('/:id', validateUpdateUserProfile, userController.update);
    router.delete('/:id', userController.delete);

    return router;
}
