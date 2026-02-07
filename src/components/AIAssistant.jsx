import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Send, Sparkles, MessageSquare, Info } from 'lucide-react';
import { Button } from './ui/Button';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

export const AIAssistant = ({ context: propContext }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const location = useLocation();

    // Determine context based on props or current route
    const getContext = () => {
        if (propContext) return propContext;

        let pageContext = "General Platform Navigation";
        if (location.pathname.includes('/experts')) pageContext = "Browsing Experts";
        if (location.pathname.includes('/project-hub')) pageContext = "Project Management Hub";
        if (location.pathname.includes('/collaboration')) pageContext = "Project Collaboration Work";

        return {
            page: pageContext,
            path: location.pathname
        };
    };

    const activeContext = getContext();

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm your Africa Konnect AI assistant. I can help you find experts, draft contracts, or navigate the platform. How can I assist you today?`
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const response = await api.ai.chat(userMsg.content, {
                userRole: user?.role,
                userName: user?.name,
                platform: "Africa Konnect - Connecting African Tech Talent with Global Opportunities",
                currentTimestamp: new Date().toISOString(),
                ...activeContext
            });

            if (response && response.reply) {
                setMessages(prev => [...prev, { role: 'assistant', content: response.reply }]);
            } else {
                setMessages(prev => [...prev, { role: 'assistant', content: "I'm having trouble connecting right now. Please try again." }]);
            }
        } catch (error) {
            console.error("AI Chat failed", error);
            const errorMsg = error.message?.includes("API Key")
                ? "I'm currently offline due to a configuration issue (API Key). Please contact support."
                : "Sorry, I encountered an error. Please try again.";
            setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
        } finally {
            setIsTyping(false);
        }
    };

    // Do not render if on login/signup pages to avoid clutter
    if (['/signin', '/signup', '/verify-email', '/forgot-password'].includes(location.pathname)) {
        return null;
    }

    return (
        <>
            {/* Floating Toggle Button */}
            <motion.button
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white z-[100] hover:shadow-xl transition-shadow group"
                style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X size={24} /> : <Bot size={28} />}
                {!isOpen && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-bounce" />
                )}
                {/* Tooltip */}
                {!isOpen && (
                    <div className="absolute right-full mr-3 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        AI Assistant
                    </div>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-[350px] md:w-96 h-[500px] bg-white rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden border border-gray-100 font-sans"
                    >
                        {/* Header */}
                        <div className="p-4 text-white flex items-center gap-3 shadow-sm bg-gradient-to-r from-indigo-500 to-purple-600">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                                <Sparkles size={20} className="text-yellow-300" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-base">Africa Konnect AI</h3>
                                <p className="text-[10px] text-white/90 flex items-center gap-1.5 opacity-90">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                    Online • {activeContext.page || 'Global Helper'}
                                </p>
                            </div>
                            <button onClick={() => setMessages([])} className="text-white/70 hover:text-white" title="Clear Chat">
                                <Info size={16} />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-200">
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                                ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-br-sm'
                                                : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 flex gap-1.5 items-center">
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100">
                            <div className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Type a message..."
                                    className="w-full pl-4 pr-10 py-3 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50 focus:bg-white text-sm"
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-1.5 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200"
                                >
                                    <Send size={14} className={input.trim() ? "ml-0.5" : ""} />
                                </button>
                            </div>
                            <div className="text-center mt-2 flex justify-center gap-4 text-[10px] text-gray-400">
                                <span>Powered by DeepSeek</span>
                                <span>v1.0.2</span>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
