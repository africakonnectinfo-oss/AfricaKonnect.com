import React from 'react';
import { motion } from 'framer-motion';
import { Mic, Video, PhoneOff, MessageSquare, Sun, Moon, Clock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

const Step3Interview = ({ onNext }) => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Integrated Interview</h2>
                <p className="text-gray-600">Meet your expert. We've synced your timezones for optimal collaboration.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Main Video Area */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                        {/* Expert Video Placeholder */}
                        <img
                            src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800&h=600"
                            alt="Expert Video"
                            className="w-full h-full object-cover opacity-90"
                        />
                        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-lg text-white text-sm font-medium">
                            Amara Okeke (Expert)
                        </div>

                        {/* Self View */}
                        <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg">
                            <img
                                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200"
                                alt="You"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                        <button className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                            <Mic size={24} />
                        </button>
                        <button className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                            <Video size={24} />
                        </button>
                        <button className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg shadow-red-500/30">
                            <PhoneOff size={24} />
                        </button>
                        <button className="p-4 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors">
                            <MessageSquare size={24} />
                        </button>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <Card className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Timezone Sync</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Sun className="text-orange-500" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Your Time</p>
                                        <p className="text-xs text-gray-500">New York (EST)</p>
                                    </div>
                                </div>
                                <span className="font-mono font-semibold text-gray-900">10:00 AM</span>
                            </div>

                            <div className="flex items-center justify-center text-gray-400">
                                <Clock size={16} />
                                <span className="mx-2 text-xs">4h Overlap</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Moon className="text-indigo-500" size={20} />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Expert Time</p>
                                        <p className="text-xs text-gray-500">Lagos (WAT)</p>
                                    </div>
                                </div>
                                <span className="font-mono font-semibold text-gray-900">3:00 PM</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Interview Notes</h3>
                        <textarea
                            className="w-full h-32 p-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                            placeholder="Jot down key points..."
                        />
                    </Card>

                    <Button className="w-full" size="lg" onClick={onNext}>
                        Proceed to Contract
                    </Button>
                </div>
            </div>
        </div>
    );
};

export { Step3Interview };
