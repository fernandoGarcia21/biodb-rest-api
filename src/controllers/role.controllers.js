/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all roles
export const getAllRoles = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM Role');
    res.json(rows);
};

//Query the database to return only one role with a certain id
export const getRole = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM role r WHERE r.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one role in the database
export const createRole = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const {rows} = await pool.query('INSERT INTO role VALUES(DEFAULT, $1) RETURNING *', [name]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The role already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Role added with ID: ${newId}`)
};

//Updates one role in the database
export const updateRole = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE role SET name = $1 WHERE id = $2 RETURNING *', [data.name, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Role with id ${id} modified successfully`);
};

//Deletes one role in the database and returns an http status code
export const deleteRole = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM role r WHERE r.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};