# flexBioDB VPS Deployment Guide

This guide describes a production deployment of a flexBioDB instance on
a Linux VPS. It is based on the deployment workflow used for LittorinaDB
and is written so that the same procedure can be adapted to other
flexBioDB instances.

> **Security note:** Never commit production passwords, PostgreSQL
> credentials, session secrets, JWT secrets, or other private values to
> Git. Replace all placeholders in this guide with instance-specific
> values and store secrets outside the repositories.

------------------------------------------------------------------------

## 1. Deployment architecture

A production flexBioDB deployment consists of four main components:

``` text
Internet
   |
   | HTTPS (443)
   v
Nginx
   |
   +---- / ------------------> Next.js frontend (localhost:8080)
   |
   +---- /api/ --------------> Node.js REST API (localhost:3000)
                                      |
                                      v
                                PostgreSQL
                                (localhost:5432)
```

Nginx is the public entry point. PostgreSQL should remain accessible
only from the local server. The frontend and backend are managed as
persistent processes with PM2.

The LittorinaDB reference deployment was performed on AlmaLinux 10.2.
Commands may require minor changes on other distributions.

------------------------------------------------------------------------

## 2. Values used throughout this guide

Replace these placeholders with values appropriate for the new instance:

``` text
<linux-user>          Linux account used to run flexBioDB
<server-ip>           Public IP address of the VPS
<domain>              Public domain, e.g. example.org
<database-name>       PostgreSQL database name
<database-user>       PostgreSQL application role
<backend-directory>   Directory containing biodb-rest-api
<frontend-directory>  Directory containing biodb-react-client
<permanent-files>     Persistent file directory
```

A possible directory layout is:

``` text
/home/<linux-user>/flexbiodb/
├── biodb-rest-api/
├── biodb-react-client/
└── permanent_files/
    └── protocols/
```

For LittorinaDB, the deployment root was
`/home/snail/littorina_database`.

------------------------------------------------------------------------

## 3. Initial VPS setup

Update the system and install the basic tools required by the
deployment:

``` bash
sudo dnf update -y
sudo dnf install -y git nginx
```

Install a supported Node.js version and npm using the package source
appropriate for the server. Confirm the installation:

``` bash
node --version
npm --version
git --version
```

Install PM2 globally:

``` bash
sudo npm install -g pm2
pm2 --version
```

Enable and start Nginx:

``` bash
sudo systemctl enable --now nginx
sudo systemctl status nginx --no-pager
```

### Firewall note

Do not assume that `firewalld` or `nft` is installed. On the LittorinaDB
VPS neither command was initially available. Check the actual
VPS/network configuration first:

``` bash
sudo ss -ltnp
```

If the hosting provider has an external firewall, security group, or
network panel, make sure ports 22, 80, and 443 are permitted there.

------------------------------------------------------------------------

## 4. Clone the repositories

Create the deployment directory:

``` bash
mkdir -p /home/<linux-user>/flexbiodb
cd /home/<linux-user>/flexbiodb
```

Clone the backend and frontend repositories:

``` bash
git clone https://github.com/fernandoGarcia21/biodb-rest-api.git
git clone https://github.com/fernandoGarcia21/biodb-react-client.git
```

Install dependencies:

``` bash
cd biodb-rest-api
npm ci

cd ../biodb-react-client
npm ci
```

Use `npm install` instead of `npm ci` only when a lock file is
unavailable or intentionally being regenerated.

------------------------------------------------------------------------

## 5. PostgreSQL production setup

Install PostgreSQL using the package/repository appropriate for the
server. The LittorinaDB reference deployment used PostgreSQL 17.

The database should listen only on localhost unless remote database
access is explicitly required.

Create a dedicated non-superuser application role and database. For
example, from a PostgreSQL administrative account:

``` sql
CREATE ROLE <database-user>
WITH LOGIN
PASSWORD '<strong-database-password>';

CREATE DATABASE <database-name>
OWNER <database-user>;
```

The application role should own the application database objects but
should not be a PostgreSQL superuser.

### 5.1 Initialize the schema

A new flexBioDB instance should be initialized from the repository
schema and seed files rather than by restoring a development database.

Connect as the application database owner:

``` bash
psql -h localhost -U <database-user> -d <database-name>
```

Or import directly:

``` bash
psql -h localhost -U <database-user> -d <database-name> \
  -f database/schema.sql

psql -h localhost -U <database-user> -d <database-name> \
  -f database/seed.sql
```

The order is important:

``` text
1. schema.sql
2. seed.sql
```

Importing both files as `<database-user>` ensures that the application
objects are owned by the role used by the backend.

### 5.2 Materialized views

After the seed has been loaded, refresh the materialized views in the
`public` schema. The repository documentation should be treated as the
authoritative source for the current refresh block.

Make sure the materialized views are owned by `<database-user>`.
Otherwise PostgreSQL can return errors such as:

``` text
must be owner of materialized view
```

If necessary, reassign the affected object ownership before refreshing.

### 5.3 Default administrator

The seed may create a default administrator account. If it has not been
replaced directly during instance preparation, log in immediately after
deployment, create an administrator appropriate for the new database
instance, and then inactivate or remove the default account.

Do not leave default credentials active in production.

------------------------------------------------------------------------

## 6. Permanent files

Create a persistent directory outside the Git repositories:

``` bash
mkdir -p /home/<linux-user>/flexbiodb/permanent_files/protocols
```

This directory contains instance-specific files that should survive
repository updates.

Typical files include:

``` text
permanent_files/
├── favicon.ico
├── <database-logo>.png
├── TemplateOrganisms.csv
└── protocols/
    └── ...
```

The backend repository contains examples under `database/examples/`.
Copy and adapt the appropriate example files for the new instance.

The database logo filename must match the value configured in the
`SETTINGS` table for:

``` text
DB_LOGO_FILE_NAME
```

The logo does not need to have exactly the same pixel dimensions as the
LittorinaDB example, but it should preserve the recommended aspect ratio
and use a comparable resolution.

`TemplateOrganisms.csv` is the batch template used to create, update,
and delete organism data. Its dynamic property columns must correspond
exactly to the template column identifiers configured in the Trait
Properties module.

Protocol images referenced by property protocols must also be placed
under `permanent_files`, for example:

``` bash
scp /home/local-user/permanent_files/protocols/* \
  <linux-user>@<server-ip>:/home/<linux-user>/flexbiodb/permanent_files/protocols/
```

Graphical SFTP clients such as FileZilla or MobaXterm can be used
instead.

------------------------------------------------------------------------

## 7. Backend environment configuration

Keep production environment variables outside the repository. One
possible location is:

``` text
/etc/<instance-name>/backend.env
```

Create the directory and restrict access appropriately:

``` bash
sudo mkdir -p /etc/<instance-name>
sudo touch /etc/<instance-name>/backend.env
sudo chmod 600 /etc/<instance-name>/backend.env
```

Populate the file with the variables expected by the current backend
configuration. Use the repository `.env.example` as the authoritative
list.

Typical values include database connection information, application
secrets, JWT/session configuration, and instance-specific paths.

Never place actual production secrets in `DEPLOYMENT.md`, README files,
Git commits, screenshots, or issue reports.

------------------------------------------------------------------------

## 8. Run the backend with PM2

From the backend directory:

``` bash
cd /home/<linux-user>/flexbiodb/biodb-rest-api
pm2 start npm --name biodb-rest-api -- start
```

Confirm that the process is online:

``` bash
pm2 status
```

Check its logs:

``` bash
pm2 logs biodb-rest-api --lines 50
```

Confirm that the API is listening on its expected port:

``` bash
ss -ltnp | grep ':3000'
```

The reference deployment uses port `3000`.

After changing backend JavaScript code:

``` bash
pm2 restart biodb-rest-api
```

If `package.json` or `package-lock.json` changed:

``` bash
npm ci
pm2 restart biodb-rest-api
```

### 8.1 Persist PM2 across reboots

Save the current PM2 process list:

``` bash
pm2 save
```

Then generate the startup integration:

``` bash
pm2 startup
```

Run the command printed by PM2 with the requested privileges, then save
again:

``` bash
pm2 save
```

If production environment files are loaded through systemd/PM2
integration, verify the generated service carefully and ensure the
intended `EnvironmentFile` is available before relying on automatic
restart.

------------------------------------------------------------------------

## 9. Production JWT cookie configuration

The production deployment is served over HTTPS. The working LittorinaDB
JWT cookie configuration is:

``` js
res.cookie('jwt', token, {
  sameSite: 'none',
  httpOnly: true,
  secure: true
});
```

The JWT itself is signed with the backend secret and should have a
finite expiration. The reference implementation used a short-lived
token.

Cookie configuration must be tested together with the frontend/backend
domain arrangement and browser requests. Do not weaken authentication
merely to bypass a browser cookie problem.

------------------------------------------------------------------------

## 10. Frontend environment configuration

Keep the production frontend variables outside Git, for example:

``` text
/etc/<instance-name>/frontend.env
```

The relevant public variables are:

``` env
# Public URL of the backend API
NEXT_PUBLIC_API_URL=https://<domain>/api

# Public URL of the deployed flexBioDB frontend instance
NEXT_PUBLIC_SITE_URL=https://<domain>

# Optional Google Analytics 4 Measurement ID
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

For local development:

``` env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

`NEXT_PUBLIC_SITE_URL` can normally be omitted locally because the
application can fall back to localhost. Google Analytics is optional.

> Variables beginning with `NEXT_PUBLIC_` are exposed to the browser.
> Never use them for passwords or secrets.

### Important: build-time variables

Next.js embeds `NEXT_PUBLIC_*` values into the client bundle during the
production build. Therefore, the production variables must be loaded
**before** running:

``` bash
npm run build
```

If one of these variables changes, rebuild the frontend. Restarting the
existing Next.js process alone is not sufficient.

------------------------------------------------------------------------

## 11. Build and run the frontend

Load the intended production environment and enter the frontend
repository. The exact environment-loading mechanism may depend on the
service configuration.

Build:

``` bash
npm run build
```

A successful build should finish with the generated route summary.

Start the production frontend with PM2:

``` bash
pm2 start npm --name biodb-react-client -- start
```

The reference frontend start command is:

``` text
next start -p 8080 -H 0.0.0.0
```

Verify:

``` bash
pm2 status
pm2 logs biodb-react-client --lines 30
ss -ltnp | grep ':8080'
```

After frontend source changes:

``` bash
npm run build
pm2 restart biodb-react-client
```

If dependencies changed:

``` bash
npm ci
npm run build
pm2 restart biodb-react-client
```

### Next.js-generated `tsconfig.json` changes

Next.js may modify `tsconfig.json` during a build. If the VPS should
contain only repository-controlled source changes and the generated
modification is not intended to be committed, restore it before pulling:

``` bash
git restore tsconfig.json
```

Always inspect `git status` before discarding local changes.

------------------------------------------------------------------------

## 12. Nginx reverse proxy

Create an Nginx server configuration such as:

``` text
/etc/nginx/conf.d/<instance-name>.conf
```

A typical single-domain configuration is:

``` nginx
server {
    listen 80;
    listen [::]:80;

    server_name <domain> www.<domain>;

    location /api/ {
        proxy_pass http://127.0.0.1:3000/;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;

        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

The exact `/api/` proxy behavior must match the route structure expected
by the backend.

Validate the configuration:

``` bash
sudo nginx -t
```

Reload Nginx:

``` bash
sudo systemctl reload nginx
```

Confirm listening ports:

``` bash
sudo ss -ltnp
```

Before HTTPS is enabled, Nginx should be listening on port 80 and
forwarding requests to the frontend and backend.

------------------------------------------------------------------------

## 13. Domain and DNS

At the DNS provider, point the desired domain to the public VPS IP using
the appropriate A/AAAA records.

Configure both the root domain and `www` according to the desired
canonical setup.

Wait for DNS propagation and verify that the domain resolves to the VPS
before requesting an HTTPS certificate.

------------------------------------------------------------------------

## 14. HTTPS with Let's Encrypt

Install Certbot and its Nginx integration using a package source
supported by the VPS distribution. On some minimal AlmaLinux
installations, `certbot` is not available in the initially enabled DNF
repositories, so an additional supported repository or installation
method may be required.

Once Certbot is available:

``` bash
certbot --version
```

Request and deploy the certificate through Nginx:

``` bash
sudo certbot --nginx -d <domain> -d www.<domain>
```

Certbot should:

1.  request the certificate;
2.  install it in Nginx;
3.  configure HTTPS;
4.  configure or install automatic renewal.

Verify:

``` bash
sudo nginx -t
sudo systemctl reload nginx
```

Then test:

``` text
https://<domain>
```

Also confirm that HTTP requests redirect to HTTPS if that option was
selected during Certbot configuration.

------------------------------------------------------------------------

## 15. Puppeteer/Chromium dependencies

Some backend functionality, such as PDF generation, launches Chromium
through Puppeteer.

A minimal VPS installation may not contain Chromium's required shared
libraries. A typical failure is:

``` text
Failed to launch the browser process
error while loading shared libraries: libnspr4.so: cannot open shared object file
```

Inspect missing dependencies with:

``` bash
ldd ~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome | grep "not found"
```

During the LittorinaDB deployment, missing libraries included components
associated with:

``` text
NSPR
NSS
ATK
AT-SPI
CUPS
XCB
X11
Xext
Xcomposite
Xdamage
Xfixes
Xrandr
xkbcommon
ALSA
GBM
Cairo
Pango
```

Install the corresponding distribution packages. Package names can vary
between AlmaLinux/RHEL releases, so use the package manager to resolve
the libraries available on the target server.

Repeat:

``` bash
ldd ~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome | grep "not found"
```

until no required shared libraries are reported as missing.

Then restart the backend:

``` bash
pm2 restart biodb-rest-api
```

and test the PDF-generating endpoint from the application.

------------------------------------------------------------------------

## 16. First login and database-instance configuration

After the infrastructure is working, configure the new flexBioDB
instance through the web application.

If the default administrator created by `seed.sql` is still active:

1.  Log in using the default administrator.
2.  Create the real administrator account for the new instance.
3.  Verify that the new administrator can log in.
4.  Inactivate or remove the default administrator.

The recommended initial configuration order is:

``` text
1. Users / access credentials
2. Species
3. Habitats
4. Locations
5. Sampling areas
6. Projects
7. External datasets (optional)
8. Traits, environmental features, and properties
9. Organism batch data
```

Administrator-only configuration includes the foundational taxonomy,
habitat, location, sampling-area, and trait/property metadata. Projects
and external datasets can also be managed by the appropriate
group-leader role according to the application's access rules.

### Trait/property template columns

Each property intended for batch organism data must have the correct
template column identifier. These identifiers become dynamic column
headers in `TemplateOrganisms.csv`.

Do not use commas inside delimiter-sensitive field values unless the
current import implementation explicitly supports them. Replace/sanitize
them as required by the batch template conventions.

------------------------------------------------------------------------

## 17. Organism batch upload

Batch creation, update, and deletion are performed from CSV templates
through the organism interface.

The template contains four standard columns:

``` text
ORGANISM ID
SPECIES
SAMPLING AREA
PROJECTS
```

followed by dynamic columns corresponding to configured trait/property
template identifiers.

`ORGANISM ID` is the mandatory unique identifier used by the batch
workflow. Dynamic column headers must match the configured template
identifiers exactly.

Batch processing runs asynchronously through scheduled jobs. Users can
inspect batch execution status and error information through the
authenticated application.

------------------------------------------------------------------------

## 18. SEO and search-engine discovery

The frontend includes Next.js metadata routes for search-engine
discovery.

### 18.1 `robots.ts`

`src/app/robots.ts` generates:

``` text
/robots.txt
```

It allows crawling of public pages and excludes private/administrative
routes.

`robots.txt` is not a security mechanism. Authentication and
authorization must protect private routes independently.

### 18.2 Private-route `noindex`

Private route branches use `layout.tsx` metadata such as:

``` tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

Place these layouts only at route levels that are entirely private. Do
not wrap a route branch containing public pages with a `noindex` layout.

### 18.3 `sitemap.ts`

`src/app/sitemap.ts` generates:

``` text
/sitemap.xml
```

The sitemap combines public static routes with dynamic public object
pages whose IDs are retrieved from the REST API.

The reference implementation revalidates periodically so that new public
database objects can appear in the sitemap without rebuilding the
frontend for every data change.

After deployment verify:

``` bash
curl https://<domain>/robots.txt
curl https://<domain>/sitemap.xml
```

### 18.4 Google Search Console

For instances that should be discoverable through Google:

1.  Add the domain as a Domain property in Google Search Console.
2.  Add the provided `google-site-verification=...` TXT record at the
    DNS provider.
3.  Keep the verification TXT record after ownership has been confirmed.
4.  Submit the complete sitemap URL, for example:

``` text
https://<domain>/sitemap.xml
```

5.  Optionally request indexing for the home page and a few important
    public pages.

The number of *discovered pages* reported by Search Console represents
URLs found in the sitemap; it does not mean that all of them have
already been indexed.

------------------------------------------------------------------------

## 19. Google Analytics

Google Analytics 4 support is controlled through:

``` env
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

This setting is optional. If analytics are not required, leave it unset.

Because this is a `NEXT_PUBLIC_*` variable, changes require a new
production frontend build:

``` bash
npm run build
pm2 restart biodb-react-client
```

------------------------------------------------------------------------

## 20. Updating a production deployment

Before pulling changes, always inspect the working tree:

``` bash
git status
```

### 20.1 Server should exactly match Git

If the VPS contains local modifications that are not needed and the
repository is the authoritative version, discard them deliberately:

``` bash
git reset --hard HEAD
git clean -fd
git pull origin <branch>
```

**Warning:** `git reset --hard` and `git clean -fd` permanently discard
local changes/untracked files. Run them only after confirming that
nothing on the VPS must be preserved.

If a merge conflict is already in progress and the desired result is
simply the remote repository state, abort/clean the incomplete operation
as appropriate, fetch the remote branch, and reset only after confirming
that local work can be discarded.

### 20.2 Backend update

``` bash
cd /home/<linux-user>/flexbiodb/biodb-rest-api
git pull origin master
pm2 restart biodb-rest-api
```

If dependencies changed:

``` bash
npm ci
pm2 restart biodb-rest-api
```

### 20.3 Frontend update

``` bash
cd /home/<linux-user>/flexbiodb/biodb-react-client
git pull origin main
npm run build
pm2 restart biodb-react-client
```

If dependencies changed:

``` bash
npm ci
npm run build
pm2 restart biodb-react-client
```

Remember that frontend environment changes also require a rebuild.

------------------------------------------------------------------------

## 21. Monitoring and troubleshooting

### PM2 status

``` bash
pm2 status
```

### Backend log

``` bash
pm2 logs biodb-rest-api --lines 50
```

### Frontend log

``` bash
pm2 logs biodb-react-client --lines 50
```

PM2 log files are normally stored under:

``` text
~/.pm2/logs/
```

### Listening ports

``` bash
sudo ss -ltnp
```

A typical deployment should show:

``` text
22     SSH
80     Nginx HTTP
443    Nginx HTTPS
3000   backend
8080   frontend
5432   PostgreSQL on localhost only
```

### Nginx

``` bash
sudo nginx -t
sudo systemctl status nginx --no-pager
```

After configuration changes:

``` bash
sudo systemctl reload nginx
```

### PostgreSQL

Confirm that PostgreSQL is active:

``` bash
sudo systemctl status postgresql --no-pager
```

The exact service name may include the PostgreSQL major version
depending on the installation method.

### HTTP response checks

Examples:

``` bash
curl -I https://<domain>
curl -I https://<domain>/dashboard
curl -I https://<domain>/a-route-that-does-not-exist
```

A nonexistent route should return a real HTTP `404`, not merely display
an error page with status `200`.

------------------------------------------------------------------------

## 22. Common deployment issues

### Frontend still uses an old API URL

`NEXT_PUBLIC_*` values are embedded during `npm run build`.

Fix:

``` bash
# load/correct production environment first
npm run build
pm2 restart biodb-react-client
```

### Backend source changed but behavior did not

Restart the PM2 backend process:

``` bash
pm2 restart biodb-rest-api
```

### `git pull` refuses because of local modifications

Inspect:

``` bash
git status
```

If Git is authoritative and the local change is disposable, restore the
specific file:

``` bash
git restore <file>
```

or deliberately reset the deployment as described in Section 20.

### JWT is created but authentication fails in the browser

Verify the production cookie configuration, HTTPS, frontend request
credentials, proxy configuration, and the backend secret used for
signing/verification.

Do not log JWT tokens, passwords, or secret keys in production.

### Puppeteer PDF generation fails with code 127

Inspect Chromium dependencies:

``` bash
ldd ~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome | grep "not found"
```

Install the missing system libraries and restart the backend.

### Next.js log contains old errors

`pm2 logs --lines N` shows the tail of persistent log files and can
include errors from an earlier process run. Compare timestamps where
available, reproduce the request, or clear/rotate logs deliberately
before concluding that an old stack trace is still occurring.

------------------------------------------------------------------------

## 23. Production deployment checklist

Before considering the deployment complete, verify:

-   [ ] Backend and frontend repositories are cloned from the intended
    branches.
-   [ ] Production dependencies are installed.
-   [ ] PostgreSQL is running.
-   [ ] PostgreSQL listens only on the intended interfaces.
-   [ ] Application database and non-superuser owner exist.
-   [ ] `schema.sql` and `seed.sql` were imported successfully.
-   [ ] Materialized views can be refreshed by the application database
    owner.
-   [ ] Default administrator credentials have been
    replaced/inactivated.
-   [ ] `permanent_files` contains the instance logo, favicon, batch
    template, and required protocol images.
-   [ ] Backend production environment is stored outside Git.
-   [ ] Frontend production environment is stored outside Git.
-   [ ] Production secrets are not exposed in `NEXT_PUBLIC_*` variables.
-   [ ] Backend is online in PM2.
-   [ ] Frontend production build succeeds.
-   [ ] Frontend is online in PM2.
-   [ ] PM2 process list is saved and startup behavior has been
    configured.
-   [ ] Nginx configuration passes `nginx -t`.
-   [ ] `/` reaches the frontend.
-   [ ] `/api/` reaches the backend.
-   [ ] DNS resolves the domain to the VPS.
-   [ ] HTTPS certificate is installed.
-   [ ] Automatic certificate renewal is configured.
-   [ ] Authentication works over HTTPS.
-   [ ] Private routes enforce authorization.
-   [ ] Puppeteer PDF generation works.
-   [ ] Google Analytics is configured if required.
-   [ ] `/robots.txt` is accessible.
-   [ ] `/sitemap.xml` is accessible and contains the intended public
    URLs.
-   [ ] Private routes use appropriate `noindex` metadata.
-   [ ] Search Console ownership and sitemap submission are configured
    if Google indexing is desired.
-   [ ] A real nonexistent route returns HTTP 404.
-   [ ] Backend and frontend logs show no current deployment errors.

------------------------------------------------------------------------

## 24. Operational security recommendations

After deployment:

-   Rotate any secret that was accidentally displayed, shared,
    committed, or copied into an insecure location during setup.
-   Use strong, unique PostgreSQL and application secrets.
-   Keep PostgreSQL private unless remote access is explicitly required.
-   Keep the OS, Node.js dependencies, PostgreSQL, Nginx, and
    application dependencies patched.
-   Periodically test certificate renewal.
-   Review PM2 and Nginx logs for unexpected errors.
-   Back up the PostgreSQL database and `permanent_files` directory
    regularly.
-   Test restoration procedures rather than relying only on the
    existence of backups.
-   Review the public/private route lists whenever new frontend modules
    are added.

------------------------------------------------------------------------

## 25. Reference implementation

LittorinaDB is a production instance of flexBioDB and was used as the
reference deployment for this guide.

Frontend repository:

``` text
https://github.com/fernandoGarcia21/biodb-react-client
```

Backend and PostgreSQL schema repository:

``` text
https://github.com/fernandoGarcia21/biodb-rest-api
```

The repository README files and `.env.example` files should be
considered the authoritative source for application-specific
configuration variables and may evolve independently of this deployment
guide.
