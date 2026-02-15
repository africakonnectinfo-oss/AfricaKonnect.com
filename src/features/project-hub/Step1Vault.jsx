import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, X, Check, Sparkles, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProject } from '../../contexts/ProjectContext';
import { useFileUpload } from '../../hooks/useFileUpload';
import { api } from '../../lib/api';
import { toast } from 'sonner';

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
    const [budget, setBudget] = useState(currentProject?.budget || '');
    const [duration, setDuration] = useState(currentProject?.duration || '');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleAIGenerate = async () => {
        if (!projectTitle.trim()) {
            toast.error("Please enter a basic project idea or title first.");
            return;
        }

        try {
            setIsGenerating(true);
            const result = await api.ai.generateProject(projectTitle);

            if (result.error) {
                toast.error(result.error);
            } else {
                setProjectTitle(result.title || projectTitle);
                setBudget(result.estimated_budget || budget);
                setDuration(result.estimated_duration || duration);

                if (result.techStack && Array.from(result.techStack).length > 0) {
                    // Merge with existing techStacks but only if they are in our predefined list 
                    // or just add them to selectedStack
                    const newStacks = result.techStack.filter(tech =>
                        techStacks.includes(tech) || !selectedStack.includes(tech)
                    );
                    setSelectedStack(prev => [...new Set([...prev, ...newStacks])]);
                }
                toast.success("AI has refined your project details!");
            }
        } catch (error) {
            console.error("AI Generation failed", error);
            toast.error("Failed to generate project details.");
        } finally {
            setIsGenerating(false);
        }
    };

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
                    description: 'Created via Vault',
                    budget: parseFloat(budget || 0),
                    duration: duration
                });
                projectId = newProject.id;
            } else {
                // Update project details
                await updateProject(projectId, {
                    techStack: selectedStack,
                    title: projectTitle || currentProject.title,
                    budget: parseFloat(budget || currentProject.budget || 0),
                    duration: duration || currentProject.duration
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
                <div className="flex gap-2 mb-6">
                    <input
                        type="text"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                        placeholder="Enter your project title or a simple idea..."
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleAIGenerate}
                        disabled={isGenerating || !projectTitle.trim()}
                        className="flex items-center gap-2 border-primary/30 text-primary hover:bg-primary/5"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        AI Help
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Budget Match</h3>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input
                                type="number"
                                className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                                placeholder="5000"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Timeline</h3>
                        <select
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        >
                            <option value="">Select duration...</option>
                            <option value="1_month">Wait (&lt; 1 month)</option>
                            <option value="1_3_months">Sprint (1-3 months)</option>
                            <option value="3_6_months">Marathon (3-6 months)</option>
                            <option value="6_plus_months">Odyssey (6+ months)</option>
                        </select>
                    </div>
                </div>

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
