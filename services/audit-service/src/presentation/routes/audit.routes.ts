import { Router } from 'express';
import type { AuditController } from '../controllers/AuditController.js';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js';

export function createAuditRoutes(controller: AuditController): Router {
    const router = Router();

    // POST endpoint no requiere autenticación (se usa internamente por otros servicios)
    router.post('/', (req, res, next) => {
        controller.create(req, res, next).catch(next);
    });

    // GET endpoint requiere autenticación y rol de admin
    router.get('/', authenticate, authorize('admin'), (req, res, next) => {
        controller.getAll(req, res, next).catch(next);
    });

    return router;
}
