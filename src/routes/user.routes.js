/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createUser, deleteUser, getAllUsers, getUser, updateUser, changePassword, createNewUserRequest, activateUser, getAllUsersPersonInformation, deactivateUser } from '../controllers/user.controllers.js';
import {verifyToken} from '../middleware/authMiddleware.js';

const router = Router();

router.get('/user', verifyToken, getAllUsers);
router.get('/user/all', verifyToken, getAllUsersPersonInformation);
router.get('/user/:id', verifyToken, getUser);
router.post('/user', verifyToken, createUser);
router.post('/user/request', createNewUserRequest);
router.put('/user/:id', updateUser);
router.put('/user/password/:id', changePassword);
router.put('/user/activate/:id', activateUser);
router.put('/user/deactivate/:id', deactivateUser);
router.delete('/user/:id', deleteUser);


export default router;