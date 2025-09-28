// Mock utility for simulating image processing
// This will be replaced with actual backend API calls later

export const mockImageProcessing = async (originalImage, cornerPoints) => {
  // Simulate API processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // For demo purposes, we'll return a mock corrected image
  // In reality, this would be processed by the backend with OpenCV
  
  // Create a mock corrected image (for now, just return the original with a filter effect)
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = 400;
      canvas.height = 300;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Add a slight brightness adjustment to simulate correction
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, data[i] * 1.1);     // Red
        data[i + 1] = Math.min(255, data[i + 1] * 1.1); // Green
        data[i + 2] = Math.min(255, data[i + 2] * 1.1); // Blue
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Add a subtle border to indicate it's "corrected"
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
      
      // Add "CORRECTED" watermark
      ctx.fillStyle = 'rgba(16, 185, 129, 0.8)';
      ctx.fillRect(10, 10, 120, 30);
      ctx.fillStyle = 'white';
      ctx.font = 'bold 14px Arial';
      ctx.fillText('CORRECTED', 15, 30);
      
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = originalImage;
  });
};

export const mockCornerDetection = async (imageData) => {
  // Mock automatic corner detection
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock corner points (for demo)
  return [
    { x: 50, y: 80, id: 0 },
    { x: 350, y: 60, id: 1 },
    { x: 380, y: 280, id: 2 },
    { x: 30, y: 300, id: 3 }
  ];
};

export const validateImageFormat = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file format. Please upload JPEG or PNG images only.');
  }
  
  if (file.size > maxSize) {
    throw new Error('File size too large. Please upload images smaller than 10MB.');
  }
  
  return true;
};