# Use Node base image
FROM node:24-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    unoconv \
    ffmpeg \
    poppler-utils \
    tesseract-ocr \
    python3 \
    python3-venv \
    python3-pip \
    python3-dev \
    fonts-dejavu-core \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip inside venv
RUN pip install --upgrade pip

# Install Python packages inside venv
RUN pip install --no-cache-dir pdf2docx camelot-py[cv] pandas

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install Node dependencies and build
RUN npm install
RUN npm run build

# Expose port if needed (optional)
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
