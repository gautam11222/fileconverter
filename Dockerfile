# ----------------------------
# Stage 1: Build the frontend
# ----------------------------
FROM node:24-bullseye AS builder

WORKDIR /app

# Copy only package files first (for caching)
COPY package*.json ./

RUN npm install

# Copy rest of the code
COPY . .

# Build frontend + server
RUN npm run build

# ----------------------------
# Stage 2: Runtime
# ----------------------------
FROM node:24-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-core \
    libreoffice-common \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    ffmpeg \
    poppler-utils \
    tesseract-ocr \
    python3 \
    python3-venv \
    python3-pip \
    fonts-dejavu-core \
    fonts-liberation \
    locales \
    && rm -rf /var/lib/apt/lists/*

# Set UTF-8 locale (fixes soffice crashes on some files)
RUN locale-gen en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

RUN pip install --upgrade pip
RUN pip install pdf2docx camelot-py[cv] pandas

# Set working directory
WORKDIR /app

# Copy build from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Ensure prod deps only
RUN npm install --omit=dev --ignore-scripts

# Make sure /tmp is writable (LibreOffice needs this)
RUN mkdir -p /tmp && chmod -R 777 /tmp

# Expose Render’s default port
EXPOSE 10000

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:10000/ || exit 1

# Start app
CMD ["npm", "start"]
