/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2026-10-30
 */

import { pool } from "../db.js";

//Query the database to return the habitat codes aggregated by descriptor position
//This function is used to populate the dropdowns in the sampling area form
export const getHabitatCodesAggregated = async(req, res) => {
    const {rows} = await pool.query(`SELECT
                                            hdp.id,
                                            hdp.position_number,
                                            hdp.name,
                                            hdp.allow_multiple,
                                            COALESCE(
                                                (
                                                    SELECT json_agg(
                                                        json_build_object(
                                                            'id', hdc.id,
                                                            'code', hdc.code,
                                                            'meaning', hdc.meaning
                                                        )
                                                        ORDER BY hdc.display_order
                                                    )
                                                    FROM habitat_descriptor_code hdc
                                                    WHERE hdc.descriptor_position_id = hdp.id
                                                ),
                                                '[]'::json
                                            ) AS codes
                                        FROM habitat_descriptor_position hdp
                                        ORDER BY hdp.position_number;
                                        `);
    res.json(rows);
};



//Query the database to return all habitat structures
export const getAllHabitatStructures = async(req, res) => {
    const {rows} = await pool.query(`SELECT * FROM HABITAT_STRUCTURE ORDER BY NAME`);
    res.json(rows);
};

