/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-02-05
 */

import {Router} from 'express'
import { addLocationProperty, getAllPropertiesByLocation, getMissingPropertiesByTraitLocation, deleteLocationProperty, getOneLocationProperty, updateLocationProperty, getAllTraitPropertiesNoLocation } from '../controllers/location_property.controllers.js';

const router = Router();
router.post('/location_property', addLocationProperty);
router.put('/location_property/:id', updateLocationProperty);
router.get('/location_property/location/:id', getAllPropertiesByLocation);
router.get('/location_property/individual/', getAllTraitPropertiesNoLocation);
router.get('/location_property/:id', getOneLocationProperty);
router.get('/location_property/trait/:trait_id/location/:location_id', getMissingPropertiesByTraitLocation);
router.delete('/location_property/:id', deleteLocationProperty);


export default router;