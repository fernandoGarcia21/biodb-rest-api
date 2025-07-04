/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-17
 */

import {Router} from 'express'
import { getAllDataTypes } from '../controllers/data_type.controllers.js';

const router = Router();

router.get('/data_type', getAllDataTypes);

export default router;