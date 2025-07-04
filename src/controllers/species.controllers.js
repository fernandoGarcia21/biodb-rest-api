/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all species
export const getAllSpecies = async(req, res ) => {
    console.log('Query species');
    const {rows} = await pool.query('SELECT * FROM species');
    res.json(rows);
};

//Query the database to return only one species with a certain id
export const getSpecies = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM species s WHERE s.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Query the database to return only one species with a certain id
export const getSpeciesInternalCodes = async() => {
    let speciesCodesMap = [];
    const {rows} = await pool.query('SELECT s.internal_code, s.id FROM species s WHERE s.internal_code IS NOT NULL');

    if(rows.length > 0){
        speciesCodesMap = rows.reduce((map, row) => {
            map[row.internal_code] = row.id; // Assuming 'internal_code' is the unique key
            return map;
        }, {});
    }else{
        console.log('Alert: species codes were not found');
    }
    return (speciesCodesMap);
};

//Creates one species in the database
export const createSpecies = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const description = data.description;
        const internal_code = data.internal_code;

        const {rows} = await pool.query('INSERT INTO species VALUES(DEFAULT, $1, $2, $3) RETURNING *', [name, description, internal_code]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The species already exist in the DB"});  
        }

        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Species added with ID: ${newId}`)
};

//Updates one species in the database
export const updateSpecies = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE species SET name = $1, description = $2 WHERE id = $3 RETURNING *', [data.name, data.description, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Species with id ${id} modified successfully`);
};

//Deletes one species in the database and returns an http status code
export const deleteSpecies = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM species s WHERE s.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};