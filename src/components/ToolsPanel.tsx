
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Brush, Eraser, RotateCcw, Download, ImagePlus, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import ImageUploader from './ImageUploader';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createMaskedImageUrl, fileToDataUrl, canvasToDataUrl } from '@/utils/imgixUtils';

interface ToolsPanelProps {
  tool: 'brush' | 'eraser';
  setTool: (tool: 'brush' | 'eraser') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  imageFile: File | null;
  secondImageFile: File | null;
  setSecondImageFile: (file: File | null) => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onReset: () => void;
  onApplyMask: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  brushColor,
  setBrushColor,
  imageFile,
  secondImageFile,
  setSecondImageFile,
  canvasRef,
  onReset,
  onApplyMask
}) => {
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const handleBrushSizeChange = (value: number[]) => {
    setBrushSize(value[0]);
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBrushColor(e.target.value);
  };

  const handleColorPickerClick = () => {
    if (colorPickerRef.current) {
      colorPickerRef.current.click();
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current || !imageFile) {
      toast.error("No image to export");
      return;
    }

    try {
      // For local export (fallback)
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');
      
      // Create a temporary link element
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `masked_${imageFile.name.split('.')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Image exported successfully");
    } catch (error) {
      console.error("Error exporting image:", error);
      toast.error("Failed to export image");
    }
  };

  const handleReset = () => {
    onReset();
    // Dispatch a custom event to reset the mask canvas
    window.dispatchEvent(new Event('reset-mask-canvas'));
  };

  const handleSecondImageUpload = (file: File) => {
    setSecondImageFile(file);
    toast.success("Replacement image uploaded successfully");
  };

  return (
    <div className="flex flex-col space-y-4 p-4 bg-editor-toolbar rounded-md">
      <div className="flex space-x-2">
        <button
          className={`tool-button ${tool === 'brush' ? 'active' : ''}`}
          onClick={() => setTool('brush')}
          title="Brush Tool"
        >
          <Brush className="w-5 h-5" />
        </button>
        <button
          className={`tool-button ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="Eraser Tool"
        >
          <Eraser className="w-5 h-5" />
        </button>
        <div className="flex-grow" />
        <button
          className="tool-button"
          onClick={handleReset}
          title="Reset Mask"
          disabled={!imageFile}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          className="tool-button"
          onClick={handleExport}
          title="Export Masked Image"
          disabled={!imageFile}
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-400 block mb-1">Brush Size</label>
          <Slider 
            value={[brushSize]} 
            min={1} 
            max={50}
            step={1}
            onValueChange={handleBrushSizeChange}
            disabled={!imageFile}
            className="w-full"
          />
          <div className="text-xs text-right mt-1 text-gray-400">{brushSize}px</div>
        </div>

        {tool === 'brush' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Brush Color</label>
            <div 
              className="w-full h-10 rounded-md border cursor-pointer flex items-center justify-center"
              style={{ backgroundColor: brushColor }}
              onClick={handleColorPickerClick}
            >
              <span className="text-xs font-mono">
                {brushColor}
              </span>
              <input 
                ref={colorPickerRef}
                type="color" 
                value={brushColor} 
                onChange={handleColorChange}
                className="opacity-0 absolute w-0 h-0"
                disabled={!imageFile} 
              />
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-gray-700">
          <label className="text-xs text-gray-400 block mb-2">Replacement Image</label>
          {secondImageFile ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-300 truncate">
                {secondImageFile.name}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setSecondImageFile(null)}
                >
                  Remove
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-xs"
                    >
                      Change
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Upload New Image</h4>
                      <ImageUploader onImageUpload={handleSecondImageUpload} />
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={!imageFile}
                >
                  <ImagePlus className="w-4 h-4" />
                  <span>Upload Replacement</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Upload Replacement Image</h4>
                  <p className="text-xs text-gray-500">This image will replace the masked areas.</p>
                  <ImageUploader onImageUpload={handleSecondImageUpload} />
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
        
        {/* Add Apply Mask button */}
        <div className="pt-4">
          <Button 
            variant="default"
            size="sm"
            className="w-full flex items-center justify-center gap-2"
            onClick={onApplyMask}
            disabled={!imageFile || !secondImageFile}
          >
            <Wand2 className="w-4 h-4" />
            <span>Apply Mask</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ToolsPanel;
