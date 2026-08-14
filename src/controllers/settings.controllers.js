/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return the customizable settings 
//e.g. the directory of uploading files
export const getSettings = async() => {
    let settingsMap = [];
    const {rows} = await pool.query('SELECT * FROM settings');

    if(rows.length > 0){
        settingsMap = rows.reduce((map, row) => {
            map[row.name] = row.value; // Assuming 'name' is the unique key
            return map;
        }, {});
    }else{
        console.log('Alert: settings information not found in the DB');
    }
    return (settingsMap);
};


//Query the database to return the "About Us" settings
export const getAboutUsSettings = async(req, res) => {
    console.log('Fetching ABOUT US settings from the database...');
    const {rows} = await pool.query("SELECT * FROM SETTINGS WHERE NAME LIKE 'ABOUT_%'");
    res.json(rows);
};

//Query the database to return the "DB Name" from settings
export const getDBNameSettings = async(req, res) => {
    console.log('Fetching DB NAME settings from the database...');
    const {rows} = await pool.query("SELECT * FROM SETTINGS WHERE NAME = 'DB_NAME' OR NAME = 'DB_NAME_SUFFIX'");
    res.json(rows);
}; 

//Query the database to return the "DB Welcome Message" from settings
export const getDBWelcomeMessageSettings = async(req, res) => {
    console.log('Fetching DB WELCOME MESSAGE settings from the database...');
    const {rows} = await pool.query("SELECT * FROM SETTINGS WHERE NAME = 'DB_WELCOME_MESSAGE'");
    res.json(rows);
}; 