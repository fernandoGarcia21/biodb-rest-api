/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2026-01-19
 */

import {Router} from 'express'
import { getAboutUsSettings, getDBNameSettings, getDBWelcomeMessageSettings } from '../controllers/settings.controllers.js';

const router = Router();

router.get('/about_us', getAboutUsSettings);
router.get('/db_name', getDBNameSettings);
router.get('/db_welcome_message', getDBWelcomeMessageSettings);

export default router;