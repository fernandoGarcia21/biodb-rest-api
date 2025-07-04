/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import {Router} from 'express'
import { name_setting_uploads_path } from '../constants.js';
import { submitBatchUpload, startBatchProcess, getBatchProcesses, manuallyRefreshMaterializedViews } from '../controllers/batch_upload.controllers.js';
import multer from "multer";
import path from 'path';

const router = Router();

//Configuration of the directory where the files will be stored and the name of the file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, global.customSettings[name_setting_uploads_path])
    },
    filename: function (req, file, cb) {//cb means callback in the Node Js technology
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
  });

  //Configuration of the file formats allowed for batch upload
  const fileFilterBatch = (req, file, cb) => {//cb means callback in the Node Js technology
    const allowedMimes = ['text/csv'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only CSV files are allowed'));
    }
};

// Error handling middleware
router.use((err, req, res, next) => {
  if (err.message === 'Only CSV files are allowed') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

const upload = multer({storage: storage, fileFilter: fileFilterBatch});

router.get('/batch_upload', getBatchProcesses);
router.put('/batch_upload/start', startBatchProcess);
router.post('/batch_upload', upload.single('fileBatch'), submitBatchUpload);
router.post('/batch_upload/refresh', manuallyRefreshMaterializedViews);


export default router;