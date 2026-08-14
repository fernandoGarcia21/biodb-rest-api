/**
 * @author Diego Garcia Castillo <dgarciac@ist.ac.at>
 * @date 2024-10-24
 */

import { pool } from "../db.js";
import puppeteer from 'puppeteer';
import path from 'path';
import { readFile } from 'fs/promises';
import { name_setting_permanent_files_path } from '../constants.js';

const propertiesWithProtocolBaseQuery = `
    SELECT p.id,
           p.name name,
           p.description description,
           t.name trait_name,
           d.name data_type_name,
           p.template_column_name template_column_name,
           p.pre_defined_values pre_defined_values,
           p.protocol protocol,
           p.req_project_must_read req_project_must_read
    FROM property p
    JOIN trait t ON p.trait_id = t.id
    JOIN data_type d ON p.data_type_id = d.id
    `;

const propertiesWithProtocolOrderBy = ` ORDER BY t.name, p.name asc`;

const parsePropertyIdsFromRequest = (req) => {
    const requestSources = [
        req.query?.property_ids,
        req.query?.propertyIds,
        req.query?.ids,
        req.body?.property_ids,
        req.body?.propertyIds,
        req.body?.ids,
    ];

    const rawValues = [];
    requestSources.forEach((source) => {
        if (source === undefined || source === null || source === '') {
            return;
        }

        if (Array.isArray(source)) {
            rawValues.push(...source);
            return;
        }

        if (typeof source === 'string') {
            const trimmed = source.trim();
            if (!trimmed) {
                return;
            }

            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    if (Array.isArray(parsed)) {
                        rawValues.push(...parsed);
                        return;
                    }
                } catch {
                    // Fallback to comma-separated parsing below.
                }
            }

            rawValues.push(...trimmed.split(','));
            return;
        }

        rawValues.push(source);
    });

    const validIds = rawValues
        .map((value) => Number.parseInt(String(value).trim(), 10))
        .filter((value) => Number.isInteger(value) && value > 0);

    return [...new Set(validIds)];
};

const buildPropertiesWithProtocolQuery = (propertyIds) => {
    if (propertyIds.length > 0) {
        return {
            query: `${propertiesWithProtocolBaseQuery} WHERE p.id = ANY($1::int[])${propertiesWithProtocolOrderBy}`,
            values: [propertyIds],
        };
    }

    return {
        query: `${propertiesWithProtocolBaseQuery}${propertiesWithProtocolOrderBy}`,
        values: [],
    };
};

const escapeHtml = (value) => {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
};

const getMimeType = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.png') {
        return 'image/png';
    }
    if (ext === '.gif') {
        return 'image/gif';
    }
    if (ext === '.webp') {
        return 'image/webp';
    }
    if (ext === '.svg') {
        return 'image/svg+xml';
    }

    return 'image/jpeg';
};

const withEmbeddedImageSources = async (html, imagesBasePath) => {
    if (!html) {
        return '';
    }

    if (!imagesBasePath) {
        return String(html);
    }

    let updatedHtml = String(html);
    const imageTagMatches = [...updatedHtml.matchAll(/<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi)];

    for (const imageMatch of imageTagMatches) {
        const [fullMatch, beforeSrc, src, afterSrc] = imageMatch;
        const srcValue = String(src ?? '').trim();

        if (!srcValue || /^https?:\/\//i.test(srcValue) || /^data:/i.test(srcValue) || srcValue.startsWith('//')) {
            continue;
        }

        const srcWithoutQuery = srcValue.split('#')[0].split('?')[0];
        const cleanSrc = srcWithoutQuery.replace(/^\/+/, '');
        const absoluteImagePath = path.resolve(imagesBasePath, cleanSrc);

        try {
            console.log(`Embedding image for PDF: ${absoluteImagePath}`);
            const imageBytes = await readFile(absoluteImagePath);
            const mimeType = getMimeType(absoluteImagePath);
            const dataUrl = `data:${mimeType};base64,${imageBytes.toString('base64')}`;
            updatedHtml = updatedHtml.replace(fullMatch, `<img${beforeSrc}src="${dataUrl}"${afterSrc}>`);
        } catch {
            console.warn(`PDF image not found or unreadable: ${absoluteImagePath}`);
        }
    }

    return updatedHtml;
};

//Query the database to return all properties
export const getAllProperties = async(req, res ) => {
    const {rows} = await pool.query(`SELECT p.id,
        p.name,
        p.description,
        t.id trait_id,
        t.name trait_name,
        d.name data_type_name,
        p.template_column_name,
        p.pre_defined_values,
        p.req_project_must_read
        FROM property p join trait t on p.trait_id = t.id join data_type d on p.data_type_id = d.id ORDER BY trait_name, p.name`);
    res.json(rows);
};


//Query the database to return all properties along with their trait name
export const getAllPropertiesAndTrait = async(req, res ) => {
    const {rows} = await pool.query(`SELECT p.id,
        p.name,
        t.name trait_name,
        p.template_column_name,
        p.pre_defined_values ,
        p.req_project_must_read
        FROM property p join trait t on p.trait_id = t.id
        ORDER BY trait_name, p.name`);
    res.json(rows);
};



//Query the database to return all information of properties along with their trait name and protocol
export const getPropertiesWithProtocol = async(req, res ) => {
    const propertyIds = parsePropertyIdsFromRequest(req);
    const { query, values } = buildPropertiesWithProtocolQuery(propertyIds);
    const {rows} = await pool.query(query, values);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Generate a high fidelity PDF for all properties and their protocols
export const getPropertiesWithProtocolPdf = async (req, res) => {
    let browser;

    try {
        const propertyIds = parsePropertyIdsFromRequest(req);
        const { query, values } = buildPropertiesWithProtocolQuery(propertyIds);
        const { rows } = await pool.query(query, values);

        if (rows.length === 0) {
            return res.status(404).json({ message: "Object not found" });
        }

        const imagesPath = global.customSettings[name_setting_permanent_files_path];
        const requiresMustReadNote = "If 'Yes', when the user downloads organism data for this property, the system displays the 'Must read' information of the projects associated with the organisms before proceeding with the data download.";
        const pagesHtmlArray = await Promise.all(rows.map(async (row, index) => {
            const protocolHtml = await withEmbeddedImageSources(row.protocol, imagesPath);

            return `
            <section class="property-page">
                <h1>Property ${index + 1} of ${rows.length}</h1>
                <h2>${escapeHtml(row.name)}</h2>
                <table class="meta-table">
                    <tbody>
                        <tr><th>ID</th><td>${escapeHtml(row.id)}</td></tr>
                        <tr><th>Name</th><td>${escapeHtml(row.name)}</td></tr>
                        <tr><th>Description</th><td>${escapeHtml(row.description)}</td></tr>
                        <tr><th>Trait</th><td>${escapeHtml(row.trait_name)}</td></tr>
                        <tr><th>Data Type</th><td>${escapeHtml(row.data_type_name)}</td></tr>
                        <tr><th>Template Column Name</th><td>${escapeHtml(row.template_column_name)}</td></tr>
                        <tr><th>Pre Defined Values</th><td>${escapeHtml(row.pre_defined_values)}</td></tr>
                        <tr><th>Requires Project Must Read</th><td><strong>${escapeHtml(row.req_project_must_read ? 'Yes' : 'No')}</strong><div class="must-read-note">${escapeHtml(requiresMustReadNote)}</div></td></tr>
                    </tbody>
                </table>
                <h3>Protocol</h3>
                <div class="protocol-wrapper">
                    ${protocolHtml || '<p>No protocol available.</p>'}
                </div>
            </section>
            `;
        }));

        const pagesHtml = pagesHtmlArray.join('');

        const htmlDocument = `
        <!doctype html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <style>
              * { box-sizing: border-box; }
              body { margin: 0; padding: 16px; font-family: Arial, Helvetica, sans-serif; color: #1f2937; }
              .property-page { page-break-before: always; break-before: page; }
              .property-page:first-child { page-break-before: auto; break-before: auto; }
              h1 { margin: 0 0 6px; font-size: 22px; }
              h2 { margin: 0 0 14px; font-size: 18px; font-weight: 600; }
              h3 { margin: 0 0 8px; font-size: 16px; }
              .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px; }
              .meta-table th { width: 220px; text-align: left; background: #f3f4f6; }
              .meta-table th, .meta-table td { border: 1px solid #d1d5db; padding: 8px; vertical-align: top; }
              .must-read-note { margin-top: 6px; color: #4b5563; font-size: 11px; line-height: 1.35; }
              .protocol-wrapper { border: 1px solid #d1d5db; padding: 10px; }
              .protocol-wrapper table { border-collapse: collapse; width: 100%; }
              .protocol-wrapper th, .protocol-wrapper td { border: 1px solid #d1d5db; padding: 6px; }
              .protocol-wrapper img { max-width: 100%; height: auto; }
              @page { size: A4; margin: 12mm; }
            </style>
          </head>
          <body>
            ${pagesHtml}
          </body>
        </html>
        `;

        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true,
        });

        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(0);
        await page.setContent(htmlDocument, { waitUntil: 'domcontentloaded', timeout: 0 });

        const pdfBytes = await page.pdf({
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
        });
        const pdfBuffer = Buffer.from(pdfBytes);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="all-property-protocols.pdf"');
        res.setHeader('Content-Length', pdfBuffer.length);
        return res.status(200).end(pdfBuffer);
    } catch (error) {
        console.error('Error generating properties protocol PDF:', error);
        return res.status(500).json({ message: 'Internal server error' });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

//Query the database to return only one property with a certain id
export const getProperty = async(req, res ) => {
    const {id} = req.params;
    const query = `
        SELECT p.id id, p.name name, p.description description,
               p.trait_id trait_id, t.name trait_name,
               p.data_type_id data_type_id, d.name data_type_name,
               p.template_column_name template_column_name,
               p.pre_defined_values pre_defined_values,
               p.protocol protocol,
               p.req_project_must_read req_project_must_read
        FROM property p
        JOIN trait t ON p.trait_id = t.id
        JOIN data_type d ON p.data_type_id = d.id
        WHERE p.id = $1
        `;
    const {rows} = await pool.query(query, [id]);

    if(rows.length === 0){
        return res.status(404).json({message: "Object not found"});
    }
    res.json(rows);
};

//Query the database to return all properties of a given trait id
export const getPropertiesByTrait = async(req, res ) => {
    const {trait_id} = req.params;
    const {rows} = await pool.query(`SELECT p.id,
            p.name,
            p.description,
            t.name trait_name,
            d.name data_type_name,
            p.template_column_name,
            p.pre_defined_values,
            p.req_project_must_read
        FROM property p join trait t on p.trait_id = t.id
        join data_type d on p.data_type_id = d.id
        WHERE p.trait_id = $1`, [trait_id]);

    res.json(rows);
};


//Creates one property in the database
export const createProperty = async(req, res ) => {
    const data = req.body;
    let newId = 0;
    try{
        const {rows} = await pool.query('INSERT INTO property VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8) RETURNING *', [data.name,
            data.description,
            data.trait_id,
            data.data_type_id,
            data.template_column_name,
            data.pre_defined_values,
            data.protocol,
            data.req_project_must_read
        ]);
        console.log(rows)
        newId = rows[0].id
    }catch(error){
        console.log(error);

        if(error?.code === "23505"){
            return res.status(409).json({message: "The property already exist in the DB"});
        }
        return res.status(500).json({message: "Internal server error"});
    }

    res.status(201).send(`Property added with ID: ${newId}`)
};

//Updates one property in the database
export const updateProperty = async(req, res ) => {
    const {id} = req.params;
    const data = req.body;
    try{
        const {rows} = await pool.query(`UPDATE property
            SET name = $1,
            description = $2,
            data_type_id = $3,
            template_column_name = $4,
            pre_defined_values = $5,
            protocol = $6,
            req_project_must_read = $7
            WHERE id = $8
            RETURNING *`, [data.name, data.description, data.data_type_id, data.template_column_name, data.pre_defined_values, data.protocol, data.req_project_must_read, id]);
    }catch(error){
        console.log(error);
            return res.status(500).json({message: "Internal server error"});
    }
    res.status(200).send(`Property with id ${id} modified successfully`);
};

//Deletes one property in the database and returns an http status code
export const deleteProperty = async(req, res ) => {
    const {id} = req.params;

    try{

        const {rowCount} = await pool.query('DELETE FROM property p WHERE p.id = $1 RETURNING *', [id]);

        if(rowCount === 0){
            return res.status(404).json({message: "Object not found"});
        }
    }catch(error){
        console.error('Error deleting property:', error);
        // Check for specific error types if needed
        if (error.code === '23503') { // Example: foreign key violation
            return res.status(400).json({ message: "Cannot delete property due to foreign key constraint" });
        }
        return res.status(500).json({message: "Internal server error"});
    }

    return res.sendStatus(204);
};
