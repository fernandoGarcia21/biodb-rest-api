/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { login, logout } from '../controllers/login.controllers.js';
import { verifyClientToken } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/auth', login);
router.post('/logout', logout);
router.get('/verify-token', verifyClientToken);


export default router;