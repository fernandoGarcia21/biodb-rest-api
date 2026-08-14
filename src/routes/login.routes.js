/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { login, logout } from '../controllers/login.controllers.js';
import { verifyClientToken } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/auth', authLimiter, login);
router.post('/logout', logout);
router.get('/verify-token', verifyClientToken);


export default router;