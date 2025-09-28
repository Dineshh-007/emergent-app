import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import List, Tuple
import logging

logger = logging.getLogger(__name__)

class ImageProcessor:
    """Handles image distortion correction using OpenCV perspective transformation"""
    
    @staticmethod
    def validate_image(image_data: bytes) -> bool:
        """Validate if the uploaded data is a valid image"""
        try:
            image = Image.open(io.BytesIO(image_data))
            # Check if it's a valid image format
            if image.format not in ['JPEG', 'PNG']:
                return False
            return True
        except Exception as e:
            logger.error(f"Image validation failed: {e}")
            return False
    
    @staticmethod
    def load_image_from_bytes(image_data: bytes) -> np.ndarray:
        """Load image from bytes data into OpenCV format"""
        try:
            # Convert bytes to numpy array
            nparr = np.frombuffer(image_data, np.uint8)
            # Decode image
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                raise ValueError("Failed to decode image")
            return image
        except Exception as e:
            logger.error(f"Failed to load image from bytes: {e}")
            raise
    
    @staticmethod
    def save_image_to_bytes(image: np.ndarray, format: str = 'PNG') -> bytes:
        """Convert OpenCV image to bytes"""
        try:
            # Encode image to bytes
            _, buffer = cv2.imencode(f'.{format.lower()}', image)
            return buffer.tobytes()
        except Exception as e:
            logger.error(f"Failed to save image to bytes: {e}")
            raise
    
    @staticmethod
    def normalize_corner_points(corner_points: List[dict], image_shape: Tuple[int, int]) -> List[Tuple[float, float]]:
        """Normalize corner points from frontend coordinates to image coordinates"""
        try:
            height, width = image_shape[:2]
            
            # Convert frontend coordinates (which may be scaled) to actual image coordinates
            normalized_points = []
            for point in corner_points:
                # Assuming frontend coordinates are already in image space
                # If frontend uses scaled coordinates, we'd need to scale them back
                x = max(0, min(point['x'], width - 1))
                y = max(0, min(point['y'], height - 1))
                normalized_points.append((x, y))
            
            return normalized_points
        except Exception as e:
            logger.error(f"Failed to normalize corner points: {e}")
            raise
    
    @staticmethod
    def apply_perspective_correction(image: np.ndarray, corner_points: List[dict]) -> np.ndarray:
        """Apply perspective transformation to correct image distortion"""
        try:
            if len(corner_points) != 4:
                raise ValueError("Exactly 4 corner points required")
            
            height, width = image.shape[:2]
            
            # Normalize corner points
            normalized_points = ImageProcessor.normalize_corner_points(corner_points, image.shape)
            
            # Convert to numpy array for OpenCV
            src_points = np.array(normalized_points, dtype=np.float32)
            
            # Calculate the width and height of the corrected image
            # Use the maximum dimensions to preserve aspect ratio
            rect_width = max(
                np.linalg.norm(src_points[1] - src_points[0]),  # top edge
                np.linalg.norm(src_points[2] - src_points[3])   # bottom edge
            )
            rect_height = max(
                np.linalg.norm(src_points[3] - src_points[0]),  # left edge
                np.linalg.norm(src_points[2] - src_points[1])   # right edge
            )
            
            # Define destination points (rectangle)
            dst_points = np.array([
                [0, 0],
                [rect_width, 0],
                [rect_width, rect_height],
                [0, rect_height]
            ], dtype=np.float32)
            
            # Get perspective transformation matrix
            matrix = cv2.getPerspectiveTransform(src_points, dst_points)
            
            # Apply perspective transformation
            corrected_image = cv2.warpPerspective(
                image, 
                matrix, 
                (int(rect_width), int(rect_height))
            )
            
            logger.info(f"Applied perspective correction. Original: {width}x{height}, Corrected: {int(rect_width)}x{int(rect_height)}")
            
            return corrected_image
            
        except Exception as e:
            logger.error(f"Perspective correction failed: {e}")
            raise
    
    @staticmethod
    def enhance_image(image: np.ndarray) -> np.ndarray:
        """Apply basic image enhancement after correction"""
        try:
            # Apply basic enhancement
            # 1. Improve contrast
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            
            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            l = clahe.apply(l)
            
            # Merge channels back
            lab = cv2.merge([l, a, b])
            enhanced = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            
            # 2. Reduce noise
            enhanced = cv2.bilateralFilter(enhanced, 9, 75, 75)
            
            logger.info("Applied image enhancement")
            return enhanced
            
        except Exception as e:
            logger.warning(f"Image enhancement failed, returning original: {e}")
            return image
    
    @classmethod
    def process_image_correction(cls, image_data: bytes, corner_points: List[dict]) -> bytes:
        """Main method to process image distortion correction"""
        try:
            # Validate image
            if not cls.validate_image(image_data):
                raise ValueError("Invalid image format")
            
            # Load image
            image = cls.load_image_from_bytes(image_data)
            logger.info(f"Loaded image with shape: {image.shape}")
            
            # Apply perspective correction
            corrected_image = cls.apply_perspective_correction(image, corner_points)
            
            # Apply enhancement
            enhanced_image = cls.enhance_image(corrected_image)
            
            # Convert back to bytes
            result_bytes = cls.save_image_to_bytes(enhanced_image, 'PNG')
            
            logger.info("Image processing completed successfully")
            return result_bytes
            
        except Exception as e:
            logger.error(f"Image processing failed: {e}")
            raise