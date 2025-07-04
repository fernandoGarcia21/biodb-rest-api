/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createProperty, deleteProperty, getAllProperties, getPropertiesByTrait, getProperty, updateProperty, getAllPropertiesAndTrait } from '../controllers/property.controllers.js';

const router = Router();

router.get('/property', getAllProperties);
router.get('/property_trait', getAllPropertiesAndTrait);
router.get('/property/:id', getProperty);
router.get('/property/trait/:trait_id', getPropertiesByTrait);
router.post('/property', createProperty);
router.put('/property/:id', updateProperty);
router.delete('/property/:id', deleteProperty);

export default router;