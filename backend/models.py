from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime

class CornerPoint(BaseModel):
    x: float
    y: float

class ImageUploadResponse(BaseModel):
    image_id: str
    original_url: str
    message: str

class ProcessImageRequest(BaseModel):
    image_id: str
    corner_points: List[CornerPoint]
    
class ProcessImageResponse(BaseModel):
    processed_image_url: str
    processing_time: str
    message: str

class ImageRecord(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    original_path: str
    processed_path: Optional[str] = None
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    processing_time: Optional[datetime] = None
    corner_points: Optional[List[CornerPoint]] = None