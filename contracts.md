# Image Distortion Correction - Backend Integration Contracts

## API Endpoints

### 1. POST /api/upload-image
**Purpose**: Upload and store image for processing
**Request**: 
- Content-Type: multipart/form-data
- Body: image file (JPEG/PNG)
**Response**:
```json
{
  "image_id": "uuid-string",
  "original_url": "/api/images/{image_id}/original",
  "message": "Image uploaded successfully"
}
```

### 2. POST /api/process-image
**Purpose**: Apply perspective transformation using corner points
**Request**:
```json
{
  "image_id": "uuid-string",
  "corner_points": [
    {"x": 50, "y": 80},
    {"x": 350, "y": 60}, 
    {"x": 380, "y": 280},
    {"x": 30, "y": 300}
  ]
}
```
**Response**:
```json
{
  "processed_image_url": "/api/images/{image_id}/processed",
  "processing_time": "2.3s",
  "message": "Image processed successfully"
}
```

### 3. GET /api/images/{image_id}/original
**Purpose**: Serve original uploaded image
**Response**: Image file (JPEG/PNG)

### 4. GET /api/images/{image_id}/processed  
**Purpose**: Serve processed/corrected image
**Response**: Image file (JPEG/PNG)

### 5. GET /api/images/{image_id}/download
**Purpose**: Download processed image with proper headers
**Response**: Image file with download headers

## Mock Data Replacement

### Frontend Changes Required:
1. **Replace mockImageProcessing()** in `/app/frontend/src/utils/mock.js`:
   - Remove: `mockImageProcessing()` function
   - Add: `uploadImage()`, `processImage()`, `downloadImage()` API calls

2. **Update ImageDistortionCorrector.jsx**:
   - Replace mock processing with real API calls
   - Handle file upload to backend
   - Update image URLs to use backend endpoints
   - Add proper error handling for API failures

## OpenCV Implementation Details

### Backend Processing Flow:
1. **Image Upload**: Store uploaded file temporarily
2. **Corner Point Processing**: Convert frontend coordinates to image coordinates
3. **Perspective Transformation**:
   ```python
   # Get transformation matrix
   src_points = np.array(corner_points, dtype=np.float32)
   dst_points = np.array([[0,0], [width,0], [width,height], [0,height]], dtype=np.float32)
   matrix = cv2.getPerspectiveTransform(src_points, dst_points)
   
   # Apply transformation
   corrected = cv2.warpPerspective(image, matrix, (width, height))
   ```
4. **Image Storage**: Save processed image for download

### Required Python Dependencies:
- opencv-python
- pillow
- numpy

## Frontend-Backend Integration

### File Upload Flow:
1. User selects image → Frontend uploads to `/api/upload-image`
2. Backend returns `image_id` → Frontend stores ID
3. User selects corners → Frontend calls `/api/process-image` with ID + points
4. Backend processes → Returns processed image URL
5. Frontend displays processed image from URL
6. User clicks download → Frontend triggers download from `/api/images/{id}/download`

### Error Handling:
- Invalid file formats → Show toast notification
- Processing failures → Display error message
- Network errors → Retry mechanism with user feedback
- Large file uploads → Progress indicators

### Performance Optimizations:
- Compress images before processing
- Implement async processing for large images
- Add image caching headers
- Optimize OpenCV operations

## Security Considerations:
- File type validation (JPEG/PNG only)
- File size limits (max 10MB)
- Temporary file cleanup
- Input sanitization for corner points

## Testing Strategy:
- Unit tests for OpenCV processing functions
- Integration tests for API endpoints
- Frontend testing for file upload/download
- End-to-end testing with various image formats and sizes