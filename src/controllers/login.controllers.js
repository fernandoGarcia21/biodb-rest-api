import { pool } from "../db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {active_user_status} from '../constants.js';
import { SECRET_KEY } from '../config.js';

//Verifies the existence of a given user and 
//the consistency between the typed password and the password in the DB
export const login = async(req, res ) => {
    const data = req.body;

    let username = data.username;
	let password = data.password;

    console.log(data);

    //Make sure the fields are not empty
    if (username && password) {

        try{
            const {rows} = await pool.query('SELECT U.id, P.id person_id, P.first_name, P.family_name, P.email, U.status_id, U.user_level_id, U.password FROM person P, user_credentials U WHERE P.email = $1 AND U.person_id = P.id', [username]);

            console.log(rows)
            //If the user was found
            if (rows.length > 0) {
                //Validate the typed password with the password in the DB
                const result = await bcrypt.compare(password, rows[0].password);
                if(result){
                    //Validate the status of the user, it must be active
                    if(rows[0].status_id == active_user_status){

                        const token = jwt.sign({ userId: rows[0].id, levelId: rows[0].user_level_id, personId: rows[0].person_id}, SECRET_KEY, {
                            expiresIn: '1h',
                            });

                        console.log(token);

                        req.session.loggedin = true;
				        req.session.username = username;
                        
                        //res.cookie('jwt', token, { httpOnly: true, secure: true });
                        //If sameSite is set to 'none', the secure flag must be set to true
                        res.cookie('jwt', token, { sameSite: 'strict', httpOnly: false, secure: false});
                        res.json({ userId: rows[0].id, 
                                   personId: rows[0].person_id,
                                   levelId: rows[0].user_level_id,
                                   firstName: rows[0].first_name,
                                   familyName: rows[0].family_name,
                                   email: rows[0].email})

                        //Store the token in the response header
                        // Redirect to home page
				        //return res.header('Authorization', `Bearer ${token}`).status(200).json({message: 'User autenticated!'});;
                    }else{
                        return res.status(401).json({message: 'The user has not been activated! Contact the admin.'});
                    }
                }else{
                    return res.status(401).json({message: 'Wrong password!'});
                }
            }else{
                return res.status(401).json({message: 'User not found!'});
            }

        }catch(error){
            console.log(error);
            return res.status(500).json({message: "Internal server error"});
        }
    }else{
        return res.status(401).json({message: 'Please, enter username and password!'});
    }
};


//Deletes the session of the current user
export const logout = async(req, res ) => {
    const data = req.body;
    console.log('EN EL LOGOUT')
    console.log(req.session);
    console.log('JWT Cookie');
    console.log(req.cookies.jwt);
    if (req.session) {
        await req.session.destroy(err => {
          if (err) {
            console.log('Unable to logout');
            console.log(err);
            res.status(400).json({message: "Unable to log out"});
          } else {
            res.cookie("jwt", "", {expires: new Date(0),});
            res.sendStatus(200);
          }
        });
      } else {
        res.end();
      }
};

