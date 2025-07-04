/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createPerson, deletePerson, getAllPersons, getPerson, updatePerson } from '../controllers/person.controllers.js';
import {verifyToken} from '../middleware/authMiddleware.js';

const router = Router();

router.get('/person', getAllPersons);
router.get('/person/:id', getPerson);
router.post('/person', verifyToken, createPerson);
router.put('/person/:id', updatePerson);
router.delete('/person/:id', deletePerson);

export default router;