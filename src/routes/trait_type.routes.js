/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-21
 */

import {Router} from 'express'
import { getAllTraitTypes } from '../controllers/trait_type.controllers.js';

const router = Router();

router.get('/trait_type', getAllTraitTypes);

export default router;