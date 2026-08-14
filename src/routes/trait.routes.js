/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createTrait, deleteTrait, getAllTraits, getTrait, updateTrait, getAllTraitsAssociated } from '../controllers/trait.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/trait', getAllTraits);
router.get('/trait/association/:isLocationAssociated', getAllTraitsAssociated);
router.get('/trait/:id', getTrait);
router.post('/trait', verifyToken, createTrait);
router.put('/trait/:id', verifyToken, updateTrait);
router.delete('/trait/:id', verifyToken, deleteTrait);

export default router;