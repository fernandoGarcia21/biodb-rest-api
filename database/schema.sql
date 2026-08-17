--
-- PostgreSQL database dump
--

\restrict LFfRS8gkf9QvYDEKcfjovrTbdj8027ToQ7FGYcRqYCehrWzxwcuMxyeDh8Iopar

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
-- Name: tablefunc; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS tablefunc WITH SCHEMA public;


--
-- Name: EXTENSION tablefunc; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION tablefunc IS 'functions that manipulate whole tables, including crosstab';


--
-- Name: backup_organisms(character varying, integer, integer, character varying[]); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.backup_organisms(IN operation character varying, IN operation_person_id integer, IN operation_batch_id integer, IN individuals_list character varying[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  list_of_organisms TEXT;
BEGIN
	
	SELECT string_agg(quote_literal(names),', ')
	INTO list_of_organisms
	FROM unnest(individuals_list) names;

    EXECUTE format('INSERT INTO historical_organism
				   SELECT org.id,
						  org.individual_id, 
						  org.species_id,
						  org.sampling_site_id,
						  %L,
						  CURRENT_TIMESTAMP operation_date,
						  %L,
						  %L
					FROM organism org
					WHERE org.individual_id in (%s)', 
				   operation, operation_person_id, operation_batch_id, list_of_organisms);
END;
$$;


--
-- Name: backup_project_organism(character varying, integer, integer, character varying[]); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.backup_project_organism(IN operation character varying, IN operation_person_id integer, IN operation_batch_id integer, IN individuals_list character varying[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  list_of_organisms TEXT;
BEGIN
	
	SELECT string_agg(quote_literal(names),', ')
	INTO list_of_organisms
	FROM unnest(individuals_list) names;

    EXECUTE format('INSERT INTO historical_project_organism
				   SELECT pjo.id,
						  pjo.project_id, 
						  pjo.organism_id,
						  %L,
						  CURRENT_TIMESTAMP operation_date,
						  %L,
						  %L
					FROM organism org, project_organism pjo
					WHERE pjo.organism_id = org.id AND org.individual_id in (%s)', 
				   operation, operation_person_id, operation_batch_id, list_of_organisms);
END;
$$;


--
-- Name: backup_properties(character varying, integer, integer, character varying[]); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.backup_properties(IN operation character varying, IN operation_person_id integer, IN operation_batch_id integer, IN individuals_list character varying[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  list_of_organisms TEXT;
BEGIN
	
	SELECT string_agg(quote_literal(names),', ')
	INTO list_of_organisms
	FROM unnest(individuals_list) names;

    EXECUTE format('INSERT INTO historical_organism_property 
				   SELECT op.id organism_property_id, 
						   org.id organism_id,
						   pr.id property_id, 
						   op.value, 
						   %L,
						   CURRENT_TIMESTAMP as operation_date,
						   %L,
						   %L
					FROM organism_property op, trait tr, data_type dt, property pr, organism org
					WHERE op.organism_id = org.id and org.individual_id in (%s) 
					AND op.property_id = pr.id AND pr.trait_id = tr.id AND pr.data_type_id = dt.id ', 
				   operation, operation_person_id, operation_batch_id, list_of_organisms);
END;
$$;


--
-- Name: delete_organisms(character varying[]); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_organisms(IN individuals_list character varying[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  list_of_organisms TEXT;
  delete_sql TEXT;
BEGIN
	-- Merge the individual ids into a single line 
	SELECT string_agg(quote_literal(names),', ')
	INTO list_of_organisms
	FROM unnest(individuals_list) names;
	
	delete_sql := format('DELETE FROM organism 
						   WHERE individual_id IN (%s) ', 
									list_of_organisms);
	
	--Execute the delete query
    EXECUTE delete_sql;
END;
$$;


--
-- Name: delete_project_organism(character varying[]); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_project_organism(IN individuals_list character varying[])
    LANGUAGE plpgsql
    AS $$
DECLARE
  list_of_organisms TEXT;
  delete_sql TEXT;
BEGIN
	-- Merge the individual ids into a single line 
	SELECT string_agg(quote_literal(names),', ')
	INTO list_of_organisms
	FROM unnest(individuals_list) names;
	
	delete_sql := format('DELETE FROM project_organism 
						   WHERE id IN (
									SELECT pjo.id 
									FROM project_organism pjo
									INNER JOIN organism o ON pjo.organism_id = o.id 
									AND o.individual_id in (%s)) ', 
									list_of_organisms);
	
	--Execute the delete query
    EXECUTE delete_sql;
END;
$$;


--
-- Name: delete_properties(character varying[], integer[], boolean); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_properties(IN individuals_list character varying[], IN properties_list integer[], IN delete_all_properties boolean)
    LANGUAGE plpgsql
    AS $$
DECLARE
  list_of_organisms TEXT;
  list_of_properties TEXT;
  delete_sql TEXT;
BEGIN
	-- Merge the individual ids into a single line 
	SELECT string_agg(quote_literal(names),', ')
	INTO list_of_organisms
	FROM unnest(individuals_list) names;
	
	-- Merge the properties ids into a single line
	list_of_properties := array_to_string(properties_list, ',');
	
	IF delete_all_properties THEN
		delete_sql := format('DELETE FROM organism_property 
							   WHERE id IN (
										SELECT op.id 
										FROM organism_property op
										INNER JOIN organism o ON op.organism_id = o.id 
										AND o.individual_id in (%s)) ', 
							            list_of_organisms);
	ELSE
		delete_sql := format('DELETE FROM organism_property 
							   WHERE id IN (
										SELECT op.id 
										FROM organism_property op
										INNER JOIN organism o ON op.organism_id = o.id 
										AND o.individual_id in (%s)
							    ) AND property_id in (%s)', 
							            list_of_organisms, list_of_properties);
	END IF;
	
	--Execute the delete query
    EXECUTE delete_sql;
END;
$$;


--
-- Name: get_projects_ids_organism(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_projects_ids_organism(p_organism_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  result_string TEXT;
BEGIN
  -- Group and concatenate the values
  SELECT STRING_AGG(VPO.project_id::VARCHAR, ',') INTO result_string
  FROM view_project_organism VPO
  WHERE VPO.organism_id = p_organism_id;

  RETURN result_string;
END;
$$;


--
-- Name: get_projects_organism(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_projects_organism(p_organism_id integer) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
  result_string TEXT;
BEGIN
  -- Group and concatenate the values
  SELECT STRING_AGG(VPO.project_name, '; ') INTO result_string
  FROM view_project_organism VPO
  WHERE VPO.organism_id = p_organism_id;

  RETURN result_string;
END;
$$;


--
-- Name: is_ddmmyyyy_date(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_ddmmyyyy_date(input_text text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM TO_DATE(input_text, 'DD/MM/YYYY');
    RETURN TRUE;
EXCEPTION WHEN others THEN
    RETURN FALSE;
END;
$$;


--
-- Name: is_valid_ddmmyyyy(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_valid_ddmmyyyy(input_text text) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
BEGIN
    IF input_text ~ '^\d{2}/\d{2}/\d{4}$' THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$_$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: batch_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_type (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    number_cols_template integer
);


--
-- Name: batch_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.batch_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.batch_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: batch_upload; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_upload (
    id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    internal_file_name character varying(255) NOT NULL,
    parameters character varying(255),
    batch_type_id integer NOT NULL,
    uploaded_by_person_id integer NOT NULL,
    status integer NOT NULL,
    date_submitted timestamp without time zone NOT NULL,
    date_started timestamp without time zone,
    date_completed timestamp without time zone,
    logs text,
    name character varying(100),
    curator_id integer,
    curator_notes text,
    date_curated timestamp without time zone
);


--
-- Name: batch_upload_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.batch_upload ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.batch_upload_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: batch_upload_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.batch_upload_status (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: country; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.country (
    id character varying(3) NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: data_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_type (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: data_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.data_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.data_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: end_point_access; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.end_point_access (
    end_point character varying(255) NOT NULL,
    method character varying(7) NOT NULL,
    user_level_id integer NOT NULL
);


--
-- Name: external_dataset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_dataset (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    url character varying(255) NOT NULL,
    description text,
    type_dataset_id integer NOT NULL,
    date_created timestamp without time zone,
    owner_person_id integer
);


--
-- Name: external_dataset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.external_dataset ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.external_dataset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: habitat; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habitat (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text
);


--
-- Name: habitat_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.habitat ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.habitat_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: historical_organism; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historical_organism (
    id integer,
    individual_id character varying(100),
    species_id integer,
    sampling_site_id integer,
    operation character varying(1),
    operation_date timestamp without time zone,
    operation_person_id integer,
    operation_batch_id integer
);


--
-- Name: historical_organism_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historical_organism_property (
    id integer,
    organism_id integer,
    property_id integer,
    value character varying(255),
    operation character varying(1),
    operation_date timestamp without time zone,
    operation_person_id integer,
    operation_batch_id integer
);


--
-- Name: historical_project_organism; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historical_project_organism (
    id integer,
    project_id integer,
    organism_id integer,
    operation character varying(1),
    operation_date timestamp without time zone,
    operation_person_id integer,
    operation_batch_id integer
);


--
-- Name: location; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    country_id character varying(3) NOT NULL,
    extra_info text
);


--
-- Name: location_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.location ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.location_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: location_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.location_property (
    id integer NOT NULL,
    location_id integer NOT NULL,
    property_id integer NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: location_property_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.location_property ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.location_property_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: organism; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organism (
    id integer NOT NULL,
    individual_id character varying(100),
    species_id integer NOT NULL,
    sampling_site_id integer
);


--
-- Name: organism_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.organism ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.organism_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: organism_property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organism_property (
    id integer NOT NULL,
    organism_id integer NOT NULL,
    property_id integer NOT NULL,
    value character varying(255) NOT NULL
);


--
-- Name: organism_property_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.organism_property ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.organism_property_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: person; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.person (
    id integer NOT NULL,
    first_name character varying(255) NOT NULL,
    family_name character varying(255),
    abbreviation character varying(5),
    email character varying(255),
    additional_info character varying(255)
);


--
-- Name: person_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.person ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.person_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: project; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    owner_person_id integer NOT NULL,
    must_read_title character varying(250),
    must_read_content text
);


--
-- Name: project_external_dataset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_external_dataset (
    id integer NOT NULL,
    project_id integer NOT NULL,
    external_dataset_id integer NOT NULL
);


--
-- Name: project_external_dataset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.project_external_dataset ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.project_external_dataset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: project_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.project ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.project_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: project_organism; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.project_organism (
    id integer NOT NULL,
    project_id integer NOT NULL,
    organism_id integer NOT NULL
);


--
-- Name: project_organism_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.project_organism ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.project_organism_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: property; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.property (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trait_id integer NOT NULL,
    data_type_id integer NOT NULL,
    template_column_name character varying(255),
    pre_defined_values character varying(255),
    protocol text,
    req_project_must_read boolean DEFAULT false
);


--
-- Name: property_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.property ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.property_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.role ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.role_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: sampling_area; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sampling_area (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    latitude character varying(255) NOT NULL,
    longitude character varying(255) NOT NULL,
    location_id integer NOT NULL,
    habitat_id integer
);


--
-- Name: sampling_area_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.sampling_area ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.sampling_area_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    name character varying(255) NOT NULL,
    value text NOT NULL
);


--
-- Name: species; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.species (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    internal_code character varying(10),
    image_file_name character varying(255)
);


--
-- Name: species_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.species ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.species_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trait; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trait (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trait_type_id integer,
    is_location_associated boolean DEFAULT false NOT NULL
);


--
-- Name: trait_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trait ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.trait_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: trait_type; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trait_type (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: trait_type_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.trait_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.trait_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: type_dataset; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.type_dataset (
    id integer NOT NULL,
    name character varying(255) NOT NULL
);


--
-- Name: type_dataset_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.type_dataset ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.type_dataset_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_credentials (
    id integer NOT NULL,
    person_id integer,
    status_id integer NOT NULL,
    user_level_id integer NOT NULL,
    password character varying(255) NOT NULL,
    old_password character varying(255),
    requested_by integer NOT NULL
);


--
-- Name: user_credentials_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_credentials ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.user_credentials_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_level; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_level (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


--
-- Name: user_level_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_level ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.user_level_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: user_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_status (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description character varying(255)
);


--
-- Name: user_status_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.user_status ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.user_status_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: view_all_organisms_info; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_all_organisms_info AS
 SELECT o.id,
    o.individual_id,
    s.id AS species_id,
    s.name AS species_name,
    sa.id AS sampling_site_id,
    sa.name AS sampling_site_name,
    l.id AS location_id,
    l.name AS location_name,
    c.name AS country_name,
    all_props.trait_id,
    all_props.trait_name,
    all_props.property_id,
    all_props.property_name,
    all_props.template_column_name,
    op.value
   FROM ((((((public.organism o
     JOIN public.species s ON ((o.species_id = s.id)))
     JOIN public.sampling_area sa ON ((sa.id = o.sampling_site_id)))
     JOIN public.location l ON ((l.id = sa.location_id)))
     JOIN public.country c ON (((c.id)::text = (l.country_id)::text)))
     CROSS JOIN ( SELECT tr.id AS trait_id,
            tr.name AS trait_name,
            p.id AS property_id,
            p.name AS property_name,
            p.template_column_name
           FROM (public.property p
             JOIN public.trait tr ON ((p.trait_id = tr.id)))) all_props)
     LEFT JOIN public.organism_property op ON (((o.id = op.organism_id) AND (all_props.property_id = op.property_id))))
  ORDER BY o.id, all_props.property_id
  WITH NO DATA;


--
-- Name: view_home_latest_datasets; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_home_latest_datasets AS
 SELECT id,
    name,
    date_dataset,
    type,
    link_path
   FROM ( SELECT bu.id,
            bu.name,
            bu.date_completed AS date_dataset,
            'Internal'::text AS type,
            'dashboard/organisms'::text AS link_path
           FROM public.batch_upload bu
          WHERE ((bu.batch_type_id = 1) AND (bu.status = 3))
        UNION ALL
         SELECT ed.id,
            ed.name,
            ed.date_created AS date_dataset,
            'External'::text AS type,
            ('dashboard/externaldatasets/update/'::text || ed.id) AS link_path
           FROM public.external_dataset ed) unnamed_subquery
  ORDER BY date_dataset DESC, name
 LIMIT 10
  WITH NO DATA;


--
-- Name: view_home_location_organisms_counts; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_home_location_organisms_counts AS
 SELECT lo.id AS location_id,
    lo.name AS location_name,
    sp.id AS species_id,
    sp.name AS species_name,
    count(1) AS number_individuals
   FROM (((public.organism o
     JOIN public.sampling_area sa ON ((sa.id = o.sampling_site_id)))
     JOIN public.location lo ON ((lo.id = sa.location_id)))
     JOIN public.species sp ON ((sp.id = o.species_id)))
  GROUP BY lo.id, lo.name, sp.id, sp.name
  ORDER BY lo.name, sp.name DESC
  WITH NO DATA;


--
-- Name: view_home_sampling_area_counts; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_home_sampling_area_counts AS
 SELECT sa.id,
    sa.name,
    sa.latitude,
    sa.longitude,
    h.name AS habitat_name,
    count(1) AS number_individuals
   FROM ((public.organism o
     JOIN public.sampling_area sa ON ((sa.id = o.sampling_site_id)))
     JOIN public.habitat h ON ((h.id = sa.habitat_id)))
  GROUP BY sa.id, sa.name, sa.latitude, sa.longitude, h.name
  WITH NO DATA;


--
-- Name: view_home_species_counts; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_home_species_counts AS
 SELECT s.id AS species_id,
    s.name AS species_name,
    s.image_file_name,
    count(o.id) AS number_individuals
   FROM (public.organism o
     RIGHT JOIN public.species s ON ((s.id = o.species_id)))
  GROUP BY s.id, s.name, s.image_file_name
  ORDER BY (count(o.id)) DESC, s.name
  WITH NO DATA;


--
-- Name: view_home_traits_data_counts; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_home_traits_data_counts AS
 SELECT trait_id,
    trait_name,
    count(1) AS number_entries
   FROM public.view_all_organisms_info
  WHERE (value IS NOT NULL)
  GROUP BY trait_id, trait_name
  ORDER BY trait_name
  WITH NO DATA;


--
-- Name: view_project_organism; Type: MATERIALIZED VIEW; Schema: public; Owner: -
--

CREATE MATERIALIZED VIEW public.view_project_organism AS
 SELECT po.organism_id,
    po.project_id,
    pr.name AS project_name
   FROM (public.project_organism po
     JOIN public.project pr ON ((pr.id = po.project_id)))
  WITH NO DATA;


--
-- Name: batch_type batch_type_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_type
    ADD CONSTRAINT batch_type_name_key UNIQUE (name);


--
-- Name: batch_type batch_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_type
    ADD CONSTRAINT batch_type_pkey PRIMARY KEY (id);


--
-- Name: batch_upload batch_upload_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_upload
    ADD CONSTRAINT batch_upload_pkey PRIMARY KEY (id);


--
-- Name: batch_upload_status batch_upload_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_upload_status
    ADD CONSTRAINT batch_upload_status_pkey PRIMARY KEY (id);


--
-- Name: country country_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.country
    ADD CONSTRAINT country_pkey PRIMARY KEY (id);


--
-- Name: data_type data_type_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_type
    ADD CONSTRAINT data_type_name_key UNIQUE (name);


--
-- Name: data_type data_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_type
    ADD CONSTRAINT data_type_pkey PRIMARY KEY (id);


--
-- Name: external_dataset external_dataset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_dataset
    ADD CONSTRAINT external_dataset_pkey PRIMARY KEY (id);


--
-- Name: habitat habitat_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitat
    ADD CONSTRAINT habitat_name_key UNIQUE (name);


--
-- Name: habitat habitat_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habitat
    ADD CONSTRAINT habitat_pkey PRIMARY KEY (id);


--
-- Name: location location_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_pkey PRIMARY KEY (id);


--
-- Name: location_property location_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_property
    ADD CONSTRAINT location_property_pkey PRIMARY KEY (id);


--
-- Name: organism organism_individual_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism
    ADD CONSTRAINT organism_individual_id_key UNIQUE (individual_id);


--
-- Name: organism organism_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism
    ADD CONSTRAINT organism_pkey PRIMARY KEY (id);


--
-- Name: organism_property organism_property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism_property
    ADD CONSTRAINT organism_property_pkey PRIMARY KEY (id);


--
-- Name: person person_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.person
    ADD CONSTRAINT person_pkey PRIMARY KEY (id);


--
-- Name: project_external_dataset project_external_dataset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_external_dataset
    ADD CONSTRAINT project_external_dataset_pkey PRIMARY KEY (id);


--
-- Name: project_organism project_organism_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_organism
    ADD CONSTRAINT project_organism_pkey PRIMARY KEY (id);


--
-- Name: project project_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_pkey PRIMARY KEY (id);


--
-- Name: property property_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_pkey PRIMARY KEY (id);


--
-- Name: property property_template_column_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_template_column_name_key UNIQUE (template_column_name);


--
-- Name: role role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role
    ADD CONSTRAINT role_pkey PRIMARY KEY (id);


--
-- Name: sampling_area sampling_area_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sampling_area
    ADD CONSTRAINT sampling_area_name_key UNIQUE (name);


--
-- Name: sampling_area sampling_area_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sampling_area
    ADD CONSTRAINT sampling_area_pkey PRIMARY KEY (id);


--
-- Name: species species_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_name_key UNIQUE (name);


--
-- Name: species species_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.species
    ADD CONSTRAINT species_pkey PRIMARY KEY (id);


--
-- Name: trait trait_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trait
    ADD CONSTRAINT trait_name_key UNIQUE (name);


--
-- Name: trait trait_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trait
    ADD CONSTRAINT trait_pkey PRIMARY KEY (id);


--
-- Name: trait_type trait_type_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trait_type
    ADD CONSTRAINT trait_type_name_key UNIQUE (name);


--
-- Name: trait_type trait_type_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trait_type
    ADD CONSTRAINT trait_type_pkey PRIMARY KEY (id);


--
-- Name: type_dataset type_dataset_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.type_dataset
    ADD CONSTRAINT type_dataset_pkey PRIMARY KEY (id);


--
-- Name: user_credentials user_credentials_person_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_person_id_key UNIQUE (person_id);


--
-- Name: user_credentials user_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_pkey PRIMARY KEY (id);


--
-- Name: user_level user_level_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_level
    ADD CONSTRAINT user_level_name_key UNIQUE (name);


--
-- Name: user_level user_level_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_level
    ADD CONSTRAINT user_level_pkey PRIMARY KEY (id);


--
-- Name: user_status user_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_status
    ADD CONSTRAINT user_status_pkey PRIMARY KEY (id);


--
-- Name: end_point_access_end_point_method_user_level_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX end_point_access_end_point_method_user_level_id_idx ON public.end_point_access USING btree (end_point, method, user_level_id);


--
-- Name: location_property_location_id_property_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX location_property_location_id_property_id_idx ON public.location_property USING btree (location_id, property_id);


--
-- Name: organism_property_organism_id_property_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organism_property_organism_id_property_id_idx ON public.organism_property USING btree (organism_id, property_id);


--
-- Name: person_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX person_email_idx ON public.person USING btree (email);


--
-- Name: project_external_dataset_project_id_external_dataset_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX project_external_dataset_project_id_external_dataset_id_idx ON public.project_external_dataset USING btree (project_id, external_dataset_id);


--
-- Name: project_organism_project_id_organism_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX project_organism_project_id_organism_id_idx ON public.project_organism USING btree (project_id, organism_id);


--
-- Name: property_name_trait_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX property_name_trait_id_idx ON public.property USING btree (name, trait_id);


--
-- Name: role_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX role_name_idx ON public.role USING btree (name);


--
-- Name: species_internal_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX species_internal_code_idx ON public.species USING btree (internal_code);


--
-- Name: user_credentials_person_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_credentials_person_id_idx ON public.user_credentials USING btree (person_id);


--
-- Name: batch_upload batch_upload_batch_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_upload
    ADD CONSTRAINT batch_upload_batch_type_id_fkey FOREIGN KEY (batch_type_id) REFERENCES public.batch_type(id);


--
-- Name: batch_upload batch_upload_curator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_upload
    ADD CONSTRAINT batch_upload_curator_id_fkey FOREIGN KEY (curator_id) REFERENCES public.person(id) DEFERRABLE;


--
-- Name: batch_upload batch_upload_status_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_upload
    ADD CONSTRAINT batch_upload_status_fkey FOREIGN KEY (status) REFERENCES public.batch_upload_status(id) DEFERRABLE;


--
-- Name: batch_upload batch_upload_uploaded_by_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.batch_upload
    ADD CONSTRAINT batch_upload_uploaded_by_person_id_fkey FOREIGN KEY (uploaded_by_person_id) REFERENCES public.person(id);


--
-- Name: end_point_access end_point_access_user_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.end_point_access
    ADD CONSTRAINT end_point_access_user_level_id_fkey FOREIGN KEY (user_level_id) REFERENCES public.user_level(id);


--
-- Name: external_dataset external_dataset_owner_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_dataset
    ADD CONSTRAINT external_dataset_owner_person_id_fkey FOREIGN KEY (owner_person_id) REFERENCES public.person(id) DEFERRABLE;


--
-- Name: external_dataset external_dataset_type_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_dataset
    ADD CONSTRAINT external_dataset_type_dataset_id_fkey FOREIGN KEY (type_dataset_id) REFERENCES public.type_dataset(id);


--
-- Name: location location_country_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location
    ADD CONSTRAINT location_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.country(id);


--
-- Name: location_property location_property_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_property
    ADD CONSTRAINT location_property_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: location_property location_property_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.location_property
    ADD CONSTRAINT location_property_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);


--
-- Name: organism_property organism_property_organism_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism_property
    ADD CONSTRAINT organism_property_organism_id_fkey FOREIGN KEY (organism_id) REFERENCES public.organism(id);


--
-- Name: organism_property organism_property_property_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism_property
    ADD CONSTRAINT organism_property_property_id_fkey FOREIGN KEY (property_id) REFERENCES public.property(id);


--
-- Name: organism organism_sampling_site_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism
    ADD CONSTRAINT organism_sampling_site_id_fkey FOREIGN KEY (sampling_site_id) REFERENCES public.sampling_area(id);


--
-- Name: organism organism_species_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organism
    ADD CONSTRAINT organism_species_id_fkey FOREIGN KEY (species_id) REFERENCES public.species(id);


--
-- Name: project_external_dataset project_external_dataset_external_dataset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_external_dataset
    ADD CONSTRAINT project_external_dataset_external_dataset_id_fkey FOREIGN KEY (external_dataset_id) REFERENCES public.external_dataset(id);


--
-- Name: project_external_dataset project_external_dataset_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_external_dataset
    ADD CONSTRAINT project_external_dataset_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- Name: project_organism project_organism_organism_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_organism
    ADD CONSTRAINT project_organism_organism_id_fkey FOREIGN KEY (organism_id) REFERENCES public.organism(id);


--
-- Name: project_organism project_organism_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project_organism
    ADD CONSTRAINT project_organism_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.project(id);


--
-- Name: project project_owner_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.project
    ADD CONSTRAINT project_owner_person_id_fkey FOREIGN KEY (owner_person_id) REFERENCES public.person(id);


--
-- Name: property property_trait_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.property
    ADD CONSTRAINT property_trait_id_fkey FOREIGN KEY (trait_id) REFERENCES public.trait(id);


--
-- Name: sampling_area sampling_area_habitat_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sampling_area
    ADD CONSTRAINT sampling_area_habitat_id_fkey FOREIGN KEY (habitat_id) REFERENCES public.habitat(id);


--
-- Name: sampling_area sampling_area_location_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sampling_area
    ADD CONSTRAINT sampling_area_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.location(id);


--
-- Name: trait trait_trait_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trait
    ADD CONSTRAINT trait_trait_type_id_fkey FOREIGN KEY (trait_type_id) REFERENCES public.trait_type(id);


--
-- Name: user_credentials user_credentials_person_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id);


--
-- Name: user_credentials user_credentials_requested_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_requested_by_fkey FOREIGN KEY (requested_by) REFERENCES public.person(id);


--
-- Name: user_credentials user_credentials_status_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_status_id_fkey FOREIGN KEY (status_id) REFERENCES public.user_status(id);


--
-- Name: user_credentials user_credentials_user_level_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_credentials
    ADD CONSTRAINT user_credentials_user_level_id_fkey FOREIGN KEY (user_level_id) REFERENCES public.user_level(id);


--
-- PostgreSQL database dump complete
--

\unrestrict LFfRS8gkf9QvYDEKcfjovrTbdj8027ToQ7FGYcRqYCehrWzxwcuMxyeDh8Iopar

