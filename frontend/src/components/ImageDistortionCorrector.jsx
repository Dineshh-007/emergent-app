import React, { useState, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Upload, Download, RotateCcw, Zap } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { mockImageProcessing } from '../utils/mock';

const ImageDistortionCorrector = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [correctedImage, setCorrectedImage] = useState(null);
  const [cornerPoints, setCornerPoints] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedPoint, setDraggedPoint] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target.result);
        setCornerPoints([]);
        setCorrectedImage(null);
        toast({
          title: "Image uploaded successfully!",
          description: "Click on four corners to define the distorted area"
        });
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG or PNG image",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleCanvasClick = useCallback((event) => {
    if (!originalImage || cornerPoints.length >= 4) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newPoint = { x, y, id: cornerPoints.length };
    setCornerPoints(prev => [...prev, newPoint]);
    
    if (cornerPoints.length === 3) {
      toast({
        title: "All corners selected!",
        description: "Ready to process the image"
      });
    }
  }, [originalImage, cornerPoints, toast]);

  const handlePointDrag = useCallback((event, pointId) => {
    if (draggedPoint !== pointId) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    setCornerPoints(prev => 
      prev.map(point => 
        point.id === pointId ? { ...point, x, y } : point
      )
    );
  }, [draggedPoint]);

  const processImage = async () => {
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
      // Mock processing with delay
      const result = await mockImageProcessing(originalImage, cornerPoints);
      setCorrectedImage(result);
      toast({
        title: "Image processed successfully!",
        description: "Your corrected image is ready for download"
      });
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "There was an error processing your image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!correctedImage) return;
    
    const link = document.createElement('a');
    link.href = correctedImage;
    link.download = 'corrected-image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Download started!",
      description: "Your corrected image is being downloaded"
    });
  };

  const resetSelection = () => {
    setCornerPoints([]);
    setCorrectedImage(null);
    toast({
      title: "Selection reset",
      description: "You can now select new corner points"
    });
  };

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
        {!originalImage && (
          <Card className="backdrop-blur-lg bg-white/30 border-white/20 shadow-xl mb-8">
            <div className="p-8 text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 transition-all duration-300 hover:border-blue-400 hover:bg-white/10">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Upload Your Image</h3>
                <p className="text-gray-500 mb-4">Drag and drop or click to select JPEG/PNG files</p>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                >
                  Choose File
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

        {originalImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Original Image with Corner Selection */}
            <Card className="backdrop-blur-lg bg-white/30 border-white/20 shadow-xl">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Original Image
                </h3>
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    onClick={handleCanvasClick}
                    onMouseMove={handlePointDrag}
                    onMouseUp={() => setDraggedPoint(null)}
                    className="w-full h-auto border border-gray-200 rounded-lg cursor-crosshair"
                    style={{ 
                      backgroundImage: `url(${originalImage})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      aspectRatio: '4/3',
                      minHeight: '300px'
                    }}
                  />
                  
                  {/* Corner Points */}
                  {cornerPoints.map((point, index) => (
                    <div
                      key={point.id}
                      className="absolute w-4 h-4 bg-red-500 border-2 border-white rounded-full cursor-move transform -translate-x-2 -translate-y-2 shadow-lg"
                      style={{ left: point.x, top: point.y }}
                      onMouseDown={() => setDraggedPoint(point.id)}
                      title={`Corner ${index + 1}`}
                    />
                  ))}
                  
                  {/* Connecting Lines */}
                  {cornerPoints.length > 1 && (
                    <svg 
                      className="absolute inset-0 pointer-events-none"
                      style={{ width: '100%', height: '100%' }}
                    >
                      {cornerPoints.map((point, index) => {
                        const nextPoint = cornerPoints[index + 1] || cornerPoints[0];
                        if (index === cornerPoints.length - 1 && cornerPoints.length < 4) return null;
                        return (
                          <line
                            key={`line-${index}`}
                            x1={point.x}
                            y1={point.y}
                            x2={nextPoint.x}
                            y2={nextPoint.y}
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
                    onClick={processImage}
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
                  <p>Points selected: {cornerPoints.length}/4</p>
                  <p className="mt-1">Click on the four corners of the distorted area in order</p>
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
                
                {correctedImage ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <img
                        src={correctedImage}
                        alt="Corrected"
                        className="w-full h-auto border border-gray-200 rounded-lg shadow-md"
                        style={{ aspectRatio: '4/3', objectFit: 'contain', minHeight: '300px' }}
                      />
                    </div>
                    <Button
                      onClick={downloadImage}
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