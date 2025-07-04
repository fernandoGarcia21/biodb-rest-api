/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

//Database connection configuration
export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_PORT = process.env.DB_PORT;

//Port that will attend the http requests
export const HTTP_PORT = process.env.PORT || 3000;

//Secret key used to generate the authentication token of the rest api
export const SECRET_KEY = process.env.S_K
export const VALIDATE_TOKEN = true; //For practicity in development, the token validation can be inactivated
export const BATCH_FILES_DIRECTORY = 'C:/Users/dgarciac/batch_files';