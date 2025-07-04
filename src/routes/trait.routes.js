/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createTrait, deleteTrait, getAllTraits, getTrait, updateTrait, getAllTraitsAssociated } from '../controllers/trait.controllers.js';

const router = Router();

router.get('/trait', getAllTraits);
router.get('/trait/association/:isLocationAssociated', getAllTraitsAssociated);
router.get('/trait/:id', getTrait);
router.post('/trait', createTrait);
router.put('/trait/:id', updateTrait);
router.delete('/trait/:id', deleteTrait);

export default router;