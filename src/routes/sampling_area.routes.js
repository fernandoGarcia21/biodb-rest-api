/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-06-16
 * @description Routes for managing sampling areas in the database.
 */

import {Router} from 'express'
import { createSamplingArea, deleteSamplingArea, getAllSamplingAreas, getSamplingArea, updateSamplingArea, getAllSamplingAreasAndLocations } from '../controllers/sampling_area.controllers.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import multer from "multer";
import path from 'path';
import { name_setting_sampling_area_files_directory } from '../constants.js';
const router = Router();

//Configuration of the directory where the files will be stored and the name of the file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, global.customSettings[name_setting_sampling_area_files_directory])
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

router.get('/sampling_area', getAllSamplingAreas);
router.get('/sampling_area/locations/', getAllSamplingAreasAndLocations);
router.get('/sampling_area/:id', getSamplingArea);
router.post('/sampling_area', verifyToken, upload.single('imageFile'), createSamplingArea);
router.put('/sampling_area/:id', verifyToken, upload.single('imageFile'), updateSamplingArea);
router.delete('/sampling_area/:id', verifyToken, deleteSamplingArea);

export default router;