# Step 1: Build the React frontend
FROM node:23.3.0-slim AS builder-frontend
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy frontend dependency files and install dependencies
COPY frontend/package.json frontend/pnpm-lock.yaml ./frontend/
RUN cd frontend && pnpm install

# Copy the rest of the frontend source code and build the app
COPY frontend ./frontend
RUN cd frontend && pnpm run build

# Step 2: Setup the Express backend with Python, pnpm, Git, and the scripts folder
FROM node:23.3.0-slim

# Set the working directory
WORKDIR /tmp/app

# Set environment variables for production
ENV NODE_ENV=production
ENV AGENT_REPO=eliza-zetta

# Install pnpm globally and necessary build tools
RUN npm install -g pnpm@9.4.0 && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        git \
        python3 \
        python3-pip \
        python3-dev \
        python3-venv \
        curl \
        node-gyp \
        ffmpeg \
        libtool-bin \
        autoconf \
        automake \
        libopus-dev \
        make \
        g++ \
        build-essential \
        libcairo2-dev \
        libjpeg-dev \
        libpango1.0-dev \
        libgif-dev \
        openssl \
        libssl-dev && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*  

# Set Python 3 as the default python
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Copy Agent Code to be built in runtime to keep image small
COPY ${AGENT_REPO} ./${AGENT_REPO}

# Copy backend dependency files and install dependencies
# Handle Sqlite3 binding file error
COPY backend/package.json backend/pnpm-lock.yaml ./backend/
RUN cd backend && \
    pnpm install && \
    cd node_modules/better-sqlite3 && \
    pnpm run build-release

# Copy backend source code and the built React frontend from the previous stage
COPY backend ./backend
COPY --from=builder-frontend /app/frontend/dist ./backend/frontend/dist

# Copy requirements.txt for Python dependencies
COPY scripts/requirements.txt ./scripts/requirements.txt

# Use a virtual environment for Python dependencies
RUN python3 -m venv /tmp/venv && \
    /tmp/venv/bin/pip install --no-cache-dir -r ./scripts/requirements.txt && \
    ln -s /tmp/venv/bin/python /usr/local/bin/python-venv && \
    ln -s /tmp/venv/bin/pip /usr/local/bin/pip-venv

# Copy the scripts folder into the container
COPY scripts ./scripts

# Copy the entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Run the backend as a non-root user (Currently takes too long, temp fix run as root)
# RUN useradd -m appuser
# RUN chown -R appuser:appuser /app
# USER appuser

# Expose the backend port
EXPOSE 5000 3000 5173

# Use the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]
