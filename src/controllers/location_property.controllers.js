/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-02-05
 */

import { pool } from "../db.js";

//Query the database to return all trait and properties that a location can have
//and the values associated to one location
export const getAllPropertiesByLocation = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT 
                                            t.id, 
                                            t.name trait_name, 
                                            t.description trait_description, 
                                            tt.name trait_type_name,
                                            p.id property_id,
                                            p.name property_name,
                                            p.description property_description,
                                            dt.name data_type_name,
                                            lp.id location_property_id,
                                            lp.value
                                            FROM trait t
                                            JOIN property p on p.trait_id = t.id
                                            JOIN trait_type tt on tt.id = t.trait_type_id
                                            JOIN data_type dt on dt.id = p.data_type_id
                                            LEFT JOIN location_property lp ON lp.property_id = p.id AND lp.location_id = $1
                                            WHERE t.is_location_associated = TRUE
                                            ORDER BY trait_name, property_name`, [id]);
    res.json(rows);
};


//Query the database to return all properties for all traits that are
//not associated to locations but to invdividuals
export const getAllTraitPropertiesNoLocation = async(req, res ) => {
    const {rows} = await pool.query(`SELECT 
                                            t.id trait_id, 
                                            t.name trait_name, 
                                            tt.name trait_type_name,
                                            t.trait_type_id,
                                            p.id property_id,
                                            p.name property_name,
                                            dt.id data_type_id,
                                            dt.name data_type_name
                                        FROM trait t
                                        JOIN trait_type tt on tt.id = t.trait_type_id
                                        JOIN property p on p.trait_id = t.id
                                        JOIN data_type dt on dt.id = p.data_type_id
                                        WHERE t.is_location_associated = FALSE
                                        ORDER BY trait_name, property_name`, []);

    res.json(rows);
};


//Query the database to return all properties of a given trait id that are not assigned to a given location
export const getMissingPropertiesByTraitLocation = async(req, res ) => {
    const {trait_id, location_id} = req.params;
    const {rows} = await pool.query(`SELECT 
                                        p.id, 
                                        p.name, 
                                        p.description, 
                                        t.name trait_name, 
                                        d.name data_type_name, 
                                        p.template_column_name 
                                    FROM property p 
                                    join trait t on p.trait_id = t.id 
                                    join data_type d on p.data_type_id = d.id 
                                    WHERE p.trait_id = $1 
                                    AND p.id NOT IN (
                                        SELECT lp.property_id
                                        FROM location_property lp
                                        WHERE lp.location_id = $2
                                    )`, [trait_id, location_id]);

    res.json(rows);
};

//Add a property of a trait to one location in the database
export const addLocationProperty = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO location_property VALUES(DEFAULT, $1, $2, $3) RETURNING *', 
        [data.location_id,
        data.property_id,
        data.value
        ]);
        console.log(rows)
        newId = rows[0].id

    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The property already exists for the location in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Property with ID: ${newId} was added to the location.`)
};




//Deletes one location property in the database and returns an http status code
export const deleteLocationProperty = async(req, res ) => {
    const {id} = req.params;
    try{
        const {rowCount} = await pool.query('DELETE FROM location_property lp WHERE lp.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting location property:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete location property due to foreign key constraint" });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};



//Query the database to return only one location property with a certain id
export const getOneLocationProperty = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT lp.id,
                                            l.name location_name,
                                            t.name trait_name,
                                            lp.property_id,
                                            p.name property_name,
                                            p.data_type_id,
                                            dt.name data_type_name,
                                            lp.value
                                        FROM location_property lp
                                        JOIN location l on l.id = lp.location_id
                                        JOIN property p on p.id = lp.property_id
                                        JOIN data_type dt on dt.id = p.data_type_id
                                        JOIN trait t on t.id = p.trait_id
                                        WHERE lp.id = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};



//Update a property value of a location in the database
export const updateLocationProperty = async(req, res ) => {
    const data = req.body;
    console.log(data);
    const {id} = req.params;
    try{
        const {rows} = await pool.query('UPDATE location_property set value = $1 WHERE id = $2 RETURNING *', 
        [data.value, id]);
        console.log(rows)

    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Location property with id ${id} modified successfully`);
};