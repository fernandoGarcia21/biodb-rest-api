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
