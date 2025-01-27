# Step 1: Build the React frontend
FROM node:23.3.0-slim as build
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
WORKDIR /app

# Install Python, Git, and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-dev build-essential git && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm

# Configure Git for large repositories
RUN git config --global http.postBuffer 157286400

# Clone the agent repository and checkout the main branch
RUN git clone --depth 1 --branch main https://github.com/michaelhaw/eliza-rdai.git /eliza-rdai

# Add AGENT_REPO environment variable
ENV AGENT_REPO=eliza-rdai

# Copy backend dependency files and install dependencies
COPY backend/package.json backend/pnpm-lock.yaml ./backend/
RUN cd backend && pnpm install

# Copy backend source code and the built React frontend from the previous stage
COPY backend ./backend
COPY --from=build /app/frontend/build ./backend/frontend/build

# Copy scripts folder and install Python dependencies
COPY scripts/requirements.txt ./scripts/requirements.txt
RUN pip3 install --no-cache-dir -r ./scripts/requirements.txt
COPY scripts ./scripts

# Expose the backend port
EXPOSE 5000

# Set environment variables for production
ENV NODE_ENV=production

# Run the backend as a non-root user
RUN useradd -m appuser
RUN chown -R appuser:appuser /app
USER appuser

# Run the Express app
CMD ["node", "backend/app.js"]
