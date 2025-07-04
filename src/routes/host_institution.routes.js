/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createHostInstitution, deleteHostInstitution, getAllHostInstitutions, getHostInstitution, updateHostInstitution } from '../controllers/host_institution.controllers.js';

const router = Router();

router.get('/host_institution', getAllHostInstitutions);
router.get('/host_institution/:id', getHostInstitution);
router.post('/host_institution', createHostInstitution);
router.put('/host_institution/:id', updateHostInstitution);
router.delete('/host_institution/:id', deleteHostInstitution);

export default router;