/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all locations
export const getAllLocations = async(req, res ) => {
    const {rows} = await pool.query(`SELECT l.id,
                                            l.name,
                                            co.name country_name,
                                            l.extra_info,
                                            count(distinct p.trait_id) traits
                                            FROM location l
                                            JOIN country co on co.id = l.country_id
                                            LEFT JOIN location_property lp on lp.location_id = l.id
                                            LEFT JOIN property p on p.id = lp.property_id
                                            GROUP BY 1,2,3,4
                                            ORDER BY 2`);
    res.json(rows);
};

//Query the database to return only one location with a certain id
export const getLocation = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT l.id,
                                        l.name,
                                        co.name country_name,
                                        l.extra_info
                                        FROM location l
                                        JOIN country co on co.id = l.country_id
                                        where l.id = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one location in the database
export const createLocation = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const country_id = data.country_id;
        const extra_info = data.extra_info;

        const {rows} = await pool.query('INSERT INTO location VALUES(DEFAULT, $1, $2, $3) RETURNING *', [name, country_id, extra_info]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The location already exist in the DB"});  
        }

        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Location added with ID: ${newId}`)
};

//Updates one location in the database
export const updateLocation = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE location SET name = $1, country_id = $2, extra_info = $3 WHERE id = $4 RETURNING *', [
            data.name, 
            data.country_id, 
            data.extra_info, 
            id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Location with id ${id} modified successfully`);
};

//Deletes one location in the database and returns an http status code
export const deleteLocation = async(req, res ) => {
    const {id} = req.params;
    try{
        const {rowCount} = await pool.query('DELETE FROM location l WHERE l.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting location:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete location due to foreign key constraint" });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};


//Query the database to return a list of locations associated with a certain country id
export const getLocationsByCountry = async(req, res ) => {
    const {countryId} = req.params;
    const {rows} = await pool.query(`SELECT *
                                    FROM LOCATION L
                                    WHERE L.COUNTRY_ID = $1
                                    ORDER BY 2 ASC`, [countryId]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};
