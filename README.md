# flexBioDB REST API

The **flexBioDB REST API** is the backend component of **flexBioDB**, an
open-source and fully customizable database framework designed to
support research communities working with emerging model systems in
evolutionary biology, ecology, and related fields.

flexBioDB originated from the development of **LittorinaDB**, a database
created to address the specific data-management needs of the
international *Littorina* research community. The framework generalizes
the architecture developed for LittorinaDB so that it can be configured
and adapted to other biological study systems.

Further details on the conception, development, architecture, and
implementation of LittorinaDB are provided in Chapter 4 of:

> García Castillo, D. F. (2026). *The genomic architecture of local
> adaptation in introduced populations*. Institute of Science and
> Technology Austria (ISTA). https://doi.org/10.15479/AT-ISTA-20991

Because flexBioDB is open source and configurable, research communities
can adapt its data structure, terminology, interface, and deployment to
their own organisms, projects, and data-management requirements.

**LittorinaDB** is the inaugural and reference implementation of
flexBioDB. It is a dedicated Model Organism Database (MOD) for the
*Littorina* research community, with an initial focus on *Littorina
saxatilis* and *Littorina arcana*.

For more information about the Littorina research community, visit the
[Littorina Research Community
website](https://littorina.at.biopolis.pt/).

## Architecture

flexBioDB follows a three-tier architecture composed of:

1.  **Web client** --- the Next.js/React user interface.
2.  **REST API** --- the Node.js/Express backend contained in this
    repository.
3.  **PostgreSQL database** --- the relational database used to store
    biological data and metadata.

The REST API acts as the communication layer between the web client and
the database. It handles database queries, authentication, data
submission, file management, and other server-side operations.

## Main technologies

The backend is built primarily with:

-   Node.js
-   Express
-   PostgreSQL
-   `pg` / `pg-format`
-   JSON Web Tokens (JWT)
-   bcrypt
-   Multer
-   Express Session
-   Express Rate Limit

## Requirements

To run the REST API, you need:

-   Node.js
-   npm
-   PostgreSQL
-   A configured flexBioDB database

## Installation

Clone the repository:

``` bash
git clone https://github.com/fernandoGarcia21/biodb-rest-api.git
cd biodb-rest-api
```

Install the dependencies:

``` bash
npm install
```

## Environment configuration

Create a local environment file from the provided example:

``` bash
cp .env.example .env
```

Configure the database connection and application secret in `.env`:

``` env
DB_USER=
DB_HOST=
DB_PASSWORD=
DB_DATABASE=
DB_PORT=
JWT_SECRET=
```

The database variables specify the PostgreSQL instance used by the API.

`S_K` is used as an application secret and should be set to a secure,
unpredictable value.

Do not commit the `.env` file or any credentials to the repository.

### JWT authentication secret

`JWT_SECRET` is the private key used by the REST API to sign and verify JSON
Web Tokens (JWTs) for user authentication. After a successful login, the API
generates a signed token that the client includes in subsequent authenticated
requests.

`JWT_SECRET` must be a long, random, and private value. It must only be stored
on the backend server and must never be exposed to the frontend or committed
to the repository.

A suitable secret can be generated, for example, with:

```bash
openssl rand -hex 32

## Development

Start the API in development mode:

``` bash
npm run dev
```

This loads the variables from `.env` and runs the server in watch mode,
so the application automatically restarts when source files change.

## Production

Start the API with:

``` bash
npm start
```

For production deployments, a process manager such as PM2 can be used to
keep the API running and restart it automatically when necessary.

## Frontend

The REST API is designed to work with the flexBioDB React client:

https://github.com/fernandoGarcia21/biodb-react-client

The frontend communicates with this API to retrieve, submit, update, and
manage the information stored in the flexBioDB PostgreSQL database.

## Database

flexBioDB uses PostgreSQL as its relational database management system.

The database stores the biological data and associated metadata managed
through the REST API. The framework is designed so that its database and
application configuration can be adapted to the requirements of
different biological research systems.

Database schema and initialization instructions should be configured
before starting a new flexBioDB deployment.

## LittorinaDB: reference implementation

LittorinaDB was developed for the needs of the international *Littorina*
research community and served as the foundation from which the more
general flexBioDB framework emerged.

LittorinaDB centralizes standardized biological information, including
phenotypic and environmental data at the individual-organism level,
while allowing database records to be linked to datasets stored in
external public repositories.

As the reference implementation, LittorinaDB demonstrates how the
underlying flexBioDB architecture can be customized for a particular
research community while retaining a reusable and lightweight framework
that can be adapted to other emerging model systems.

## Authors and contributors

**Author and project lead**

-   Diego Fernando García Castillo ---
    https://github.com/fernandoGarcia21

**Contributors**

-   Anja Westram
-   Roger Butlin
-   Rui Faria
-   Nick Barton

## License

This project is distributed under the MIT License. See the repository
license file for details.
