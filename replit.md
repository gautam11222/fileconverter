# FileConverter

## Overview

FileConverter is a professional online file conversion web application that supports 50+ different file format conversions across documents, images, audio, video, and archives. The application provides a modern, responsive interface with features like drag-and-drop uploads, batch processing, real-time conversion progress, and secure temporary file storage. The platform is designed to be SEO-optimized with dedicated pages for each conversion tool and includes provisions for Google AdSense integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript and uses a modern component-based architecture:
- **UI Framework**: React with Vite for fast development and building
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible design
- **State Management**: React hooks and TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing with SEO-friendly URLs
- **Theme System**: Custom theme provider supporting light/dark modes
- **File Handling**: Custom hooks for file upload, conversion tracking, and progress monitoring

### Backend Architecture
The server follows a REST API pattern built on Express.js:
- **Framework**: Express.js with TypeScript for type safety
- **File Processing**: Modular converter services supporting multiple file formats
- **Upload Handling**: Multer middleware for secure file uploads with size limits
- **Storage Strategy**: Temporary file storage with automatic cleanup
- **Session Management**: Session-based conversion tracking without user accounts

### Database Design
Uses Drizzle ORM with PostgreSQL for data persistence:
- **Users Table**: Optional user registration with username/password/email
- **Conversions Table**: Tracks conversion history with metadata including file info, status, and download paths
- **Schema**: Type-safe database operations with Zod validation

### File Conversion Engine
Supports 50+ conversion types across multiple categories:
- **Documents**: PDF ↔ Word, Excel, PowerPoint, TXT conversions
- **Images**: JPG, PNG, WEBP, SVG, HEIC format conversions with compression options
- **Audio**: MP3, WAV, AAC, FLAC conversions with quality settings
- **Video**: MP4, AVI, MOV, MKV conversions with compression and extraction features
- **Archives**: ZIP, RAR, 7Z compression and extraction
- **Specialized**: OCR (image to text), speech-to-text, text-to-speech capabilities

### SEO Optimization
Comprehensive SEO strategy for search engine visibility:
- **Individual Tool Pages**: Dedicated routes for each conversion type (e.g., /pdf-to-word)
- **Meta Tags**: Dynamic title, description, and Open Graph tags per tool
- **Structured Data**: JSON-LD markup for rich snippets and FAQ sections
- **Performance**: Optimized loading with code splitting and asset optimization

### Security Features
Enterprise-grade security measures:
- **File Upload Validation**: Type checking and size limits
- **Temporary Storage**: Automatic file deletion after 24 hours
- **HTTPS**: SSL encryption for all data transmission
- **Input Sanitization**: Protection against malicious file uploads

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle ORM**: Type-safe database operations and migrations

### File Processing Libraries
- **Sharp**: High-performance image processing and conversion
- **FFmpeg**: Video and audio conversion engine
- **LibreOffice**: Document format conversions
- **Archiver/Unzipper**: Archive file handling

### UI Components
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Icon library for consistent iconography
- **React Hook Form**: Form handling with validation
- **React Dropzone**: Drag-and-drop file upload interface

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across the entire application
- **Tailwind CSS**: Utility-first CSS framework
- **TanStack Query**: Server state management and caching

### Cloud Storage Integration
- Support planned for Google Drive, Dropbox, and OneDrive imports
- Email delivery system for converted files
- Analytics integration with Google Analytics for usage tracking

### Advertisement System
- Google AdSense integration points in header, sidebar, and footer
- Clear separation between ads and functional elements
- Mobile-responsive ad placements