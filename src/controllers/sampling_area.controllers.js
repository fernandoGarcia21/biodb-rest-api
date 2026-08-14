/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-16-06
 */

import { pool } from "../db.js";

//Query the database to return all sampling areas
export const getAllSamplingAreas = async(req, res ) => {
    const {rows} = await pool.query(`SELECT sa.id,
                                            sa.name,
                                            sa.description,
                                            sa.latitude,
                                            sa.longitude,
                                            l.id location_id,
                                            l.name location_name,
                                            c.name country_name,
                                            sa.habitat_id,
                                            h.name habitat_name
                                            FROM sampling_area sa
                                            JOIN location l ON l.id = sa.location_id
                                            JOIN country c ON c.id = l.country_id
                                            LEFT JOIN habitat h ON h.id = sa.habitat_id
                                            ORDER BY 2`);
    res.json(rows);
};

//Query the database to return only one sampling area with a certain id
export const getSamplingArea = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`
                                    SELECT SA.ID,
                                        SA.NAME,
                                        SA.DESCRIPTION,
                                        SA.LATITUDE,
                                        SA.LONGITUDE,
                                        L.COUNTRY_ID,
                                        C.NAME COUNTRY_NAME,
                                        L.ID LOCATION_ID,
                                        L.NAME LOCATION_NAME,
                                        SA.HABITAT_ID,
                                        H.NAME HABITAT_NAME,
                                        H.DESCRIPTION HABITAT_DESCRIPTION
                                    FROM SAMPLING_AREA SA
                                    JOIN LOCATION L ON L.ID = SA.LOCATION_ID
                                    JOIN COUNTRY C ON C.ID = L.COUNTRY_ID
                                    LEFT JOIN HABITAT H ON H.ID = SA.HABITAT_ID
                                    WHERE SA.ID = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};


//Query the database to return all sampling areas and their associated locations
export const getAllSamplingAreasAndLocations = async(req, res ) => {
    const {rows} = await pool.query(`SELECT L.ID LOCATION_ID,
                                            L.NAME LOCATION_NAME,
                                            SA.ID SAMPLING_AREA_ID,
                                            SA.NAME SAMPLING_AREA_NAME,
                                            H.ID HABITAT_ID,
                                            H.NAME HABITAT_NAME
                                        FROM SAMPLING_AREA SA
                                        JOIN LOCATION L ON L.ID = SA.LOCATION_ID
                                        LEFT JOIN HABITAT H ON H.ID = SA.HABITAT_ID
                                        ORDER BY 2, 4 ASC`);
    res.json(rows);
};


//Creates one sampling area in the database
export const createSamplingArea = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const name = data.name;
        const description = data.description;
        const latitude = data.latitude;
        const longitude = data.longitude;
        const location_id = data.location_id;
        const habitat_id = data.habitat_id;

        const {rows} = await pool.query('INSERT INTO sampling_area VALUES(DEFAULT, $1, $2, $3, $4, $5, $6) RETURNING *', [name, description, latitude, longitude, location_id, habitat_id]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The sampling area already exist in the DB"});  
        }

        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Sampling area added with ID: ${newId}`)
};

//Updates one sampling area in the database
export const updateSamplingArea = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE sampling_area SET name = $1, description = $2, latitude = $3, longitude = $4, location_id = $5, habitat_id = $6 WHERE id = $7 RETURNING *', [
            data.name, 
            data.description, 
            data.latitude, 
            data.longitude, 
            data.location_id, 
            data.habitat_id,
            id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Sampling area with id ${id} modified successfully`);
};

//Deletes one sampling area in the database and returns an http status code
export const deleteSamplingArea = async(req, res ) => {
    const {id} = req.params;
    try{
        const {rowCount} = await pool.query('DELETE FROM sampling_area sa WHERE sa.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting sampling area:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete sampling area due to foreign key constraint" });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};