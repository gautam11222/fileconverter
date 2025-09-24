# Use Node base image
FROM node:24-bullseye

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-script-provider-python \
    libreoffice-common \
    libreoffice-writer \
    libreoffice-calc \
    libreoffice-impress \
    libreoffice-draw \
    libreoffice-base \
    unoconv \
    ffmpeg \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-eng \
    ghostscript \
    python3 \
    python3-venv \
    python3-pip \
    python3-dev \
    libgl1 \
    fonts-dejavu-core \
    fonts-liberation \
    fonts-noto-cjk \
    && rm -rf /var/lib/apt/lists/*
# Create Python virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Upgrade pip inside venv
RUN pip install --upgrade pip

# Install Python packages inside venv
RUN pip install pdf2docx camelot-py[cv] pandas

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Install Node dependencies
RUN npm install
RUN npm run build

# Start the app
CMD ["npm", "start"]