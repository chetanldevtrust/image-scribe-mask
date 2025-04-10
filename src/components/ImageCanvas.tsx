
import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ImageCanvasProps {
  imageFile: File | null;
  tool: 'brush' | 'eraser';
  brushSize: number;
  brushColor: string;
  onResetCanvas: () => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
  imageFile, 
  tool, 
  brushSize, 
  brushColor,
  onResetCanvas
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  
  // Reset the canvas when the reset button is clicked
  useEffect(() => {
    const resetMaskCanvas = () => {
      const maskCanvas = maskCanvasRef.current;
      if (!maskCanvas) return;
      
      const ctx = maskCanvas.getContext('2d');
      if (!ctx) return;
      
      ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      mergeCanvasLayers();
    };
    
    const handleResetEvent = () => {
      resetMaskCanvas();
      toast({
        title: "Canvas Reset",
        description: "Your mask layer has been cleared"
      });
    };
    
    window.addEventListener('reset-mask-canvas', handleResetEvent);
    return () => {
      window.removeEventListener('reset-mask-canvas', handleResetEvent);
    };
  }, [toast]);

  // Load the image onto the canvas when the imageFile changes
  useEffect(() => {
    if (!imageFile) return;
    
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas) return;
    
    const imageCtx = imageCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!imageCtx || !maskCtx) return;
    
    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    
    img.onload = () => {
      // Set canvas dimensions to match the image
      const maxWidth = containerRef.current?.clientWidth || window.innerWidth - 40;
      const maxHeight = containerRef.current?.clientHeight || window.innerHeight - 200;
      
      let width = img.width;
      let height = img.height;
      let scale = 1;
      
      // Scale down the image if it's too large
      if (width > maxWidth || height > maxHeight) {
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        scale = Math.min(scaleX, scaleY);
        
        width = width * scale;
        height = height * scale;
      }
      
      // Set the canvas dimensions
      imageCanvas.width = width;
      imageCanvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;
      
      // Draw the image on the image canvas
      imageCtx.clearRect(0, 0, width, height);
      imageCtx.drawImage(img, 0, 0, width, height);
      
      // Clear the mask canvas
      maskCtx.clearRect(0, 0, width, height);
      
      setImageSize({ width, height });
      setCanvasScale(scale);
      setImageLoaded(true);
      
      // Merge the canvases
      mergeCanvasLayers();
      
      URL.revokeObjectURL(img.src);
    };
  }, [imageFile]);

  const mergeCanvasLayers = () => {
    const canvas = canvasRef.current;
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    
    if (!canvas || !imageCanvas || !maskCanvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set the main canvas dimensions
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw the image layer
    ctx.drawImage(imageCanvas, 0, 0);
    
    // Draw the mask layer with compositing
    ctx.globalCompositeOperation = 'source-atop';
    ctx.drawImage(maskCanvas, 0, 0);
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!imageLoaded) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    
    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / maskCanvas.width);
    const y = (e.clientY - rect.top) / (rect.height / maskCanvas.height);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Set up brush styles
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (tool === 'brush') {
      ctx.strokeStyle = brushColor;
      ctx.globalCompositeOperation = 'source-over';
    } else if (tool === 'eraser') {
      ctx.strokeStyle = 'rgba(0,0,0,0)';
      ctx.globalCompositeOperation = 'destination-out';
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !imageLoaded) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    
    const rect = maskCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / maskCanvas.width);
    const y = (e.clientY - rect.top) / (rect.height / maskCanvas.height);
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Merge the layers to update the display
    mergeCanvasLayers();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const maskCanvas = maskCanvasRef.current;
    if (!maskCanvas) return;
    
    const ctx = maskCanvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
    
    // Reset composite operation
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    <div 
      ref={containerRef}
      className={`image-canvas-container relative h-full w-full rounded-lg ${tool === 'brush' ? 'editing-cursor-brush' : 'editing-cursor-eraser'}`}
    >
      {/* Main canvas for display */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 right-0 bottom-0 m-auto"
      />
      
      {/* Image canvas layer (hidden) */}
      <canvas 
        ref={imageCanvasRef}
        className="hidden"
      />
      
      {/* Mask canvas layer for drawing (visible but with pointer events) */}
      <canvas 
        ref={maskCanvasRef}
        className="absolute top-0 left-0 right-0 bottom-0 m-auto"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      
      {!imageLoaded && (
        <div className="text-gray-400">
          Upload an image to start masking
        </div>
      )}
    </div>
  );
};

export default ImageCanvas;
