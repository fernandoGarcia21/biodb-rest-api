/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createLocation, deleteLocation, getAllLocations, getLocation, updateLocation, getLocationsByCountry } from '../controllers/location.controllers.js';

const router = Router();

router.get('/location', getAllLocations);
router.get('/location/:id', getLocation);
router.get('/location/country/:countryId', getLocationsByCountry);
router.post('/location', createLocation);
router.put('/location/:id', updateLocation);
router.delete('/location/:id', deleteLocation);

export default router;