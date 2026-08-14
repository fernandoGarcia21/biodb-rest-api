/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-04-17
 */

import {Router} from 'express'
import { createExternalDataset, deleteExternalDataset, getAllExternalDatasets, getExternalDataset, updateExternalDataset } from '../controllers/external_dataset.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/external_dataset', getAllExternalDatasets);
router.get('/external_dataset/:id', getExternalDataset);
router.post('/external_dataset', verifyToken, createExternalDataset);
router.put('/external_dataset/:id', verifyToken, updateExternalDataset);
router.delete('/external_dataset/:id', verifyToken, deleteExternalDataset);

export default router;