-- =============================================================================
-- LittorinaDB settings example
-- =============================================================================
-- Example configuration showing how the generic flexBioDB settings can be
-- customized for a specific database instance.
--
-- LittorinaDB is the inaugural and reference implementation of flexBioDB.
--
-- This script is a reference of how the SETTINGS inserts in the seed.sql
-- could be customized and it corresponds to the instance LittorinaDB.
-- If this file is used to customize the SETTINGS, it must be executed
-- AFTER the seed.sql. Note that this file uses UPDATE instead of INSERT.
--
-- IMPORTANT:
-- Review the file-system paths below and adapt them to the server where the
-- instance is deployed before executing this script.
-- =============================================================================


-- Absolute path to the directory where permanent files, such as the database
-- logo, species thumbnails, and CSV templates, are stored.
UPDATE public.settings
SET value = '/path/to/littorinadb/permanent_files'
WHERE name = 'PERMANENT_FILES_DIRECTORY';


-- Absolute path to the directory where CSV files uploaded by authenticated
-- users are stored.
UPDATE public.settings
SET value = '/path/to/littorinadb/uploaded_files'
WHERE name = 'BATCH_FILES_DIRECTORY';


-- Absolute path to the directory where image files of sampling area are uploaded by authenticated users.
UPDATE public.settings
SET value = '/path/to/littorinadb/uploaded_files/sampling_area'
WHERE name = 'SAMPLING_AREA_FILES_DIRECTORY';



-- Maximum number of organism records displayed in query results at
-- /dashboard/organism. This limit only affects on-screen visualization;
-- dataset downloads include the complete set of records returned by the query.
UPDATE public.settings
SET value = '500'
WHERE name = 'MAX_ORGANISMS_QUERY';


-- First part of the database instance name displayed in the web interface.
UPDATE public.settings
SET value = 'Littorina'
WHERE name = 'DB_NAME';


-- Second part (suffix) of the database instance name displayed in the
-- web interface.
UPDATE public.settings
SET value = 'DB'
WHERE name = 'DB_NAME_SUFFIX';


-- File name of the database instance logo. The file must be stored in the
-- directory specified by PERMANENT_FILES_DIRECTORY.
UPDATE public.settings
SET value = 'LittorinaDB-logo-prod.png'
WHERE name = 'DB_LOGO_FILE_NAME';


-- Welcome message displayed in the page header next to the database
-- instance name.
UPDATE public.settings
SET value = 'A standardized, open-access database for phenotypic, environmental, and ecological data from the Littorina research community.'
WHERE name = 'DB_WELCOME_MESSAGE';


-- =============================================================================
-- About page
-- =============================================================================

UPDATE public.settings
SET value = 'Conceptualized during the XIII ISOLBE (July 2023), LittorinaDB is a community-driven project supported by researchers across North America, Europe, and Asia.'
WHERE name = 'ABOUT_COLLABORATION';


UPDATE public.settings
SET value = 'Littorina Research Community (2026). LittorinaDB: A standardized database for Littorina evolutionary and ecological research. Available at: [https://www.littorinadb.org] (Accessed: [Date]).'
WHERE name = 'ABOUT_CITE';


UPDATE public.settings
SET value = '<b>LittorinaDB</b> addresses the fragmentation of biological data in the <i>Littorina</i> research community. By providing a centralized, three-tier architecture, we enable researchers to integrate phenotypic, environmental, and genomic datasets under standardized protocols.'
WHERE name = 'ABOUT_MISSION';


UPDATE public.settings
SET value = '<p>LittorinaDB is the first MOD oriented to individual organisms (snails) of the <i>Littorina</i> genus that includes standardized phenotypic data, environmental features, and direct links to external datasets (NCBI/SRA).</p>
<ul>
    <li><b>Species:</b> Currently hosting <i>L. saxatilis</i> and <i>L. arcana</i>.</li>
    <li><b>Data Model:</b> Utilizing a hierarchical Trait/Feature-Property model.</li>
    <li><b>Standardization:</b> We have moved beyond simple data hosting. LittorinaDB enforces standardized protocols for data measuring and recording to ensure interoperability across the research community.</li>
</ul>'
WHERE name = 'ABOUT_SCOPE';


UPDATE public.settings
SET value = '<div style="border: 1px solid #aed6f1; padding: 20px; border-radius: 8px; display: flex; align-items: center; gap: 20px;">
    <div style="font-size: 2rem;">&#9993;</div>
    <div>
        <p style="margin: 0; font-weight: bold; color: var(--primary);">Have questions or comments?</p>
        <p style="margin: 5px 0 15px 0;">For technical inquiries, data submission requests, or general comments regarding the Littorina research ecosystem, please visit our community contact portal.</p>
        <a href="https://littorina.at.biopolis.pt/contact" target="_blank" style="background-color: #635bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Visit the Littorina Research Community Contact Page →
        </a>
    </div>
</div>'
WHERE name = 'ABOUT_CONTACT';





-- =============================================================================
-- LittorinaDB habitat descriptor seed (new databases only)
-- Requires the generic seed to be executed first.
-- Simple INSERT statements; no ON CONFLICT.
-- =============================================================================

INSERT INTO public.habitat_descriptor_position (position_number, name, allow_multiple) VALUES
    (1, 'Substrate type', true),
    (2, 'Barnacle occurrence', false),
    (3, 'Wave exposure', true),
    (4, 'Crevice / refuge structure', false),
    (5, 'Brown macroalgal occurrence', false);

-- Position 1: Substrate type
INSERT INTO public.habitat_descriptor_code (descriptor_position_id, code, meaning, display_order)
SELECT p.id, v.code, v.meaning, v.display_order
FROM public.habitat_descriptor_position AS p
CROSS JOIN (VALUES
    ('R', 'Bedrock (continuous rock)', 1),
    ('B', 'Boulders (large rock blocks)', 2),
    ('C', 'Cobbles / pebbles / shingle', 3),
    ('S', 'Soft substrate (e.g., sand or fine sediments)', 4),
    ('A', 'Artificial substrate (e.g., seawall, bulkhead, jetty)', 5),
    ('U', 'Unknown / not recorded', 6)
) AS v(code, meaning, display_order)
WHERE p.position_number = 1;

-- Position 2: Barnacle occurrence
INSERT INTO public.habitat_descriptor_code (descriptor_position_id, code, meaning, display_order)
SELECT p.id, v.code, v.meaning, v.display_order
FROM public.habitat_descriptor_position AS p
CROSS JOIN (VALUES
    ('W', 'Widespread across the sampled area', 1),
    ('L', 'Localized: present in part of the sampled area', 2),
    ('R', 'Rare: observed only occasionally in the sampled area', 3),
    ('N', 'Not observed', 4),
    ('U', 'Unknown / not recorded', 5)
) AS v(code, meaning, display_order)
WHERE p.position_number = 2;

-- Position 3: Wave exposure
INSERT INTO public.habitat_descriptor_code (descriptor_position_id, code, meaning, display_order)
SELECT p.id, v.code, v.meaning, v.display_order
FROM public.habitat_descriptor_position AS p
CROSS JOIN (VALUES
    ('L', 'Low', 1),
    ('M', 'Moderate', 2),
    ('H', 'High', 3),
    ('U', 'Unknown / not recorded', 4)
) AS v(code, meaning, display_order)
WHERE p.position_number = 3;

-- Position 4: Crevice / refuge structure
INSERT INTO public.habitat_descriptor_code (descriptor_position_id, code, meaning, display_order)
SELECT p.id, v.code, v.meaning, v.display_order
FROM public.habitat_descriptor_position AS p
CROSS JOIN (VALUES
    ('L', 'Large crevices or substantial rock refuges', 1),
    ('S', 'Small crevices', 2),
    ('N', 'No visible crevices / refuges', 3),
    ('M', 'Mixed crevice sizes', 4),
    ('U', 'Unknown / not recorded', 5)
) AS v(code, meaning, display_order)
WHERE p.position_number = 4;

-- Position 5: Fleshy macroalgal occurrence
INSERT INTO public.habitat_descriptor_code (descriptor_position_id, code, meaning, display_order)
SELECT p.id, v.code, v.meaning, v.display_order
FROM public.habitat_descriptor_position AS p
CROSS JOIN (VALUES
    ('W', 'Widespread across the sampled area', 1),
    ('L', 'Localized: present in part of the sampled area', 2),
    ('R', 'Rare: observed only occasionally in the sampled area', 3),
    ('N', 'Not observed', 4),
    ('U', 'Unknown / not recorded', 5)
) AS v(code, meaning, display_order)
WHERE p.position_number = 5;
