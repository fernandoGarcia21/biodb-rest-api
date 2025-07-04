/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import { mapOperations, mapCloseOperations, mapDataTypesSQL, data_type_integer, data_type_decimal, data_type_date, data_type_text } from '../constants.js';
import format from 'pg-format';
import { query } from "express";

//Query the database to return all organisms
export const getOrganisms = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM organism');
    res.json(rows);
};


//Query the database to return all organisms and their associated information
export const getAllOrganismsInformation = async(req, res ) => {
    const {rows} = await pool.query(`SELECT *,
                                    get_projects_organism(id) projects
                                    FROM(
                                        SELECT id,
                                                individual_id,
                                                species_id,
                                                species_name,
                                                sampling_site_id,
                                                sampling_site_name,
                                                location_id,
                                                location_name,
                                                country_name,
                                                json_agg(row(trait_name, property_name, template_column_name, value)) AS properties 
                                        FROM view_all_organisms_info
                                        GROUP BY 1,2,3,4,5,6,7,8,9 --Group the query by the first seven columns
                                        ORDER BY species_name, individual_id)`);
    res.json(rows);
};


//Query the database to return only one organism with a certain id
export const getOrganism = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query('SELECT * FROM organism o WHERE o.id = $1', [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one organism in the database
export const createOrganism = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{

        const internal_individual_id = data.internal_individual_id;
        const species_id = data.species_id;
        const sampling_site_id = data.sampling_site_id;

        const {rows} = await pool.query('INSERT INTO organism VALUES(DEFAULT, $1, $2, $3) RETURNING *', [
            internal_individual_id, 
            species_id, 
            sampling_site_id]);
        console.log(rows)
        newId = rows[0].id

    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The organism already exist in the DB"});  
        }

        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Organism added with ID: ${newId}`)
};

//Updates one organism in the database
export const updateOrganism = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE organism SET individualId = $1, species_id = $2, sampling_site_id = $3 WHERE id = $4 RETURNING *', [
            data.internal_individual_id, 
            data.species_id, 
            data.sampling_site_id, 
            id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`Organism with id ${id} modified successfully`);
};

//Deletes one organism in the database and returns an http status code
export const deleteOrganism = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM organism o WHERE o.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};

//Query the database to return a list of internal IDs and individual ids based on a list of individual Ids
export const getOrganismsByListIds = async(listIndividualIds) => {
    const valuesIn = "'"+listIndividualIds.join("','")+"'";
    console.log(valuesIn);
    const {rows} = await pool.query('SELECT O.id, O.individual_id FROM organism O WHERE O.individual_id = ANY ($1)', [listIndividualIds]);
    return(rows);
};

//Returns the SQL parsing statement for the input property value given the data type
export const getInputValueStatement = (dataType, paramNumber) =>{

    const mapDataTypesSQLInput = new Map();
    //Set the SQL parsing statements that each datatype of the input property value can have
    mapDataTypesSQLInput.set('1', `$${paramNumber}::FLOAT`); //Integer number (will be converted into float)
    mapDataTypesSQLInput.set('2', `$${paramNumber}::FLOAT`); //Double
    mapDataTypesSQLInput.set('3', `$${paramNumber}`);//Text
    //mapDataTypesSQLInput.set('4', `TO_TIMESTAMP($${paramNumber}, 'DD/MM/YYYY')`);//Date
    mapDataTypesSQLInput.set('4', `TO_TIMESTAMP($${paramNumber}, 'DD/MM/YYYY')
ELSE FALSE 
END`);//Date. We added an extra validation to avoid errors when the date is not in the correct format. For example, for 'NA' values
    mapDataTypesSQLInput.set('5', `$${paramNumber}`);//Multiple options

    return mapDataTypesSQLInput.get(dataType);
}

export const getInputValueStatementExport = (dataType) =>{

    const mapDataTypesSQLInput = new Map();
    //Set the SQL parsing statements that each datatype of the input property value can have
    mapDataTypesSQLInput.set('1', `%L::FLOAT`); //Integer number (will be converted into float)
    mapDataTypesSQLInput.set('2', `%L::FLOAT`); //Double
    mapDataTypesSQLInput.set('3', `%L`);//Text
    //mapDataTypesSQLInput.set('4', `TO_TIMESTAMP(%L, 'DD/MM/YYYY')`);//Date
    mapDataTypesSQLInput.set('4', `TO_TIMESTAMP(%L, 'DD/MM/YYYY')
ELSE FALSE 
END`);//Date. We added an extra validation to avoid errors when the date is not in the correct format. For example, for 'NA' values
    mapDataTypesSQLInput.set('5', `%L`);//Multiple options

    return mapDataTypesSQLInput.get(dataType);
}


//Query the database to return all organisms and their associated information
//The properties are filtered based on the filters provided in the URL
//And the properties are aggregated in a JSON array so they are easier to parse in the frontend
export const getFilteredOrganismsInformation = async(req, res ) => {
    const {filters} = req.params;
    //console.log('The filters are:');
    //console.log(filters);

    let statementNames  = '';
    let statementSpecies = '';
    let statementSamplingAreas   = '';
    let statementProjects   = '';
    let statementProperties   = '';

    //Map the operations to the SQL statements
    //Decode the filter parameters from the URL
    //So they can be used as an object in the query
    const params = new URLSearchParams(filters);
    const filterArray = [];
    
    let queryViewOrganisms = `SELECT id,
                                    individual_id,
                                    species_id,
                                    species_name,
                                    sampling_site_id,
                                    sampling_site_name,
                                    location_id,
                                    location_name,
                                    country_name`;
    let aggregateStatement =", '[]'::json AS properties "; //Statement to aggregate the properties of the organisms
    let queryFromViewOrganisms = ' FROM view_all_organisms_info ';

    let groupStatement = ` GROUP BY 1,2,3,4,5,6,7,8,9 --Group the query by the first seven columns
                        ORDER BY species_name, individual_id`;

    let outputPropertiesStatement = ''; //Statement to filter the properties defined in the outputProperties array

    let paramsNumber = 0;
    let propertiesNumber = 0;
    const propertiesArray = [];
    const operationsArray = [];
    const dataTypesArray = [];
    const propertiesValuesArray = [];
    const propertiesOutputArray = [];
    let filterCondition = '';

    //Dynamically build the query based on the filters
    for (const [key, value] of params.entries()) {
    const valuesArray = value.split(',');

        if(value != null && value.length > 0){
            if(key === 'filterName'){
                statementNames = paramsNumber > 0 ? ' AND' : '';

                paramsNumber++;
                statementNames = statementNames + ` individual_id LIKE $${paramsNumber}`;
                filterArray.push(`%${value}%`);
            }

            if(key === 'filterSpecies'){
                statementSpecies = paramsNumber > 0 ? ' AND' : '';

                paramsNumber++;
                statementSpecies = statementSpecies + ` species_id = ANY($${paramsNumber})`;
                filterArray.push(valuesArray);
            }

            if(key === 'filterSamplingArea'){
                statementSamplingAreas = paramsNumber > 0 ? ' AND' : '';

                paramsNumber++;
                statementSamplingAreas = statementSamplingAreas + ` sampling_site_id = ANY($${paramsNumber})`;
                filterArray.push(valuesArray);
            }

            if(key === 'filterProject'){
                statementProjects = paramsNumber > 0 ? ' AND' : '';

                paramsNumber++;
                statementProjects = statementProjects + ` id in (SELECT organism_id FROM view_project_organism vpo WHERE vpo.project_id = ANY ($${paramsNumber}))`;

                
                filterArray.push(valuesArray);
            }

            //Whether the properties filter is an AND or an OR
            if(key === 'filterCondition'){
                filterCondition = value;
            }

            //Create an array with the data types of the properties to filter
            //We need this information to build the query properly, e.g. for numbers we need to
            //append ':: FLOAT' to the value
            if(key === 'propertyDataTypes'){
                dataTypesArray.push(...valuesArray);
            }

            //Create separate arrays for the properties and the operations
            if(key === 'filterPropertiesIds'){
                propertiesArray.push(...valuesArray);
            }
            if(key === 'filterPropertiesOperations'){
                operationsArray.push(...valuesArray);
            }
            if(key === 'filterPropertiesValues'){
                propertiesValuesArray.push(...valuesArray);
            }
            //The output set of properties can be different to the input set of properties to filter
            if(key === 'filterPropertiesOutput'){
                console.log('****The output properties array is:');
                console.log(valuesArray);
                propertiesOutputArray.push(...valuesArray);

            }
        }
    }

    //Build the properties filter statement
    //console.log('****The datatypes array is:');
    //console.log(dataTypesArray);

    //If output properties were provided, group the output properties in the query
    if(propertiesOutputArray.length > 0){
        aggregateStatement = ', json_agg(row(trait_name, property_name, template_column_name, value)) AS properties ';
    }
    queryViewOrganisms += aggregateStatement + queryFromViewOrganisms;

    const thereAreFiltersBeforeProperties = paramsNumber > 0 || filterArray.length > 0;
    if(propertiesArray.length > 0){
        queryViewOrganisms += ' WHERE id in (';
        //Iterate over the properties to filter
        for(let i = 0; i < propertiesArray.length; i++){
            statementProperties += 'SELECT id FROM view_all_organisms_info WHERE (';
            propertiesNumber++;

            const tmpOperation = mapOperations.get(operationsArray[i]); //e.g. =, >, <, LIKE, IS NULL, etc.
            const tmpCloseOperation = mapCloseOperations.get(operationsArray[i]);

            //console.log(`The number of previous filters is ${filterArray.length}`);
            const tmpAnd = thereAreFiltersBeforeProperties ? ' AND ' : ''; //Add the AND statement to the query if there are other filters before the properties filter

            //If the operation is 'IS NULL', we don't need to append the value to the query
            //We just need to append the param number of the id of the property to the is null statement
            if(operationsArray[i] == 'nl' || operationsArray[i] == 'nn'){
                const statementNullPropertiesFirst = `id ${operationsArray[i] == 'nl' ? 'NOT' : ''} IN (SELECT id from view_all_organisms_info where property_id = $`; //Statement to filter the properties that are null
                const statementNullPropertiesSecond = ' AND value IS NOT NULL)'; //Statement to filter the properties that are null

                statementProperties += statementNames + 
                                   statementSpecies + 
                                   statementSamplingAreas + 
                                   tmpAnd+
                                   statementNullPropertiesFirst +
                                   (++paramsNumber) +
                                   statementNullPropertiesSecond;
                //Add the property id to the filter array corresponding to the parameter number
                filterArray.push(propertiesArray[i]);
                
            }else{
                statementProperties += statementNames + 
                                   statementSpecies + 
                                   statementSamplingAreas + 
                                   tmpAnd+
                                   ` property_id = $${++paramsNumber} AND ${mapDataTypesSQL.get(dataTypesArray[i])} ${tmpOperation}${getInputValueStatement(dataTypesArray[i], ++paramsNumber)}${tmpCloseOperation}`;

                //Add the property id and the property value to the filter array
                filterArray.push(propertiesArray[i]);
                filterArray.push(operationsArray[i] == 'lk' ? `%${propertiesValuesArray[i]}%`: propertiesValuesArray[i]);
            }
            
            if(i < propertiesArray.length - 1){
                statementProperties += `) ${filterCondition} `; //Add the INTERSECT or UNION statement to the query for the next property
            }
        }//End of the for loop for the properties list

        statementProperties += ')';
        //Add the properties filter statement to the query
        queryViewOrganisms += statementProperties; 
        queryViewOrganisms += ')'; 
        
        outputPropertiesStatement += propertiesOutputArray.length > 0 ? ' AND ' : '';//If there are no filters, we need to add the AND clause to the query
    //End if propertiesArray.length > 0
    }else{
        //Add the WHERE clause to the query and append the filter statements
        if(paramsNumber > 0){
            queryViewOrganisms += ' WHERE (';
            queryViewOrganisms += statementNames;
            queryViewOrganisms += statementSpecies;
            queryViewOrganisms += statementSamplingAreas;
            queryViewOrganisms += statementProjects;
            queryViewOrganisms += ')'; 

            outputPropertiesStatement += propertiesOutputArray.length > 0 ? ' AND ' : '';//If there are no filters, we need to add the AND clause to the query
        }else{
            outputPropertiesStatement += propertiesOutputArray.length > 0 ? ' WHERE ' : '';//If there are no filters, we need to add the WHERE clause to the query
        }

    }
    //if there are output properties, we need to add them to the query as well
    if(propertiesOutputArray.length > 0){
        outputPropertiesStatement += ` (property_id = ANY($${++paramsNumber}) OR property_id IS NULL)`; //Statement to filter the properties defined in the outputProperties array
        //Add the property id to the filter array corresponding to the parameter number
        filterArray.push(propertiesOutputArray);
    }

    //Add the output properties condition statement to the query
    queryViewOrganisms += outputPropertiesStatement;
    //Add the group statement to the query
    queryViewOrganisms += groupStatement;

    //Append the function to show the projects associated to the organisms
    queryViewOrganisms = `SELECT *,
	                            get_projects_organism(ID) PROJECTS
                          FROM(${queryViewOrganisms})`;

    console.log('**** The query is:');
    console.log(queryViewOrganisms);

    console.log('****The filter array is:');
    console.log(filterArray);

    try{
        const {rows} = await pool.query(queryViewOrganisms, filterArray);
        res.json(rows);

    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
};


const stringArrayToIntArray = (stringArray) => {
    if (!Array.isArray(stringArray)) {
      return []; // Return an empty array for invalid input
    }
  
    return stringArray.map((str) => {
      const num = parseInt(str, 10); // Parse as base-10 integer
  
      if (isNaN(num)) {
        return NaN; // Or handle invalid numbers differently, like skipping them or returning a default value
      }
  
      return num;
    });
  }



//Query the database to return all organisms and their associated information
//The properties are filtered based on the filters provided in the URL
//And the properties are added as columns to the output.
//This function is used to export the data to a CSV/TSV file
export const getExportFilteredOrganismsInformation = async(req, res ) => {
    const {filters} = req.params;
    //console.log('The filters are:');
    //console.log(filters);

    let finalQuery = ''; //Final query to be executed
    let statementNames  = ''; //Statement to filter the names of the organisms
    let statementSpecies = ''; //Statement to filter the species of the organisms
    let statementSamplingAreas   = ''; //Statement to filter the locations of the organisms
    let statementProjects   = ''; //Statement to filter the projects of the organisms
    let statementProperties   = ''; //Statement to filter the properties of the organisms. Multiple properties can be filtered, and they are attached with an INTERSECT (AND) or an UNION (OR) statement

    //Map the operations to the SQL statements
    //Decode the filter parameters from the URL
    //So they can be used as an object in the query
    const params = new URLSearchParams(filters);
    const filterArray = [];
    
    //---------------------------------------------------------------
    //Statements that are used to pivot the properties of the organisms from rows to columns using the tablefunc extension (ie. CREATE EXTENSION tablefunc;)
    let queryPropertiesPivot = `SELECT name property_name FROM property where id IN (%L) ORDER BY trait_id, name`;
    let queryAsCrossTableBegin = ` AS ct (id integer, "Internal Id" text, "Species" text, "Sampling site" text, "Sampling location" text, "Country" text, `; //This is the query to pivot the properties of the organisms from rows to columns
    let queryAsCrossTableEnd = `) `;
    //---------------------------------------------------------------

    //Main query that retrives the organisms and their properties
    let queryViewOrganisms = `SELECT
                                    id,
                                    individual_id "Internal Id",
                                    species_name "Species",
                                    sampling_site_name "Sampling area",
                                    location_name "Sampling location",
                                    country_name "Country"`;
    let selectPropertyValueStatement =""; //Statement to aggregate the properties of the organisms
    let queryFromViewOrganisms = ' FROM view_all_organisms_info ';
    let groupStatement = ``; //Statement to group the query by the first four columns
    let orderStatement = ` ORDER BY species_name, individual_id`;

    let outputPropertiesStatement = ''; //Statement to filter the properties defined in the outputProperties array

    let paramsNumber = 0;
    const propertiesArray = [];
    const operationsArray = [];
    const dataTypesArray = [];
    const propertiesValuesArray = [];
    const propertiesOutputArray = [];
    let filterCondition = '';

    //Dynamically build the query based on the filters
    for (const [key, value] of params.entries()) {
    const valuesArray = value.split(',');

        if(value != null && value.length > 0){
            if(key === 'filterName'){
                statementNames = paramsNumber > 0 ? ' AND' : '';
                paramsNumber++;
                statementNames = statementNames + ` individual_id LIKE %L`;
                statementNames = format(statementNames, `%${value}%`);
            }

            if(key === 'filterSpecies'){
                statementSpecies = paramsNumber > 0 ? ' AND' : '';
                paramsNumber++;
                statementSpecies = statementSpecies + ` species_id in (%L)`;
                statementSpecies = format(statementSpecies, valuesArray).replace(/'/g, "");
            }

            if(key === 'filterSamplingArea'){
                statementSamplingAreas = paramsNumber > 0 ? ' AND' : '';
                paramsNumber++;
                statementSamplingAreas = statementSamplingAreas + ` sampling_site_id in(%L)`;
                statementSamplingAreas = format(statementSamplingAreas, valuesArray).replace(/'/g, "");
            }

            if(key === 'filterProject'){
                statementProjects = paramsNumber > 0 ? ' AND' : '';

                paramsNumber++;
                statementProjects = statementProjects + ` id in (SELECT organism_id FROM view_project_organism vpo WHERE vpo.project_id = ANY ($${paramsNumber}))`;

                
                filterArray.push(valuesArray);
            }

            //Whether the properties filter is an AND or an OR
            if(key === 'filterCondition'){
                filterCondition = value;
            }

            //Create an array with the data types of the properties to filter
            //We need this information to build the query properly, e.g. for numbers we need to
            //append ':: FLOAT' to the value
            if(key === 'propertyDataTypes'){
                dataTypesArray.push(...valuesArray);
            }

            //Create separate arrays for the properties and the operations
            if(key === 'filterPropertiesIds'){
                propertiesArray.push(...valuesArray);
            }
            if(key === 'filterPropertiesOperations'){
                operationsArray.push(...valuesArray);
            }
            if(key === 'filterPropertiesValues'){
                propertiesValuesArray.push(...valuesArray);
            }
            //The output set of properties can be different to the input set of properties to filter
            if(key === 'filterPropertiesOutput'){
                console.log('****The output properties array is:');
                console.log(valuesArray);
                propertiesOutputArray.push(...valuesArray);

            }
        }
    }

    //Build the properties filter statement
    //console.log('****The datatypes array is:');
    //console.log(dataTypesArray);

    //If output properties were provided, group the output properties in the query
    if(propertiesOutputArray.length > 0){
        selectPropertyValueStatement = ', property_name, value '; //Statement to add the properties of the organisms to output

        //If output properties were provided, the quotes in the name filter must be scapped
        statementNames = statementNames.replace(/'/g, "''");
    }
    queryViewOrganisms += selectPropertyValueStatement + queryFromViewOrganisms;

    const thereAreFiltersBeforeProperties = paramsNumber > 0 || filterArray.length > 0;
    if(propertiesArray.length > 0){
        queryViewOrganisms += ' WHERE id in (';
        //Iterate over the properties to filter
        for(let i = 0; i < propertiesArray.length; i++){
            statementProperties += 'SELECT id FROM view_all_organisms_info WHERE (';

            const tmpOperation = mapOperations.get(operationsArray[i]); //e.g. =, >, <, LIKE, IS NULL, etc.
            const tmpCloseOperation = mapCloseOperations.get(operationsArray[i]);

            //console.log(`The number of previous filters is ${filterArray.length}`);
            const tmpAnd = thereAreFiltersBeforeProperties ? ' AND ' : ''; //Add the AND statement to the query if there are other filters before the properties filter

            //If the operation is 'IS NULL', we don't need to append the value to the query
            //We just need to append the param number of the id of the property to the is null statement
            if(operationsArray[i] == 'nl' || operationsArray[i] == 'nn'){
                const statementNullPropertiesFirst = `id ${operationsArray[i] == 'nl' ? 'NOT' : ''} IN (SELECT id FROM view_all_organisms_info WHERE property_id = %L`; //Statement to filter the properties that are null
                const statementNullPropertiesSecond = ' AND value IS NOT NULL)'; //Statement to filter the properties that are null

                //Add the property id to the filter
                const tmpStatemetNullProperties = statementNames + 
                    statementSpecies + 
                    statementSamplingAreas + 
                    format(
                        tmpAnd+
                        statementNullPropertiesFirst +
                        statementNullPropertiesSecond, propertiesArray[i]).replace(/'/g, "");
                
                statementProperties += tmpStatemetNullProperties;
                
            }else{
                let tmpStatemetPropertiesId = format(` ${tmpAnd} property_id = %L `, propertiesArray[i]).replace(/'/g, "");

                 let tmpStatemetPropertiesValue = ` AND ${mapDataTypesSQL.get(dataTypesArray[i])} ${tmpOperation}${getInputValueStatementExport(dataTypesArray[i])}${tmpCloseOperation}`;

                //If the operation is 'LIKE' we need to add the % to the value 
                 if(operationsArray[i] == 'lk'){
                    tmpStatemetPropertiesValue = format(tmpStatemetPropertiesValue, `%${propertiesValuesArray[i]}%`);
                    //If the operation is 'LIKE' and output properties were requiered we must scape the quotes to pass the value to the crosstab query
                    //if(propertiesOutputArray.length > 0){
                    //    tmpStatemetPropertiesValue = tmpStatemetPropertiesValue.replace(/'/g, "''");
                    //}
                 }else{
                    tmpStatemetPropertiesValue = format(tmpStatemetPropertiesValue, propertiesValuesArray[i]);
                 }
   

                 //If the data type of the property is a number, we need to remove the quotes from the value
                 if(dataTypesArray[i] == data_type_integer || dataTypesArray[i] == data_type_decimal){
                    tmpStatemetPropertiesValue = tmpStatemetPropertiesValue.replace(/'/g, "");
                 }

                 //If the data type of the property is date and output properties were requiered we must scape the quotes to pass the value to the crosstab query
                 if((dataTypesArray[i] == data_type_date || dataTypesArray[i] == data_type_text) && propertiesOutputArray.length > 0){
                    tmpStatemetPropertiesValue = tmpStatemetPropertiesValue.replace(/'/g, "''");
                 }

                //Add the property id and the property value to the filter
                let tmpStatemetProperties = tmpStatemetPropertiesId + tmpStatemetPropertiesValue;

                statementProperties += statementNames + 
                                   statementSpecies + 
                                   statementSamplingAreas + 
                                   tmpStatemetProperties;
            }
            
            if(i < propertiesArray.length - 1){
                statementProperties += `) ${filterCondition} `; //Add the INTERSECT or UNION statement to the query for the next property
            }
        }//End of the for loop for the properties list

        statementProperties += ')';
        //Add the properties filter statement to the query
        queryViewOrganisms += statementProperties; 
        queryViewOrganisms += ')'; 
        
        outputPropertiesStatement += propertiesOutputArray.length > 0 ? ' AND ' : '';//If there are no filters, we need to add the AND clause to the query
    //End if propertiesArray.length > 0
    }else{
        //Add the WHERE clause to the query and append the filter statements
        if(paramsNumber > 0){
            queryViewOrganisms += ' WHERE (';
            queryViewOrganisms += statementNames;
            queryViewOrganisms += statementSpecies;
            queryViewOrganisms += statementSamplingAreas;
            queryViewOrganisms += statementProjects;
            queryViewOrganisms += ')'; 

            outputPropertiesStatement += propertiesOutputArray.length > 0 ? ' AND ' : '';//If there are no filters, we need to add the AND clause to the query
        }else{
            outputPropertiesStatement += propertiesOutputArray.length > 0 ? ' WHERE ' : '';//If there are no filters, we need to add the WHERE clause to the query
        }

    }
    //if there are output properties, we need to add them to the query as well
    if(propertiesOutputArray.length > 0){
        outputPropertiesStatement += format(` (property_id IN (%L) OR property_id IS NULL)`, propertiesOutputArray).replace(/'/g, ""); //Statement to filter the properties defined in the outputProperties array
    }else{
        groupStatement = ` GROUP BY 1,2,3,4,5,6 ` //Group the query by the first four columns, it will be applied only if there are no output properties provided because otherwise the output properties will be grouped in the crosstab query
    }

    //Add the output properties condition statement to the query
    queryViewOrganisms += outputPropertiesStatement;
    //Add the group statement to the query
    queryViewOrganisms += groupStatement;
    //Add the order statement to the query
    queryViewOrganisms += orderStatement;


    //Add the properties pivot statement to the query if output properties were provided
    if(propertiesOutputArray.length > 0){
        //First we need to create the list of properties to pivot as columns based on the output properties
        let queryConcatProperties = `SELECT concat(string_agg(property_name, ' text, '),' text') FROM(
                SELECT concat('"', name, '"') property_name FROM property where id = ANY($1) ORDER BY trait_id, name
            )`
        const {rows} = await pool.query(queryConcatProperties, [propertiesOutputArray]);
        const concatPropertiesList = rows[0].concat;
        console.log(`****The concatenated properties list is: ${concatPropertiesList}`);

        //Now we can build the final query with the previously built main query and the crosstab statements to pivot the properties of the organisms from rows to columns
        // Construct the crosstab query
        const columnHeaderQuery = format(queryPropertiesPivot, propertiesOutputArray).replace(/'/g, "");;
        const crosstabQuery = `SELECT * FROM crosstab('${queryViewOrganisms}', '${columnHeaderQuery}') ${queryAsCrossTableBegin}${ concatPropertiesList}${queryAsCrossTableEnd}`;

        finalQuery = crosstabQuery;
    }else{
        finalQuery = queryViewOrganisms;
    }

    //Append the function to show the projects associated to the organisms
    finalQuery = `SELECT *,
	                     get_projects_organism(id) Projects
                  FROM(${finalQuery})`;
    
    console.log('**** The final query is:');
    console.log(finalQuery);

    console.log('****The filter array is:');
    console.log(filterArray);

    try{
        const {rows} = await pool.query(finalQuery, []);

         // Extract column names from the query result
         // The first column in the query output is the numeric ID, we do not
         //need that value so, we slice the first element of the array
        const columnNames = rows.length > 0 ? Object.keys(rows[0]).slice(1) : [];

        // Format the results as TSV
        const tsv = [
            columnNames.join('\t'), // Add column names as the first row
            ...rows.map((row) => Object.values(row).slice(1).join('\t'))
        ].join('\n');

    // Set response headers for TSV download
    res.setHeader('Content-Type', 'text/tab-separated-values');
    res.setHeader('Content-Disposition', 'attachment; filename=data.tsv');
    res.send(tsv);

    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
};