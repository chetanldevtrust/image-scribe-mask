
import { useState, useRef } from 'react';
import ImageUploader from '@/components/ImageUploader';
import ImageCanvas from '@/components/ImageCanvas';
import ToolsPanel from '@/components/ToolsPanel';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Info } from 'lucide-react';

const Index = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [secondImageFile, setSecondImageFile] = useState<File | null>(null);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [brushSize, setBrushSize] = useState(20);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const handleReset = () => {
    // Canvas reset logic is handled via an event in ImageCanvas component
  };
  
  const handleBack = () => {
    setImageFile(null);
    setSecondImageFile(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="p-4 flex items-center justify-between bg-white dark:bg-gray-800 shadow-sm">
        <h1 className="text-2xl font-bold">Image Scribe Mask</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-gray-500 flex items-center gap-1">
            <Info className="w-4 h-4" />
            <span>Help</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-4">
        {!imageFile ? (
          <div className="max-w-3xl mx-auto mt-10">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold mb-3">Upload an Image to Start Masking</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Upload your image and use our tools to mask areas for editing or replacement
              </p>
            </div>
            <ImageUploader onImageUpload={setImageFile} />
            
            <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-medium mb-3">How to Use Image Scribe Mask</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                <li>Upload an image using the uploader above</li>
                <li>Use the brush tool to mark areas you want to mask</li>
                <li>Use the eraser tool to remove parts of your mask</li>
                <li>Upload a second image to replace the masked areas</li>
                <li>Adjust brush size and color as needed</li>
                <li>Export your final image when finished</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleBack}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <h2 className="text-xl font-medium">Image Masking Editor</h2>
            </div>
            
            <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-200px)]">
              <div className="w-full lg:w-64 flex flex-col">
                <ToolsPanel 
                  tool={tool}
                  setTool={setTool}
                  brushSize={brushSize}
                  setBrushSize={setBrushSize}
                  brushColor={brushColor}
                  setBrushColor={setBrushColor}
                  imageFile={imageFile}
                  secondImageFile={secondImageFile}
                  setSecondImageFile={setSecondImageFile}
                  canvasRef={canvasRef}
                  onReset={handleReset}
                />
              </div>
              
              <div className="flex-1 bg-editor-bg rounded-lg overflow-hidden shadow-lg">
                <ImageCanvas 
                  imageFile={imageFile}
                  secondImageFile={secondImageFile}
                  tool={tool}
                  brushSize={brushSize}
                  brushColor={brushColor}
                  onResetCanvas={handleReset}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-gray-500 text-sm">
        <p>Image Scribe Mask &copy; {new Date().getFullYear()} - Create beautiful image masks</p>
      </footer>
    </div>
  );
};

export default Index;
