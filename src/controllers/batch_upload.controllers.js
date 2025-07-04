/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import {bu_status_submitted, bu_status_running, bu_status_completed, bu_status_failed, bu_data_type_organism, bu_data_type_properties, backup_type_organism, backup_type_properties, backup_type_project_organism, name_setting_uploads_path, bu_column_organism_id, bu_column_species, bu_column_sampling_site, batch_type_upload, batch_type_delete, bu_column_projects } from "../constants.js";
import { getOrganismsByListIds } from './organism.controllers.js';
import {getOrganismPropertiesAssociations} from './organism_property.controllers.js';
import { validateDataType, validatePreDefinedValue } from "../utilities/data_types.js";
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';


//Query the database to return all chromosomes
export const getBatchProcesses = async(req, res ) => {
    const {rows} = await pool.query(`SELECT 
                                            bu.id,
                                            bu.file_name,
                                            bu.internal_file_name,
                                            bu.parameters,
                                            bt.name batch_type,
                                            pe.first_name || ' ' || pe.family_name uploaded_by,
                                            bu.status status_id,
                                            CASE
                                                WHEN bu.status = '1' THEN 'Submitted'
                                                WHEN bu.status = '2' THEN 'Running'
                                                WHEN bu.status = '3' THEN 'Completed'
                                                WHEN bu.status = '4' THEN 'Cancelled'
                                                WHEN bu.status = '5' THEN 'Failed'
                                                ELSE bu.status  -- Handle cases where the number doesn't match
                                            END AS status,
                                            to_char(bu.date_submitted, 'DD-MM-YYYY HH24:MI') date_submitted,
                                            to_char(bu.date_started, 'DD-MM-YYYY HH24:MI') date_started,
                                            to_char(bu.date_completed, 'DD-MM-YYYY HH24:MI') date_completed,
                                            bu.logs
                                            FROM batch_upload bu
                                            JOIN batch_type bt on bt.id = bu.batch_type_id
                                            JOIN person pe on pe.id = bu.uploaded_by_person_id
                                            ORDER BY bu.date_submitted DESC
                                            `);
    res.json(rows);
};


//Creates one instance of a batch upload in the database
export const submitBatchUpload = async(req, res) => {
    const data = req.body;
    let newId = 0;
    try{
        //const internal_file_name = uniqueFilename(BATCH_FILES_DIRECTORY, 'b'+data.batch_type_id+'-p'+data.person_id)+'.tsv';
        const internal_file_name = req.file.filename;
        const original_file_name = req.file.originalname;
        const {rows} = await pool.query('INSERT INTO batch_upload VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, NULL, NULL, NULL, $7) RETURNING *', [original_file_name, internal_file_name, data.parameters, data.batch_type_id, data.person_id, bu_status_submitted, data.batch_name]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The batch upload already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Batch added with ID: ${newId}`)
};


//This function permites to manually refresh the materialized view
//that contains all the information of the organisms and is used in the front end
//to show the organisms in the table
export const manuallyRefreshMaterializedViews = async(req, res ) => {
    try{
        refreshMaterializedViewsMain();
    }catch(error){
        console.log(error);
        return res.status(500).json({message: error.message});

    }
    res.status(201).send('Manually refreshing of the materialized views ended successfully');
}

//This function executes the query to refresh the materialized view
export const refreshMaterializedViewsMain = async() => {
        console.log('REFRESHING MATERIALIZED VIEWS');
        //Query to refresh the materialized view that associates individuals and properties
        const queryMViewOrganismsProperties = `REFRESH MATERIALIZED VIEW view_all_organisms_info`;
        await pool.query(queryMViewOrganismsProperties);

        //Query to refresh the materialized view that associates individuals and projects
        const queryMViewOrganismsProjects = `REFRESH MATERIALIZED VIEW view_project_organism`;
        await pool.query(queryMViewOrganismsProjects);

        //Query to refresh the materialized views for the home page
        const queryMViewSpeciesCounts = `REFRESH MATERIALIZED VIEW view_home_species_counts`;
        const queryMViewTraitsDataCounts = `REFRESH MATERIALIZED VIEW view_home_traits_data_counts`;
        const queryMViewLocationOrganismsCounts = `REFRESH MATERIALIZED VIEW view_home_location_organisms_counts`;
        const queryMViewLatestDatasets = `REFRESH MATERIALIZED VIEW view_home_latest_datasets`;

        await pool.query(queryMViewSpeciesCounts);
        await pool.query(queryMViewTraitsDataCounts);
        await pool.query(queryMViewLocationOrganismsCounts);
        await pool.query(queryMViewLatestDatasets);

        console.log('FINISHED REFRESHING');
}


//This function executes the main process of the batch upload
//and it is called by the route /batch_upload/start rest API
//It was created for testing purposes
export const startBatchProcess = async(req, res ) => {
    try{
        startBatchProcessMain();
    }catch(error){
        console.log(error);
        return res.status(500).json({message: "Internal server error"});

    }
    res.status(201).send('Batch upload process ended');
}


//Inserts in the database a set of rows from a csv file 
// as indicated in a submitted batch upload process
export const startBatchProcessMain = async( ) => {

    const queryInitialUpdateBatchUpload = 'UPDATE batch_upload SET status = $1';
    //Get only the first pending batch upload job from the queue sorted by date submitted
    const queryPendingBatchJobs = `SELECT * 
                                   FROM batch_upload b 
                                   WHERE b.status = $1 
                                   ORDER BY b.date_submitted ASC
                                   FETCH FIRST ROW ONLY`;
    const {rows} = await pool.query(queryPendingBatchJobs, [bu_status_submitted]);

    //Verify there are pending batch uploads to process
    if(rows.length > 0){
        //Process each batch upload process as a promise
        await Promise.all(
            rows.map(async batch => { //the object row is each row from the csv data file (except the first line)
                console.log('Procesing as promise: ' + batch.internal_file_name);
                const client = await pool.connect();

                //Update the status of the batch_upload process in the database to iniciated
                let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', date_started = CURRENT_TIMESTAMP WHERE id = $2';
                await pool.query(queryUpdateBatchUpload, [bu_status_running, batch.id]);
                await client.query('COMMIT'); //Commit the changes

                const fixedColumnsData = []; //Will contain the data of the organism standard id, species and sampling site
                const propertiesData = []; //Will have the data of the properties (phenotypes, environment, external datasets)

                //This objet will contain the ID and template names of the properties for a phenotypic batch upload
                let mapHeadersAndIds = []; 
                let isDataOk = true;

                const fullFilePath = path.join(global.customSettings[name_setting_uploads_path], batch.internal_file_name);
                
                //Create a promise to validate the consistency of the headers of the file.
                //Only if this promise is resolved as true, the program continues to validate the data
                const validateHeadersPromise = new Promise((resolve) => {
                    let headerPassed = false;
                    //Start a stream to read the file and save the rows in the database
                    const readStream = fs.createReadStream(fullFilePath);
                    readStream.pipe(csv())
                    .on("headers", async(headers) => {
                        console.log(' -> On Headers was called');
                        try{
                            //Validate that headers are valid fields
                            mapHeadersAndIds = await validateBatchHeaders(headers, batch.batch_type_id);
                            headerPassed = true;

                            readStream.close();
                        }catch(error){
                            // Update the status of the batch_upload process to failed
                            let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', logs = $2 WHERE id = $3';
                            await pool.query(queryUpdateBatchUpload, [bu_status_failed, error.message, batch.id]);
                            await client.query('COMMIT');
                            readStream.close();
                        }
                        resolve(headerPassed);
                    })
                    .on('error',
                        async(error) => {
                            // Update the status of the batch_upload process to failed
                            let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', logs = $2 WHERE id = $3';
                            await pool.query(queryUpdateBatchUpload, [bu_status_failed, error.message, batch.id]);
                            await client.query('COMMIT');
                            readStream.close();
                            resolve(headerPassed);
                            });       
                    });

                    //Call the promise to validate headers, then
                    //if headers are correct validate data
                    await validateHeadersPromise.then((isHeadersOk) => {
                    //Only if the header was evaluated, process the file content
                    console.log(isHeadersOk);
                    if(isHeadersOk){
                        const readStream = fs.createReadStream(fullFilePath);
                        let errorMessageDataValidation = '';
                        const dataPromises = [];
                        readStream.pipe(csv())
                            .on("data", async (row) => {
                                console.log(' -> On Data was called');
                                dataPromises.push((async () => {
                                    try{
                                        console.log(row);
                                        //Separate the data of the fixed headers (organism id, species, sampling site) 
                                        fixedColumnsData.push(await validateFixedHeadersData(row));
                                        //from the data of the properties
                                        //If the batch type is a phenotypic upload, the properties must be validated. If there are no properties in the template, the data is not validated
                                        if(mapHeadersAndIds && mapHeadersAndIds.length > 0){
                                            propertiesData.push(await validatePropertiesData(row, mapHeadersAndIds)); 
                                        }
                                        console.log('*************');
                                        console.log(propertiesData);
                                    }catch(error){
                                        isDataOk = false;
                                        //Concatenate the error message to save in the log of the batch process in the DB
                                        errorMessageDataValidation = errorMessageDataValidation + '\r\n' + error.message;
                                    }
                                })());//Close the push of dataPromises
                            })
                            .on('error',
                                async(error) => {
                                    isDataOk = false;
                                    // Update the status of the batch_upload process to failed
                                    let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', logs = $2 WHERE id = $3';
                                    await pool.query(queryUpdateBatchUpload, [bu_status_failed, error.message, batch.id]);
                                    await client.query('COMMIT');
                                    readStream.close();
                                    })
                            .on("end", async () => {
                                console.log("File reading finished, next proceed to insert into the DB.");
                                try{
                                    await Promise.all(dataPromises);
                                    if(isHeadersOk & isDataOk){ //if the validation of the headers and data in the previous step failed, the flags are false

                                        console.log(propertiesData);
                                        let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', date_completed = CURRENT_TIMESTAMP WHERE id = $2';

                                        await client.query('BEGIN'); //Begining the transaction

                                        //ToDo
                                        //Verify what is the type of batch upload
                                        //If it is a file upload or a data delete in batch
                                        
                                        switch(batch.batch_type_id){
                                            //The batch type is a data upload
                                            case (batch_type_upload): {
                                                let promisesBatchProcess = [];
                                                //After headers and data content were validated, organisms that are not
                                                //found in the DB must be created, and their IDs must be added to the phenotypes data
                                                const completeDataInsert = await addOrganismDBIdsToProperties (fixedColumnsData, propertiesData, client, batch);

                                                //Flatten the array of arrays that contains the values of the insert
                                                promisesBatchProcess = completeDataInsert.map(async propertiesData => { //the object propertiesData contains the values of the properties of a given individual from the csv data file
                                                    console.log(propertiesData);
                                                   
                                                    const tmpInsertData = propertiesData.slice(0,3); //The data to insert is the first three elements of the array
                                                    await client.query(await prepareInsertQuery(bu_data_type_properties, propertiesData), tmpInsertData);
                                                });

                                                //Execute all the promises of the batch process
                                                await Promise.all(promisesBatchProcess
                                                ) .then(async () => { 
                                                    console.log(`Tasks of batch ${batch.id} completed successfully`); 
                                                    await pool.query(queryUpdateBatchUpload, [bu_status_completed, batch.id])
                                                }) .catch( (error) => {
                                                    console.log(error);
                                                    throw error;
                                                });
                                                await client.query('COMMIT');
                                                console.log('All records processed successfully.');

                                                break;
                                            }// Close case 1
                                            //The batch type is a data delete
                                            case (batch_type_delete): {
                                                console.log('READY TO DELETE');

                                                //The following two params are found in the batch_upload table, column parameters

                                                if(batch.parameters == null || batch.parameters == undefined){
                                                    throw new Error('The batch process is missing the required parameters is_delete_organism and list_delete_properties');
                                                }

                                                //parameters to delete
                                                let isDeleteOrganism = '';
                                                let listDeleteProperties = [];

                                                try{
                                                    //Evaluate that the parameters have a correct json format
                                                    console.log('-----Printing the parameters');
                                                    console.log(batch.parameters);
                                                    isDeleteOrganism = JSON.parse(batch.parameters).is_delete_organism;
                                                    listDeleteProperties = JSON.parse(batch.parameters).list_delete_properties;
                                                    console.log(JSON.parse(batch.parameters));
                                                }catch(error){
                                                    throw new Error('The format of the parameters property () of the batch process is not a valid Json object. ' + error.message);
                                                }
                                                
                                                //Extract the indvidual ids from the object fixedColumnsData
                                                const listIndividualIds = fixedColumnsData.map(org => org.organism_id);

                                                //If an array with the properties to delete was sent or the entire organisms will be deleted
                                                //1. we must create a security copy of properties before deleting in the table historical_properties
                                                if((isDeleteOrganism != undefined && isDeleteOrganism) || (listDeleteProperties != undefined && listDeleteProperties.length > 0)){
                                                    console.log(' *Backup of properties and organisms');
                                                    //Create the backup of the properties to be deleted
                                                        await executeBackupQuery(backup_type_properties, listIndividualIds, 'D', batch.uploaded_by_person_id, batch.id, client);
                                                        console.log('Backup of properties successful');

                                                        //Delete the properties just after the backup was executed successfully
                                                        //If an error occur during the backup, the program jumps to the catch and
                                                        //the deletion does not occur
                                                        await executeDeleteQuery (backup_type_properties, listIndividualIds, listDeleteProperties, isDeleteOrganism, client);
                                                        console.log('Delete of properties successful');
                                                    
                                                }

                                                //2. If the entire organisms will be deleted, we must create a copy of the organisms in the table historical_organism and a copy of the associations between organisms and projects
                                                if(isDeleteOrganism != undefined && isDeleteOrganism){
                                                    //2.1. Create a copy of the organisms
                                                    await executeBackupQuery(backup_type_organism, listIndividualIds, 'D', batch.uploaded_by_person_id, batch.id, client);

                                                    //2.1. Create a copy of the project_organism associations before deleting
                                                    await executeBackupQuery(backup_type_project_organism, listIndividualIds, 'D', batch.uploaded_by_person_id, batch.id, client);

                                                    //If an error occur during the backup, the program jumps to the catch and
                                                    //the deletion does not occur

                                                    //2.3. Delete the project organisms
                                                        await executeDeleteQuery (backup_type_project_organism, listIndividualIds, [], null, client);
                                                        console.log('Delete of project_organisms successful');

                                                        //2.4. Delete the organisms
                                                        await executeDeleteQuery (backup_type_organism, listIndividualIds, [], null, client);
                                                        console.log('Delete of organisms successful');

                                                }
                                                //Update the batch upload table with the status 'completed'
                                                console.log(`Tasks of batch ${batch.id} completed successfully`); 
                                                await pool.query(queryUpdateBatchUpload, [bu_status_completed, batch.id])

                                                //Commit the changes after all steps of the delete transaction were succesfully executed
                                                await client.query('COMMIT');
                                                break;
                                            }//close case 2
                                            default : {
                                                throw new Error(`The batch type ${batch.batch_type_id} is unknown`);
                                            }
                                        }
                                        
                                    }//if is data ok
                                    else{
                                        // Update the status of the batch_upload process to failed
                                        let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', logs = $2 WHERE id = $3';
                                        errorMessageDataValidation = 'Summary of data validation:' + errorMessageDataValidation;
                                        await pool.query(queryUpdateBatchUpload, [bu_status_failed, errorMessageDataValidation, batch.id]);
                                        await client.query('COMMIT');
                                        readStream.close();
                                    }

                                }catch(error){//Error to handle the database errors
                                    console.log('* Error processing batch *');
                                    console.error(error);

                                    //Try to get the line number in the csv file where there is a problem
                                    const stackLines = error.stack.split('\n');
                                    let extraInfoMessage = '';
                                    try{
                                        let auxLineNumber = stackLines[4].split(" ").slice(-1)[0];
                                        auxLineNumber = parseInt(extraInfoMessage.split(")")[0]);
                                        if(!isNaN(auxLineNumber)){
                                            extraInfoMessage = 'The problem might be on line ' + (auxLineNumber+2);
                                        }
                                    }catch(error){
                                        extraInfoMessage = '';
                                    }

                                    //If an error occurred, then rollback, report it in the batch_upload status and logs
                                    await client.query('ROLLBACK'); //rollback the batch insertions, so no data associated with this transaction is inserted.

                                    // Update the status of the batch_upload process to failed
                                    let queryUpdateBatchUpload = queryInitialUpdateBatchUpload + ', logs = $2 WHERE id = $3';
                                    await pool.query(queryUpdateBatchUpload, [bu_status_failed, error.message + '. ' +extraInfoMessage, batch.id]);
                                    await client.query('COMMIT');

                                }finally{
                                    console.log('Releasing the client');
                                    client.release();
                                }
                            });//Close the readstream of the data
                        }//Only if the headers were evaluated and are correct

                    }).catch((err) => {
                    console.error(err);
                    });//Close the then in the promise of Validate headers

                
                })// cLOSE THE MAP OF THE BATCHES
            );//CLOSE THE PROMISE ALL OF THE BATCHES
    }else{
        console.log('There are no pending jobs.')
    }
};


//Add the Ids of the organisms to the trait data before inserting.
//E.g. phenotypic traits require the numeric id of the organism
//But the template provides the text standard id.
//So, if the organism does not exist in the DB, the function creates the organism 
//and returns the id of the created organism.
//If the organism exists, the function updates the information of the organism.
async function addOrganismDBIdsToProperties (fixedColumnsData, propertiesData, client, batch){

    const tmpListIds = new Set(fixedColumnsData.map(item => item.organism_id));
    const uniqueListIdsTemplate = Array.from(tmpListIds);

    //Query the DB to obtain the numeric ID of the provided organisms in the template
    const organismNumericIds = await getOrganismsByListIds(uniqueListIdsTemplate);
    const organismIndividualIds = organismNumericIds.map(organism => organism.individual_id);
    console.log(organismNumericIds);

    //Identify the organisms that are not found in the DB and thus must be created
    const nonFoundIdsTemplate = uniqueListIdsTemplate.filter(uniqueId => !organismIndividualIds.includes(uniqueId));

    let newIds = [];
    //Insert organisms in the DB
    const listNewIds = await Promise.all(
        //Itterate over all ids non found in the DB to insert them in the DB
        nonFoundIdsTemplate.map(async standardIdTemplate => {
            console.log(standardIdTemplate);
            //Get all the information from the template of a missing DB individual 
            let tmpFixedData = fixedColumnsData.find(data => data.organism_id == standardIdTemplate);
            const tmpFixedDataInsert = { ...tmpFixedData };
            delete tmpFixedDataInsert['project_ids'];//Remove the property project_ids from the object to insert in the DB
            let tmpInsertQuery = prepareInsertQuery(bu_data_type_organism, tmpFixedDataInsert);
            let tmpInsertData = [];
            let newOrganismId = null;
 
            //The data of the new organism must have species ID
            if(tmpFixedData.hasOwnProperty('species_id')){ 
                tmpInsertData = [tmpFixedData.organism_id,
                    tmpFixedData.species_id];      
                    if(tmpFixedData.hasOwnProperty('sampling_site_id')){
                        tmpInsertData.push(tmpFixedData.sampling_site_id);
                    }
                const {rows} = await client.query(tmpInsertQuery, tmpInsertData);
                newOrganismId = rows[0].id;


                //if the fixed columns include the project association, then update the project association table by deleting the old associations and inserting the new ones
                if(tmpFixedData.hasOwnProperty('project_ids')){
                    console.log('Inserting project associations');
                    const tmpProjects = tmpFixedData.project_ids;
                    console.log(tmpProjects);

                    //Insert the new associations
                    await Promise.all(
                        tmpProjects.map(async project => {
                            const {rows} = await client.query('INSERT INTO project_organism VALUES(DEFAULT, $1, $2)', [project, newOrganismId]);
                        })
                    ) .then(async () => {
                        console.log('Project associations inserted');
                    }) .catch( (error) => {
                        console.log(error);
                        throw new Error(`Error occurred during the insert of the organism and project associations for the organism ${tmpFixedData.organism_id}: ${error.message}`);
                    });
                }


            }else{
                throw new Error('Data for new organism ' + standardIdTemplate +' is incomplete. Species Id is required when creating a new organism');
            }
            //All the returns are merged in the '.them()' event into an array
            return({fixedId: standardIdTemplate,
                    dbId: newOrganismId});
        })
    ) .then(async (newOrganismDB) => {
        console.log('Organisms inserted' + newOrganismDB); 
        newIds = newOrganismDB;
    }) .catch( (error) => {
        console.log(error);
        throw error;
    }); 
    console.log(newIds); 

    //After Inserting new individuals, update individuals that are already in the DB 
    // (species ID, sampling site) if the info was provided
    //organismIndividualIds
    
    await Promise.all(
        //Itterate over all ids of organisms found in the DB to update their organism data in the DB
        organismNumericIds.map(async organismDb => {
            console.log(organismDb);
            //Get all the information from the template of a missing DB individual 
            let tmpFixedData = fixedColumnsData.find(data => data.organism_id == organismDb.individual_id);
 
            //If the data in the template for an organism has either species info or sampling site info (or both)
            const tmpFixedDataUpdate = { ...tmpFixedData };
            delete tmpFixedDataUpdate['project_ids'];//Remove the property project_ids from the object to insert in the DB
            let { organism_id, ...tmpUpdateData } = tmpFixedDataUpdate;
            let tmpUpdateQuery = prepareUpdateQuery(bu_data_type_organism, tmpUpdateData);
            if(tmpUpdateData.hasOwnProperty('species_id') | tmpUpdateData.hasOwnProperty('sampling_site_id')){ 
                const tmpUpdateDataArray = Object.values(tmpUpdateData);
                tmpUpdateDataArray.push(organismDb.id)
                const {rows} = await client.query(tmpUpdateQuery, tmpUpdateDataArray);
            }

            //if the fixed columns include the project association, then update the project association table by deleting the old associations and inserting the new ones
            if(tmpFixedData.hasOwnProperty('project_ids')){
                console.log('Updating project associations');

                //Create the backup of the properties to be deleted
                await executeBackupQuery(backup_type_project_organism, 
                    [organismDb.individual_id], 
                    'U', 
                    batch.uploaded_by_person_id, 
                    batch.id, 
                    client);
                console.log('Backup of project organism associations successful');


                const tmpProjects = tmpFixedData.project_ids;
                console.log(tmpProjects);
                //Delete the old associations
                await client.query('DELETE FROM project_organism WHERE organism_id = $1', [organismDb.id]);
                //Insert the new associations
                await Promise.all(
                    tmpProjects.map(async project => {
                        const {rows} = await client.query('INSERT INTO project_organism VALUES(DEFAULT, $1, $2)', [project, organismDb.id]);
                    })
                ) .then(async () => {
                    console.log('Project associations updated');
                }) .catch( (error) => {
                    console.log(error);
                    throw new Error(`Error occurred during the update of the organism and project associations for the organism ${organismDb.id}: ${error.message}`);
                });
            }
        })
    ) .then(async () => {
        console.log('Organisms updated'); 
    }) .catch( (error) => {
        console.log(error);
        throw error;
    }); 


    //Add the individual IDs to the organisms that were found in the DB
    let tmpFlatData = propertiesData.flat(1);
    let newFlatData = tmpFlatData.map(flatDataItem => {
        const replacementOrganismDB = organismNumericIds.find(organism => organism.individual_id === flatDataItem[0]);
        const replacementNewOrganismDB = newIds.find(organism => organism.fixedId === flatDataItem[0]);
        let newDataItem = [...flatDataItem];
        //Search for the organism ID either in the organisms already present in the DB or the list of IDs just inserted in the DB
        newDataItem[0] = (replacementOrganismDB ? replacementOrganismDB.id : replacementNewOrganismDB.dbId);
        return newDataItem;
      });

    //Add the individual IDs to the organisms that were just created in the DB

    console.log(newFlatData); 


    return(newFlatData)
}

//This function creates a string with the structure of $1, $2, ... $n 
// based on the indicated number of parameters.
// That output string can be appended to the INSERT statement in the VALUES section.
function generateParameters(numParameters) {
    const parameters = [];
    for (let i = 1; i <= numParameters; i++) {
      parameters.push('$' + i);
    }
    return parameters.join(', ');
  }

//This function returns the query that will be used to insert the data
//according to the type of batch process
function prepareInsertQuery(dataType, valuesData){

    let queryInsertFinal = '';

    switch (dataType) {
        case bu_data_type_organism:

            let numberParams = Object.keys(valuesData).length;
            let params = generateParameters(numberParams);

            queryInsertFinal = `INSERT INTO organism VALUES(DEFAULT, ${params}) RETURNING id`;
            break;
        case bu_data_type_properties:
            const tmpOperation = valuesData[3]; //The operation is the last element of the array: either 'I' for insert or 'U' for update
            if(tmpOperation == 'I'){
                queryInsertFinal = "INSERT INTO organism_property VALUES(DEFAULT, $1, $2, $3) RETURNING id";
            }else{
                if(tmpOperation == 'U'){
                    queryInsertFinal = "UPDATE organism_property SET value = $3 WHERE organism_id = $1 AND property_id = $2 RETURNING id";
                }
            }
        break;

    }
    return(queryInsertFinal);
}

//This function creates and executes a query to insert the data
//in the backup (historical_) table according to the type of batch process
async function executeBackupQuery(dataType, listIndividualIds, operation, personId, batchId, client){

    let queryBackup = '';
    let dataQuery = [];
    let nameStoredProcedure = '';

    //The queries code in all cases (properties, organisms, projects) is similar, 
    //eventhough, I decided to split it separate cases because in the future,
    //the backup stored procedures might receive different sets of parameters
    switch (dataType) {
        case backup_type_organism:
            nameStoredProcedure = 'backup_organisms';
            queryBackup = `CALL ${nameStoredProcedure} ($1, $2, $3, $4)`;
            dataQuery = [operation, personId, batchId, listIndividualIds];
            break;

        case backup_type_properties:
            nameStoredProcedure = 'backup_properties';
            queryBackup = `CALL ${nameStoredProcedure} ($1, $2, $3, $4)`; 
            dataQuery = [operation, personId, batchId, listIndividualIds];
            break;
        
        case backup_type_project_organism:
            nameStoredProcedure = 'backup_project_organism';
            queryBackup = `CALL ${nameStoredProcedure} ($1, $2, $3, $4)`; 
            dataQuery = [operation, personId, batchId, listIndividualIds];
            break;
    }

    //Execute the query
    try{
        //Call the stored procedure to backup
        await client.query(queryBackup, dataQuery);
    }catch(error){
        console.log(error);
        throw new Error(`Error occurred during the creation of the backup. Calling the ${nameStoredProcedure} stored procedure failed.`);
    }
    
}


//This function creates and executes a query to delete data from the DB
async function executeDeleteQuery(dataType, listIndividualIds, listPropertiesIds, deleteAllProperties, client){

    let queryDelete = '';
    let dataQuery = [];
    let nameStoredProcedure = '';

    switch (dataType) {
        case backup_type_organism:
            nameStoredProcedure = 'delete_organisms';
            queryDelete = `CALL ${nameStoredProcedure} ($1)`;
            dataQuery = [listIndividualIds];
            break;
 
        case backup_type_properties:
            nameStoredProcedure = 'delete_properties';
            queryDelete = `CALL ${nameStoredProcedure} ($1, $2, $3)`; 
            dataQuery = [listIndividualIds, listPropertiesIds, deleteAllProperties];
            break;
        
        case backup_type_project_organism:
            nameStoredProcedure = 'delete_project_organism';
            queryDelete = `CALL ${nameStoredProcedure} ($1)`; 
            dataQuery = [listIndividualIds];
            break;
    }

    //Execute the query
    try{
        //Call the stored procedure to delete data
        await client.query(queryDelete, dataQuery);
    }catch(error){
        console.log(error);
        throw new Error(`Error occurred while deleting data. Calling the ${nameStoredProcedure} stored procedure failed.`);
    }
    
}


//This function returns the query that will be used to update an organism
//according to the type of batch process and the data provided in the template
function prepareUpdateQuery(dataType, valuesData){

    const queryInsertPhenotypes = "INSERT INTO organism_property VALUES(DEFAULT, $1, $2, $3) RETURNING id";
    let queryUpdateFinal = '';

    switch (dataType) {
        case bu_data_type_organism:
            let params = Object.keys(valuesData);
            let numberParams = params.length;
            let indexP = 0;
            let queryUpdateParams = params.map(par => par + ' = $' + ++indexP).join(', ');

            queryUpdateFinal = `UPDATE organism SET ${queryUpdateParams} WHERE id = $${numberParams+1} RETURNING id`;
            break;
        case bu_data_type_properties:
            queryUpdateFinal = queryInsertPhenotypes;
            break
    }
    return(queryUpdateFinal);
}

//Validates that the input file has valid columns:
//Organism id is mandatory.
//Additionally, examins that there are no columns that are not part of trait properties
//or not the fixed columns. 
async function validateBatchHeaders (headersRow, batch_type_id){
    let headersAreValid = false;
    let mapHeadersAndIds = [];
    try{
        //First validate that the row has the correct number of rows
        console.log('Validating phenotypes headers:');
        console.log(headersRow);

        //Check if the template has the column of SNAIL id (the unique standard identifier)
        if(headersRow.includes(bu_column_organism_id)){

            //If the type of batch is upload, the columns must be validated
            if(batch_type_id == batch_type_upload){
                //Get only phentypic properties headers, no the fixed headers: snail id, species, location
                const onlyPropertyHeaders = headersRow.filter(header => 
                                (header !== bu_column_organism_id &
                                header !== bu_column_species &
                                header !== bu_column_sampling_site &
                                header !== bu_column_projects )
                        );
                const {rows} = await pool.query(`SELECT p.id, 
                                                        p.template_column_name, 
                                                        p.data_type_id,
                                                        p.pre_defined_values
                                                    FROM property p
                                                    JOIN trait t on t.id = p.trait_id
                                                    AND t.is_location_associated = FALSE
                                                    WHERE p.template_column_name IS NOT NULL
                                                    ORDER BY p.template_column_name`);
                console.log(rows);
                console.log('The only valid headers are:');
                const validHeaders = rows.map(item => item.template_column_name);
                //console.log(validHeaders);
                //Validate all given headers except the fixed ones, are part of a property (so, either phenotypes, external DS, or environment)
                headersAreValid = onlyPropertyHeaders.every(item => rows.map(property => property.template_column_name).includes(item));
            
                if(headersAreValid){
                    mapHeadersAndIds = rows.filter(property => onlyPropertyHeaders.includes(property.template_column_name));
                }else{
                    const invalidHeaders = onlyPropertyHeaders.filter(header => !validHeaders.includes(header));
                    throw new Error('Invalid headers found in the template:' +invalidHeaders.map(item => ' '+item));
                }
            }
            
            
        }else{
            throw new Error('Invalid headers in the template. Required column ' + bu_column_organism_id +' not found.');
        }
        console.log(mapHeadersAndIds);
               
    }catch(error){
        console.error(error);
        throw new Error(error.message);
    }
    return(mapHeadersAndIds);
}

//This function validates that the properties data to be inserted has the correct format
//for each particular property. These are the rest of the columns except the fixed ones.
async function validatePropertiesData(dataRow, mapHeadersAndIds){
    let dataInsert = []; //this is the row that will be inserted after formatting.
    try{
        console.log('ROW in phenotypes:');
        console.log(dataRow);

        //Validate the format af all properties according to their data type
        const resultDataValidations = mapHeadersAndIds.map(header => ({
            template_column_name : header.template_column_name,
            result:validateDataType(header.data_type_id, dataRow[header.template_column_name])
            }));
        
        //Identify properties that did not pass the format validation
        const nonPassingValidation = resultDataValidations.filter(resultValidation => resultValidation.result === false);
        //Check all properties passed the format validation
        if(nonPassingValidation.length == 0){

            //Validate the format af all properties according to their data type
            const resultPreDefinedValuesValidations = mapHeadersAndIds.map(header => ({
            template_column_name : header.template_column_name,
            result:validatePreDefinedValue(header.pre_defined_values, dataRow[header.template_column_name])
            }));

            //Identify properties that did not pass the pre-defined values validation
            const nonPassingPreDefined = resultPreDefinedValuesValidations.filter(resultValidation => resultValidation.result === false);

            //Check all properties passed the pre-defined values validation
            if(nonPassingPreDefined.length == 0){
                //Add the value to the Ids of the headers in a new key value object (dataInsert)
                dataInsert = mapHeadersAndIds.map(header => ({
                organism_id: dataRow[bu_column_organism_id],
                template_column_name: header.template_column_name,
                property_id: header.id,
                value: dataRow[header.template_column_name] // Add new value property
                }));

                //Determine whether the property-organism association already exists in the DB or not
                
                const propertyOrganismAssociations = await getOrganismPropertiesAssociations(dataInsert.map(di => [di.organism_id, di.property_id]));
                console.log(propertyOrganismAssociations);

                //If the property-organism association already exists, the data will be updated
                //If the property-organism association does not exist, the data will be inserted
                //Keep only the information required for the insert values of phenotypic properties and discard unnnecesary fields.
                //The dataInsert object will have the following structure: [organism_id, property_id, value, 'I' or 'U'] 
                //I and U are the flags to insert or update the property data in the DB
                dataInsert = dataInsert.map(di => [di.organism_id, 
                                                    di.property_id, 
                                                    di.value, 
                                                    propertyOrganismAssociations.find(pa => pa.individual_id == di.organism_id && pa.property_id == di.property_id) ? 'U' : 'I']);


            }else{
                throw new Error('Organism ' + dataRow[bu_column_organism_id] +'. The value provided for ' + 
                    nonPassingPreDefined.map(invalidProperties => invalidProperties.template_column_name).join(', ') + 
                ' is not in the range of pre-defined values.');
            }
        }else{
            throw new Error('Organism ' + dataRow[bu_column_organism_id] +'. The format of the field(s) ' + 
                nonPassingValidation.map(invalidProperties => invalidProperties.template_column_name).join(', ') + 
                ' is not correct.');
        }

    }catch(error){
        console.error(error);
        throw new Error(error.message);
    }

    return dataInsert;
}


//This function validates that the data of the organism is correct format.
//The fixed headers of the organisms are the species and the sampling site.
async function validateFixedHeadersData(dataRow){
    const mapSpecies = global.speciesInternalCodes;
    //If the type of batch is organisms batch upload
    let dataInsert = {organism_id: dataRow[bu_column_organism_id]}; //this is the row that will be inserted after formatting
    try{

        //If the species of the organism to insert is not a valid species
        console.log(dataRow);
        if(dataRow.hasOwnProperty(bu_column_species) && dataRow[bu_column_species] != '') {
            if(dataRow[bu_column_species] in mapSpecies){
                //Add the species id and the sampling site to the object if this exists
                dataInsert.species_id = mapSpecies[dataRow[bu_column_species]]; //Replace the code of the species by the ID of the species
            }else{
                throw new Error('Invalid species for ' + dataRow[bu_column_organism_id]);
            }   
        }

        //If the information of the sampling site was provided, add that information to the insert object
        if(dataRow.hasOwnProperty(bu_column_sampling_site) && dataRow[bu_column_sampling_site] != ''){
            dataInsert.sampling_site_id = dataRow[bu_column_sampling_site];
         }

         //If the information of the associated projects was provided, split the projects by the ';' character and add the projects array to the insert object
         if(dataRow.hasOwnProperty(bu_column_projects) && dataRow[bu_column_projects] != ''){
            const tmpProjects = dataRow[bu_column_projects].split(';');

            // Validate that all items in the tmpProjects array can be parsed as integers
            const allProjectsAreIntegers = tmpProjects.every(project => !isNaN(parseInt(project, 10)));
            if (!allProjectsAreIntegers) {
                throw new Error('Invalid project IDs for ' + dataRow[bu_column_organism_id] + '. All project IDs must be integers.');
            }

            dataInsert.project_ids = tmpProjects;
         }

    }catch(error){
        console.error(error);
        throw new Error(error.message);
    }

    return dataInsert;
}