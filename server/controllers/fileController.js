const {
    createFile,
    getFilesByProject,
    getFileById,
    deleteFile
} = require('../models/fileModel');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Upload file
exports.uploadFile = async (req, res) => {
    try {
        const { projectId, name, type, size, data } = req.body;

        const file = await createFile({
            projectId,
            name,
            type,
            size,
            data,
            uploadedBy: req.user.name
        });

        res.status(201).json(file);
    } catch (error) {
        console.error('Upload file error:', error);
        res.status(500).json({ message: error.message });
    }
};



// Upload generic image (profile, etc) - returns URL
exports.uploadImage = async (req, res) => {
    try {
        const { data, name } = req.body; // data is base64 string

        if (!data) {
            return res.status(400).json({ message: 'No image data provided' });
        }

        // Extract base64 header and data
        const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);

        if (!matches || matches.length !== 3) {
            return res.status(400).json({ message: 'Invalid base64 string' });
        }

        const type = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');
        const extension = type.split('/')[1] || 'png';
        const filename = `${uuidv4()}.${extension}`;

        const uploadsDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }

        const filePath = path.join(uploadsDir, filename);

        fs.writeFileSync(filePath, buffer);

        // Return URL (relative to server root, served via static middleware)
        const url = `${process.env.API_URL || 'http://localhost:5000'}/uploads/${filename}`;

        res.json({ url });
    } catch (error) {
        console.error('Upload image error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get project files (existing)
exports.getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;
        const files = await getFilesByProject(projectId);
        res.json(files);
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Download file (get content)
exports.downloadFile = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await getFileById(id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.json(file);
    } catch (error) {
        console.error('Download file error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete file
exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteFile(id);
        res.json({ message: 'File deleted' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ message: error.message });
    }
};
