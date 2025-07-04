/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { getOrganismProperties, createOrganismProperty, updateOrganismProperty, deleteOrganismProperty } from '../controllers/organism_property.controllers.js';

const router = Router();

router.get('/organism_property/:organism_id', getOrganismProperties);
router.post('/organism_property', createOrganismProperty);
router.put('/organism_property/:id', updateOrganismProperty);
router.delete('/organism_property/:id', deleteOrganismProperty);

export default router;