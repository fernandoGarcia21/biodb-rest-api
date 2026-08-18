# flexBioDB Database

This directory contains the PostgreSQL database definition and initial
data required to deploy a new **flexBioDB** instance.

flexBioDB originated from the development of **LittorinaDB**, a database
designed for the international *Littorina* research community. The
database layer is part of flexBioDB's three-tier architecture and is
intended to be reusable and configurable for other biological study
systems.

## Files

-   `schema.sql` --- creates the database structure, including tables,
    constraints, sequences, views, materialized views, functions,
    procedures, and other database objects.
-   `seed.sql` --- inserts the reference/catalog data required by a new
    flexBioDB installation, creates a bootstrap administrator account,
    and provides generic initial values for the `settings` table.
-   `examples/settings.LittorinaDB.sql` --- optional example showing how
    the generic `settings` values can be customized for a real flexBioDB
    instance. LittorinaDB is provided as the reference implementation.

The seed contains only the initial data required by the framework. It is
not intended to contain real LittorinaDB users or other production user
records.

## Requirements

-   PostgreSQL
-   A PostgreSQL administrative account capable of creating roles and
    databases
-   The `psql` command-line client
-   Node.js and the backend dependencies if you want to generate a
    custom bcrypt password hash using the method described below

## 1. Create the flexBioDB database user

The recommended configuration uses a dedicated PostgreSQL role named
`admin_biodb`.

`admin_biodb` should own the flexBioDB database and its objects, but it
does **not** need to be a PostgreSQL superuser.

Connect to PostgreSQL with an administrative account, for example:

``` bash
psql -h localhost -U postgres
```

Create the role:

``` sql
CREATE USER admin_biodb WITH PASSWORD 'YOUR_SECURE_DATABASE_PASSWORD';
```

Use a strong password and do not store the real password in this
repository. If `admin_biodb` already exists, do not create it again.

## 2. Create the database

Create the database with `admin_biodb` as its owner:

``` sql
CREATE DATABASE biodb OWNER admin_biodb;
```

Then exit `psql`:

``` text
\q
```

Using `admin_biodb` as the database owner is important because the
flexBioDB backend needs to work with database objects such as tables,
sequences, views, materialized views, functions, and stored procedures.
In particular, ownership allows operations such as refreshing
materialized views without requiring the application account to be a
PostgreSQL superuser.

## 3. Review the instance settings

Before importing `seed.sql`, review the generic values inserted into the
`settings` table. These values define deployment- and instance-specific
configuration, including:

-   database instance name, suffix, logo, and welcome message;
-   content displayed on the About page;
-   the maximum number of organism records displayed on screen; and
-   server directories used for permanent files and uploaded batch
    files.

The generic values can be customized directly in `seed.sql` before
installation. Alternatively, they can be updated directly in the
`settings` table after installation, for example:

``` sql
UPDATE public.settings
SET value = 'MyDatabase'
WHERE name = 'DB_NAME';
```

This version of flexBioDB does not provide a user-interface CRUD module
for the `settings` table. These parameters are expected to change only
occasionally and generally concern deployment- or instance-level
configuration. They are therefore intended to be managed by the
server/database administrator rather than through routine database
curation.

Particular attention must be given to:

``` text
PERMANENT_FILES_DIRECTORY
BATCH_FILES_DIRECTORY
```

Both values must be valid absolute paths on the target server. The
backend process must have the appropriate read/write permissions for
these directories.

The `examples/settings.LittorinaDB.sql` file provides a practical
example of how these generic settings can be customized for LittorinaDB.
It uses `UPDATE` statements and is intended to be executed only after
`seed.sql`. Review and adapt the file-system paths before using it.

## 4. Review the bootstrap administrator credentials

Before importing `seed.sql`, review the default flexBioDB administrator
account.

The seed provides the following bootstrap credentials:

``` text
Email: admin@example.com
Password: 000000
```

The password is not stored as plain text in the database. `seed.sql`
contains the bcrypt hash corresponding to the default password `000000`.

These credentials are intended only to provide initial access to a new
installation. **They must not be retained unchanged in a publicly
accessible production deployment.**

For production, the recommended approach is to customize the
administrator email and password hash in `seed.sql` **before importing
it**.

### Generate a custom administrator password hash

The backend uses bcrypt for password hashing. After installing the
backend Node.js dependencies, you can generate a new bcrypt hash from
the backend project directory with:

``` bash
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```

Replace `YOUR_PASSWORD` with the desired administrator password. Copy
the generated bcrypt hash and replace the default administrator password
hash in `seed.sql`.

You may also replace `admin@example.com` with the desired administrator
email address before importing the seed.

Do **not** put the plain-text administrator password in `seed.sql`.

Alternatively, for a local or temporary installation, the default
bootstrap account can be used for the first login. The administrator
information and password should then be changed immediately through the
flexBioDB application.

User/person information can be managed from:

``` text
/dashboard/persons
/dashboard/users
```

## 5. Import the database schema

Import `schema.sql` while connected as `admin_biodb`:

``` bash
psql -h localhost -U admin_biodb -d biodb -f database/schema.sql
```

It is important to perform the import as `admin_biodb`. Objects created
during the import will therefore be owned by the dedicated flexBioDB
database role rather than by the PostgreSQL superuser.

## 6. Import the seed data

After the schema has been created, import the initial reference data:

``` bash
psql -h localhost -U admin_biodb -d biodb -f database/seed.sql
```

The seed populates the reference/catalog tables required by flexBioDB,
creates the bootstrap administrator records in `person` and
`user_credentials`, and inserts generic initial values into `settings`.

The seed also synchronizes the relevant identity sequences after
inserting records with explicit IDs so that subsequent records generated
by the application receive the correct IDs.

## 7. Optional: apply the LittorinaDB example settings

This step is **optional** and is intended primarily as a practical
example for administrators configuring a new flexBioDB instance.

After `seed.sql` has been imported, the generic settings can be replaced
with the LittorinaDB reference configuration using:

``` bash
psql -h localhost -U admin_biodb -d biodb -f database/examples/settings.LittorinaDB.sql
```

The example file uses `UPDATE` statements rather than inserting a second
set of settings. Before executing it, review values that depend on the
deployment environment, especially `PERMANENT_FILES_DIRECTORY` and
`BATCH_FILES_DIRECTORY`.

Administrators deploying a different biological database can use this
file as a guide and update the corresponding records with values
appropriate to their own flexBioDB instance.

## 8. Refresh the materialized views

After creating the schema and importing the seed data (and, when
applicable, the example instance settings), refresh all materialized
views so that they reflect the newly inserted data.

Connect to the database as `admin_biodb`:

``` bash
psql -h localhost -U admin_biodb -d biodb
```

Then execute:

``` sql
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT schemaname, matviewname
        FROM pg_matviews
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format(
            'REFRESH MATERIALIZED VIEW %I.%I',
            r.schemaname,
            r.matviewname
        );
    END LOOP;
END $$;
```

This block discovers and refreshes all materialized views in the
`public` schema. It does not create a permanent function in the
database.

## 9. Verify the installation

You can inspect the database from `psql`:

``` sql
\dt
\dm
```

Check that the bootstrap administrator was created:

``` sql
SELECT id, first_name, family_name, email
FROM person
WHERE id = 1;
```

You can also confirm the associated user account:

``` sql
SELECT id, person_id, status_id, user_level_id
FROM user_credentials
WHERE person_id = 1;
```

The default administrator should have:

``` text
status_id = 1
user_level_id = 1
```

To confirm that `admin_biodb` owns the materialized views and has the
required permissions, a materialized view can also be refreshed
manually, for example:

``` sql
REFRESH MATERIALIZED VIEW view_all_organisms_info;
```

## Security notes

-   Do not run the flexBioDB backend using the PostgreSQL `postgres`
    superuser.
-   Keep the `admin_biodb` database password outside the repository,
    normally in the backend `.env` file.
-   Do not commit real user credentials or production user records to
    `seed.sql`.
-   Replace the bootstrap administrator credentials before production
    deployment, or change them immediately after the first login.
-   Keep the backend `JWT_SECRET` private and separate from the
    PostgreSQL credentials.
-   Review the `settings` values before production deployment,
    especially server file-system paths and instance-specific public
    content.

## LittorinaDB

**LittorinaDB** is the inaugural and reference implementation of
flexBioDB. It was developed to address the data-management needs of the
international *Littorina* research community.

Further details on the conception, development, architecture, and
implementation of LittorinaDB are provided in Chapter 4 of:

> García Castillo, D. F. (2026). *The genomic architecture of local
> adaptation in introduced populations*. Institute of Science and
> Technology Austria (ISTA). https://doi.org/10.15479/AT-ISTA-20991

Additional information about the Littorina research community is
available at:

https://littorina.at.biopolis.pt/

## License

The flexBioDB project is distributed under the MIT License. See the
repository license information for details.
