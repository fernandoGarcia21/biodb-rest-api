/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-06-16
 * @description Routes for managing sampling areas in the database.
 */

import {Router} from 'express'
import { createSamplingArea, deleteSamplingArea, getAllSamplingAreas, getSamplingArea, updateSamplingArea, getAllSamplingAreasAndLocations } from '../controllers/sampling_area.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/sampling_area', getAllSamplingAreas);
router.get('/sampling_area/locations/', getAllSamplingAreasAndLocations);
router.get('/sampling_area/:id', getSamplingArea);
router.post('/sampling_area', verifyToken, createSamplingArea);
router.put('/sampling_area/:id', verifyToken, updateSamplingArea);
router.delete('/sampling_area/:id', verifyToken, deleteSamplingArea);

export default router;