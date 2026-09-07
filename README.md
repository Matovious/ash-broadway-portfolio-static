# ashbroadway.com

Static site for Ash Broadway, migrated off WordPress. Built with Astro; content
lives in this repo as markdown and is edited through Sveltia CMS at `/admin/`.

There is no database. Every edit is a git commit, so the site's history *is* the
content history, and a bad edit is reverted by reverting a commit.

## Local development

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # prerenders every page into dist/
npm start         # serves the built output the way Railway does
```

## How it fits together

| Path | What it is |
| --- | --- |
| `src/content/case-studies/` | One markdown file per case study. `sections` holds the brief/scope/process/outcome blocks. |
| `src/content/testimonials/` | One file per testimonial. |
| `src/content/pages/about.md` | The homepage. |
| `public/media/` | Images and PDFs. CMS uploads land here. |
| `public/admin/` | The CMS. `config.yml` defines what Ash can edit. |
| `src/pages/auth.ts`, `callback.ts` | GitHub sign-in for the CMS (see below). |

Every page is prerendered at build time. The only server-rendered routes are the
two OAuth endpoints, which is why the project uses the Node adapter.

### URLs

The URL structure matches what WordPress served, so the migration needs no
redirects: `/`, `/portfolio/`, `/portfolio/<slug>/`, `/testimonials/`.

## Deploying on Railway

Railway builds and runs this like any Node app — `npm install`, `npm run build`,
`npm start`. Two things need setting up once.

### 1. A GitHub OAuth app (so Ash can log into the CMS)

Netlify provides this for free; Railway doesn't, so we host the OAuth endpoints
ourselves. On GitHub: **Settings → Developer settings → OAuth Apps → New**.

- Homepage URL: `https://ashbroadway.com`
- Authorization callback URL: `https://ashbroadway.com/callback`

Copy the client ID, generate a client secret.

### 2. Railway environment variables

| Variable | Value |
| --- | --- |
| `GITHUB_CLIENT_ID` | from the OAuth app |
| `GITHUB_CLIENT_SECRET` | from the OAuth app |
| `ALLOWED_DOMAINS` | `ashbroadway.com` |

`PORT` is provided by Railway. `HOST` is set to `0.0.0.0` by the start script.

### 3. Give Ash access

Add her GitHub account as a collaborator on this repo. She signs in at
`ashbroadway.com/admin/` — she never needs to visit GitHub itself. Publishing
from the CMS pushes a commit, which triggers a Railway redeploy.

## Editing without the CMS

Edit the markdown directly and push. The CMS and the files are the same thing.
