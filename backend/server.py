from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import time
import io
from pathlib import Path
from typing import Dict
from models import (
    ImageUploadResponse, 
    ProcessImageRequest, 
    ProcessImageResponse, 
    ImageRecord
)
from image_processor import ImageProcessor

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="Image Distortion Corrector API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# In-memory storage for processed images (in production, use file storage or cloud storage)
image_storage: Dict[str, bytes] = {}
processed_storage: Dict[str, bytes] = {}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@api_router.get("/")
async def root():
    return {"message": "Image Distortion Corrector API v1.0"}

@api_router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_image(file: UploadFile = File(...)):
    """Upload an image for processing"""
    try:
        # Validate file type
        if file.content_type not in ["image/jpeg", "image/png"]:
            raise HTTPException(
                status_code=400, 
                detail="Invalid file type. Only JPEG and PNG images are supported."
            )
        
        # Read file data
        file_data = await file.read()
        
        # Validate file size (10MB limit)
        if len(file_data) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size too large. Maximum size is 10MB."
            )
        
        # Validate image format using our processor
        if not ImageProcessor.validate_image(file_data):
            raise HTTPException(
                status_code=400,
                detail="Invalid image format or corrupted file."
            )
        
        # Create image record
        image_record = ImageRecord(
            filename=file.filename,
            original_path="memory",  # We're storing in memory for simplicity
        )
        
        # Store image data in memory
        image_storage[image_record.id] = file_data
        
        # Save record to database
        await db.images.insert_one(image_record.dict())
        
        logger.info(f"Image uploaded successfully: {image_record.id}")
        
        return ImageUploadResponse(
            image_id=image_record.id,
            original_url=f"/api/images/{image_record.id}/original",
            message="Image uploaded successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image upload failed: {e}")
        raise HTTPException(status_code=500, detail="Image upload failed")

@api_router.post("/process-image", response_model=ProcessImageResponse)
async def process_image(request: ProcessImageRequest):
    """Process image with perspective correction"""
    try:
        # Check if image exists
        if request.image_id not in image_storage:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # Validate corner points
        if len(request.corner_points) != 4:
            raise HTTPException(
                status_code=400, 
                detail="Exactly 4 corner points are required"
            )
        
        start_time = time.time()
        
        # Get original image data
        original_data = image_storage[request.image_id]
        
        # Convert corner points to dict format expected by processor
        corner_points = [point.dict() for point in request.corner_points]
        
        # Process image
        processed_data = ImageProcessor.process_image_correction(
            original_data, 
            corner_points
        )
        
        # Store processed image
        processed_storage[request.image_id] = processed_data
        
        # Update database record
        processing_time = time.time() - start_time
        await db.images.update_one(
            {"id": request.image_id},
            {
                "$set": {
                    "processed_path": "memory",
                    "corner_points": corner_points,
                    "processing_time": processing_time
                }
            }
        )
        
        logger.info(f"Image processed successfully: {request.image_id} in {processing_time:.2f}s")
        
        return ProcessImageResponse(
            processed_image_url=f"/api/images/{request.image_id}/processed",
            processing_time=f"{processing_time:.2f}s",
            message="Image processed successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@api_router.get("/images/{image_id}/original")
async def get_original_image(image_id: str):
    """Serve original uploaded image"""
    if image_id not in image_storage:
        raise HTTPException(status_code=404, detail="Image not found")
    
    image_data = image_storage[image_id]
    return StreamingResponse(
        io.BytesIO(image_data),
        media_type="image/png",
        headers={"Cache-Control": "max-age=3600"}
    )

@api_router.get("/images/{image_id}/processed")
async def get_processed_image(image_id: str):
    """Serve processed/corrected image"""
    if image_id not in processed_storage:
        raise HTTPException(status_code=404, detail="Processed image not found")
    
    image_data = processed_storage[image_id]
    return StreamingResponse(
        io.BytesIO(image_data),
        media_type="image/png",
        headers={"Cache-Control": "max-age=3600"}
    )

@api_router.get("/images/{image_id}/download")
async def download_processed_image(image_id: str):
    """Download processed image with proper headers"""
    if image_id not in processed_storage:
        raise HTTPException(status_code=404, detail="Processed image not found")
    
    # Get image record for filename
    image_record = await db.images.find_one({"id": image_id})
    if not image_record:
        raise HTTPException(status_code=404, detail="Image record not found")
    
    image_data = processed_storage[image_id]
    filename = f"corrected_{image_record['filename'].split('.')[0]}.png"
    
    return StreamingResponse(
        io.BytesIO(image_data),
        media_type="application/octet-stream",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
            "Cache-Control": "no-cache"
        }
    )

@api_router.get("/images/{image_id}/info")
async def get_image_info(image_id: str):
    """Get image processing information"""
    image_record = await db.images.find_one({"id": image_id})
    if not image_record:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return {
        "image_id": image_record["id"],
        "filename": image_record["filename"],
        "upload_time": image_record["upload_time"],
        "processing_time": image_record.get("processing_time"),
        "corner_points": image_record.get("corner_points"),
        "is_processed": image_id in processed_storage
    }

# Health check endpoint
@api_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Image Distortion Corrector API",
        "version": "1.0.0",
        "opencv_available": True
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
    # Clear memory storage
    image_storage.clear()
    processed_storage.clear()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)