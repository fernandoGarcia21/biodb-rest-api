/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { getOrganisms, getOrganism, createOrganism, updateOrganism,  deleteOrganism, getAllOrganismsInformation, getFilteredOrganismsInformation, getExportFilteredOrganismsInformation} from '../controllers/organism.controllers.js';

const router = Router();

router.get('/organism', getOrganisms);
router.get('/organism_all', getAllOrganismsInformation);
router.get('/organism_filter/:filters', getFilteredOrganismsInformation);
router.get('/organism_export/:filters', getExportFilteredOrganismsInformation);
router.get('/organism/:id', getOrganism);
router.post('/organism', createOrganism);
router.put('/organism/:id', updateOrganism);
router.delete('/organism/:id', deleteOrganism);

export default router;