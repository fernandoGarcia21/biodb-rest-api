/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-01-13
 * @description Routes for managing habitats in the database.
 */

import {Router} from 'express'
import { getAllHabitats, getHabitat } from '../controllers/habitat.controllers.js';

const router = Router();

router.get('/habitat', getAllHabitats);
router.get('/habitat/:id', getHabitat);

export default router;