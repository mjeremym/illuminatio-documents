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
