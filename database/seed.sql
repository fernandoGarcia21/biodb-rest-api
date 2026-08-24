--
-- PostgreSQL database dump
--

\restrict ghqwqCdCOp25Fb34nK01YsNBrG6yiUTmjmEf7vVZ65SyhG6O4t8bg1BGuJlBDI6

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: batch_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.batch_type (id, name, number_cols_template) VALUES (1, 'Batch upload organisms', NULL);
INSERT INTO public.batch_type (id, name, number_cols_template) VALUES (2, 'Delete organism', NULL);
INSERT INTO public.batch_type (id, name, number_cols_template) VALUES (3, 'Batch upload traits', NULL);


--
-- Data for Name: batch_upload_status; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.batch_upload_status (id, name) VALUES (1, 'Submitted');
INSERT INTO public.batch_upload_status (id, name) VALUES (2, 'Running');
INSERT INTO public.batch_upload_status (id, name) VALUES (3, 'Completed');
INSERT INTO public.batch_upload_status (id, name) VALUES (4, 'Canceled');
INSERT INTO public.batch_upload_status (id, name) VALUES (5, 'Failed');
INSERT INTO public.batch_upload_status (id, name) VALUES (7, 'Rejected');
INSERT INTO public.batch_upload_status (id, name) VALUES (6, 'Approved');


--
-- Data for Name: country; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.country (id, name) VALUES ('AF', 'Afghanistan');
INSERT INTO public.country (id, name) VALUES ('AX', 'Åland Islands');
INSERT INTO public.country (id, name) VALUES ('AL', 'Albania');
INSERT INTO public.country (id, name) VALUES ('DZ', 'Algeria');
INSERT INTO public.country (id, name) VALUES ('AS', 'American Samoa');
INSERT INTO public.country (id, name) VALUES ('AD', 'Andorra');
INSERT INTO public.country (id, name) VALUES ('AO', 'Angola');
INSERT INTO public.country (id, name) VALUES ('AI', 'Anguilla');
INSERT INTO public.country (id, name) VALUES ('AQ', 'Antarctica');
INSERT INTO public.country (id, name) VALUES ('AG', 'Antigua and Barbuda');
INSERT INTO public.country (id, name) VALUES ('AR', 'Argentina');
INSERT INTO public.country (id, name) VALUES ('AM', 'Armenia');
INSERT INTO public.country (id, name) VALUES ('AW', 'Aruba');
INSERT INTO public.country (id, name) VALUES ('AU', 'Australia');
INSERT INTO public.country (id, name) VALUES ('AT', 'Austria');
INSERT INTO public.country (id, name) VALUES ('AZ', 'Azerbaijan');
INSERT INTO public.country (id, name) VALUES ('BS', 'Bahamas');
INSERT INTO public.country (id, name) VALUES ('BH', 'Bahrain');
INSERT INTO public.country (id, name) VALUES ('BD', 'Bangladesh');
INSERT INTO public.country (id, name) VALUES ('BB', 'Barbados');
INSERT INTO public.country (id, name) VALUES ('BY', 'Belarus');
INSERT INTO public.country (id, name) VALUES ('BE', 'Belgium');
INSERT INTO public.country (id, name) VALUES ('BZ', 'Belize');
INSERT INTO public.country (id, name) VALUES ('BJ', 'Benin');
INSERT INTO public.country (id, name) VALUES ('BM', 'Bermuda');
INSERT INTO public.country (id, name) VALUES ('BT', 'Bhutan');
INSERT INTO public.country (id, name) VALUES ('BO', 'Bolivia, Plurinational State of');
INSERT INTO public.country (id, name) VALUES ('BQ', 'Bonaire, Sint Eustatius and Saba');
INSERT INTO public.country (id, name) VALUES ('BA', 'Bosnia and Herzegovina');
INSERT INTO public.country (id, name) VALUES ('BW', 'Botswana');
INSERT INTO public.country (id, name) VALUES ('BV', 'Bouvet Island');
INSERT INTO public.country (id, name) VALUES ('BR', 'Brazil');
INSERT INTO public.country (id, name) VALUES ('IO', 'British Indian Ocean Territory');
INSERT INTO public.country (id, name) VALUES ('BN', 'Brunei Darussalam');
INSERT INTO public.country (id, name) VALUES ('BG', 'Bulgaria');
INSERT INTO public.country (id, name) VALUES ('BF', 'Burkina Faso');
INSERT INTO public.country (id, name) VALUES ('BI', 'Burundi');
INSERT INTO public.country (id, name) VALUES ('CV', 'Cabo Verde');
INSERT INTO public.country (id, name) VALUES ('KH', 'Cambodia');
INSERT INTO public.country (id, name) VALUES ('CM', 'Cameroon');
INSERT INTO public.country (id, name) VALUES ('CA', 'Canada');
INSERT INTO public.country (id, name) VALUES ('KY', 'Cayman Islands');
INSERT INTO public.country (id, name) VALUES ('CF', 'Central African Republic');
INSERT INTO public.country (id, name) VALUES ('TD', 'Chad');
INSERT INTO public.country (id, name) VALUES ('CL', 'Chile');
INSERT INTO public.country (id, name) VALUES ('CN', 'China');
INSERT INTO public.country (id, name) VALUES ('CX', 'Christmas Island');
INSERT INTO public.country (id, name) VALUES ('CC', 'Cocos (Keeling) Islands');
INSERT INTO public.country (id, name) VALUES ('CO', 'Colombia');
INSERT INTO public.country (id, name) VALUES ('KM', 'Comoros');
INSERT INTO public.country (id, name) VALUES ('CG', 'Congo');
INSERT INTO public.country (id, name) VALUES ('CD', 'Congo, Democratic Republic of the');
INSERT INTO public.country (id, name) VALUES ('CK', 'Cook Islands');
INSERT INTO public.country (id, name) VALUES ('CR', 'Costa Rica');
INSERT INTO public.country (id, name) VALUES ('CI', 'Côte d''Ivoire');
INSERT INTO public.country (id, name) VALUES ('HR', 'Croatia');
INSERT INTO public.country (id, name) VALUES ('CU', 'Cuba');
INSERT INTO public.country (id, name) VALUES ('CW', 'Curaçao');
INSERT INTO public.country (id, name) VALUES ('CY', 'Cyprus');
INSERT INTO public.country (id, name) VALUES ('CZ', 'Czechia');
INSERT INTO public.country (id, name) VALUES ('DK', 'Denmark');
INSERT INTO public.country (id, name) VALUES ('DJ', 'Djibouti');
INSERT INTO public.country (id, name) VALUES ('DM', 'Dominica');
INSERT INTO public.country (id, name) VALUES ('DO', 'Dominican Republic');
INSERT INTO public.country (id, name) VALUES ('EC', 'Ecuador');
INSERT INTO public.country (id, name) VALUES ('EG', 'Egypt');
INSERT INTO public.country (id, name) VALUES ('SV', 'El Salvador');
INSERT INTO public.country (id, name) VALUES ('GQ', 'Equatorial Guinea');
INSERT INTO public.country (id, name) VALUES ('ER', 'Eritrea');
INSERT INTO public.country (id, name) VALUES ('EE', 'Estonia');
INSERT INTO public.country (id, name) VALUES ('SZ', 'Eswatini');
INSERT INTO public.country (id, name) VALUES ('ET', 'Ethiopia');
INSERT INTO public.country (id, name) VALUES ('FK', 'Falkland Islands (Malvinas)');
INSERT INTO public.country (id, name) VALUES ('FO', 'Faroe Islands');
INSERT INTO public.country (id, name) VALUES ('FJ', 'Fiji');
INSERT INTO public.country (id, name) VALUES ('FI', 'Finland');
INSERT INTO public.country (id, name) VALUES ('FR', 'France');
INSERT INTO public.country (id, name) VALUES ('GF', 'French Guiana');
INSERT INTO public.country (id, name) VALUES ('PF', 'French Polynesia');
INSERT INTO public.country (id, name) VALUES ('TF', 'French Southern Territories');
INSERT INTO public.country (id, name) VALUES ('GA', 'Gabon');
INSERT INTO public.country (id, name) VALUES ('GM', 'Gambia');
INSERT INTO public.country (id, name) VALUES ('GE', 'Georgia');
INSERT INTO public.country (id, name) VALUES ('DE', 'Germany');
INSERT INTO public.country (id, name) VALUES ('GH', 'Ghana');
INSERT INTO public.country (id, name) VALUES ('GI', 'Gibraltar');
INSERT INTO public.country (id, name) VALUES ('GR', 'Greece');
INSERT INTO public.country (id, name) VALUES ('GL', 'Greenland');
INSERT INTO public.country (id, name) VALUES ('GD', 'Grenada');
INSERT INTO public.country (id, name) VALUES ('GP', 'Guadeloupe');
INSERT INTO public.country (id, name) VALUES ('GU', 'Guam');
INSERT INTO public.country (id, name) VALUES ('GT', 'Guatemala');
INSERT INTO public.country (id, name) VALUES ('GG', 'Guernsey');
INSERT INTO public.country (id, name) VALUES ('GN', 'Guinea');
INSERT INTO public.country (id, name) VALUES ('GW', 'Guinea-Bissau');
INSERT INTO public.country (id, name) VALUES ('GY', 'Guyana');
INSERT INTO public.country (id, name) VALUES ('HT', 'Haiti');
INSERT INTO public.country (id, name) VALUES ('HM', 'Heard Island and McDonald Islands');
INSERT INTO public.country (id, name) VALUES ('VA', 'Holy See');
INSERT INTO public.country (id, name) VALUES ('HN', 'Honduras');
INSERT INTO public.country (id, name) VALUES ('HK', 'Hong Kong');
INSERT INTO public.country (id, name) VALUES ('HU', 'Hungary');
INSERT INTO public.country (id, name) VALUES ('IS', 'Iceland');
INSERT INTO public.country (id, name) VALUES ('IN', 'India');
INSERT INTO public.country (id, name) VALUES ('ID', 'Indonesia');
INSERT INTO public.country (id, name) VALUES ('IR', 'Iran, Islamic Republic of');
INSERT INTO public.country (id, name) VALUES ('IQ', 'Iraq');
INSERT INTO public.country (id, name) VALUES ('IE', 'Ireland');
INSERT INTO public.country (id, name) VALUES ('IM', 'Isle of Man');
INSERT INTO public.country (id, name) VALUES ('IL', 'Israel');
INSERT INTO public.country (id, name) VALUES ('IT', 'Italy');
INSERT INTO public.country (id, name) VALUES ('JM', 'Jamaica');
INSERT INTO public.country (id, name) VALUES ('JP', 'Japan');
INSERT INTO public.country (id, name) VALUES ('JE', 'Jersey');
INSERT INTO public.country (id, name) VALUES ('JO', 'Jordan');
INSERT INTO public.country (id, name) VALUES ('KZ', 'Kazakhstan');
INSERT INTO public.country (id, name) VALUES ('KE', 'Kenya');
INSERT INTO public.country (id, name) VALUES ('KI', 'Kiribati');
INSERT INTO public.country (id, name) VALUES ('KP', 'Korea, Democratic People''s Republic of');
INSERT INTO public.country (id, name) VALUES ('KR', 'Korea, Republic of');
INSERT INTO public.country (id, name) VALUES ('KW', 'Kuwait');
INSERT INTO public.country (id, name) VALUES ('KG', 'Kyrgyzstan');
INSERT INTO public.country (id, name) VALUES ('LA', 'Lao People''s Democratic Republic');
INSERT INTO public.country (id, name) VALUES ('LV', 'Latvia');
INSERT INTO public.country (id, name) VALUES ('LB', 'Lebanon');
INSERT INTO public.country (id, name) VALUES ('LS', 'Lesotho');
INSERT INTO public.country (id, name) VALUES ('LR', 'Liberia');
INSERT INTO public.country (id, name) VALUES ('LY', 'Libya');
INSERT INTO public.country (id, name) VALUES ('LI', 'Liechtenstein');
INSERT INTO public.country (id, name) VALUES ('LT', 'Lithuania');
INSERT INTO public.country (id, name) VALUES ('LU', 'Luxembourg');
INSERT INTO public.country (id, name) VALUES ('MO', 'Macao');
INSERT INTO public.country (id, name) VALUES ('MG', 'Madagascar');
INSERT INTO public.country (id, name) VALUES ('MW', 'Malawi');
INSERT INTO public.country (id, name) VALUES ('MY', 'Malaysia');
INSERT INTO public.country (id, name) VALUES ('MV', 'Maldives');
INSERT INTO public.country (id, name) VALUES ('ML', 'Mali');
INSERT INTO public.country (id, name) VALUES ('MT', 'Malta');
INSERT INTO public.country (id, name) VALUES ('MH', 'Marshall Islands');
INSERT INTO public.country (id, name) VALUES ('MQ', 'Martinique');
INSERT INTO public.country (id, name) VALUES ('MR', 'Mauritania');
INSERT INTO public.country (id, name) VALUES ('MU', 'Mauritius');
INSERT INTO public.country (id, name) VALUES ('YT', 'Mayotte');
INSERT INTO public.country (id, name) VALUES ('MX', 'Mexico');
INSERT INTO public.country (id, name) VALUES ('FM', 'Micronesia, Federated States of');
INSERT INTO public.country (id, name) VALUES ('MD', 'Moldova, Republic of');
INSERT INTO public.country (id, name) VALUES ('MC', 'Monaco');
INSERT INTO public.country (id, name) VALUES ('MN', 'Mongolia');
INSERT INTO public.country (id, name) VALUES ('ME', 'Montenegro');
INSERT INTO public.country (id, name) VALUES ('MS', 'Montserrat');
INSERT INTO public.country (id, name) VALUES ('MA', 'Morocco');
INSERT INTO public.country (id, name) VALUES ('MZ', 'Mozambique');
INSERT INTO public.country (id, name) VALUES ('MM', 'Myanmar');
INSERT INTO public.country (id, name) VALUES ('NA', 'Namibia');
INSERT INTO public.country (id, name) VALUES ('NR', 'Nauru');
INSERT INTO public.country (id, name) VALUES ('NP', 'Nepal');
INSERT INTO public.country (id, name) VALUES ('NL', 'Netherlands, Kingdom of the');
INSERT INTO public.country (id, name) VALUES ('NC', 'New Caledonia');
INSERT INTO public.country (id, name) VALUES ('NZ', 'New Zealand');
INSERT INTO public.country (id, name) VALUES ('NI', 'Nicaragua');
INSERT INTO public.country (id, name) VALUES ('NE', 'Niger');
INSERT INTO public.country (id, name) VALUES ('NG', 'Nigeria');
INSERT INTO public.country (id, name) VALUES ('NU', 'Niue');
INSERT INTO public.country (id, name) VALUES ('NF', 'Norfolk Island');
INSERT INTO public.country (id, name) VALUES ('MK', 'North Macedonia');
INSERT INTO public.country (id, name) VALUES ('MP', 'Northern Mariana Islands');
INSERT INTO public.country (id, name) VALUES ('NO', 'Norway');
INSERT INTO public.country (id, name) VALUES ('OM', 'Oman');
INSERT INTO public.country (id, name) VALUES ('PK', 'Pakistan');
INSERT INTO public.country (id, name) VALUES ('PW', 'Palau');
INSERT INTO public.country (id, name) VALUES ('PS', 'Palestine, State of');
INSERT INTO public.country (id, name) VALUES ('PA', 'Panama');
INSERT INTO public.country (id, name) VALUES ('PG', 'Papua New Guinea');
INSERT INTO public.country (id, name) VALUES ('PY', 'Paraguay');
INSERT INTO public.country (id, name) VALUES ('PE', 'Peru');
INSERT INTO public.country (id, name) VALUES ('PH', 'Philippines');
INSERT INTO public.country (id, name) VALUES ('PN', 'Pitcairn');
INSERT INTO public.country (id, name) VALUES ('PL', 'Poland');
INSERT INTO public.country (id, name) VALUES ('PT', 'Portugal');
INSERT INTO public.country (id, name) VALUES ('PR', 'Puerto Rico');
INSERT INTO public.country (id, name) VALUES ('QA', 'Qatar');
INSERT INTO public.country (id, name) VALUES ('RE', 'Réunion');
INSERT INTO public.country (id, name) VALUES ('RO', 'Romania');
INSERT INTO public.country (id, name) VALUES ('RU', 'Russian Federation');
INSERT INTO public.country (id, name) VALUES ('RW', 'Rwanda');
INSERT INTO public.country (id, name) VALUES ('BL', 'Saint Barthélemy');
INSERT INTO public.country (id, name) VALUES ('SH', 'Saint Helena, Ascension and Tristan da Cunha');
INSERT INTO public.country (id, name) VALUES ('KN', 'Saint Kitts and Nevis');
INSERT INTO public.country (id, name) VALUES ('LC', 'Saint Lucia');
INSERT INTO public.country (id, name) VALUES ('MF', 'Saint Martin (French part)');
INSERT INTO public.country (id, name) VALUES ('PM', 'Saint Pierre and Miquelon');
INSERT INTO public.country (id, name) VALUES ('VC', 'Saint Vincent and the Grenadines');
INSERT INTO public.country (id, name) VALUES ('WS', 'Samoa');
INSERT INTO public.country (id, name) VALUES ('SM', 'San Marino');
INSERT INTO public.country (id, name) VALUES ('ST', 'Sao Tome and Principe');
INSERT INTO public.country (id, name) VALUES ('SA', 'Saudi Arabia');
INSERT INTO public.country (id, name) VALUES ('SN', 'Senegal');
INSERT INTO public.country (id, name) VALUES ('RS', 'Serbia');
INSERT INTO public.country (id, name) VALUES ('SC', 'Seychelles');
INSERT INTO public.country (id, name) VALUES ('SL', 'Sierra Leone');
INSERT INTO public.country (id, name) VALUES ('SG', 'Singapore');
INSERT INTO public.country (id, name) VALUES ('SX', 'Sint Maarten (Dutch part)');
INSERT INTO public.country (id, name) VALUES ('SK', 'Slovakia');
INSERT INTO public.country (id, name) VALUES ('SI', 'Slovenia');
INSERT INTO public.country (id, name) VALUES ('SB', 'Solomon Islands');
INSERT INTO public.country (id, name) VALUES ('SO', 'Somalia');
INSERT INTO public.country (id, name) VALUES ('ZA', 'South Africa');
INSERT INTO public.country (id, name) VALUES ('GS', 'South Georgia and the South Sandwich Islands');
INSERT INTO public.country (id, name) VALUES ('SS', 'South Sudan');
INSERT INTO public.country (id, name) VALUES ('ES', 'Spain');
INSERT INTO public.country (id, name) VALUES ('LK', 'Sri Lanka');
INSERT INTO public.country (id, name) VALUES ('SD', 'Sudan');
INSERT INTO public.country (id, name) VALUES ('SR', 'Suriname');
INSERT INTO public.country (id, name) VALUES ('SJ', 'Svalbard and Jan Mayen');
INSERT INTO public.country (id, name) VALUES ('SE', 'Sweden');
INSERT INTO public.country (id, name) VALUES ('CH', 'Switzerland');
INSERT INTO public.country (id, name) VALUES ('SY', 'Syrian Arab Republic');
INSERT INTO public.country (id, name) VALUES ('TW', 'Taiwan, Province of China');
INSERT INTO public.country (id, name) VALUES ('TJ', 'Tajikistan');
INSERT INTO public.country (id, name) VALUES ('TZ', 'Tanzania, United Republic of');
INSERT INTO public.country (id, name) VALUES ('TH', 'Thailand');
INSERT INTO public.country (id, name) VALUES ('TL', 'Timor-Leste');
INSERT INTO public.country (id, name) VALUES ('TG', 'Togo');
INSERT INTO public.country (id, name) VALUES ('TK', 'Tokelau');
INSERT INTO public.country (id, name) VALUES ('TO', 'Tonga');
INSERT INTO public.country (id, name) VALUES ('TT', 'Trinidad and Tobago');
INSERT INTO public.country (id, name) VALUES ('TN', 'Tunisia');
INSERT INTO public.country (id, name) VALUES ('TR', 'Turkey');
INSERT INTO public.country (id, name) VALUES ('TM', 'Turkmenistan');
INSERT INTO public.country (id, name) VALUES ('TC', 'Turks and Caicos Islands');
INSERT INTO public.country (id, name) VALUES ('TV', 'Tuvalu');
INSERT INTO public.country (id, name) VALUES ('UG', 'Uganda');
INSERT INTO public.country (id, name) VALUES ('UA', 'Ukraine');
INSERT INTO public.country (id, name) VALUES ('AE', 'United Arab Emirates');
INSERT INTO public.country (id, name) VALUES ('GB', 'United Kingdom of Great Britain and Northern Ireland');
INSERT INTO public.country (id, name) VALUES ('US', 'United States of America');
INSERT INTO public.country (id, name) VALUES ('UM', 'United States Minor Outlying Islands');
INSERT INTO public.country (id, name) VALUES ('UY', 'Uruguay');
INSERT INTO public.country (id, name) VALUES ('UZ', 'Uzbekistan');
INSERT INTO public.country (id, name) VALUES ('VU', 'Vanuatu');
INSERT INTO public.country (id, name) VALUES ('VE', 'Venezuela, Bolivarian Republic of');
INSERT INTO public.country (id, name) VALUES ('VN', 'Viet Nam');
INSERT INTO public.country (id, name) VALUES ('VG', 'Virgin Islands (British)');
INSERT INTO public.country (id, name) VALUES ('VI', 'Virgin Islands (U.S.)');
INSERT INTO public.country (id, name) VALUES ('WF', 'Wallis and Futuna');
INSERT INTO public.country (id, name) VALUES ('EH', 'Western Sahara');
INSERT INTO public.country (id, name) VALUES ('YE', 'Yemen');
INSERT INTO public.country (id, name) VALUES ('ZM', 'Zambia');
INSERT INTO public.country (id, name) VALUES ('ZW', 'Zimbabwe');


--
-- Data for Name: data_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.data_type (id, name) VALUES (1, 'Integer number');
INSERT INTO public.data_type (id, name) VALUES (2, 'Decimal number');
INSERT INTO public.data_type (id, name) VALUES (4, 'Date');
INSERT INTO public.data_type (id, name) VALUES (3, 'Text/URL');


--
-- Data for Name: user_level; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_level (id, name) VALUES (1, 'Admin');
INSERT INTO public.user_level (id, name) VALUES (2, 'Leader');
INSERT INTO public.user_level (id, name) VALUES (3, 'Invited');


--
-- Data for Name: end_point_access; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user/:id', 'GET', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user/:id', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person', 'POST', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user', 'POST', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/user/all', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person/:id', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person/:id', 'GET', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/person', 'GET', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload', 'GET', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload/start', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload', 'POST', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload/refresh', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload/:id', 'GET', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload/:id', 'GET', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/batch_upload/update/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project', 'POST', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id', 'PUT', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id', 'DELETE', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id/external_datasets', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id/external_datasets', 'POST', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id/external_datasets', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/project/:id/external_datasets', 'DELETE', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/location', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/location/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/location/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/sampling_area', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/sampling_area/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/sampling_area/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/trait', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/trait/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/trait/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/property', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/property/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/property/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/external_dataset', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/external_dataset/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/external_dataset/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/external_dataset', 'POST', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/external_dataset/:id', 'PUT', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/external_dataset/:id', 'DELETE', 2);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/species', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/species/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/species/:id', 'DELETE', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/habitat', 'POST', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/habitat/:id', 'PUT', 1);
INSERT INTO public.end_point_access (end_point, method, user_level_id) VALUES ('/habitat/:id', 'DELETE', 1);


--
-- Data for Name: role; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: -
--
-- =============================================================================
-- flexBioDB instance settings
-- =============================================================================
-- These settings define deployment- and instance-specific parameters.
-- Review and customize them before deploying a flexBioDB instance.
--
-- They can be modified directly in this seed file before installation or
-- updated later in the public.settings table by the server/database
-- administrator.
-- =============================================================================


-- Absolute path to the directory where permanent files, such as the database
-- logo, species thumbnails, and CSV templates, are stored.
INSERT INTO public.settings (name, value)
VALUES ('PERMANENT_FILES_DIRECTORY', '/path/to/permanent_files');


-- Absolute path to the directory where CSV files uploaded by authenticated
-- users are stored.
INSERT INTO public.settings (name, value)
VALUES ('BATCH_FILES_DIRECTORY', '/path/to/uploaded_files');


-- Maximum number of organism records displayed in query results at
-- /dashboard/organism. This limit only affects on-screen visualization;
-- dataset downloads include the complete set of records returned by the query.
INSERT INTO public.settings (name, value)
VALUES ('MAX_ORGANISMS_QUERY', '500');


-- First part of the database instance name displayed in the web interface.
INSERT INTO public.settings (name, value)
VALUES ('DB_NAME', 'exampleInstance');


-- Second part (suffix) of the database instance name displayed in the
-- web interface.
INSERT INTO public.settings (name, value)
VALUES ('DB_NAME_SUFFIX', 'DB');


-- File name of the database instance logo. The file must be stored in the
-- directory specified by PERMANENT_FILES_DIRECTORY.
INSERT INTO public.settings (name, value)
VALUES ('DB_LOGO_FILE_NAME', 'exampleInstanceDB-logo-prod.png');


-- Welcome message displayed in the page header next to the database
-- instance name.
INSERT INTO public.settings (name, value)
VALUES (
    'DB_WELCOME_MESSAGE',
    'Configure the welcome message of this flexBioDB instance.'
);


-- =============================================================================
-- About page
-- =============================================================================
-- Content displayed on the About page. HTML markup can be used in these
-- settings to customize the presentation.
-- =============================================================================

INSERT INTO public.settings (name, value)
VALUES (
    'ABOUT_COLLABORATION',
    'Configure the collaboration subsection of this flexBioDB instance.'
);

INSERT INTO public.settings (name, value)
VALUES (
    'ABOUT_CITE',
    'Configure the how to cite us subsection of this flexBioDB instance.'
);

INSERT INTO public.settings (name, value)
VALUES (
    'ABOUT_MISSION',
    'Configure the mission of this flexBioDB instance.'
);

INSERT INTO public.settings (name, value)
VALUES (
    'ABOUT_SCOPE',
    'Configure the scope subsection of this flexBioDB instance.'
);

INSERT INTO public.settings (name, value)
VALUES (
    'ABOUT_CONTACT',
    'Configure the contact us subsection of this flexBioDB instance.'
);

--
-- Data for Name: trait_type; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trait_type (id, name) VALUES (1, 'General');
INSERT INTO public.trait_type (id, name) VALUES (2, 'Phenotypic');
INSERT INTO public.trait_type (id, name) VALUES (3, 'Environmental');


--
-- Data for Name: type_dataset; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.type_dataset (id, name) VALUES (1, 'SNP Genotypes');
INSERT INTO public.type_dataset (id, name) VALUES (2, 'Raw sequencing data');


--
-- Data for Name: user_status; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.user_status (id, name, description) VALUES (1, 'Active', 'Only active users after authorization');
INSERT INTO public.user_status (id, name, description) VALUES (2, 'New', 'New user before activation');
INSERT INTO public.user_status (id, name, description) VALUES (3, 'Inactive', 'Active users can be inactivated');


-- Default administrator person
INSERT INTO public.person (
    id,
    first_name,
    family_name,
    abbreviation,
    email,
    additional_info
)
VALUES (
    1,
    'Admin',
    'flexBioDB',
    'ADM',
    'admin@example.com',
    'Default flexBioDB administrator'
);

-- Default administrator credentials
INSERT INTO public.user_credentials (
    id,
    person_id,
    status_id,
    user_level_id,
    password,
    old_password,
    requested_by
)
VALUES (
    1,
    1,
    1,
    1,
    '$2a$10$SvozqyJHEtHzSvVU.BvcW.i0vxQpDbzh7.TNxl5ygxsMB88J.JxG6',
    NULL,
    1
);

-- Synchronize identity sequences
SELECT pg_catalog.setval('public.person_id_seq', 1, true);
SELECT pg_catalog.setval('public.user_credentials_id_seq', 1, true);



--
-- Name: batch_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.batch_type_id_seq', 3, true);


--
-- Name: data_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.data_type_id_seq', 4, true);


--
-- Name: trait_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trait_type_id_seq', 3, true);


--
-- Name: type_dataset_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.type_dataset_id_seq', 2, true);


--
-- Name: user_level_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_level_id_seq', 3, true);


--
-- Name: user_status_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_status_id_seq', 3, true);


--
-- PostgreSQL database dump complete
--

\unrestrict ghqwqCdCOp25Fb34nK01YsNBrG6yiUTmjmEf7vVZ65SyhG6O4t8bg1BGuJlBDI6

