/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createChromosome, deleteChromosome, getAllChromosomes, getChromosome, updateChromosome } from '../controllers/chromosome.controllers.js';

const router = Router();

router.get('/chromosome', getAllChromosomes);
router.get('/chromosome/:id', getChromosome);
router.post('/chromosome', createChromosome);
router.put('/chromosome/:id', updateChromosome);
router.delete('/chromosome/:id', deleteChromosome);

export default router;