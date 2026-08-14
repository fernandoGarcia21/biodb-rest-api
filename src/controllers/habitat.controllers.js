/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2026-13-01
 */

import { pool } from "../db.js";

//Query the database to return all habitat types
export const getAllHabitats = async(req, res ) => {
    const {rows} = await pool.query(`SELECT h.id,
                                            h.name,
                                            h.description
                                            FROM habitat h
                                            ORDER BY 2`);
    res.json(rows);
};

//Query the database to return only one habitat with a certain id
export const getHabitat = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`
                                    SELECT H.ID,
                                        H.NAME,
                                        H.DESCRIPTION
                                    FROM HABITAT H
                                    WHERE H.ID = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

