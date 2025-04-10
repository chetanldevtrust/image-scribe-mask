
import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) {
      return;
    }

    const file = acceptedFiles[0];
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Check if the file size is less than 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Please upload an image smaller than 10MB');
      return;
    }
    
    onImageUpload(file);
    toast.success('Image uploaded successfully');
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: false,
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors duration-200 cursor-pointer animate-fade-in
        ${isDragActive ? 'border-editor-accent bg-editor-accent/10' : 'border-gray-400 hover:border-editor-accent/70 hover:bg-gray-100/5'}`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="bg-editor-accent/20 p-4 rounded-full">
          <Upload className="w-10 h-10 text-editor-accent" />
        </div>
        <div>
          <p className="text-lg font-medium">
            {isDragActive ? 'Drop the image here' : 'Drag & drop an image, or click to select'}
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Supports JPEG, PNG, WebP, and GIF (Max 10MB)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageUploader;
