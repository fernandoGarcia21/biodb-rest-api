/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createResearchGroup, deleteResearchGroup, getAllResearchGroups, getResearchGroup, updateResearchGroup } from '../controllers/research_group.controllers.js';

const router = Router();

router.get('/research_group', getAllResearchGroups);
router.get('/research_group/:id', getResearchGroup);
router.post('/research_group', createResearchGroup);
router.put('/research_group/:id', updateResearchGroup);
router.delete('/research_group/:id', deleteResearchGroup);

export default router;