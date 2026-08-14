/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createProject, deleteProject, getAllProjects, getProject, updateProject, getProjectExternalDatasets, getAvailableProjectExternalDatasets, createProjectExternalDataset, deleteProjectExternalDataset, getProjectsMustReadByIds } from '../controllers/project.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/project', getAllProjects);
router.get('/project/:id', getProject);
router.get('/projects/must_read/:idsArray', getProjectsMustReadByIds);
router.post('/project', verifyToken, createProject);
router.put('/project/:id', verifyToken, updateProject);
router.delete('/project/:id', verifyToken, deleteProject);
router.get('/project/:id/external_datasets', getProjectExternalDatasets);
router.get('/project/:id/available_external_datasets', getAvailableProjectExternalDatasets);
router.post('/project/:id/external_datasets', verifyToken, createProjectExternalDataset);
router.delete('/project/:id/external_datasets', verifyToken, deleteProjectExternalDataset);

export default router;