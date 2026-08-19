/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-01-13
 * @description Routes for managing habitats in the database.
 */

import {Router} from 'express'
import { getAllHabitats, getHabitat, createHabitat, updateHabitat, deleteHabitat } from '../controllers/habitat.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/habitat', getAllHabitats);
router.get('/habitat/:id', getHabitat);
router.post('/habitat', verifyToken, createHabitat);
router.put('/habitat/:id', verifyToken, updateHabitat);
router.delete('/habitat/:id', verifyToken, deleteHabitat);

export default router;