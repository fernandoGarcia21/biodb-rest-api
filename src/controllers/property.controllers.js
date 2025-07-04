/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all properties
export const getAllProperties = async(req, res ) => {
    const {rows} = await pool.query(`SELECT p.id, p.name, p.description, t.id trait_id, t.name trait_name, d.name data_type_name, p.template_column_name, p.pre_defined_values FROM property p join trait t on p.trait_id = t.id join data_type d on p.data_type_id = d.id ORDER BY trait_name, p.name`);
    res.json(rows);
};


//Query the database to return all properties along with their trait name
export const getAllPropertiesAndTrait = async(req, res ) => {
    const {rows} = await pool.query('SELECT p.id, p.name, t.name trait_name, p.template_column_name, p.pre_defined_values FROM property p join trait t on p.trait_id = t.id ORDER BY trait_name, p.name');
    res.json(rows);
};

//Query the database to return only one property with a certain id
export const getProperty = async(req, res ) => {
    const {id} = req.params;
    const query = `
        SELECT p.id id, p.name name, p.description description, 
               p.trait_id trait_id, t.name trait_name, 
               p.data_type_id data_type_id, d.name data_type_name, 
               p.template_column_name template_column_name,
               p.pre_defined_values pre_defined_values,
               p.protocol protocol
        FROM property p 
        JOIN trait t ON p.trait_id = t.id 
        JOIN data_type d ON p.data_type_id = d.id 
        WHERE p.id = $1
        `;
    const {rows} = await pool.query(query, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Query the database to return all properties of a given trait id
export const getPropertiesByTrait = async(req, res ) => {
    const {trait_id} = req.params;
    const {rows} = await pool.query('SELECT p.id, p.name, p.description, t.name trait_name, d.name data_type_name, p.template_column_name, p.pre_defined_values FROM property p join trait t on p.trait_id = t.id join data_type d on p.data_type_id = d.id WHERE p.trait_id = $1', [trait_id]);

    res.json(rows);
};


//Creates one property in the database
export const createProperty = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO property VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7) RETURNING *', [data.name,
            data.description,
            data.trait_id,
            data.data_type_id,
            data.template_column_name,
            data.pre_defined_values,
            data.protocol
        ]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The property already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Property added with ID: ${newId}`)
};

//Updates one property in the database
export const updateProperty = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query(`UPDATE property 
            SET name = $1, 
            description = $2, 
            data_type_id = $3, 
            template_column_name = $4,
            pre_defined_values = $5,
            protocol = $6
            WHERE id = $7 
            RETURNING *`, [data.name, data.description, data.data_type_id, data.template_column_name, data.pre_defined_values, data.protocol, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Property with id ${id} modified successfully`);
};

//Deletes one property in the database and returns an http status code
export const deleteProperty = async(req, res ) => {
    const {id} = req.params;

    try{

        const {rowCount} = await pool.query('DELETE FROM property p WHERE p.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting property:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete property due to foreign key constraint" });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};