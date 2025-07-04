/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-17
 */

import {Router} from 'express'
import { getFile } from '../controllers/file.controllers.js';

const router = Router();

router.get('/images/:filename', getFile);

export default router;