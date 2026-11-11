<!-- SPDX-FileCopyrightText: 2026 Jeremy Miller
     SPDX-License-Identifier: LicenseRef-Illuminatio-Proprietary -->
# Illuminatio documents

Source and publishing application for Illuminatio technical documentation and approved editorial
material.

Technical documentation remains owned by the repository it describes:

- `illuminatio-parent/docs/` owns platform-wide documentation.
- Each `illuminatio-*` module owns its module-specific `docs/` tree.
- This repository collects those sources into an ignored staging tree and publishes the combined
  Docusaurus site. It never becomes a manually maintained copy of them.

The existing `articles/`, `images/` and `presentations/` directories are original editorial source.
Only entries explicitly approved in `content-manifest.yml` may be published.

## Local development

Prerequisites: Node.js 24 or later, npm and sibling Illuminatio repositories checked out under the
same `Developments` directory.

```bash
cd site
npm ci
npm run start
```

`npm run start` collects local documentation with dirty-worktree warnings allowed. Release builds
use `npm run build`, which rejects dirty source repositories and stale or broken documentation.

## Docker image

Collect and validate documentation before building because Docker cannot read sibling repositories
outside its build context:

```bash
cd site
npm ci
npm run collect:local
npm run validate
cd ..
docker build -t illuminatio/documents:local .
```

Create the local Basic Authentication secret and start the protected container:

```bash
./deployment/create-password.sh jeremy
docker compose -f deployment/docker-compose.yml up -d
```

The site is then available at `http://127.0.0.1:8088`; maintained environments must terminate TLS
before forwarding to the container. `/healthz` contains no documentation and is the only
unauthenticated endpoint.

### Parent bootstrap integration

The parent Bootstrap catalog exposes the protected container as the opt-in `docs` service. It is
deliberately not part of the `full` Java-service scope.

```bash
cd ../illuminatio-parent
./src/resources/bootstrap.sh -s docs build
./src/resources/bootstrap.sh -s docs start
./src/resources/bootstrap.sh -s docs status
./src/resources/bootstrap.sh -s docs stop
```

`start` assembles the current sibling repository documentation, validates it, builds the image,
starts Compose and waits for `/healthz`. Set `MS_DOCUMENTATION_BUILD=false` to reuse an existing
image, `DOCUMENTATION_PORT` to override port 8088, or `ILLUMINATIO_DOCUMENTS_ROOT` when the documents
repository is not a sibling of `illuminatio-parent`.

## Release publication and presentation

The parent release workflow publishes this site alongside the application images using the same
immutable namespace and tag. Release images are built with `DOCS_BASE_URL=/documentation/`; Caddy
links to that path from the default landing page and proxies it to this container. Local Bootstrap
builds retain `DOCS_BASE_URL=/`, so `http://127.0.0.1:8088` continues to work unchanged.

The documentation theme reuses the landing-page Illuminatio design tokens: Inter/system typography,
blue, magenta and gold accents, light gradient washes, compact surfaces, and accessible focus states.
Documentation navigation, code blocks, tables, diagrams and dark mode remain optimized for technical
reading rather than reproducing the marketing layout.

The container remains responsible for Basic Authentication. Caddy does not terminate or bypass the
challenge, and `/healthz` remains the only unauthenticated endpoint. The browser-native Basic
Authentication dialog cannot be branded.

## Continuous integration

The `Documentation` workflow checks out the exact revisions in `docs-sources.lock.json`, rejects
dirty or incomplete source sets, validates links and anchors, builds the static site, audits
production dependencies at high severity, and builds the protected container.

Configure the repository secret `ILLUMINATIO_DOCS_TOKEN` with read access to the private
`illuminatio-*` source repositories. The token is used only as an HTTP authorization header while
cloning locked commits and is never written into a remote URL or generated artifact.
