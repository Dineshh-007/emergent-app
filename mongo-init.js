// MongoDB initialization script for Image Distortion Corrector
// This script sets up the initial database structure

// Switch to the image_corrector database
db = db.getSiblingDB('image_corrector');

// Create collections
db.createCollection('images');
db.createCollection('processing_logs');

// Create indexes for better performance
db.images.createIndex({ "id": 1 }, { unique: true });
db.images.createIndex({ "upload_time": -1 });
db.images.createIndex({ "filename": 1 });

db.processing_logs.createIndex({ "image_id": 1 });
db.processing_logs.createIndex({ "timestamp": -1 });

// Insert initial data (optional)
db.images.insertOne({
    id: "welcome",
    filename: "welcome.png",
    original_path: "static",
    upload_time: new Date(),
    description: "Welcome image for testing"
});

print("Image Distortion Corrector database initialized successfully!");
print("Collections created: images, processing_logs");
print("Indexes created for optimal performance");