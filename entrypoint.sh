#!/bin/sh

# Ensure script stops on failure
set -e

echo "🚀 Starting entrypoint script..."

# Ensure /app exists and is writable
mkdir -p /app

# If /app/backend does not exist, copy application files
if [ ! -d "/app/backend" ]; then
    echo "🔹 /app/backend is missing, copying application files..."
    cp -R /tmp/app/* /app/
    cp -R /tmp/venv /app/venv
else
    echo "✅ /app already contains the application files, skipping copy."
fi

# Ensure backend directory exists
if [ ! -d "/app/backend" ]; then
    echo "❌ ERROR: /app/backend does not exist!"
    ls -la /app  # Debugging step to check contents of /app
    exit 1
fi

# Change to backend directory and start the application
cd /app/backend
echo "🚀 Starting backend..."
exec pnpm run start
