/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all user status
export const getAllUserStatus = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM user_status');
    res.json(rows);
};

//Query the database to return only one user status with a certain id
export const getUserStatus = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM user_status us WHERE us.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one user status in the database
export const createUserStatus = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO user_status VALUES(DEFAULT, $1, $2) RETURNING *', [data.name, data.description]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The user status already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`User status added with ID: ${newId}`)
};

//Updates one user status in the database
export const updateUserStatus = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE user_status SET name = $1, description = $2 WHERE id = $3 RETURNING *', [data.name, data.description, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`User status with id ${id} modified successfully`);
};

//Deletes one user status in the database and returns an http status code
export const deleteUserStatus = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM user_status us WHERE us.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};