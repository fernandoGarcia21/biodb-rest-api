/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

export const active_user_status = 1; //Status afer activation
export const default_user_status = 1; //The status could be 2 'New before activation' but an additional development step would be needed to send activation emails
export const inactive_user_status = 3; //Status of inactive users
export const default_user_level = 2; //Invited
export const min_length_password = 6; 
export const salt_rounds = 10; // This value dictates the computational cost of hashing and, consequently, the level of security.

export const user_level_admin = 1; //Admin user level
export const user_level_group_leader = 2; //Curator user level

//Status of the batch upload processes
export const bu_status_submitted = 1; //Status of the batch upload process when it is submitted and waiting to be processed
export const bu_status_running = 2; //Status of the batch upload process when it was approved by the curator and it is being processed
export const bu_status_completed = 3; //Status of the batch upload process when it was approved by the curator and it has been processed successfully
export const bu_status_cancelled = 4; //Status of the batch upload process when it was cancelled
export const bu_status_failed = 5; //Status of the batch upload process when it has failed
export const bu_status_approved = 6; //Status of the batch upload process when it has been approved by the curator
export const bu_status_rejected = 7; //Status of the batch upload process when it has been rejected by the curator

//Data types in the table DATA_TYPE in the DB.
export const data_type_integer = 1;
export const data_type_decimal = 2;
export const data_type_text = 3;
export const data_type_date = 4;

//Batch upload type
export const bu_data_type_organism = 1;
export const bu_data_type_properties = 2;

//Type of backup
export const backup_type_organism = 1;
export const backup_type_properties = 2;
export const backup_type_project_organism = 3;

//Batch process type
export const batch_type_upload = 1;
export const batch_type_delete = 2;

export const bu_column_organism_id = 'ORGANISM ID';
export const bu_column_species = 'SPECIES';
export const bu_column_sampling_site = 'SAMPLING AREA';
export const bu_column_projects = 'PROJECTS';


//These constants are used to generate the output of the organisms table
export const mapOperations = new Map();
export const mapCloseOperations = new Map();
export const mapDataTypesSQL = new Map();
export const mapDataTypesSQLExport = new Map();

// 2. Adding key-value pairs:
mapOperations.set("eq", "= ");
mapOperations.set("gt", "> ");
mapOperations.set("lt", "< ");
mapOperations.set("ge", ">= ");
mapOperations.set("le", "<= ");
mapOperations.set("lk", "LIKE ");
mapOperations.set("in", "= ANY (");
mapOperations.set("nl", "IS NOT NULL"); //To evaluate if a property is null, we use the 'IS NOT NULL' statement in this particular query
mapOperations.set("nn", "IS NOT NULL"); //To evaluate if a property is not null, we use also the 'IS NOT NULL' statement in this particular query

mapCloseOperations.set("eq", "");
mapCloseOperations.set("gt", "");
mapCloseOperations.set("lt", "");
mapCloseOperations.set("ge", "");
mapCloseOperations.set("le", "");
mapCloseOperations.set("lk", "");
mapCloseOperations.set("in", ")");
mapCloseOperations.set("nl", "");
mapCloseOperations.set("nn", "");

//Set the SQL parsing statements that each datatype can have
mapDataTypesSQL.set('1', "pg_input_is_valid(VALUE, 'double precision') AND value::FLOAT"); //Integer number (will be converted into float)
mapDataTypesSQL.set('2', "pg_input_is_valid(VALUE, 'double precision') AND value::FLOAT"); //Double
mapDataTypesSQL.set('3', "value");//Text
//mapDataTypesSQL.set('4', "TO_TIMESTAMP(value, 'DD/MM/YYYY')");//Date
mapDataTypesSQL.set('4', `CASE
	WHEN is_valid_ddmmyyyy(VALUE) = TRUE THEN TO_TIMESTAMP(VALUE, 'DD/MM/YYYY') `);//Date validation to avoid the error of invalid date format, for example for 'NA' values
mapDataTypesSQL.set('5', "");//Multiple options

//Set the SQL parsing statements that each datatype can have
mapDataTypesSQLExport.set('1', "pg_input_is_valid(VALUE, ''double precision'') AND value::FLOAT"); //Integer number (will be converted into float)
mapDataTypesSQLExport.set('2', "pg_input_is_valid(VALUE, ''double precision'') AND value::FLOAT"); //Double
mapDataTypesSQLExport.set('3', "value");//Text
//mapDataTypesSQL.set('4', "TO_TIMESTAMP(value, 'DD/MM/YYYY')");//Date
mapDataTypesSQLExport.set('4', `CASE
	WHEN is_valid_ddmmyyyy(VALUE) = TRUE THEN TO_TIMESTAMP(VALUE, 'DD/MM/YYYY') `);//Date validation to avoid the error of invalid date format, for example for 'NA' values
mapDataTypesSQLExport.set('5', "");//Multiple options


export const name_setting_uploads_path = 'BATCH_FILES_DIRECTORY';
export const name_setting_permanent_files_path = 'PERMANENT_FILES_DIRECTORY';
export const name_setting_max_num_organisms_return = 'MAX_ORGANISMS_QUERY';
export const name_settings_logo_file_name = "DB_LOGO_FILE_NAME";