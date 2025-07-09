/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-04-17
 */

import { pool } from "../db.js";

//Query the database to return all external datasets
export const getAllExternalDatasets = async(req, res ) => {
    const {rows} = await pool.query(`SELECT * FROM external_dataset`);
    res.json(rows);
};

//Query the database to return only one external dataset with a certain id
export const getExternalDataset = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT ed.id external_dataset_id,
                                            ed.name,
                                            ed.url,
                                            ed.description,
                                            ed.type_dataset_id,
                                            td.name type_dataset_name
                                            FROM external_dataset ed
                                            JOIN type_dataset td on td.id = ed.type_dataset_id
                                            WHERE ed.id = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one external dataset in the database
export const createExternalDataset = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const url = data.url;
        const description = data.description;
        const type_dataset_id = data.type_dataset_id;
        const {rows} = await pool.query('INSERT INTO external_dataset VALUES(DEFAULT, $1, $2, $3, $4) RETURNING *', [name, url, description, type_dataset_id]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The external dataset already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`External dataset added with ID: ${newId}`)
};

//Updates one external dataset in the database
export const updateExternalDataset = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query(`UPDATE external_dataset 
            SET name = $1, 
            url = $2, 
            description = $3, 
            type_dataset_id = $4 
            WHERE id = $5 
            RETURNING *`, [data.name, data.url, data.description, data.type_dataset_id, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`External dataset with id ${id} modified successfully`);
};

//Deletes one external dataset in the database and returns an http status code
export const deleteExternalDataset = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM external_dataset d WHERE d.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};