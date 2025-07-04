/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createProject, deleteProject, getAllProjects, getProject, updateProject, getProjectExternalDatasets, getAvailableProjectExternalDatasets, createProjectExternalDataset, deleteProjectExternalDataset } from '../controllers/project.controllers.js';

const router = Router();

router.get('/project', getAllProjects);
router.get('/project/:id', getProject);
router.post('/project', createProject);
router.put('/project/:id', updateProject);
router.delete('/project/:id', deleteProject);
router.get('/project/:id/external_datasets', getProjectExternalDatasets);
router.get('/project/:id/available_external_datasets', getAvailableProjectExternalDatasets);
router.post('/project/:id/external_datasets', createProjectExternalDataset);
router.delete('/project/:id/external_datasets', deleteProjectExternalDataset);


export default router;