/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all traits
export const getAllTraits = async(req, res ) => {
    const query = `
                    SELECT t.id, t.name, t.description, count(p.id) num_properties, tt.name trait_type_name,
                    CASE
                        WHEN t.is_location_associated = TRUE THEN 'Yes'
                        WHEN t.is_location_associated = FALSE THEN 'No'
                    END AS location_associated
                    FROM trait t
                    LEFT JOIN property p on p.trait_id = t.id
                    LEFT JOIN trait_type tt on tt.id = t.trait_type_id
                    GROUP BY t.id, t.name, t.description, trait_type_name
                    ORDER BY t.name
                    `;
    const {rows} = await pool.query(query);
    res.json(rows);
};

//Query the database to return only one trait with a certain id
export const getTrait = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT T.ID TRAIT_ID,
                                            T.NAME,
                                            T.DESCRIPTION,
                                            T.IS_LOCATION_ASSOCIATED,
                                            T.TRAIT_TYPE_ID,
                                            TT.NAME TRAIT_TYPE_NAME
                                            FROM TRAIT T
                                            JOIN TRAIT_TYPE TT ON TT.ID = T.TRAIT_TYPE_ID
                                            WHERE T.ID = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};


//Query the database to return all traits either associated with location or not
export const getAllTraitsAssociated = async(req, res ) => {
    const query = `
                    SELECT t.id, t.name
                    FROM trait t
                    WHERE t.is_location_associated = $1
                    ORDER BY t.name
                    `;
    const {rows} = await pool.query(query, [req.params.isLocationAssociated]);
    res.json(rows);
};

//Creates one trait in the database
export const createTrait = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const description = data.description;
        const trait_type_id = data.trait_type_id;
        const is_location_associated = data.is_location_associated;
        const {rows} = await pool.query('INSERT INTO trait VALUES(DEFAULT, $1, $2, $3, $4) RETURNING *', [name, description, trait_type_id, is_location_associated]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The trait already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Trait added with ID: ${newId}`)
};

//Updates one trait in the database
export const updateTrait = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query(`
            UPDATE trait SET name = $1, 
            description = $2, 
            trait_type_id = $3, 
            is_location_associated = $4 
            WHERE id = $5 
            RETURNING *`, [data.name, data.description, data.trait_type_id, data.is_location_associated, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Trait with id ${id} modified successfully`);
};

//Deletes one trait in the database and returns an http status code
export const deleteTrait = async(req, res ) => {
    const {id} = req.params;
    try{

        const {rowCount} = await pool.query('DELETE FROM trait t WHERE t.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }

    }catch(error){
        console.error('Error deleting trait:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete trait due to foreign key constraint" });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};