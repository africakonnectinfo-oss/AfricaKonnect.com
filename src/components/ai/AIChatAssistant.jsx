import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Loader2, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

const AIChatAssistant = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hello! I'm the Africa Konnect AI Assistant. How can I help you today?" }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        const aiMsgIndex = messages.length + 1;
        setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

        try {
            const context = {
                currentPath: window.location.pathname,
            };

            await api.ai.chatStream(input, context, (chunk) => {
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[aiMsgIndex].content += chunk;
                    return newMessages;
                });
            });
        } catch (error) {
            console.error('AI Chat Error:', error);
            setMessages(prev => {
                const newMessages = [...prev];
                // Show specific error message if available, otherwise generic
                const errorMessage = error.message && error.message.length < 100
                    ? `Error: ${error.message}`
                    : "I'm sorry, I'm having trouble connecting right now. Please try again later.";

                newMessages[aiMsgIndex].content = errorMessage;
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999]">
            <AnimatePresence>
                {isOpen && !isMinimized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="mb-4"
                    >
                        <Card className="w-80 md:w-96 h-[500px] flex flex-col shadow-2xl border-primary/10 overflow-hidden">
                            {/* Header */}
                            <div className="bg-primary p-4 text-white flex justify-between items-center shadow-md">
                                <div className="flex items-center gap-2">
                                    <div className="bg-white/20 p-2 rounded-lg">
                                        <Bot size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm">AI Assistant</h3>
                                        <p className="text-[10px] text-primary-foreground/80 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                                            Ready to help
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => setIsMinimized(true)} className="p-1 hover:bg-white/10 rounded">
                                        <Minimize2 size={16} />
                                    </button>
                                    <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded">
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50"
                            >
                                {messages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm border ${msg.role === 'user'
                                                ? 'bg-primary text-white rounded-br-none border-primary'
                                                : 'bg-white text-gray-800 rounded-bl-none border-gray-100'
                                                }`}>
                                                {msg.content}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {isLoading && (
                                    <div className="flex justify-start">
                                        <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                                            <Loader2 size={16} className="animate-spin text-primary" />
                                            <span className="text-xs text-gray-500 font-medium">Assistant is thinking...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100">
                                <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-full border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                    <input
                                        type="text"
                                        placeholder="Ask anything..."
                                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-gray-800"
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        disabled={isLoading}
                                    />
                                    <Button
                                        type="submit"
                                        size="icon"
                                        className={`rounded-full h-8 w-8 transition-all ${input.trim() ? 'bg-primary shadow-md' : 'bg-gray-300'}`}
                                        disabled={!input.trim() || isLoading}
                                    >
                                        <Send size={14} />
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Float Button */}
            <div className="flex flex-col items-end gap-3">
                {isMinimized && isOpen && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setIsMinimized(false)}
                        className="bg-primary text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-2 px-5"
                    >
                        <Sparkles size={18} />
                        <span className="text-sm font-bold">Resume AI Chat</span>
                    </motion.button>
                )}

                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative bg-primary text-white p-4 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_30px_rgba(var(--primary),0.3)] hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="absolute -top-12 right-0 bg-white text-primary text-[10px] font-bold py-1 px-3 rounded-full shadow-lg border border-primary/10 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                            Need help? Ask me! 🚀
                        </div>
                        <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500 border-2 border-white"></span>
                        </span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AIChatAssistant;
