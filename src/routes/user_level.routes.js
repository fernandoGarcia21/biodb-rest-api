/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createUserLevel, deleteUserLevel, getAllUserLevel, getUserLevel, updateUserLevel } from '../controllers/user_level.controllers.js';

const router = Router();

router.get('/user_level', getAllUserLevel);
router.get('/user_level/:id', getUserLevel);
router.post('/user_level', createUserLevel);
router.put('/user_level/:id', updateUserLevel);
router.delete('/user_level/:id', deleteUserLevel);

export default router;