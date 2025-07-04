/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import {default_user_status, default_user_level, min_length_password, salt_rounds, active_user_status, inactive_user_status} from "../constants.js";
import bcrypt from 'bcryptjs';

//Query the database to return all user
export const getAllUsers = async(req, res ) => {
    const {rows} = await pool.query('SELECT * FROM user_credentials');
    res.json(rows);
};

//Query the database to return all user information
//including the person information
export const getAllUsersPersonInformation = async(req, res) => {
    const query = 
        `SELECT 
                uc.id, 
                uc.person_id, 
                p.first_name, 
                p.family_name, 
                p.email,
                us.id AS status_id,  
                us.name AS status, 
                ul.name AS level 
        FROM person p 
        JOIN user_credentials uc ON p.id = uc.person_id 
        JOIN user_status us ON uc.status_id = us.id 
        JOIN user_level ul ON uc.user_level_id = ul.id 
        ORDER BY p.first_name, p.family_name, p.email`;
    
    const {rows} = await pool.query(query);
    res.json(rows);
}


//Query the database to return only one user with a certain id
export const getUser = async(req, res ) => {
    const {id} = req.params;
    const {rows} = await pool.query(`SELECT uc.id,
                                            uc.person_id,
                                            p.first_name,
                                            p.family_name,
                                            p.email,
                                            uc.user_level_id,
                                            uc.status_id
                                    FROM user_credentials uc
                                    JOIN person p on p.id = uc.person_id
                                    WHERE uc.id = $1`, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Creates one user in the database
export const createUser = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{

        //Hash the password before storing it in the database
        const salt = await bcrypt.genSalt(salt_rounds);
        const hashed_new_passwod = await bcrypt.hash(data.password, salt);

        const {rows} = await pool.query('INSERT INTO user_credentials VALUES(DEFAULT, $1, $2, $3, $4, NULL, $5) RETURNING *', 
            [data.person_id, 
                default_user_status,
                data.user_level_id, 
                hashed_new_passwod, 
                req.personId]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The user already exist in the DB"});  
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`User added with ID: ${newId}`)
};


//Creates one user in the database from a personId
export const createUserFromPerson = async( client, pPersonId, pUserLevelId, pPassword, pRequestedByPersonId) => {
    let newId = 0;
    try{
        //Hash the password before storing it in the database
        const salt = await bcrypt.genSalt(salt_rounds);
        const hashed_new_passwod = await bcrypt.hash(pPassword, salt);

        const {rows} = await client.query('INSERT INTO user_credentials VALUES(DEFAULT, $1, $2, $3, $4, NULL, $5) RETURNING *', 
            [pPersonId, 
                default_user_status, 
                pUserLevelId, 
                hashed_new_passwod,
                pRequestedByPersonId]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);
        throw error;
    }
    return newId;
};

//Updates one user in the database
export const updateUser = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE user_credentials SET status_id = $1, user_level_id = $2 WHERE id = $3 RETURNING *', [data.status_id, data.user_level_id, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`User with id ${id} modified successfully`);
};

//Updates one user in the database to change the password
export const changePassword = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    console.log("*************")
    try{
        //Verify the new password has the minimum length requirement
        if(data.password.length >= min_length_password){
            //Filter users by user ID
            const {rows} = await pool.query('SELECT password, old_password FROM user_credentials WHERE id = $1', [id]);
            if(rows.length > 0){// Validate password length
                
                const result = await bcrypt.compare(data.password, rows[0].password);
                if(!result){ //Validate current password in the db. New password should be different to current password.
                    
                    //If the old password exists in the database, compare the old password with the new password
                    //If the old password does not exist, return false, so the proceed to register the new password
                    const result = rows[0].old_password ? await bcrypt.compare(data.password, rows[0].old_password) : false;
                    if(!result){ //New password should be different to the previously used password

                        const salt = await bcrypt.genSalt(salt_rounds);
                        const hashed_new_passwod = await bcrypt.hash(data.password, salt);
                        console.log('Hashed new password:');
                        console.log(hashed_new_passwod);

                        await pool.query('UPDATE user_credentials SET old_password = $1, password = $2 WHERE id = $3 RETURNING *', [rows[0].password, hashed_new_passwod, id]);
                    }else{
                        return res.status(400).json({message: 'The typed password was recently used. Try a different one.'});
                    }
                }else{
                    return res.status(400).json({message: 'New password must be different to the current password'});
                }
            }else{
                return res.status(400).json({message: 'User not found'});
            }
        }else{
            return res.status(400).json({message: `Password must have a minimum length of ${min_length_password}`}); 
        }
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`The password was updated successfully`);
};

//Deletes one user in the database and returns an http code
export const deleteUser = async(req, res ) => {
    const {id} = req.params;

    const {rowCount} = await pool.query('DELETE FROM user_credentials u WHERE u.id = $1 RETURNING *', [id]);

    if(rowCount === 0){
        return res.status(404).json({message: "Object not found"});
    }

    return res.sendStatus(204);
};


//Creates one person in the database and request to create a user too
export const createNewUserRequest = async(req, res ) => {
    const data = req.body;
    let personId = 0;

    //Create a cliente to the DB connection
    const client = await pool.connect()

    try {
    await client.query('BEGIN'); //Begining the transaction
    
    console.log(data.email);
    const queryPersonByEmail = 'SELECT id FROM person p WHERE p.email = $1'
    const {rows} = await client.query(queryPersonByEmail, [ data.email]);

    if(rows.length === 0){
        //If the person does not exist, we must insert the person
        //First insert the row in the table person
        const queryInsertPerson = 'INSERT INTO person VALUES(DEFAULT, $1, $2, NULL, $3, $4) RETURNING id';
        const {rows} = await client.query(queryInsertPerson, [
            data.first_name, 
            data.family_name,  
            data.email, 
            data.additional_info]);
        
        personId = rows[0].id; //The person ID comes from the new created person
    }else{
        personId = rows[0].id; //The peson ID comes from the already existing person
    }

    //Next create a row in the table user associated with the person id just created or existing
    const queryInsertUser = 'INSERT INTO user_credentials VALUES(DEFAULT, $1, $2, $3, $4, NULL, $6) RETURNING *'

    const salt = await bcrypt.genSalt(salt_rounds);
    const random_password = Math.random().toString(36).slice(-6);
    console.log('Random Password: ' + random_password);
    const hashed_passwod = await bcrypt.hash(random_password, salt);

    const insertUserValues = [personId, //person Id
        default_user_status, //The status of new users before activation
        default_user_level, //The level of invited users
        hashed_passwod, //Hashed randomly generated password of 6 alphanumeric characters
        data.requested_by_id //Id of the user that is registering the user
    ];
    //Execute the insert user query
    await client.query(queryInsertUser, insertUserValues)
    await client.query('COMMIT') //Commit the changes

    } catch (error) {
        await client.query('ROLLBACK') //Rollback if any step of the transaction failed
        console.log(error);

    if(error?.code === "23505"){
        return res.status(409).json({message: "The user already exist in the DB"});  
    }

    return res.status(500).json({message: "Internal server error"}); 
    } finally {
        console.log("*** RELEASE THE CLIENT ***")
        client.release() //Release the connection
    }

    res.status(201).send(`User ${data.email} added successfully`);
};

//Updates the status of one user in the database
export const activateUser = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE user_credentials SET status_id = $1 WHERE id = $2 RETURNING *', [active_user_status, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`User with id ${id} activated successfully`);
};

//Updates the status of one user in the database and inactive the user
export const deactivateUser = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query('UPDATE user_credentials SET status_id = $1 WHERE id = $2 RETURNING *', [inactive_user_status, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"}); 
    }
    res.status(200).send(`User with id ${id} deactivated successfully`);
};
