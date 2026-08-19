/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2026-19-08
 */

import { pool } from "../db.js";

//Query the database to return all habitat types
export const getAllHabitats = async(req, res ) => {
    const {rows} = await pool.query(`SELECT h.id,
                                            h.name,
                                            h.description
                                            FROM habitat h
                                            ORDER BY 2`);
    res.json(rows);
};

//Query the database to return only one habitat with a certain id
export const getHabitat = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`
                                    SELECT H.ID,
                                        H.NAME,
                                        H.DESCRIPTION
                                    FROM HABITAT H
                                    WHERE H.ID = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};


//Creates one habitat in the database
export const createHabitat = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const description = data.description;
        const {rows} = await pool.query('INSERT INTO habitat VALUES(DEFAULT, $1, $2) RETURNING *', [name, description]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The habitat already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Habitat added with ID: ${newId}`)
};

//Updates one habitat in the database
export const updateHabitat = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query(`UPDATE habitat 
            SET name = $1, 
            description = $2
            WHERE id = $3 
            RETURNING *`, [data.name, data.description, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Habitat with id ${id} modified successfully`);
};

//Deletes one habitat in the database and returns an http status code
export const deleteHabitat = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM habitat h WHERE h.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};