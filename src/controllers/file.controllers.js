/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-03-24
 */

//const path = require('path');
//const fs = require('fs');
import fs from 'fs';
import path from "path";
import { pool } from "../db.js";
import {name_setting_permanent_files_path, name_setting_uploads_path, name_settings_logo_file_name} from '../constants.js';

//Get one file from the permanent files storage folder
export const getImageFile = async(req, res ) => {
    const filename = req.params.filename;
    const imagePath = path.join(global.customSettings[name_setting_permanent_files_path], filename);

    fs.readFile(imagePath, (err, data) => {
        if (err) {
        return res.status(404).send('Image not found');
        }
        res.contentType('image/jpeg'); // Adjust content type as needed
        res.send(data);
    });
};


//Get one file from the permanent files storage folder
export const getCSVFile = async(req, res ) => {
    const filename = req.params.filename;
    const imagePath = path.join(global.customSettings[name_setting_permanent_files_path], filename);

    fs.readFile(imagePath, (err, data) => {
        if (err) {
        return res.status(404).send('File not found');
        }
        res.contentType('csv'); // Adjust content type as needed
        res.send(data);
    });
};

//Get one file from the batch upload files storage folder using the batch id to associate the internal filename   
export const getBatchFileByBatchId = async(req, res ) => {
    const batchId = req.params.batchId;

    //Query the database to get the internal filename associated with the batch id
    const {rows} = await pool.query('SELECT internal_file_name FROM batch_upload WHERE id = $1', [batchId]);
    if (rows.length === 0) {
        return res.status(404).send('Batch not found');
    }
    const filename = rows[0].internal_file_name;
    const filePath = path.join(global.customSettings[name_setting_uploads_path], filename);

    fs.readFile(filePath, (err, data) => {
        if (err) {
        return res.status(404).send('The internal file was not found');
        }
        res.contentType('csv'); // Adjust content type as needed
        res.send(data);
    });
};


//Get the logo image file of the database from the permanent files storage folder
export const getDBLogoImageFile = async(req, res ) => {
    console.log('Fetching the logo image file of the database from the permanent files storage folder...');
    const filename = global.customSettings[name_settings_logo_file_name];
    const imagePath = path.join(global.customSettings[name_setting_permanent_files_path], filename);

    fs.readFile(imagePath, (err, data) => {
        if (err) {
        return res.status(404).send('Image not found');
        }
        res.contentType('image/jpeg'); // Adjust content type as needed
        res.send(data);
    });
};