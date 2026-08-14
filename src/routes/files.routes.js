/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-17
 */

import {Router} from 'express'
import { getImageFile, getCSVFile, getBatchFileByBatchId, getDBLogoImageFile } from '../controllers/file.controllers.js';

const router = Router();

router.get('/images/:filename', getImageFile);
router.get('/files/:filename', getCSVFile);
router.get('/batch_file/:batchId', getBatchFileByBatchId);
router.get('/db_logo', getDBLogoImageFile);

export default router;