/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createReferenceGenome, deleteReferenceGenome, getAllReferenceGenomes, getReferenceGenome, updateReferenceGenome } from '../controllers/reference_genome.controllers.js';

const router = Router();

router.get('/reference_genome', getAllReferenceGenomes);
router.get('/reference_genome/:id', getReferenceGenome);
router.post('/reference_genome', createReferenceGenome);
router.put('/reference_genome/:id', updateReferenceGenome);
router.delete('/reference_genome/:id', deleteReferenceGenome);

export default router;