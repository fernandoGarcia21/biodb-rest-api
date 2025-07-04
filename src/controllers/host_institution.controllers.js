/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all host institutions
export const getAllHostInstitutions = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM host_institution');
    res.json(rows);
};

//Query the database to return only one host institution with a certain id
export const getHostInstitution = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM host_institution h WHERE h.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one host institution in the database
export const createHostInstitution = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO host_institution VALUES(DEFAULT, $1, $2) RETURNING *', [data.name, data.country_id]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The host institution already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Host institution added with ID: ${newId}`)
};

//Updates one host institution in the database
export const updateHostInstitution = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE host_institution SET name = $1, country_id = $2 WHERE id = $3 RETURNING *', [data.name, data.country_id, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Host institution with id ${id} modified successfully`);
};

//Deletes one host institution in the database and returns an http status code
export const deleteHostInstitution = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM host_institution h WHERE h.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};