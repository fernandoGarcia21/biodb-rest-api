/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createRole, deleteRole, getAllRoles, getRole, updateRole } from '../controllers/role.controllers.js';

const router = Router();

router.get('/role', getAllRoles);
router.get('/role/:id', getRole);
router.post('/role', createRole);
router.put('/role/:id', updateRole);
router.delete('/role/:id', deleteRole);

export default router;