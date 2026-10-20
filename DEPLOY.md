# CLIENT X — production deployment

Repo: github.com/zenithai2007-hub/client-x (branch main)
Latest commit: 3e5a0d5 — "Production master upgrade" (build `npm run build` passes, 38 routes, 17 API endpoints)

Live URL (currently serving the previous build cd26733):
https://client-x-zenithai2007-5539s-projects.vercel.app/

## Status: DEPLOY BLOCKED — Vercel connector lacks scope permission

`create_deployment` via the Vercel connector fails with:

> 403 forbidden — Not authorized: Trying to access resource under scope
> "zenithai2007-5539s-projects". You must re-authenticate to this scope or use a
> token with access to this scope. (POST /v13/deployments)

Reads of `list_projects` succeed, but writes/deployments under this team scope
are forbidden with the current OAuth grant.

## What is needed

Re-authorize the Vercel connector (agent.meta.ai/connectors) so it has deploy
permission for the **zenithai2007-5539s-projects** team — or supply a Vercel
token with `deployments.publish` for that team — then re-run:

```bash
cd ~/workspace/client-x
python3 scripts/vercel-deploy.py
```

The script regenerates the file manifest (SHA1-referenced; Vercel dedupes blobs
it already has) and calls `create_deployment` with
`project=prj_BEZfxJ7i4LJ1G2OkLdxfJHnXAluR`, `target=production`. If Vercel
reports missing blobs, upload them first with the `upload_file` tool (base64,
SHA1 digest as `xVercelDigest`), then retry — the script documents the exact
arguments shape.
