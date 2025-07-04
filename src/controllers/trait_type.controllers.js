/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-01-21
 */

import { pool } from "../db.js";

//Query the database to return all trait types
export const getAllTraitTypes = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM trait_type');
    res.json(rows);
};
