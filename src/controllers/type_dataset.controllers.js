/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-04-17
 */

import { pool } from "../db.js";

//Query the database to return all type datasets
export const getAllTypeDatasets = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM type_dataset');
    res.json(rows);
};

//Query the database to return only one type dataset with a certain id
export const getTypeDataset = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM type_dataset t WHERE t.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one type dataset in the database
export const createTypeDataset = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const {rows} = await pool.query('INSERT INTO type_dataset VALUES(DEFAULT, $1) RETURNING *', [name]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The type dataset already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Type dataset added with ID: ${newId}`)
};

//Updates one type dataset in the database
export const updateTypeDataset = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query(`UPDATE type_dataset 
            SET name = $1 
            WHERE id = $2 
            RETURNING *`, [data.name, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Type dataset with id ${id} modified successfully`);
};

//Deletes one type dataset in the database and returns an http status code
export const deleteTypeDataset = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM type_dataset d WHERE d.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};