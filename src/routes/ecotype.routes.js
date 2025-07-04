/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createEcotype, deleteEcotype, getAllEcotypes, getEcotype, updateEcotype } from '../controllers/ecotype.controllers.js';

const router = Router();

router.get('/ecotype', getAllEcotypes);
router.get('/ecotype/:id', getEcotype);
router.post('/ecotype', createEcotype);
router.put('/ecotype/:id', updateEcotype);
router.delete('/ecotype/:id', deleteEcotype);

export default router;