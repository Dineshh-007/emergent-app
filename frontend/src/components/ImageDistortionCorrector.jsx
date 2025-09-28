import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Upload, Download, RotateCcw, Zap, Info } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { 
  uploadImage, 
  processImage, 
  downloadImage, 
  getImageUrl, 
  validateImageFile 
} from '../utils/api';

const ImageDistortionCorrector = () => {
  const [imageId, setImageId] = useState(null);
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  const [cornerPoints, setCornerPoints] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageRef = useRef(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // Validate file
      validateImageFile(file);
      
      // Upload image
      const result = await uploadImage(file);
      
      // Set image data
      setImageId(result.image_id);
      setOriginalImageUrl(getImageUrl(result.image_id, 'original'));
      setCornerPoints([]);
      setProcessedImageUrl(null);
      
      toast({
        title: "Image uploaded successfully!",
        description: "Click on four corners to define the distorted area"
      });
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  }, [toast]);

  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      
      // Get the displayed size of the image
      const rect = img.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      setCanvasSize({ width: rect.width, height: rect.height });
    }
  }, []);

  const handleImageLoad = useCallback(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      updateCanvasSize();
    }
  }, [updateCanvasSize]);

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [updateCanvasSize]);

  const convertToImageCoordinates = useCallback((canvasX, canvasY) => {
    if (canvasSize.width === 0 || canvasSize.height === 0) return { x: canvasX, y: canvasY };
    
    // Convert canvas coordinates to actual image coordinates
    const scaleX = imageSize.width / canvasSize.width;
    const scaleY = imageSize.height / canvasSize.height;
    
    return {
      x: canvasX * scaleX,
      y: canvasY * scaleY
    };
  }, [canvasSize, imageSize]);

  const convertToCanvasCoordinates = useCallback((imageX, imageY) => {
    if (imageSize.width === 0 || imageSize.height === 0) return { x: imageX, y: imageY };
    
    // Convert image coordinates to canvas coordinates for display
    const scaleX = canvasSize.width / imageSize.width;
    const scaleY = canvasSize.height / imageSize.height;
    
    return {
      x: imageX * scaleX,
      y: imageY * scaleY
    };
  }, [canvasSize, imageSize]);

  const handleCanvasClick = useCallback((event) => {
    if (!originalImageUrl || cornerPoints.length >= 4) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to image coordinates
    const imageCoords = convertToImageCoordinates(canvasX, canvasY);
    
    const newPoint = { 
      x: imageCoords.x, 
      y: imageCoords.y, 
      id: cornerPoints.length,
      displayX: canvasX,
      displayY: canvasY
    };
    
    setCornerPoints(prev => [...prev, newPoint]);
    
    if (cornerPoints.length === 3) {
      toast({
        title: "All corners selected!",
        description: "Ready to process the image"
      });
    }
  }, [originalImageUrl, cornerPoints, toast, convertToImageCoordinates]);

  const handlePointDrag = useCallback((event, pointId) => {
    if (draggedPoint !== pointId) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const canvasX = event.clientX - rect.left;
    const canvasY = event.clientY - rect.top;
    
    // Convert to image coordinates
    const imageCoords = convertToImageCoordinates(canvasX, canvasY);
    
    setCornerPoints(prev => 
      prev.map(point => 
        point.id === pointId 
          ? { 
              ...point, 
              x: imageCoords.x, 
              y: imageCoords.y,
              displayX: canvasX,
              displayY: canvasY
            } 
          : point
      )
    );
  }, [draggedPoint, convertToImageCoordinates]);

  const processImageDistortion = async () => {
    if (cornerPoints.length !== 4) {
      toast({
        title: "Incomplete selection",
        description: "Please select all 4 corner points",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      // Convert corner points to API format (image coordinates)
      const apiCornerPoints = cornerPoints.map(point => ({
        x: point.x,
        y: point.y
      }));
      
      const result = await processImage(imageId, apiCornerPoints);
      
      setProcessedImageUrl(result.processed_image_url);
      
      toast({
        title: "Image processed successfully!",
        description: `Processing completed in ${result.processing_time}`
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!imageId) return;
    
    try {
      downloadImage(imageId);
      toast({
        title: "Download started!",
        description: "Your corrected image is being downloaded"
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error downloading the image",
        variant: "destructive"
      });
    }
  };

  const resetSelection = () => {
    setCornerPoints([]);
    setProcessedImageUrl(null);
    toast({
      title: "Selection reset",
      description: "You can now select new corner points"
    });
  };

  // Update display coordinates when canvas size changes
  useEffect(() => {
    if (cornerPoints.length > 0 && canvasSize.width > 0) {
      setCornerPoints(prev => 
        prev.map(point => {
          const displayCoords = convertToCanvasCoordinates(point.x, point.y);
          return {
            ...point,
            displayX: displayCoords.x,
            displayY: displayCoords.y
          };
        })
      );
    }
  }, [canvasSize, convertToCanvasCoordinates]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* Glassmorphism Header */}
      <div className="max-w-7xl mx-auto">
        <Card className="backdrop-blur-lg bg-white/30 border-white/20 shadow-xl mb-8">
          <div className="p-6 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Image Distortion Corrector
            </h1>
            <p className="text-gray-600 text-lg">
              Developed by Dinesh, Iniyan, Sudharshan, Arjun, Boophesh
            </p>
            <p className="text-gray-500 mt-2">
              Upload an image and select four corner points to correct perspective distortion
            </p>
          </div>
        </Card>

        {/* Upload Section */}
        {!originalImageUrl && (
          <Card className="backdrop-blur-lg bg-white/30 border-white/20 shadow-xl mb-8">
            <div className="p-8 text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 transition-all duration-300 hover:border-blue-400 hover:bg-white/10">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Your Image</h3>
                <p className="text-gray-500 mb-4">Drag and drop or click to select JPEG/PNG files (max 10MB)</p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Choose File'
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </Card>
        )}

        {originalImageUrl && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Image with Corner Selection */}
            <Card className="backdrop-blur-lg bg-white/30 border-white/20 shadow-xl">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Original Image
                </h3>
                <div className="relative">
                  <img
                    ref={imageRef}
                    src={originalImageUrl}
                    alt="Original"
                    onLoad={handleImageLoad}
                    className="w-full h-auto border border-gray-200 rounded-lg"
                    style={{ maxHeight: '400px', objectFit: 'contain' }}
                  />
                  
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handlePointDrag}
                    onMouseUp={() => setDraggedPoint(null)}
                    className="absolute inset-0 cursor-crosshair"
                    style={{ pointerEvents: cornerPoints.length >= 4 ? 'none' : 'auto' }}
                  />
                  
                  {/* Corner Points */}
                  {cornerPoints.map((point, index) => (
                    <div
                      key={point.id}
                      className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-move transform -translate-x-2 -translate-y-2 shadow-lg z-10"
                      style={{ left: point.displayX, top: point.displayY }}
                      onMouseDown={() => setDraggedPoint(point.id)}
                      title={`Corner ${index + 1}`}
                    />
                  ))}
                  
                  {/* Connecting Lines */}
                  {cornerPoints.length > 1 && (
                    <svg 
                      className="absolute inset-0 pointer-events-none z-5"
                      style={{ width: '100%', height: '100%' }}
                    >
                      {cornerPoints.map((point, index) => {
                        const nextPoint = cornerPoints[index + 1] || cornerPoints[0];
                        if (index === cornerPoints.length - 1 && cornerPoints.length < 4) return null;
                        return (
                          <line
                            key={`line-${index}`}
                            x1={point.displayX}
                            y1={point.displayY}
                            x2={nextPoint.displayX}
                            y2={nextPoint.displayY}
                            stroke="red"
                            strokeWidth="2"
                            strokeDasharray="5,5"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={processImageDistortion}
                    disabled={cornerPoints.length !== 4 || isProcessing}
                    className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Correct Distortion'
                    )}
                  </Button>
                  <Button
                    onClick={resetSelection}
                    variant="outline"
                    className="border-gray-300 hover:bg-white/50"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Points
                  </Button>
                </div>
                
                <div className="mt-4 text-sm text-gray-600">
                  <p className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Points selected: {cornerPoints.length}/4
                  </p>
                  <p className="mt-1">Click on the four corners of the distorted area in order</p>
                  {imageSize.width > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      Image size: {imageSize.width} × {imageSize.height} pixels
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Corrected Image */}
            <Card className="backdrop-blur-lg bg-white/30 border-white/20 shadow-xl">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Download className="w-5 h-5" />
                  Corrected Image
                </h3>
                
                {processedImageUrl ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={processedImageUrl}
                        alt="Corrected"
                        className="w-full h-auto border border-gray-200 rounded-lg shadow-md"
                        style={{ maxHeight: '400px', objectFit: 'contain' }}
                      />
                    </div>
                    <Button
                      onClick={handleDownload}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Corrected Image
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-80 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center text-gray-500">
                      <Zap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Corrected image will appear here</p>
                      <p className="text-sm mt-1">Select 4 corner points and click "Correct Distortion"</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageDistortionCorrector;