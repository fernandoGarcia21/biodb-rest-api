/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import jwt from 'jsonwebtoken';
import where from 'lodash.where';
import { SECRET_KEY, VALIDATE_TOKEN } from '../config.js';

//This function validades that the request was sent using an active
//and valid token. The token is generated during the login process.
//Additionally, the level of the user must be allowed to use the end point resource
export const verifyToken = async(req, res, next) => {
    if(VALIDATE_TOKEN){
        //The token might come from the Thunder Client app or from a cookie in the browser
        const token = req.header('Authorization') ? req.header('Authorization') : req.cookies.jwt;
        
        if (!token) return res.status(401).json({ error: 'Access denied' });
        try {
            //The token might come from the Thunder Client app or from a cookie in the browser
            const decodedToken = token.split(" ").length > 1 ? jwt.verify(token.split(" ")[1], SECRET_KEY) : jwt.verify(token, SECRET_KEY);

            //Validate there is an access rule for the requested end point and user level
            const tokenRules = where(global.endPointAccess, {'end_point': req.route.path, 'method': req.method, 'user_level_id': decodedToken.levelId});

            console.log(tokenRules)
            //Allow access to the resource only if there are access rules for the current user level
            if(tokenRules.length === 0){
                res.status(401).json({ error: 'Access denied' });
            }else{
                req.userId = decodedToken.userId;
                req.personId = decodedToken.personId;
                next();
            }
            
        } catch (error) {
        console.log(error);
        res.status(401).json({ error: 'Invalid token' });
        }
    }else{
        next();
    }
 };


 //This function validades that the request was sent using an active
//and valid token. The token is generated during the login process.
export const verifyClientToken = async(req, res) => {
    //The token might come from the Thunder Client app or from a cookie in the browser
    const token = req.header('Authorization') ? req.header('Authorization') : req.cookies.jwt;
    console.log('The token from the client is: ');
    console.log(token);
    if (!token) return res.status(401).json({ error: 'Access denied' });
    try {
        //The token might come from the Thunder Client app or from a cookie in the browser
        const decodedToken = token.split(" ").length > 1 ? jwt.verify(token.split(" ")[1], SECRET_KEY) : jwt.verify(token, SECRET_KEY);

        return res.json({userId: decodedToken.userId,
            levelId: decodedToken.levelId,
            personId: decodedToken.personId
        });
        
    } catch (error) {
    console.log(error);
    res.status(401).json({ error: 'Invalid token' });
    }
 };