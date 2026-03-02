#!/bin/sh
set -e
echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
echo "Starting TeachersHelp..."
exec node server.js
