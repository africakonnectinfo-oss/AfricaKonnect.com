const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

// Upload file (Generic) - Stores in 'uploads' bucket
exports.uploadFile = async (req, res) => {
    try {
        const { projectId, name, type, size, data } = req.body;

        // Data is expected as base64 or similar. For now, let's assume direct buffer or base64.
        // If it's a file object from frontend, we need to handle it.
        // Assuming 'data' is base64 string for text/small bits, or multi-part form data which is harder in JSON body.
        // If the frontend sends JSON with base64 'data', we proceed.

        if (!data) return res.status(400).json({ message: "No data provided" });

        // Decode base64
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let buffer, contentType;

        if (matches && matches.length === 3) {
            contentType = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            // Assume raw base64 or handle error
            return res.status(400).json({ message: "Invalid data format" });
        }

        const filename = `${projectId}/${uuidv4()}-${name}`; // Organize by project

        const { data: uploadData, error } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: contentType,
                upsert: false
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        // Save metadata to DB (using existing model)
        const { createFile } = require('../models/fileModel');
        const fileRecord = await createFile({
            projectId,
            name,
            type: contentType,
            size,
            url: publicUrl, // Storing URL is key
            uploadedBy: req.user ? req.user.name : 'System'
        });

        // Real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`project_${projectId}`).emit('file_uploaded', fileRecord);
        }

        res.status(201).json(fileRecord);

    } catch (error) {
        console.error('Supabase Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Upload Image (Profile/Assets) - Returns URL directly
exports.uploadImage = async (req, res) => {
    try {
        const { data, name } = req.body;
        if (!data) return res.status(400).json({ message: 'No image data' });

        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) return res.status(400).json({ message: 'Invalid base64' });

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = type.split('/')[1] || 'png';
        const filename = `images/${uuidv4()}.${extension}`;

        const { error } = await supabase
            .storage
            .from('uploads')
            .upload(filename, buffer, {
                contentType: type,
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);

        res.json({ url: publicUrl });

    } catch (error) {
        console.error('Supabase Image Upload Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get Project Files (Metadata from DB)
exports.getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { getFilesByProject } = require('../models/fileModel');
        const files = await getFilesByProject(projectId);
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
