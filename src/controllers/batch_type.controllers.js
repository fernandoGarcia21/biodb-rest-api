/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";

//Query the database to return the number of calumns that is requiered for 
//the template of each batch upload process
export const getBatchTypeNumberCols = async() => {
    let numberColsMap = [];
    const {rows} = await pool.query('SELECT bt.id, bt.number_cols_template FROM batch_type bt');

    if(rows.length > 0){
        numberColsMap = rows.reduce((map, row) => {
            map[row.id] = row.number_cols_template; // Assuming 'id' is the unique key
            return map;
        }, {});
    }else{
        console.log('Alert: batch type information not found');
    }
    return (numberColsMap);
};
