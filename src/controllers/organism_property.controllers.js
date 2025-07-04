/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import { validateDataType } from "../utilities/data_types.js";
import format from 'pg-format';


//Query the database to return all properties of an organism with a certain organism id
export const getOrganismProperties = async(req, res ) => {
    const {organism_id} = req.params;
    const {rows} = await pool.query('SELECT op.id organism_property_id, op.value, '+ 
                                    'pr.id property_id, pr.name property_name, tr.id trait_id, '+ 
                                    'tr.name trait_name, dt.id data_type_id '+ 
                                    'FROM organism_property op, trait tr, data_type dt, property pr '+ 
                                    'WHERE op.organism_id = $1 '+
                                    'AND op.property_id = pr.id AND pr.trait_id = tr.id AND pr.data_type_id = dt.id '+
                                    'ORDER BY trait_name, property_name', [organism_id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found, properties"});
    }
    res.json(rows);
};

//Add a property of a phenotypic trait to one organism in the database
export const createOrganismProperty = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        let resultDataType = await pool.query('SELECT data_type_id FROM property WHERE id = $1', [data.property_id]);
        if(resultDataType.rows && resultDataType.rows.length > 0){

            //Validate the value of the property has the requiered data type
            let valueValidType = validateDataType(resultDataType.rows[0].data_type_id, data.value);
            if(valueValidType){
                const {rows} = await pool.query('INSERT INTO organism_property VALUES(DEFAULT, $1, $2, $3) RETURNING *', 
                [data.organism_id,
                data.property_id,
                data.value
                ]);
                console.log(rows)
                newId = rows[0].id
            }else{
                return res.status(404).json({message: "Invalid data type"});
            }
            
        }else{
            return res.status(404).json({message: "The trait property was not found"});
        }

    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The property already exists for the organism in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Property with ID: ${newId} was added to the organism.`)
};

//Updates one property of one organism in the database
export const updateOrganismProperty = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{

        let resultDataType = await pool.query('SELECT data_type_id FROM property WHERE id = $1', [data.property_id]);
        if(resultDataType.rows && resultDataType.rows.length > 0){

            //Validate the value of the property has the requiered data type
            let valueValidType = validateDataType(resultDataType.rows[0].data_type_id, data.value);
            if(valueValidType){
                const {rows} = await pool.query('UPDATE organism_property SET property_id = $1, value = $2 WHERE id = $3 RETURNING *', [data.property_id, data.value, id]);
            }else{
                return res.status(404).json({message: "Invalid data type"});
            }

        }else{
            return res.status(404).json({message: "The trait property was not found"});
        }
    }catch(error){
        console.log(error);
        if(error?.code === "23505"){
            return res.status(409).json({message: "The property already exists for the organism in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Property with id ${id} modified successfully`);
};

//Deletes one property of the phenotypic traits of one organism from the database and returns an http status code
export const deleteOrganismProperty = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM organism_property op WHERE op.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};


//Query the database to return all properties of all organisms with a certain organism id from a list
export const getAllPropertiesOrganismList = async( list_organisms ) => {
    const {rows} = await pool.query('SELECT op.id organism_property_id, op.value, '+ 
                                    'pr.id property_id, pr.name property_name, tr.id trait_id, '+ 
                                    'tr.name trait_name, dt.id data_type_id '+ 
                                    'FROM organism_property op, trait tr, data_type dt, property pr '+ 
                                    'WHERE op.organism_id = $1 '+
                                    'AND op.property_id = pr.id AND pr.trait_id = tr.id AND pr.data_type_id = dt.id '+
                                    'ORDER BY trait_name, property_name', [organism_id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Query the database to return all properties of all organisms with a certain organism id from a list
export const getOrganismPropertiesAssociations = async(organism_property_tuples) => {
    const query = `SELECT OP.ID,
                        OP.ORGANISM_ID, 
                        O.INDIVIDUAL_ID,
                        OP.PROPERTY_ID 
                    FROM ORGANISM_PROPERTY OP
                    JOIN ORGANISM O ON O.ID = OP.ORGANISM_ID 
                    WHERE (O.INDIVIDUAL_ID, OP.PROPERTY_ID) IN (%L)`;
    let toupleParam = '';
    for (let i = 0; i < organism_property_tuples.length; i++) {
        let organism_property = organism_property_tuples[i];
        toupleParam += `("${organism_property[0]}", ${organism_property[1]})`;
        toupleParam += i === organism_property_tuples.length - 1 ? '' : ',';
    }
 
    const formatedQuery = format(query, toupleParam).replace(/'/g, "").replace(/"/g, "'");
    console.log(formatedQuery);
    const {rows} = await pool.query(formatedQuery);
    return rows;
}; 