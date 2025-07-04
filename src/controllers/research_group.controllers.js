/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all research groups
export const getAllResearchGroups = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM research_group');
    res.json(rows);
};

//Query the database to return only one research group with a certain id
export const getResearchGroup = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM research_group r WHERE r.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one research group in the database
export const createResearchGroup = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO research_group VALUES(DEFAULT, $1, $2, $3) RETURNING *', [
            data.name, 
            data.website, 
            data.host_institution_id]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The research group already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Research group added with ID: ${newId}`)
};

//Updates one research group in the database
export const updateResearchGroup = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE research_group SET name = $1, website = $2, host_institution_id = $3 WHERE id = $4 RETURNING *', [data.name, data.website, data.host_institution_id, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Research group with id ${id} modified successfully`);
};

//Deletes one research group in the database and returns an http status code
export const deleteResearchGroup = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM research_group r WHERE r.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};