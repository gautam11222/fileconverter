export interface ConversionTool {
  id: string;
  name: string;
  description: string;
  fromFormat: string;
  toFormat: string;
  category: ConversionCategory;
  icon: string;
  iconColor: string;
  path: string;
  popular?: boolean;
}

export type ConversionCategory = 'documents' | 'images' | 'audio' | 'video' | 'archives' | 'other';

export interface FileUpload {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  downloadUrl?: string;
  convertedFileName?: string;
  conversionId?: string;
}

export interface ConversionSettings {
  targetFormat: string;
  quality: 'low' | 'medium' | 'high';
  compress: boolean;
  emailResult: boolean;
  customSettings?: Record<string, any>;
}

export interface ConversionHistory {
  id: string;
  originalName: string;
  convertedName: string;
  fromFormat: string;
  toFormat: string;
  timestamp: Date;
  status: 'completed' | 'failed';
}
