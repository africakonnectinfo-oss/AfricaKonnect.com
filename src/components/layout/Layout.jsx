import React from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

import { AIAssistant } from '../AIAssistant';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <main className="flex-grow pt-20">
                {children}
            </main>
            <Footer />
            <AIAssistant />
        </div>
    );
};

export { Layout };
