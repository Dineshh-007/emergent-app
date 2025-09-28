// API utility functions for image processing
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API}/upload-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Image upload failed:', error);
    throw new Error(
      error.response?.data?.detail || 'Failed to upload image'
    );
  }
};

export const processImage = async (imageId, cornerPoints) => {
  try {
    const response = await axios.post(`${API}/process-image`, {
      image_id: imageId,
      corner_points: cornerPoints,
    });
    
    return response.data;
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error(
      error.response?.data?.detail || 'Failed to process image'
    );
  }
};

export const getImageInfo = async (imageId) => {
  try {
    const response = await axios.get(`${API}/images/${imageId}/info`);
    return response.data;
  } catch (error) {
    console.error('Failed to get image info:', error);
    throw new Error(
      error.response?.data?.detail || 'Failed to get image information'
    );
  }
};

export const downloadImage = (imageId) => {
  const downloadUrl = `${API}/images/${imageId}/download`;
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `corrected-image-${imageId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getImageUrl = (imageId, type = 'original') => {
  return `${API}/images/${imageId}/${type}`;
};

export const validateImageFile = (file) => {
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