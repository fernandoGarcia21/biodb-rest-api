/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createProperty, deleteProperty, getPropertiesWithProtocolPdf, getAllProperties, getPropertiesByTrait, getProperty, updateProperty, getAllPropertiesAndTrait, getPropertiesWithProtocol } from '../controllers/property.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/property', getAllProperties);
router.get('/property_trait', getAllPropertiesAndTrait);
router.get('/property/:id', getProperty);
router.get('/property/trait/:trait_id', getPropertiesByTrait);
router.post('/property', verifyToken, createProperty);
router.put('/property/:id', verifyToken, updateProperty);
router.delete('/property/:id', verifyToken, deleteProperty);
router.get('/property_with_protocol', getPropertiesWithProtocol);
router.get('/property_with_protocol_pdf', getPropertiesWithProtocolPdf);
router.post('/property_with_protocol_pdf', getPropertiesWithProtocolPdf);
 
export default router;