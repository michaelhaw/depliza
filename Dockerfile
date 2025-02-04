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

# Step 2: Build the Agent Application
FROM node:23.3.0-slim AS builder-agent

# Install pnpm globally and necessary build tools
RUN npm install -g pnpm@9.4.0 && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y \
        git \
        python3 \
        python3-pip \
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

# Set the working directory
WORKDIR /app

ENV AGENT_REPO=eliza-zetta

# Copy application code
COPY ${AGENT_REPO} .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build the project
RUN pnpm run build && pnpm prune --prod

# Step 3: Setup the Express backend with Python, pnpm, Git, and the scripts folder
FROM node:23.3.0-slim
WORKDIR /app

# Set environment variables for production
ENV NODE_ENV=production
ENV AGENT_REPO=eliza-zetta

# Install Python, Git, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-dev python3-venv build-essential git curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install runtime dependencies
RUN npm install -g pnpm@9.4.0 && \
    apt-get update && \
    apt-get install -y \
        git \
        curl \
        python3 \
        python3-pip \
        python3-dev \
        python3-venv \
        build-essential \
        ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*    

# Install pnpm globally
RUN npm install -g pnpm

# Install flyctl in a custom directory
ENV FLYCTL_INSTALL=/app/flyctl
ENV PATH=$FLYCTL_INSTALL/bin:$PATH
RUN curl -L https://fly.io/install.sh | sh && \
    chmod +x $FLYCTL_INSTALL/bin/flyctl

# Clone the agent repository and checkout the main branch
# [Feat] agent repository is now merged into depliza repo, no need to clone
# RUN git clone --depth 1 --branch revert https://github.com/michaelhaw/eliza-rdai.git ./eliza-rdai

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
RUN python3 -m venv /app/venv && \
    /app/venv/bin/pip install --no-cache-dir -r ./scripts/requirements.txt && \
    ln -s /app/venv/bin/python /usr/local/bin/python-venv && \
    ln -s /app/venv/bin/pip /usr/local/bin/pip-venv

# Copy the scripts folder into the container
COPY scripts ./scripts

# Copy built artifacts and production dependencies from the builder stage
COPY --from=builder-agent /app/package.json ./${AGENT_REPO}/
COPY --from=builder-agent /app/pnpm-workspace.yaml ./${AGENT_REPO}/
COPY --from=builder-agent /app/.npmrc ./${AGENT_REPO}/
COPY --from=builder-agent /app/turbo.json ./${AGENT_REPO}/
COPY --from=builder-agent /app/node_modules ./${AGENT_REPO}/node_modules
COPY --from=builder-agent /app/agent ./${AGENT_REPO}/agent
COPY --from=builder-agent /app/client ./${AGENT_REPO}/client
COPY --from=builder-agent /app/lerna.json ./${AGENT_REPO}/
COPY --from=builder-agent /app/packages ./${AGENT_REPO}/packages
COPY --from=builder-agent /app/scripts ./${AGENT_REPO}/scripts
COPY --from=builder-agent /app/characters ./${AGENT_REPO}/characters

# Run the backend as a non-root user (Currently takes too long, temp fix run as root)
# RUN useradd -m appuser
# RUN chown -R appuser:appuser /app
# USER appuser

# Expose the backend port
EXPOSE 5000 3000 5173

# Run the Express app
CMD ["node", "backend/app.js"]
