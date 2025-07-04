/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import express, { application } from 'express';
import { HTTP_PORT } from './config.js';
import organismRoutes from './routes/organism.routes.js';
import speciesRoutes from './routes/species.routes.js';
import ecotypeRoutes from './routes/ecotype.routes.js';
import locationRoutes from './routes/location.routes.js';
import samplingAreaRoutes from './routes/sampling_area.routes.js';
import referenceGenomeRoutes from './routes/reference_genome.routes.js';
import chromosomeRoutes from './routes/chromosome.routes.js';
import personRoutes from './routes/person.routes.js';
import projectRoutes from './routes/project.routes.js';
import hostInstitutionRoutes from './routes/host_institution.routes.js';
import researchGroupRoutes from './routes/research_group.routes.js';
import roleRoutes from './routes/role.routes.js';
import userStatusRoutes from './routes/user_status.routes.js';
import userLevelRoutes from './routes/user_level.routes.js';
import userRoutes from './routes/user.routes.js';
import loginRoutes from './routes/login.routes.js';
import batchUploadRoutes from './routes/batch_upload.routes.js';
import traitRoutes from './routes/trait.routes.js';
import propertyRoutes from './routes/property.routes.js';
import dataTypeRoutes from './routes/data_type.routes.js';
import countryRoutes from './routes/country.routes.js';
import traitTypeRoutes from './routes/trait_type.routes.js';
import organismPropertyRoutes from './routes/organism_property.routes.js';
import locationPropertyRoutes from './routes/location_property.routes.js';
import fileRoutes from './routes/files.routes.js';
import typeDatasetRoutes from './routes/type_dataset.routes.js';
import externalDatasetRoutes from './routes/external_dataset.routes.js';
import homeRoutes from './routes/home.routes.js';

import { getAllEndPointAccess } from './controllers/end_point_access.controllers.js';
import { getSpeciesInternalCodes } from './controllers/species.controllers.js';
import { getBatchTypeNumberCols } from './controllers/batch_type.controllers.js';
import { getSettings } from './controllers/settings.controllers.js';
import { startBatchProcessMain, refreshMaterializedViewsMain } from './controllers/batch_upload.controllers.js';
import morgan from 'morgan';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import cron  from 'node-cron';
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
console.log(__dirname)

// Define a list of allowed origins
const allowedOrigins = [
	'http://10.41.170.35:8080', // Example IP address
	'http://192.168.144.5:8080', //PHONE
	'http://localhost:8080',     // Localhost
	'http://127.0.0.1:8080'      // Localhost with loopback address
  ];
  
  // Configure CORS middleware
  app.use(cors({
	origin: (origin, callback) => {
	  if (!origin) return callback(null, true); // Allow requests with no origin
	  if (allowedOrigins.includes(origin)) {
		return callback(null, true);
	  } else {
		return callback(new Error('Not allowed by CORS'));
	  }
	},
	credentials: true,
	exposedHeaders: 'Authorization',
  }));

app.use(morgan('dev'));
app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json()); //So, express can receive request bodies in json format.
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/web/nodelogin/static')));
app.use(cookieParser());
app.use(speciesRoutes);
app.use(organismRoutes);
app.use(ecotypeRoutes);
app.use(locationRoutes);
app.use(samplingAreaRoutes);
app.use(referenceGenomeRoutes);
app.use(chromosomeRoutes);
app.use(personRoutes);
app.use(projectRoutes);
app.use(hostInstitutionRoutes);
app.use(researchGroupRoutes);
app.use(roleRoutes);
app.use(userStatusRoutes);
app.use(userLevelRoutes);
app.use(userRoutes);
app.use(loginRoutes);
app.use(batchUploadRoutes);
app.use(traitRoutes);
app.use(propertyRoutes);
app.use(dataTypeRoutes);
app.use(countryRoutes);
app.use(traitTypeRoutes);
app.use(organismPropertyRoutes);
app.use(locationPropertyRoutes);
app.use(fileRoutes);
app.use(typeDatasetRoutes);
app.use(externalDatasetRoutes);
app.use(homeRoutes);

// http://localhost:3000/
app.get('/auth', function(request, response) {
	// Render login template
	response.sendFile(path.join(__dirname + '/web/nodelogin/login.html'));
});

// http://localhost:3000/home
app.get('/home', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
		// Output username
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		// Not logged in
		response.send('Please login to view this page!');
	}
	response.end();
});

// http://localhost:3000/
app.get('/logout', function(request, response) {
	// If the user is loggedin
	if (request.session.loggedin) {
	// Render logout template
	response.sendFile(path.join(__dirname + '/web/nodelogin/logout.html'));
	} else {
		// Not logged in
		response.send('Please login to view this page!');
        response.end();
	}
});

//Start the server listening on a given port and
//load the end point roles from the database 
//into the global objects of the application
app.listen(HTTP_PORT, '0.0.0.0', async function(){
    console.log('Loading end point access rules');
    const endPointAccess = await getAllEndPointAccess(); 
	const speciesInternalCodes = await getSpeciesInternalCodes();
	const batchTypeNumbercols = await getBatchTypeNumberCols();
	const customSettings = await getSettings();
    //console.log(endPointAccess);
	//console.log(speciesInternalCodes);
	//console.log(batchTypeNumbercols);
	console.log(customSettings);
    //Export the end point access rules as a global object
    global.endPointAccess = endPointAccess;
	global.speciesInternalCodes = speciesInternalCodes;
    global.batchTypeNumbercols = batchTypeNumbercols;
	global.customSettings = customSettings;

});
console.log('Server listening on port ', HTTP_PORT);

// Schedule a task to process batch jobs to run every minute
cron.schedule('* * * * *', () => {
    console.log('Batch processes (e.g. create organisms) are executed every //minute:', new Date().toLocaleTimeString());
	startBatchProcessMain();
});

// Refreshment of the materialized views: Runs at 10:00 AM every day
cron.schedule('0 2 * * *', () => {
	console.log('Task refresh materialized views: Running at 2:00 AM every day');
	refreshMaterializedViewsMain();
  });

// Optional: Log that the scheduler is running
console.log('Cron job scheduler started...');