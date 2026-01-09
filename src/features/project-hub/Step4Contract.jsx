import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, ShieldCheck, Download, Check, Edit2, Save } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import { socketService } from '../../lib/socket';
import { useNavigate } from 'react-router-dom';

const Step4Contract = ({ onNext }) => {
    const navigate = useNavigate();
    const { currentProject } = useProject();
    const { user } = useAuth();
    const [contract, setContract] = useState(null);
    const [isSigned, setIsSigned] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [loading, setLoading] = useState(true);

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [terms, setTerms] = useState('');
    const [amount, setAmount] = useState('');
    const [saving, setSaving] = useState(false);

    // Check status
    const expertStatus = currentProject?.expert_status || 'none';
    const isExpertAccepted = expertStatus === 'accepted';
    const isExpertPending = expertStatus === 'pending';

    useEffect(() => {
        const fetchContract = async () => {
            if (!currentProject?.id) return;
            try {
                // Fetch contracts for this project
                const contracts = await api.contracts.getByProject(currentProject.id);
                // Assume the most recent one is active
                const activeContract = contracts[0];

                if (activeContract) {
                    setContract(activeContract);
                    setTerms(activeContract.terms || '');
                    setAmount(activeContract.amount || '');
                    // Check if *current user* has signed?
                    // The standard schema just has `status` ('signed', 'pending') and `signed_at`.
                    // A proper contract might need `client_signed_at` and `expert_signed_at`.
                    // For MPV we assume 'signed' means fully executed or just use status.
                    if (activeContract.status === 'signed' || activeContract.status === 'active') {
                        setIsSigned(true);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch contract", error);
            } finally {
                setLoading(false);
            }
        };

        if (isExpertAccepted) {
            fetchContract();
        } else {
            setLoading(false);
        }
    }, [currentProject, isExpertAccepted]);

    const handleSave = async () => {
        if (!contract) return;
        setSaving(true);
        try {
            const updated = await api.contracts.update(contract.id, { terms, amount });
            setContract(updated);
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to save contract", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    // Real-time updates
    useEffect(() => {
        if (!currentProject?.id) return;

        const socket = socketService.connect();

        const handleProjectUpdate = (updatedProject) => {
            if (updatedProject.id === currentProject.id) {
                // Check if contract status changed
                // This assumes updatedProject might contain contract info or we trigger a refetch
                // For robustness, let's just refetch the contract if we see a significant update
                if (updatedProject.status === 'contracted' || updatedProject.status === 'active') {
                    // Refetch specific contract to get signature details
                    api.contracts.getByProject(currentProject.id).then(contracts => {
                        const active = contracts[0];
                        if (active && (active.status === 'signed' || active.status === 'active')) {
                            setContract(active);
                            setIsSigned(true);
                            if (!isSigned) setShowConfetti(true); // Don't show if already signed locally
                        }
                    });
                }
            }
        };

        socket.on('project_update', handleProjectUpdate);

        return () => {
            socket.off('project_update', handleProjectUpdate);
        };
    }, [currentProject?.id, isSigned]);

    const handleSign = async () => {
        if (!contract) return;
        try {
            // Capture Metadata
            const metadata = {
                ip: '127.0.0.1', // In a real app, this would be captured by the server or an IP service
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                consent: true
            };

            await api.contracts.sign(contract.id, metadata);
            setIsSigned(true);
            setShowConfetti(true);
            setContract(prev => ({ ...prev, status: 'signed' }));
        } catch (error) {
            console.error("Failed to sign contract", error);
            alert("Failed to sign contract.");
        }
    };

    const handleProceed = () => {
        navigate('/collaboration');
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading contract details...</div>;

    if (isExpertPending) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 inline-block mb-8">
                    <div className="animate-pulse flex flex-col items-center">
                        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                            <span className="text-2xl">⏳</span>
                        </div>
                        <h3 className="text-xl font-bold text-yellow-800 mb-2">Waiting for Expert Acceptance</h3>
                        <p className="text-yellow-700">
                            We've sent your invitation to the expert. Once they accept, you can proceed to sign the contract.
                        </p>
                    </div>
                </div>
                <p className="text-gray-500 text-sm">You will be notified when they accept.</p>
            </div>
        );
    }

    if (!isExpertAccepted && expertStatus !== 'none') {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <h3 className="text-xl font-bold text-red-600 mb-2">Expert Declined</h3>
                <p className="text-gray-600">The expert has declined the invitation. Please go back and select another expert.</p>
                <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>Back to Matches</Button>
            </div>
        );
    }

    // Role check: Only client can edit, and only if pending
    const canEdit = user?.role === 'client' && contract?.status === 'pending';

    return (
        <div className="max-w-4xl mx-auto relative">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Smart Contract Agreement</h2>
                <p className="text-gray-600">Review and sign the engagement contract.</p>
            </div>

            <Card className={`p-0 overflow-hidden border-2 ${isSigned ? 'border-success/50' : 'border-gray-100'}`}>
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-700">
                        <FileSignature size={20} />
                        <span className="font-semibold">Engagement_Contract_v1.0.pdf</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {canEdit && !isEditing && !isSigned && (
                            <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                <Edit2 size={16} className="mr-2" />
                                Edit Terms
                            </Button>
                        )}
                        {isEditing && (
                            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                                <Save size={16} className="mr-2" />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-gray-500">
                            <Download size={16} className="mr-2" />
                            Download
                        </Button>
                    </div>
                </div>

                <div className="p-8 max-h-[500px] overflow-y-auto bg-white">
                    <div className="font-serif text-gray-700 leading-relaxed text-sm space-y-4">
                        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">INDEPENDENT CONTRACTOR AGREEMENT</h3>
                        <p>
                            This Agreement is made between <strong>Client</strong> and <strong>Expert</strong>.
                        </p>

                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs mb-2">Scope & Terms</h4>
                                {isEditing ? (
                                    <textarea
                                        className="w-full h-40 p-3 border rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                                        value={terms}
                                        onChange={(e) => setTerms(e.target.value)}
                                        placeholder="Enter contract terms here..."
                                    />
                                ) : (
                                    <div className="whitespace-pre-wrap">{terms || 'Standard Agreement Terms...'}</div>
                                )}
                            </div>

                            <div>
                                <h4 className="font-bold text-gray-900 uppercase text-xs mb-2">Total Contract Value</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-lg font-bold text-gray-400">$</span>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            className="p-2 border rounded-md w-32 focus:ring-2 focus:ring-primary focus:border-transparent font-bold text-gray-900"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                        />
                                    ) : (
                                        <span className="text-lg font-bold text-gray-900">{amount}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="h-10"></div>
                        <p className="text-xs text-gray-500 italic text-center">
                            By electronically signing, both parties agree to the terms set forth above.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-50 p-6 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 border-2 border-dashed rounded-lg flex items-center justify-center ${isSigned ? 'bg-success/10 border-success text-success' : 'bg-white border-gray-300 text-gray-400'}`}>
                                {isSigned ? <Check size={24} /> : <span className="text-xs">Sign</span>}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">
                                    {isSigned ? 'Contract Signed' : 'Digital Signature'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {isSigned ? `Signed on ${new Date().toLocaleDateString()}` : 'Click sign to accept terms'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                onClick={handleSign}
                                disabled={isSigned || isEditing || !contract}
                                className={isSigned ? "bg-success hover:bg-success cursor-default" : ""}
                            >
                                {isSigned ? (
                                    <>
                                        <ShieldCheck className="mr-2" size={20} />
                                        Signed successfully
                                    </>
                                ) : (
                                    "Sign & Accept Contract"
                                )}
                            </Button>

                            {isSigned && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <Button size="lg" onClick={handleProceed}>
                                        Proceed to Collaboration Hub
                                    </Button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            <AnimatePresence>
                {showConfetti && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                    >
                        <div className="text-6xl">🎉</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export { Step4Contract };
