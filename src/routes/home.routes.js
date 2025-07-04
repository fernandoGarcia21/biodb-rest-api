/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-06-18
 * @description This file defines the routes for the home module of the application.
 * It includes routes for fetching species counts, trait data counts, location organism counts,
 */

import {Router} from 'express'
import { getSpeciesCounts, getTraitsDataCounts, getLocationOrganismsCounts, getLatestDatasets } from '../controllers/home.controllers.js';

const router = Router();

router.get('/home_report/species_counts', getSpeciesCounts);
router.get('/home_report/traits_data_counts', getTraitsDataCounts);
router.get('/home_report/location_organisms_counts', getLocationOrganismsCounts);
router.get('/home_report/latest_datasets', getLatestDatasets);

export default router;