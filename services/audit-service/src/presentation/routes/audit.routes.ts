import { Router } from 'express';
import type { AuditController } from '../controllers/AuditController.js';

export function createAuditRoutes(controller: AuditController): Router {
    const router = Router();

    router.post('/', (req, res, next) => {
        controller.create(req, res).catch(next);
    });

    router.get('/', (req, res, next) => {
        controller.getAll(req, res).catch(next);
    });

    return router;
}
