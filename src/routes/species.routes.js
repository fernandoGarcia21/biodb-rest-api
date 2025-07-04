/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createSpecies, deleteSpecies, getAllSpecies, getSpecies, updateSpecies } from '../controllers/species.controllers.js';

const router = Router();

router.get('/species', getAllSpecies);
router.get('/species/:id', getSpecies);
router.post('/species', createSpecies);
router.put('/species/:id', updateSpecies);
router.delete('/species/:id', deleteSpecies);

export default router;