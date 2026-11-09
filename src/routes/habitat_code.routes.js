/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2026-11-07
 * @description Routes for managing habitat codes and habitat structures in the application. These routes handle requests related to retrieving habitat codes aggregated by descriptor position and fetching all habitat structures.
 */

import {Router} from 'express'
import { getHabitatCodesAggregated, getAllHabitatStructures } from '../controllers/habitat_code.controllers.js';

const router = Router();

router.get('/habitat_codes', getHabitatCodesAggregated);
router.get('/habitat_structures', getAllHabitatStructures);

export default router;