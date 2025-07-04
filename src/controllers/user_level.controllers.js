/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all user level
export const getAllUserLevel = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM user_level ORDER BY 1 ASC');
    res.json(rows);
};

//Query the database to return only one user level with a certain id
export const getUserLevel = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM user_level ul WHERE ul.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one user level in the database
export const createUserLevel = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO user_level VALUES(DEFAULT, $1) RETURNING *', [data.name]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The user level already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`User level added with ID: ${newId}`)
};

//Updates one user level in the database
export const updateUserLevel = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE user_level SET name = $1 WHERE id = $2 RETURNING *', [data.name, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`User level with id ${id} modified successfully`);
};

//Deletes one user level in the database and returns an http status code
export const deleteUserLevel = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM user_level ul WHERE ul.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};