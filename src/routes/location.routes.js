/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createLocation, deleteLocation, getAllLocations, getLocation, updateLocation, getLocationsByCountry } from '../controllers/location.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/location', getAllLocations);
router.get('/location/:id', getLocation);
router.get('/location/country/:countryId', getLocationsByCountry);
router.post('/location', verifyToken, createLocation);
router.put('/location/:id', verifyToken, updateLocation);
router.delete('/location/:id', verifyToken, deleteLocation);

export default router;