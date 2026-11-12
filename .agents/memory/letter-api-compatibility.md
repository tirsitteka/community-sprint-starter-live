---
name: Letter API compatibility
description: Why both historical letter request conventions are supported.
---

Treat both historical letter request conventions as compatibility boundaries,
not duplicate routes to remove during cleanup.

**Why:** Independently developed GitHub and Replit versions used different
request paths and field names. The user approved combining the versions while
preserving both sets of work, so existing callers should continue to work.

**How to apply:** Keep both entry points on the same private letter workflow
and validation limit. Apply privacy, template, deadline, and response-ending
fixes to the shared workflow. Do not move one entry point back to general
chat routing, tools, or logging. Remove a convention only with an explicit
migration decision.
