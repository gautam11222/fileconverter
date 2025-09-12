import { useState, useCallback } from 'react';
import { FileUpload, ConversionSettings } from '@/types/converter';
import { useToast } from '@/hooks/use-toast';

export function useFileConverter() {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const addFiles = useCallback((newFiles: File[]) => {
    const fileUploads: FileUpload[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...fileUploads]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const updateFileStatus = useCallback((fileId: string, status: FileUpload['status'], progress?: number, error?: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId
          ? { ...file, status, progress: progress ?? file.progress, error }
          : file
      )
    );
  }, []);

  const pollConversionStatus = useCallback(async (fileId: string, conversionId: string) => {
    const maxAttempts = 30; // 30 seconds max
    let attempts = 0;

    const checkStatus = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/conversion/${conversionId}`);
        if (!response.ok) {
          throw new Error('Failed to check conversion status');
        }

        const result = await response.json();
        
        if (result.status === 'completed' && result.downloadUrl) {
          updateFileStatus(fileId, 'completed', 100);
          setFiles((prev) =>
            prev.map((file) =>
              file.id === fileId
                ? {
                    ...file,
                    downloadUrl: result.downloadUrl,
                    convertedFileName: result.fileName,
                  }
                : file
            )
          );
        } else if (result.status === 'failed') {
          updateFileStatus(fileId, 'failed', 0, 'Conversion failed');
        } else if (result.status === 'processing' && attempts < maxAttempts) {
          attempts++;
          setTimeout(checkStatus, 1000); // Check again in 1 second
        } else if (attempts >= maxAttempts) {
          updateFileStatus(fileId, 'failed', 0, 'Conversion timeout');
        }
      } catch (error) {
        updateFileStatus(fileId, 'failed', 0, error instanceof Error ? error.message : 'Status check failed');
      }
    };

    checkStatus();
  }, [updateFileStatus]);

  const convertFiles = useCallback(async (settings: ConversionSettings) => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to convert.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);

    try {
      for (const fileUpload of files) {
        updateFileStatus(fileUpload.id, 'processing');

        const formData = new FormData();
        formData.append('file', fileUpload.file);
        formData.append('targetFormat', settings.targetFormat);
        formData.append('quality', settings.quality);
        formData.append('compress', settings.compress.toString());
        formData.append('emailResult', settings.emailResult.toString());

        try {
          const response = await fetch('/api/convert', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(`Conversion failed: ${response.statusText}`);
          }

          const result = await response.json();
          
          // Store conversionId and start polling for status
          setFiles((prev) =>
            prev.map((file) =>
              file.id === fileUpload.id
                ? {
                    ...file,
                    conversionId: result.conversionId,
                  }
                : file
            )
          );

          // Poll for conversion status
          pollConversionStatus(fileUpload.id, result.conversionId);

        } catch (error) {
          updateFileStatus(fileUpload.id, 'failed', 0, error instanceof Error ? error.message : 'Conversion failed');
        }
      }

      toast({
        title: "Conversion complete",
        description: "Your files have been converted successfully.",
      });
    } catch (error) {
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An error occurred during conversion.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  }, [files, toast, updateFileStatus, pollConversionStatus]);

  const resetConverter = useCallback(() => {
    setFiles([]);
    setIsConverting(false);
  }, []);

  const getCompletedFiles = useCallback(() => {
    return files.filter((file) => file.status === 'completed' && file.downloadUrl);
  }, [files]);

  return {
    files,
    isConverting,
    addFiles,
    removeFile,
    convertFiles,
    resetConverter,
    getCompletedFiles,
  };
}
