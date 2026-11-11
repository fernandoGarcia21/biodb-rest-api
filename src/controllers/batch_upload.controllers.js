/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import { notifyAdminsOfBatchSubmission, notifyBatchStatusChange } from "../services/batch-notifications.js";
import {
  bu_status_submitted,
  bu_status_approved,
  bu_status_running,
  bu_status_completed,
  bu_status_failed,
  bu_data_type_organism,
  bu_data_type_properties,
  backup_type_organism,
  backup_type_properties,
  backup_type_project_organism,
  name_setting_uploads_path,
  bu_column_organism_id,
  bu_column_species,
  bu_column_sampling_site,
  batch_type_upload,
  batch_type_delete,
  bu_column_projects,
  user_level_admin,
  user_level_group_leader,
  bu_status_rejected,
} from "../constants.js";
import { getOrganismsByListIds } from "./organism.controllers.js";
import { getOrganismPropertiesAssociations } from "./organism_property.controllers.js";
import {
  validateDataType,
  validatePreDefinedValue,
} from "../utilities/data_types.js";
import { getUserById } from "./user.controllers.js";
import fs from "fs";
import csv from "csv-parser";
import path from "path";

const normalizeCsvHeader = (header) =>
  String(header ?? "")
    .replace(/^\uFEFF/, "")
    .trim();

//Query the database to return all batch processes in the table batch_upload.
// The query returns either the processes submitted only by the group leader user
// or all rows for the curator/admin user.
export const getBatchProcesses = async (req, res) => {
  const user_id = req.userId;
  const user = await getUserById(user_id);

  const baseQuery = `SELECT BU.ID,
                                BU.FILE_NAME,
                                BU.INTERNAL_FILE_NAME,
                                BU.PARAMETERS,
                                BT.NAME BATCH_TYPE,
                                PE.FIRST_NAME || ' ' || PE.FAMILY_NAME UPLOADED_BY,
                                BU.STATUS STATUS_ID,
                                BUS.NAME STATUS,
                                TO_CHAR(BU.DATE_SUBMITTED, 'DD-MM-YYYY HH24:MI') DATE_SUBMITTED,
                                TO_CHAR(BU.DATE_STARTED, 'DD-MM-YYYY HH24:MI') DATE_STARTED,
                                TO_CHAR(BU.DATE_COMPLETED, 'DD-MM-YYYY HH24:MI') DATE_COMPLETED,
                                TO_CHAR(BU.DATE_CURATED, 'DD-MM-YYYY HH24:MI') DATE_CURATED,
                                BU.LOGS,
                                PCUR.FIRST_NAME || ' ' || PCUR.FAMILY_NAME CURATOR,
                                BU.CURATOR_NOTES
                            FROM
                                BATCH_UPLOAD BU
                                JOIN BATCH_TYPE BT ON BT.ID = BU.BATCH_TYPE_ID
                                JOIN PERSON PE ON PE.ID = BU.UPLOADED_BY_PERSON_ID
                                JOIN BATCH_UPLOAD_STATUS BUS ON BUS.ID = BU.STATUS
                                LEFT JOIN PERSON PCUR ON PCUR.ID = BU.CURATOR_ID`;
  const whereQuery = "WHERE BU.UPLOADED_BY_PERSON_ID = $1";
  const orderQuery = "ORDER BY BU.DATE_SUBMITTED DESC";

  if (user) {
    let params = [];
    let finalQuery = "";

    if (user.user_level_id === user_level_group_leader) {
      //group leader
      finalQuery = `${baseQuery} ${whereQuery} ${orderQuery}`;
      params = [user.person_id];
    } else {
      if (user.user_level_id === user_level_admin) {
        //admin user
        finalQuery = `${baseQuery} ${orderQuery}`;
      } else {
        return res.status(403).json({
          message: "User does not have permission to access this resource",
        });
      }
    }

    const { rows } = await pool.query(finalQuery, params);
    res.json(rows);
  } else {
    return res.status(404).json({ message: "User not found" });
  }
};

//Query the database to return a batch process by its ID. The query returns the information of the batch process, the name of the batch type and the name of the person that submitted the batch process
export const getBatchProcessById = async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    `SELECT
                                            BU.ID,
                                            BU.NAME,
                                            BU.FILE_NAME,
                                            BU.INTERNAL_FILE_NAME,
                                            BU.PARAMETERS,
                                            BT.NAME BATCH_TYPE,
                                            PE.FIRST_NAME || ' ' || PE.FAMILY_NAME UPLOADED_BY,
                                            BU.STATUS STATUS_ID,
                                            BUS.NAME STATUS,
                                            TO_CHAR(BU.DATE_SUBMITTED, 'DD-MM-YYYY HH24:MI') DATE_SUBMITTED
                                        FROM
                                            BATCH_UPLOAD BU
                                            JOIN BATCH_TYPE BT ON BT.ID = BU.BATCH_TYPE_ID
                                            JOIN PERSON PE ON PE.ID = BU.UPLOADED_BY_PERSON_ID
                                            JOIN BATCH_UPLOAD_STATUS BUS ON BUS.ID = BU.STATUS
                                        WHERE
                                            BU.ID = $1
                                            `,
    [id],
  );
  if (rows.length === 0) {
    return res.status(404).json({ message: "Object not found" });
  }
  res.json(rows);
};

//Creates one instance of a batch upload in the database
export const submitBatchUpload = async (req, res) => {
  const data = req.body;
  let newId = 0;
  try {
    //const internal_file_name = uniqueFilename(BATCH_FILES_DIRECTORY, 'b'+data.batch_type_id+'-p'+data.person_id)+'.tsv';
    const internal_file_name = req.file.filename;
    const original_file_name = req.file.originalname;
    const { rows } = await pool.query(
      "INSERT INTO batch_upload VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, NULL, NULL, NULL, $7, NULL, NULL) RETURNING *",
      [
        original_file_name,
        internal_file_name,
        data.parameters,
        data.batch_type_id,
        data.person_id,
        bu_status_submitted,
        data.batch_name,
      ],
    );
    newId = rows[0].id;
  } catch (error) {
    if (error?.code === "23505") {
      return res
        .status(409)
        .json({ message: "The batch upload already exist in the DB" });
    }
    return res.status(500).json({ message: "Internal server error" });
  }

  // The insert has already committed. Notification failures must not fail the submission.
  try {
    await notifyAdminsOfBatchSubmission({
      batchId: newId,
      batchName: data.batch_name,
      batchTypeId: data.batch_type_id,
      personId: data.person_id,
    });
  } catch (error) {
    console.error("Batch notification failed", { batchId: newId, code: error?.code ?? "NOTIFICATION_ERROR" });
  }

  res.status(201).send(`Batch added with ID: ${newId}`);
};

//This function permites to manually refresh the materialized view
//that contains all the information of the organisms and is used in the front end
//to show the organisms in the table
export const manuallyRefreshMaterializedViews = async (req, res) => {
  try {
    await refreshMaterializedViewsMain();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
  res
    .status(201)
    .send("Manually refreshing of the materialized views ended successfully");
};

/** Refresh dependent materialized views in the existing order. */
export const refreshMaterializedViewsMain = async () => {
  const views = [
    "view_all_organisms_info",
    "view_project_organism",
    "view_home_species_counts",
    "view_home_traits_data_counts",
    "view_home_location_organisms_counts",
    "view_home_latest_datasets",
    "view_home_sampling_area_counts",
  ];
  for (const view of views)
    await pool.query(`REFRESH MATERIALIZED VIEW ${view}`);
};

//This function executes the main process of the batch upload
//and it is called by the route /batch_upload/start rest API
//It was created for testing purposes
export const startBatchProcess = async (req, res) => {
  try {
    await startBatchProcessMain();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
  res.status(201).send("Batch upload process ended");
};

/** @typedef {[string | number, number, unknown, 'I' | 'U']} PropertyOperation */

const updateBatchStatusQuery = "UPDATE batch_upload SET status = $1";
let batchProcessing = false;

async function markBatchRunning(batchId) {
  await pool.query(
    `${updateBatchStatusQuery}, date_started = CURRENT_TIMESTAMP WHERE id = $2`,
    [bu_status_running, batchId],
  );
}

async function markBatchFailed(batchId, error) {
  await pool.query(`${updateBatchStatusQuery}, logs = $2 WHERE id = $3`, [
    bu_status_failed,
    error.message,
    batchId,
  ]);
}

/** Read and validate a file before opening the write transaction. */
async function readAndValidateBatchFile(batch) {
  const filePath = path.join(
    global.customSettings[name_setting_uploads_path],
    batch.internal_file_name,
  );
  const input = fs.createReadStream(filePath);
  const parser = csv({
    mapHeaders: ({ header }) => normalizeCsvHeader(header),
  });
  // pipe() does not forward source errors to the destination automatically.
  input.on("error", (error) => parser.destroy(error));
  let headers;
  parser.on("headers", (value) => {
    headers = value;
  });
  input.pipe(parser);

  const fixedColumnsData = [];
  const propertiesData = [];
  const validationErrors = [];
  let propertyHeaders;
  try {
    for await (const row of parser) {
      if (!propertyHeaders)
        propertyHeaders = await validateBatchHeaders(
          headers ?? [],
          batch.batch_type_id,
        );
      try {
        fixedColumnsData.push(await validateFixedHeadersData(row));
        if (propertyHeaders.length > 0) {
          propertiesData.push(
            await validatePropertiesData(row, propertyHeaders),
          );
        }
      } catch (error) {
        validationErrors.push(error.message);
      }
    }
    // Validate header-only and empty files too.
    if (!propertyHeaders)
      await validateBatchHeaders(headers ?? [], batch.batch_type_id);
    if (validationErrors.length > 0) {
      throw new Error(
        "Summary of data validation:\r\n" + validationErrors.join("\r\n"),
      );
    }
    return { fixedColumnsData, propertiesData };
  } finally {
    input.destroy();
    parser.destroy();
  }
}

// Validate the fixed columns of a row, returning an object with the values to insert into the database.
async function uploadBatchData(
  batch,
  fixedColumnsData,
  propertiesData,
  client,
) {
    // Insert or update organisms and project associations, returning property operations with numeric organism IDs.
  const operations = await addOrganismDBIdsToProperties(
    fixedColumnsData,
    propertiesData,
    client,
    batch,
  );
  // Insert or update properties with numeric organism IDs.
  for (const operation of operations) {
    await client.query(
      prepareInsertQuery(bu_data_type_properties, operation),
      operation.slice(0, 3),
    );
  }
}

// Delete organisms and/or properties, backing up each category first.
async function deleteBatchData(batch, fixedColumnsData, client) {
  if (batch.parameters == null) {
    throw new Error(
      "The batch process is missing the required parameters is_delete_organism and list_delete_properties",
    );
  }
  let parameters;
  try {
    parameters = JSON.parse(batch.parameters);
  } catch (error) {
    throw new Error(
      "The format of the parameters property () of the batch process is not a valid Json object. " +
        error.message,
      { cause: error },
    );
  }
  const isDeleteOrganism = parameters.is_delete_organism;
  const listDeleteProperties = parameters.list_delete_properties;
  const individualIds = fixedColumnsData.map(
    (organism) => organism.organism_id,
  );

  // Back up each category before deleting it, preserving the existing order.
  if (
    isDeleteOrganism ||
    (listDeleteProperties != undefined && listDeleteProperties.length > 0)
  ) {
    await executeBackupQuery(
      backup_type_properties,
      individualIds,
      "D",
      batch.uploaded_by_person_id,
      batch.id,
      client,
    );
    await executeDeleteQuery(
      backup_type_properties,
      individualIds,
      listDeleteProperties,
      isDeleteOrganism,
      client,
    );
  }
  if (isDeleteOrganism) {
    await executeBackupQuery(
      backup_type_organism,
      individualIds,
      "D",
      batch.uploaded_by_person_id,
      batch.id,
      client,
    );
    await executeBackupQuery(
      backup_type_project_organism,
      individualIds,
      "D",
      batch.uploaded_by_person_id,
      batch.id,
      client,
    );
    await executeDeleteQuery(
      backup_type_project_organism,
      individualIds,
      [],
      null,
      client,
    );
    await executeDeleteQuery(
      backup_type_organism,
      individualIds,
      [],
      null,
      client,
    );
  }
}

// This function processes a single batch upload, handling the entire lifecycle 
// of the batch, including reading and validating the file, 
// performing database operations, and updating the batch status. 
// It ensures that all operations are performed within a transaction, 
// rolling back in case of any errors.
// Best-effort background delivery never delays the queue or changes saved status.
function scheduleBatchStatusNotification(batch, outcome) {
  void Promise.resolve().then(() => notifyBatchStatusChange({ batch, outcome })).catch((error) => {
    console.error("Batch status notification failed", { batchId: batch.id, outcome, code: error?.code ?? "NOTIFICATION_ERROR" });
  });
}

async function processBatch(batch) {
  let client;
  let transactionStarted = false;
  let outcome;
  try {
    await markBatchRunning(batch.id);
    const { fixedColumnsData, propertiesData } =
      await readAndValidateBatchFile(batch);
    client = await pool.connect();
    await client.query("BEGIN");
    transactionStarted = true;

    switch (batch.batch_type_id) {
      case batch_type_upload:
        await uploadBatchData(batch, fixedColumnsData, propertiesData, client);
        break;
      case batch_type_delete:
        await deleteBatchData(batch, fixedColumnsData, client);
        break;
      default:
        throw new Error(`The batch type ${batch.batch_type_id} is unknown`);
    }
    // Completion status and data changes must succeed or roll back together.
    await client.query(
      `${updateBatchStatusQuery}, date_completed = CURRENT_TIMESTAMP WHERE id = $2`,
      [bu_status_completed, batch.id],
    );
    await client.query("COMMIT");
    transactionStarted = false;
    outcome = "completed";
    console.info(`Batch ${batch.id} completed successfully`);
  } catch (error) {
    console.error(`Error processing batch ${batch.id}:`, error);
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        // Discard a connection whose transaction could not be rolled back.
        client.release(rollbackError);
        client = undefined;
        console.error(`Error rolling back batch ${batch.id}:`, rollbackError);
      }
    }
    // Return the leased client before using the pool to record failure.
    // This also works when the pool is configured with a single connection.
    client?.release();
    client = undefined;
    await markBatchFailed(batch.id, error);
    outcome = "failed";
  } finally {
    client?.release();
  }
  if (outcome) scheduleBatchStatusNotification(batch, outcome);
}

/** Process the oldest approved batch and await its entire lifecycle. */
export const startBatchProcessMain = async () => {
  // Prevent overlapping cron/manual runs within this server process.
  if (batchProcessing) return;
  batchProcessing = true;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM batch_upload
            WHERE status = $1 ORDER BY date_submitted ASC FETCH FIRST ROW ONLY`,
      [bu_status_approved],
    );
    for (const batch of rows) await processBatch(batch);
  } finally {
    batchProcessing = false;
  }
};

/**
 * Resolve text organism IDs, creating or updating organisms and project associations.
 * @returns {Promise<PropertyOperation[]>} Property operations with numeric organism IDs.
 */
async function addOrganismDBIdsToProperties(
  fixedColumnsData,
  propertiesData,
  client,
  batch,
) {
  const individualIds = [
    ...new Set(fixedColumnsData.map((row) => row.organism_id)),
  ];
  const existingOrganisms = await getOrganismsByListIds(individualIds);
  const existingIds = new Set(
    existingOrganisms.map((organism) => organism.individual_id),
  );
  const newIds = new Map();

  for (const individualId of individualIds.filter(
    (id) => !existingIds.has(id),
  )) {
    const organism = fixedColumnsData.find(
      (row) => row.organism_id == individualId,
    );
    if (!Object.hasOwn(organism, "species_id")) {
      throw new Error(
        "Data for new organism " +
          individualId +
          " is incomplete. Species Id is required when creating a new organism",
      );
    }
    const { project_ids: projects, ...organismData } = organism;
    const values = [organism.organism_id, organism.species_id];
    if (Object.hasOwn(organism, "sampling_site_id"))
      values.push(organism.sampling_site_id);
    const { rows } = await client.query(
      prepareInsertQuery(bu_data_type_organism, organismData),
      values,
    );
    const databaseId = rows[0].id;
    newIds.set(individualId, databaseId);
    if (Object.hasOwn(organism, "project_ids")) {
      await insertProjectAssociations(
        projects,
        databaseId,
        client,
        individualId,
        "insert",
      );
    }
  }

  for (const existing of existingOrganisms) {
    const organism = fixedColumnsData.find(
      (row) => row.organism_id == existing.individual_id,
    );
    const {
      organism_id: individualId,
      project_ids: projects,
      ...updates
    } = organism;
    if (
      Object.hasOwn(updates, "species_id") ||
      Object.hasOwn(updates, "sampling_site_id")
    ) {
      await client.query(prepareUpdateQuery(bu_data_type_organism, updates), [
        ...Object.values(updates),
        existing.id,
      ]);
    }
    if (Object.hasOwn(organism, "project_ids")) {
      await executeBackupQuery(
        backup_type_project_organism,
        [existing.individual_id],
        "U",
        batch.uploaded_by_person_id,
        batch.id,
        client,
      );
      await client.query(
        "DELETE FROM project_organism WHERE organism_id = $1",
        [existing.id],
      );
      await insertProjectAssociations(
        projects,
        existing.id,
        client,
        existing.id,
        "update",
      );
    }
  }

  const databaseIds = new Map(
    existingOrganisms.map((organism) => [organism.individual_id, organism.id]),
  );
  for (const [id, databaseId] of newIds) databaseIds.set(id, databaseId);
  return propertiesData
    .flat(1)
    .map(([individualId, ...operation]) => [
      databaseIds.get(individualId),
      ...operation,
    ]);
}

async function insertProjectAssociations(
  projectIds,
  organismId,
  client,
  displayId,
  operation,
) {
  try {
    for (const projectId of projectIds) {
      await client.query(
        "INSERT INTO project_organism VALUES(DEFAULT, $1, $2)",
        [projectId, organismId],
      );
    }
  } catch (error) {
    throw new Error(
      `Error occurred during the ${operation} of the organism and project associations for the organism ${displayId}: ${error.message}`,
      { cause: error },
    );
  }
}

//This function creates a string with the structure of $1, $2, ... $n
// based on the indicated number of parameters.
// That output string can be appended to the INSERT statement in the VALUES section.
function generateParameters(numParameters) {
  const parameters = [];
  for (let i = 1; i <= numParameters; i++) {
    parameters.push("$" + i);
  }
  return parameters.join(", ");
}

/** Build the existing organism/property insert or property update statement. */
function prepareInsertQuery(dataType, valuesData) {
  if (dataType === bu_data_type_organism) {
    const parameters = generateParameters(Object.keys(valuesData).length);
    return `INSERT INTO organism VALUES(DEFAULT, ${parameters}) RETURNING id`;
  }
  if (dataType === bu_data_type_properties) {
    const operation = valuesData[3];
    if (operation === "I")
      return "INSERT INTO organism_property VALUES(DEFAULT, $1, $2, $3) RETURNING id";
    if (operation === "U")
      return "UPDATE organism_property SET value = $3 WHERE organism_id = $1 AND property_id = $2 RETURNING id";
  }
  return "";
}

//This function creates and executes a query to insert the data
//in the backup (historical_) table according to the type of batch process
async function executeBackupQuery(
  dataType,
  listIndividualIds,
  operation,
  personId,
  batchId,
  client,
) {
  let queryBackup = "";
  let dataQuery = [];
  let nameStoredProcedure = "";

  //The queries code in all cases (properties, organisms, projects) is similar,
  //eventhough, I decided to split it separate cases because in the future,
  //the backup stored procedures might receive different sets of parameters
  switch (dataType) {
    case backup_type_organism:
      nameStoredProcedure = "backup_organisms";
      queryBackup = `CALL ${nameStoredProcedure} ($1, $2, $3, $4)`;
      dataQuery = [operation, personId, batchId, listIndividualIds];
      break;

    case backup_type_properties:
      nameStoredProcedure = "backup_properties";
      queryBackup = `CALL ${nameStoredProcedure} ($1, $2, $3, $4)`;
      dataQuery = [operation, personId, batchId, listIndividualIds];
      break;

    case backup_type_project_organism:
      nameStoredProcedure = "backup_project_organism";
      queryBackup = `CALL ${nameStoredProcedure} ($1, $2, $3, $4)`;
      dataQuery = [operation, personId, batchId, listIndividualIds];
      break;
  }

  //Execute the query
  try {
    //Call the stored procedure to backup
    await client.query(queryBackup, dataQuery);
  } catch (error) {
    throw new Error(
      `Error occurred during the creation of the backup. Calling the ${nameStoredProcedure} stored procedure failed.`,
      { cause: error },
    );
  }
}

//This function creates and executes a query to delete data from the DB
async function executeDeleteQuery(
  dataType,
  listIndividualIds,
  listPropertiesIds,
  deleteAllProperties,
  client,
) {
  let queryDelete = "";
  let dataQuery = [];
  let nameStoredProcedure = "";

  switch (dataType) {
    case backup_type_organism:
      nameStoredProcedure = "delete_organisms";
      queryDelete = `CALL ${nameStoredProcedure} ($1)`;
      dataQuery = [listIndividualIds];
      break;

    case backup_type_properties:
      nameStoredProcedure = "delete_properties";
      queryDelete = `CALL ${nameStoredProcedure} ($1, $2, $3)`;
      dataQuery = [listIndividualIds, listPropertiesIds, deleteAllProperties];
      break;

    case backup_type_project_organism:
      nameStoredProcedure = "delete_project_organism";
      queryDelete = `CALL ${nameStoredProcedure} ($1)`;
      dataQuery = [listIndividualIds];
      break;
  }

  //Execute the query
  try {
    //Call the stored procedure to delete data
    await client.query(queryDelete, dataQuery);
  } catch (error) {
    throw new Error(
      `Error occurred while deleting data. Calling the ${nameStoredProcedure} stored procedure failed.`,
      { cause: error },
    );
  }
}

/** Keep update column order aligned with the corresponding values array. */
function prepareUpdateQuery(dataType, valuesData) {
  if (dataType === bu_data_type_organism) {
    const columns = Object.keys(valuesData);
    const assignments = columns
      .map((column, index) => `${column} = $${index + 1}`)
      .join(", ");
    return `UPDATE organism SET ${assignments} WHERE id = $${columns.length + 1} RETURNING id`;
  }
  if (dataType === bu_data_type_properties) {
    return "INSERT INTO organism_property VALUES(DEFAULT, $1, $2, $3) RETURNING id";
  }
  return "";
}

/** Validate required/fixed headers and return the matching property definitions. */
async function validateBatchHeaders(headers, batchTypeId) {
  const normalizeHeader = (header) => normalizeCsvHeader(header).toUpperCase();
  if (
    !headers.some(
      (header) =>
        normalizeHeader(header) === normalizeHeader(bu_column_organism_id),
    )
  ) {
    throw new Error(
      "Invalid headers in the template. Required column " +
        bu_column_organism_id +
        " not found.",
    );
  }
  if (batchTypeId != batch_type_upload) return [];

  const fixedHeaders = new Set(
    [
      bu_column_organism_id,
      bu_column_species,
      bu_column_sampling_site,
      bu_column_projects,
    ].map(normalizeHeader),
  );
  const propertyHeaders = headers.filter(
    (header) => !fixedHeaders.has(normalizeHeader(header)),
  );
  const { rows: properties } = await pool.query(`SELECT p.id,
        p.template_column_name, p.data_type_id, p.pre_defined_values
        FROM property p JOIN trait t ON t.id = p.trait_id
        AND t.is_location_associated = FALSE
        WHERE p.template_column_name IS NOT NULL ORDER BY p.template_column_name`);
  const validHeaders = new Set(
    properties.map((property) =>
      normalizeHeader(property.template_column_name),
    ),
  );
  const invalidHeaders = propertyHeaders.filter(
    (header) => !validHeaders.has(normalizeHeader(header)),
  );
  if (invalidHeaders.length > 0) {
    throw new Error(
      "Invalid headers found in the template:" +
        invalidHeaders.map((header) => " " + header),
    );
  }
  const selectedHeaders = new Set(propertyHeaders.map(normalizeHeader));
  return properties.filter((property) =>
    selectedHeaders.has(normalizeHeader(property.template_column_name)),
  );
}

/** Validate nonempty property values and choose the existing insert/update operation. */
async function validatePropertiesData(dataRow, propertyHeaders) {
  const populatedHeaders = propertyHeaders.filter((header) => {
    const value = dataRow[header.template_column_name];
    return value !== "" && value !== null && value !== undefined;
  });
  const invalidFormats = populatedHeaders.filter(
    (header) =>
      validateDataType(
        header.data_type_id,
        dataRow[header.template_column_name],
      ) === false,
  );
  if (invalidFormats.length > 0) {
    throw new Error(
      "Organism " +
        dataRow[bu_column_organism_id] +
        ". The format of the field(s) " +
        invalidFormats.map((header) => header.template_column_name).join(", ") +
        " is not correct.",
    );
  }
  const invalidPredefined = populatedHeaders.filter(
    (header) =>
      validatePreDefinedValue(
        header.pre_defined_values,
        dataRow[header.template_column_name],
      ) === false,
  );
  if (invalidPredefined.length > 0) {
    throw new Error(
      "Organism " +
        dataRow[bu_column_organism_id] +
        ". The value provided for " +
        invalidPredefined
          .map((header) => header.template_column_name)
          .join(", ") +
        " is not in the range of pre-defined values.",
    );
  }
  if (populatedHeaders.length === 0) return [];

  const individualId = dataRow[bu_column_organism_id];
  const associations = await getOrganismPropertiesAssociations(
    populatedHeaders.map((header) => [individualId, header.id]),
  );
  return populatedHeaders.map((header) => [
    individualId,
    header.id,
    dataRow[header.template_column_name],
    associations.some(
      (association) =>
        association.individual_id == individualId &&
        association.property_id == header.id,
    )
      ? "U"
      : "I",
  ]);
}

/** Translate optional fixed columns while preserving existing validation rules. */
async function validateFixedHeadersData(dataRow) {
  const speciesCodes = global.speciesInternalCodes;
  const organism = { organism_id: dataRow[bu_column_organism_id] };
  if (
    Object.hasOwn(dataRow, bu_column_species) &&
    dataRow[bu_column_species] != ""
  ) {
    if (!(dataRow[bu_column_species] in speciesCodes)) {
      throw new Error("Invalid species for " + dataRow[bu_column_organism_id]);
    }
    organism.species_id = speciesCodes[dataRow[bu_column_species]];
  }
  if (
    Object.hasOwn(dataRow, bu_column_sampling_site) &&
    dataRow[bu_column_sampling_site] != ""
  ) {
    organism.sampling_site_id = dataRow[bu_column_sampling_site];
  }
  if (
    Object.hasOwn(dataRow, bu_column_projects) &&
    dataRow[bu_column_projects] != ""
  ) {
    const projectIds = dataRow[bu_column_projects].split(";");
    if (!projectIds.every((id) => !isNaN(parseInt(id, 10)))) {
      throw new Error(
        "Invalid project IDs for " +
          dataRow[bu_column_organism_id] +
          ". All project IDs must be integers.",
      );
    }
    organism.project_ids = projectIds;
  }
  return organism;
}

//Updates one batch process in the database
export const updateBatchProcess = async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  let updatedBatch;
  try {
    const { rows } = await pool.query(
      "UPDATE batch_upload SET status = $1, curator_id = $2, curator_notes = $3, date_curated = NOW() WHERE id = $4 RETURNING *",
      [data.status_id, data.curator_id, data.curator_notes, id],
    );
    updatedBatch = rows[0];
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
  if (updatedBatch && Number(data.status_id) === bu_status_rejected) {
    scheduleBatchStatusNotification(updatedBatch, "rejected");
  }
  res
    .status(200)
    .send(`Review of the batch process with id ${id} registered successfully`);
};
