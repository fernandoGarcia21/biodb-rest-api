/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all ecotypes
export const getAllEcotypes = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM ecotype');
    res.json(rows);
};

//Query the database to return only one ecotype with a certain id
export const getEcotype = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM ecotype e WHERE e.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one ecotype in the database
export const createEcotype = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const {rows} = await pool.query('INSERT INTO ecotype VALUES(DEFAULT, $1) RETURNING *', [name]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The ecotype already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Ecotype added with ID: ${newId}`)
};

//Updates one ecotype in the database
export const updateEcotype = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    console.log("en el put")
    try{
        const {rows} = await pool.query('UPDATE ecotype SET name = $1 WHERE id = $2 RETURNING *', [data.name, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Ecotype with id ${id} modified successfully`);
};

//Deletes one ecotype in the database and returns an http status code
export const deleteEcotype = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM ecotype e WHERE e.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};