/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-31
 */

import { pool } from "../db.js";

//Query the database to return all countries
export const getAllCountries = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM country');
    res.json(rows);
};



//Query the database to return a list of countries that have locations associated
export const getCountriesWithLocationAssociated = async(req, res ) => {
    const {rows} = await pool.query(`SELECT DISTINCT C.ID,
                                        C.NAME
                                    FROM COUNTRY C
                                    JOIN LOCATION L ON L.COUNTRY_ID = C.ID
                                    ORDER BY C.NAME ASC -- Or ORDER BY 2 ASC`);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};
