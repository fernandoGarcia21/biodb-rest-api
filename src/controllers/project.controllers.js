/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return all projects
export const getAllProjects = async(req, res ) => {
    const {rows} = await pool.query(`SELECT  pr.id,
                                                pr.name,
                                                pr.description,
                                                pr.owner_person_id,
                                                pe.first_name || ' ' || pe.family_name owner_person_name,
                                                pe.email owner_person_email,
                                                string_agg(ped.external_dataset_id::TEXT, ' | ') AS external_dataset_ids,
                                                string_agg(ed.name::TEXT, '|') AS external_dataset_names
                                        FROM project pr
                                        JOIN person pe ON pe.id = pr.owner_person_id
                                        LEFT JOIN project_external_dataset ped on ped.project_id = pr.id
                                        LEFT JOIN external_dataset ed on ed.id = ped.external_dataset_id
                                        GROUP BY 1,2,3,4,5,6
                                        ORDER BY 2 ASC`);
    res.json(rows);
};

//Query the database to return only one project with a certain id
export const getProject = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT  pr.id,
                                                pr.name,
                                                pr.description,
                                                pr.owner_person_id,
                                                pe.first_name || ' ' || pe.family_name owner_person_name,
                                                pe.email owner_person_email
                                        FROM project pr
                                        JOIN person pe ON pe.id = pr.owner_person_id
                                        WHERE pr.id = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one project in the database
export const createProject = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO project VALUES(DEFAULT, $1, $2, $3) RETURNING *', [data.name, data.description, data.owner_person_id]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The project already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Project added with ID: ${newId}`)
};

//Updates one project in the database
export const updateProject = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE project SET name = $1, description = $2, owner_person_id = $3 WHERE id = $4 RETURNING *', [data.name, data.description, data.owner_person_id, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Project with id ${id} modified successfully`);
};

//Deletes one project in the database and returns an http status code
export const deleteProject = async(req, res ) => {
    const {id} = req.params;
    try{
        const {rowCount} = await pool.query('DELETE FROM project p WHERE p.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting project:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete project due to foreign key constraint." });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};



//Query the database to return the external datasets associated to one project with a certain id
export const getProjectExternalDatasets = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT ped.id,
                                            ed.id as external_dataset_id,
                                            ed.name as dataset_name,
                                            ed.url,
                                            td.name as type_dataset_name
                                        FROM project_external_dataset ped
                                        JOIN external_dataset ed on ed.id = ped.external_dataset_id
                                        JOIN type_dataset td on td.id = ed.type_dataset_id
                                        WHERE ped.project_id = $1
                                        ORDER BY type_dataset_name, dataset_name asc`, [id]);

    res.json(rows);
};

//Query the database to return the external datasets associated to one project with a certain id
export const getAvailableProjectExternalDatasets = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT ed.id as external_dataset_id,
                                            ed.name as dataset_name,
                                            td.name as type_dataset_name
                                        FROM external_dataset ed
                                        JOIN type_dataset td on td.id = ed.type_dataset_id
                                        LEFT JOIN project_external_dataset ped 
                                                        on ped.external_dataset_id = ed.id
                                                        AND ped.project_id = $1
                                        WHERE ped.id IS NULL
                                        ORDER BY type_dataset_name, dataset_name ASC`, [id]);

    res.json(rows);
};


//Creates the association between one project and one external dataset in the database
export const createProjectExternalDataset = async(req, res ) => {
    const data = req.body;
    const {id} = req.params;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO project_external_dataset VALUES(DEFAULT, $1, $2) RETURNING *', [id, data.external_dataset_id]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The project-external dataset association already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Project-external dataset added with ID: ${newId}`)
};


//Deletes the association between one project and one external dataset in the database and returns an http status code
export const deleteProjectExternalDataset = async(req, res ) => {
    const {id} = req.params;
    try{
        const {rowCount} = await pool.query('DELETE FROM project_external_dataset ped WHERE ped.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting project:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete project-external dataset association due to foreign key constraint." });
        }
        return res.status(500).json({message: "Internal server error"}); 
    }  

    return res.sendStatus(204);
};
