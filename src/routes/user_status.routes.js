/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createUserStatus, deleteUserStatus, getAllUserStatus, getUserStatus, updateUserStatus } from '../controllers/user_status.controllers.js';

const router = Router();

router.get('/user_status', getAllUserStatus);
router.get('/user_status/:id', getUserStatus);
router.post('/user_status', createUserStatus);
router.put('/user_status/:id', updateUserStatus);
router.delete('/user_status/:id', deleteUserStatus);

export default router;