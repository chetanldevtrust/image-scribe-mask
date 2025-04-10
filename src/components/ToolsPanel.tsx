
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Brush, Eraser, RotateCcw, Download, Undo } from 'lucide-react';
import { toast } from 'sonner';

interface ToolsPanelProps {
  tool: 'brush' | 'eraser';
  setTool: (tool: 'brush' | 'eraser') => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  brushColor: string;
  setBrushColor: (color: string) => void;
  imageFile: File | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onReset: () => void;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  tool,
  setTool,
  brushSize,
  setBrushSize,
  brushColor,
  setBrushColor,
  imageFile,
  canvasRef,
  onReset
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

  const handleExport = () => {
    if (!canvasRef.current || !imageFile) {
      toast.error("No image to export");
      return;
    }

    try {
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
      </div>
    </div>
  );
};

export default ToolsPanel;
