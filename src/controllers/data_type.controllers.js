/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-17
 */

import { pool } from "../db.js";

//Query the database to return all data types
export const getAllDataTypes = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM data_type');
    res.json(rows);
};
