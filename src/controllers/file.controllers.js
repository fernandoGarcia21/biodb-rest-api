/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-03-24
 */

//const path = require('path');
//const fs = require('fs');
import fs from 'fs';
import path from "path";
import {imageDirectory} from '../constants.js';

//Get one file from the permanent files storage folder
export const getFile = async(req, res ) => {
    const filename = req.params.filename;
    const imagePath = path.join(imageDirectory, filename);

    fs.readFile(imagePath, (err, data) => {
        if (err) {
        return res.status(404).send('Image not found');
        }
        res.contentType('image/jpeg'); // Adjust content type as needed
        res.send(data);
    });
};
