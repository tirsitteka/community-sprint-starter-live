#!/usr/bin/env bash
set -euo pipefail

npm ci
npm run db:setup
npm test
npm run build
