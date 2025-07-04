/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all accessibility rules for different user levels
export const getAllEndPointAccess = async() => {
    const {rows} = await pool.query('SELECT * FROM end_point_access');
    return(rows);
};
