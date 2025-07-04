/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all reference genomes
export const getAllReferenceGenomes = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM reference_genome');
    res.json(rows);
};

//Query the database to return only one reference genome with a certain id
export const getReferenceGenome = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM reference_genome g WHERE g.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one reference genome in the database
export const createReferenceGenome = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO reference_genome VALUES(DEFAULT, $1, $2, $3, $4) RETURNING *', [data.species_id, data.name, data.name_publication, data.doi_publication]);

        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The reference renome already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Reference genome added with ID: ${newId}`)
};

//Updates one reference genome in the database
export const updateReferenceGenome = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE reference_genome SET species_id = $1, name = $2, name_publication = $3, doi_publication = $4 WHERE id = $5 RETURNING *', [data.species_id, data.name, data.name_publication, data.doi_publication, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Reference genome with id ${id} modified successfully`);
};

//Deletes one reference genome in the database and returns an http status code
export const deleteReferenceGenome = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM reference_genome g WHERE g.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};