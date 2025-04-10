import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fileToDataUrl, canvasToDataUrl, createMaskedImageUrl } from '@/utils/imgixUtils';

interface ImageCanvasProps {
  imageFile: File | null;
  secondImageFile: File | null;
  tool: 'brush' | 'eraser';
  brushSize: number;
  brushColor: string;
  onResetCanvas: () => void;
}

const ImageCanvas: React.FC<ImageCanvasProps> = ({ 
  imageFile, 
  secondImageFile,
  tool, 
  brushSize, 
  brushColor,
  onResetCanvas
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const secondImageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [secondImageLoaded, setSecondImageLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [canvasScale, setCanvasScale] = useState(1);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [maskUrl, setMaskUrl] = useState<string | null>(null);
  const [secondImageUrl, setSecondImageUrl] = useState<string | null>(null);
  const [maskApplied, setMaskApplied] = useState(false);
  
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

  useEffect(() => {
    if (!imageFile) return;
    
    const loadImage = async () => {
      try {
        const dataUrl = await fileToDataUrl(imageFile);
        setImageUrl(dataUrl);
      } catch (error) {
        console.error("Error converting image file to data URL:", error);
        toast({
          title: "Error",
          description: "Failed to load image",
          variant: "destructive"
        });
      }
    };
    
    loadImage();
    
    setMaskApplied(false);
  }, [imageFile, toast]);

  useEffect(() => {
    if (!imageUrl) return;
    
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    if (!imageCanvas || !maskCanvas) return;
    
    const imageCtx = imageCanvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    if (!imageCtx || !maskCtx) return;
    
    const img = new Image();
    img.src = imageUrl;
    
    img.onload = () => {
      const maxWidth = containerRef.current?.clientWidth || window.innerWidth - 40;
      const maxHeight = containerRef.current?.clientHeight || window.innerHeight - 200;
      
      let width = img.width;
      let height = img.height;
      let scale = 1;
      
      if (width > maxWidth || height > maxHeight) {
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        scale = Math.min(scaleX, scaleY);
        
        width = width * scale;
        height = height * scale;
      }
      
      imageCanvas.width = width;
      imageCanvas.height = height;
      maskCanvas.width = width;
      maskCanvas.height = height;
      
      if (secondImageCanvasRef.current) {
        secondImageCanvasRef.current.width = width;
        secondImageCanvasRef.current.height = height;
      }
      
      imageCtx.clearRect(0, 0, width, height);
      imageCtx.drawImage(img, 0, 0, width, height);
      
      maskCtx.clearRect(0, 0, width, height);
      
      setImageSize({ width, height });
      setCanvasScale(scale);
      setImageLoaded(true);
      
      mergeCanvasLayers();
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!secondImageFile) return;
    
    const loadSecondImage = async () => {
      try {
        const dataUrl = await fileToDataUrl(secondImageFile);
        setSecondImageUrl(dataUrl);
      } catch (error) {
        console.error("Error converting second image file to data URL:", error);
      }
    };
    
    loadSecondImage();
    
    setMaskApplied(false);
  }, [secondImageFile]);

  useEffect(() => {
    if (!secondImageUrl || !imageLoaded) return;
    
    if (!secondImageCanvasRef.current) {
      secondImageCanvasRef.current = document.createElement('canvas');
    }
    
    const secondImgCanvas = secondImageCanvasRef.current;
    secondImgCanvas.width = imageSize.width;
    secondImgCanvas.height = imageSize.height;
    
    const secondImgCtx = secondImgCanvas.getContext('2d');
    if (!secondImgCtx) return;
    
    const img = new Image();
    img.src = secondImageUrl;
    
    img.onload = () => {
      secondImgCtx.clearRect(0, 0, secondImgCanvas.width, secondImgCanvas.height);
      
      secondImgCtx.drawImage(img, 0, 0, secondImgCanvas.width, secondImgCanvas.height);
      
      setSecondImageLoaded(true);
      
      mergeCanvasLayers();
    };
  }, [secondImageUrl, imageLoaded, imageSize]);

  useEffect(() => {
    if (!maskCanvasRef.current || !imageLoaded) return;
    
    const updateMaskUrl = () => {
      if (maskCanvasRef.current) {
        const dataUrl = canvasToDataUrl(maskCanvasRef.current);
        setMaskUrl(dataUrl);
      }
    };
    
    const observer = new MutationObserver(updateMaskUrl);
    observer.observe(maskCanvasRef.current, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });
    
    return () => {
      observer.disconnect();
    };
  }, [imageLoaded]);

  const mergeCanvasLayers = () => {
    const canvas = canvasRef.current;
    const imageCanvas = imageCanvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    
    if (!canvas || !imageCanvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    canvas.width = imageSize.width;
    canvas.height = imageSize.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (maskApplied && imageUrl && maskUrl && secondImageUrl && secondImageLoaded) {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx && secondImageCanvasRef.current) {
        tempCtx.drawImage(secondImageCanvasRef.current, 0, 0);
        
        tempCtx.globalCompositeOperation = 'destination-in';
        tempCtx.drawImage(maskCanvas, 0, 0);
        
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }
    else if (imageCanvas && maskCanvas && !maskApplied) {
      ctx.drawImage(imageCanvas, 0, 0);
      ctx.globalAlpha = 0.5;
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalAlpha = 1.0;
    }
    
    ctx.globalCompositeOperation = 'source-over';
  };

  const handleApplyMask = () => {
    if (!imageUrl || !maskUrl || !secondImageUrl) {
      toast({
        title: "Cannot Apply Mask",
        description: "Please ensure you have both an image and replacement image uploaded",
        variant: "destructive"
      });
      return;
    }
    
    setMaskApplied(true);
    
    toast({
      title: "Mask Applied",
      description: "The masked area has been replaced with your uploaded image"
    });
    
    mergeCanvasLayers();
  };

  useEffect(() => {
    const applyMaskHandler = () => {
      handleApplyMask();
    };
    
    window.addEventListener('apply-mask', applyMaskHandler);
    
    return () => {
      window.removeEventListener('apply-mask', applyMaskHandler);
    };
  }, [imageUrl, maskUrl, secondImageUrl]);

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
    
    ctx.globalCompositeOperation = 'source-over';
  };

  return (
    <div 
      ref={containerRef}
      className={`image-canvas-container relative h-full w-full rounded-lg ${tool === 'brush' ? 'editing-cursor-brush' : 'editing-cursor-eraser'}`}
    >
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 right-0 bottom-0 m-auto"
      />
      
      <canvas 
        ref={imageCanvasRef}
        className="hidden"
      />
      
      <canvas 
        ref={maskCanvasRef}
        className="absolute top-0 left-0 right-0 bottom-0 m-auto"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ pointerEvents: maskApplied ? 'none' : 'auto' }}
      />
      
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          Upload an image to start masking
        </div>
      )}
    </div>
  );
};

ImageCanvas.handleApplyMask = () => {
  window.dispatchEvent(new Event('apply-mask'));
};

export default ImageCanvas;
