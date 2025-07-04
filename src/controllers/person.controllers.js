/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import { createUserFromPerson } from "./user.controllers.js";

//Query the database to return all persons
export const getAllPersons = async(req, res ) => {
    const {rows} = await pool.query(`SELECT p.*,
                                            uc.id user_id
                                        FROM person p
                                        LEFT JOIN user_credentials uc ON uc.person_id = p.id
                                        ORDER BY p.first_name, p.family_name ASC`);
    res.json(rows);
};

//Query the database to return only one person with a certain id
export const getPerson = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM person p WHERE p.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};


//Creates one person in the database
export const createPerson = async(req, res ) => {
    const data = req.body;
    let newId = 0;
 
    const client = await pool.connect();
    try{ 
        await client.query('BEGIN'); //Begining the transaction
        const {rows} = await client.query('INSERT INTO person VALUES(DEFAULT, $1, $2, $3, $4, $5) RETURNING *', [
            data.first_name, 
            data.family_name, 
            data.abbreviation, 
            data.email, 
            data.additional_info]);
        console.log(rows);

        newId = rows[0].id;
        
        //If the user is to be created, as indicated in the create person form 
        if(data.is_create_user === true){
            //Create a user from the person
            await createUserFromPerson(client, newId, data.user_level_id, data.password, req.personId);
    }

        await client.query('COMMIT'); //Commit the changes
    }catch(error){
        await client.query('ROLLBACK'); //rollback the person/user insertions
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The person or the user already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Person added with ID: ${newId}`)
};

//Updates one person in the database
export const updatePerson = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE person SET first_name = $1, family_name = $2, abbreviation = $3, email = $4, additional_info = $5 WHERE id = $6 RETURNING *', [data.first_name, data.family_name, data.abbreviation, data.email, data.additional_info, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Person with id ${id} modified successfully`);
};

//Deletes one person in the database and returns an http status code
export const deletePerson = async(req, res ) => {
    const {id} = req.params;
    try{
        const {rowCount} = await pool.query('DELETE FROM person p WHERE p.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting person:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete person due to foreign key constraint." });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  
    return res.sendStatus(204);
};

