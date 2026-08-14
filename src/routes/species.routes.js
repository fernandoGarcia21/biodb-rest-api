/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { createSpecies, deleteSpecies, getAllSpecies, getSpecies, updateSpecies } from '../controllers/species.controllers.js';
import multer from "multer";
import path from 'path';
import { name_setting_permanent_files_path } from '../constants.js';
import {verifyToken} from '../middleware/authMiddleware.js';

const router = Router();

//Configuration of the directory where the files will be stored and the name of the file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, global.customSettings[name_setting_permanent_files_path])
    },
    filename: function (req, file, cb) {//cb means callback in the Node Js technology
      cb(null, file.originalname)
    }
  });

//Configuration of the file formats allowed for species image upload
const fileFilterBatch = (req, file, cb) => {//cb means callback in the Node Js technology
    const allowedMimes = ['image/jpeg', 'image/png'];
    const allowedExtensions = ['.jpg', '.jpeg', '.png'];
    const extension = path.extname(file.originalname || '').toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only jpg, JPEG, or png files are allowed'));
    }
  };


// Error handling middleware
router.use((err, req, res, next) => {
  if (err.message === 'Only jpg, JPEG, or png files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

const upload = multer({storage: storage, fileFilter: fileFilterBatch});

router.get('/species', getAllSpecies);
router.get('/species/:id', getSpecies);
router.post('/species', verifyToken, upload.single('imageFile'), createSpecies);
router.put('/species/:id', verifyToken, upload.single('imageFile'), updateSpecies);
router.delete('/species/:id', verifyToken, deleteSpecies);

export default router;