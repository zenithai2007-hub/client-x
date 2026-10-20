#!/usr/bin/env python3
"""Re-run the production deployment for CLIENT X.

Requires a Vercel connector/credential with deploy permission on the
zenithai2007-5539s-projects team. Usage:

    python3 scripts/vercel-deploy.py

It prints the exact `vercel call-tool` command to run.
"""
import hashlib
import json
import os
import subprocess

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAM_ID = "team_5Pfj4pmPdzHYfX39Kzewjv9u"
PROJECT_ID = "prj_BEZfxJ7i4LJ1G2OkLdxfJHnXAluR"

files = subprocess.check_output(["git", "ls-files"], cwd=REPO, text=True).splitlines()
entries = []
for f in files:
    path = os.path.join(REPO, f)
    data = open(path, "rb").read()
    entries.append({"file": f, "sha": hashlib.sha1(data).hexdigest(), "size": len(data)})

payload = {
    "teamId": TEAM_ID,
    "requestBody": {
        "name": "client-x",
        "project": PROJECT_ID,
        "target": "production",
        "files": entries,
    },
}

tmp = "/tmp/clientx-deploy-payload.json"
open(tmp, "w").write(json.dumps(payload))
print(f"manifest: {len(entries)} files -> {tmp}")
print()
print("Run:")
print(
    '  /opt/hatch/bin/vercel call-tool --name create_deployment '
    f'--arguments-json "$(cat {tmp})"'
)
print()
print("If Vercel lists missing file blobs, upload each with the upload_file tool")
print("(base64 content in requestBody, SHA1 in xVercelDigest, teamId set), then retry.")
