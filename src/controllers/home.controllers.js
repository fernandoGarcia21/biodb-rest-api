/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2025-06-18
 */

import { pool } from "../db.js";

//Query the materialized view in the database to return the number of organisms per species
export const getSpeciesCounts = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM view_home_species_counts');
    res.json(rows);
};


//Query the materialized view in the database to return the number of variables with data per trait
export const getTraitsDataCounts = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM view_home_traits_data_counts');
    res.json(rows);
};


//Query the materialized view in the database to return the number of organisms per location
export const getLocationOrganismsCounts = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM view_home_location_organisms_counts');
    res.json(rows);
};

//Query the materialized view in the database to return the top latest datasets either internal or external
export const getLatestDatasets = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM view_home_latest_datasets');
    res.json(rows);
};

//Query the materialized view in the database to return the count of organisms by sampling area
export const getSamplingAreaCounts = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM view_home_sampling_area_counts');
    res.json(rows);
};

//Query the DB to return the total number of samples, species, projects and the last update date
export const getDashboardStats = async(req, res) => {
   const {rows} = await pool.query(`SELECT 'total_samples' AS field_name, SUM(number_individuals)::text AS field_value FROM view_home_species_counts
                                    UNION ALL
                                    SELECT 'total_species' AS field_name, COUNT(1)::text AS field_value FROM species
                                    UNION ALL
                                    SELECT 'total_projects' AS field_name, COUNT(1)::text AS field_value FROM project
                                    UNION ALL
                                    SELECT 'last_update' AS field_name, TO_CHAR(MAX(date_dataset), 'DD/FMMonth/YYYY') AS field_value FROM view_home_latest_datasets;
                                    `);
    if (rows.length === 0) {
        return res.status(404).json({ message: 'No dashboard stats found' });
    }
    res.json(rows);
};