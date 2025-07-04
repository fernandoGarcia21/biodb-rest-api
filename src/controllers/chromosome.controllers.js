/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all chromosomes
export const getAllChromosomes = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM chromosome');
    res.json(rows);
};

//Query the database to return only one chromosome with a certain id
export const getChromosome = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM chromosome c WHERE c.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one chromosome in the database
export const createChromosome = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO chromosome VALUES(DEFAULT, $1, $2, $3) RETURNING *', [data.genome_id, data.name, data.comments]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The chromosome already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Chromosome added with ID: ${newId}`)
};

//Updates one chromosome in the database
export const updateChromosome = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE chromosome SET genome_id = $1, name = $2, comments = $3 WHERE id = $4 RETURNING *', [data.genome_id, data.name, data.comments, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Chromosome with id ${id} modified successfully`);
};

//Deletes one chromosome in the database and returns an http status code
export const deleteChromosome = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM chromosome c WHERE c.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};