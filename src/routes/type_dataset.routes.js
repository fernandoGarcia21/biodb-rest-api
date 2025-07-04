/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-04-17
 */

import {Router} from 'express'
import { createTypeDataset, deleteTypeDataset, getAllTypeDatasets, getTypeDataset, updateTypeDataset } from '../controllers/type_dataset.controllers.js';

const router = Router();

router.get('/type_dataset', getAllTypeDatasets);
router.get('/type_dataset/:id', getTypeDataset);
router.post('/type_dataset', createTypeDataset);
router.put('/type_dataset/:id', updateTypeDataset);
router.delete('/type_dataset/:id', deleteTypeDataset);

export default router;