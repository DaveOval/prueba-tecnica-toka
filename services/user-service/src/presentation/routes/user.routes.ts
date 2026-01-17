import { Router } from "express";
import { UserController } from "../controllers/UserController.js";
import { validateCreateUserProfile, validateUpdateUserProfile } from "../middlewares/validateRequest.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { canAccessProfile } from "../middlewares/canAccessProfile.js";

export function createUserRoutes(userController: UserController): Router {
    const router = Router();

    // Todas las rutas requieren autenticación
    router.use(authenticate);

    // POST / - Crear perfil (autenticado)
    router.post('/', validateCreateUserProfile, userController.create);
    
    // GET / - Listar todos (solo admin)
    router.get('/', authorize('admin'), userController.getAll);
    
    // GET /:id - Ver perfil (solo propio perfil o admin)
    router.get('/:id', canAccessProfile, userController.getById);
    
    // PUT /:id - Actualizar perfil (solo admin)
    router.put('/:id', authorize('admin'), validateUpdateUserProfile, userController.update);
    
    // DELETE /:id - Eliminar perfil (solo admin)
    router.delete('/:id', authorize('admin'), userController.delete);

    return router;
}
