---
name: Backend freshness after merges
description: Avoid mistaking a stale running backend for a frontend-to-backend route mismatch after a failed merge setup.
---

After a failed merge setup, do not assume a working frontend and healthy API mean the backend has loaded the merged code.

**Why:** The frontend updated while the running backend still lacked the newly merged letter route. The client and source route matched; restarting the application resolved the live 404 without changing either path.

**How to apply:** When a new API endpoint exists in source but returns the generic missing-route response, check runtime freshness before editing the contract. After repairing failed merge setup, restart the application workflow and verify the new endpoint itself.
