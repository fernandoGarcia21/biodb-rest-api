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