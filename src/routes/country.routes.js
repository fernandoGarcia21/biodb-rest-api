/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-17
 */

import {Router} from 'express'
import { getAllCountries, getCountriesWithLocationAssociated } from '../controllers/country.controllers.js';

const router = Router();

router.get('/country', getAllCountries);
router.get('/country/withlocations', getCountriesWithLocationAssociated);

export default router;