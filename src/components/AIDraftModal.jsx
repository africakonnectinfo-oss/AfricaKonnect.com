import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Sparkles, X, FileText } from 'lucide-react';

const AIDraftModal = ({ isOpen, onClose, onDraft, project, clientName, expertName }) => {
    const [rate, setRate] = useState(project?.budget || '');
    const [duration, setDuration] = useState('2 weeks');
    const [deliverables, setDeliverables] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleDraft = async () => {
        setLoading(true);
        try {
            await onDraft({
                projectName: project?.title,
                clientName,
                expertName,
                rate,
                duration,
                deliverables
            });
            onClose();
        } catch (error) {
            console.error("AI Draft failed", error);
            // Error handling handled by parent usually
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-lg p-6 bg-white relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={20} />
                </button>

                <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <Sparkles size={20} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Draft Contract with AI</h3>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                    Anthropic Claude AI will generate a legally sound freelance contract based on the details below.
                </p>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hourly/Fixed Rate ($)</label>
                            <input
                                type="number"
                                value={rate}
                                onChange={(e) => setRate(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                            <input
                                type="text"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                                placeholder="e.g. 1 month"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Key Deliverables (Optional)</label>
                        <textarea
                            value={deliverables}
                            onChange={(e) => setDeliverables(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-purple-200 focus:border-purple-500"
                            placeholder="e.g. React Frontend, API integration, Unit Tests..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={onClose}>Cancel</Button>
                        <Button
                            onClick={handleDraft}
                            disabled={loading}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles size={16} className="animate-spin" /> Generating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles size={16} /> Generate Contract
                                </span>
                            )}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default AIDraftModal;
