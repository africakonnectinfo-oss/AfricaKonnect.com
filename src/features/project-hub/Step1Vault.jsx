import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProject } from '../../contexts/ProjectContext';
import { useFileUpload } from '../../hooks/useFileUpload';

const techStacks = [
    "React", "Node.js", "Python", "Figma", "Cybersecurity",
    "AWS", "Flutter", "DevOps", "Data Science", "Blockchain"
];

const Step1Vault = ({ onNext }) => {
    const { currentProject, createProject, updateProject, addProjectFile } = useProject();
    const { uploadFile, uploading } = useFileUpload();
    const [files, setFiles] = useState(currentProject?.files || []);
    const [selectedStack, setSelectedStack] = useState(currentProject?.techStack || []);
    const [isDragging, setIsDragging] = useState(false);
    const [projectTitle, setProjectTitle] = useState(currentProject?.title || '');

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        for (const file of droppedFiles) {
            await handleFileUpload(file);
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const result = await uploadFile(file);
            if (result.file) {
                setFiles([...files, result.file]);

                if (currentProject) {
                    addProjectFile(currentProject.id, result.file);
                }
            }
        } catch (error) {
            alert('Error uploading file: ' + error.message);
        }
    };

    const handleFileInput = async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    };

    const toggleStack = (tech) => {
        if (selectedStack.includes(tech)) {
            setSelectedStack(selectedStack.filter(t => t !== tech));
        } else {
            setSelectedStack([...selectedStack, tech]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleProceed = async () => {
        try {
            let projectId = currentProject?.id;

            if (!projectId) {
                // Create project
                const newProject = await createProject({
                    title: projectTitle || 'New Project',
                    techStack: selectedStack,
                    description: 'Created via Vault'
                });
                projectId = newProject.id;
            } else {
                // Update project details
                await updateProject(projectId, {
                    techStack: selectedStack,
                    title: projectTitle || currentProject.title,
                });
            }

            // Upload any files that haven't been uploaded to backend yet
            // Backend files represent IDs as UUIDs, local files use 'file_' prefix
            const pendingFiles = files.filter(f => f.id && f.id.toString().startsWith('file_'));

            for (const file of pendingFiles) {
                await addProjectFile(projectId, file);
            }

            onNext();
        } catch (error) {
            console.error('Error proceeding:', error);
            // alert('Failed to save project. Please try again.'); 
            // Don't block UI with alert for now, but log it.
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Let's start by understanding your needs</h2>
                <p className="text-gray-600">Upload your project files securely. We'll analyze them to find your perfect match.</p>
            </div>

            <Card className="p-8 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">Project Title</h3>
                <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary mb-6"
                    placeholder="Enter your project title..."
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                />

                <h3 className="font-semibold text-gray-900 mb-4">1. What are you building?</h3>
                <div
                    className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50'
                        }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-500">
                        <Upload size={24} />
                    </div>
                    <p className="text-gray-900 font-medium mb-1">Drag & drop files here to skip manual entry</p>
                    <p className="text-gray-500 text-sm mb-4">PDF, DOCX, or Images (Max 10MB)</p>
                    <label>
                        <Button variant="secondary" size="sm" disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Browse Files'}
                        </Button>
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileInput}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                        {files.map((file, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText size={18} className="text-primary" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{file.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-error">
                                    <X size={18} />
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </Card>

            <Card className="p-8 mb-8">
                <h3 className="font-semibold text-gray-900 mb-4">2. Which technologies matter?</h3>
                <div className="flex flex-wrap gap-3">
                    {techStacks.map((tech) => (
                        <button
                            key={tech}
                            onClick={() => toggleStack(tech)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedStack.includes(tech)
                                ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary ring-offset-2'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                {selectedStack.includes(tech) && <Check size={14} />}
                                {tech}
                            </div>
                        </button>
                    ))}
                </div>
            </Card>

            <div className="flex justify-end">
                <Button
                    size="lg"
                    onClick={handleProceed}
                    disabled={selectedStack.length === 0}
                >
                    Proceed to Match
                </Button>
            </div>
        </div>
    );
};

export { Step1Vault };
