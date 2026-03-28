const pool = require('../database/db');

// Global helper to query RapidAPI endpoint
async function callRapidAPI(promptStr) {
    const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;
    
    // Fallbacks just in case .env didn't load properly
    const rapidApiKey = process.env.RAPIDAPI_KEY || "c7e5534adbmshe7aeff69caa00e0p1b6db5jsn7fb9d7c8861b";
    const rapidApiHost = process.env.RAPIDAPI_HOST || "chatgpt-vision1.p.rapidapi.com";
    const rapidApiUrl = process.env.RAPIDAPI_URL || "https://chatgpt-vision1.p.rapidapi.com/matagvision2";

    if (!rapidApiKey) {
        throw new Error("RapidAPI Key is missing from configuration.");
    }

    const payload = {
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: promptStr }
                ]
            }
        ],
        web_access: false
    };

    const options = {
        method: 'POST',
        headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': rapidApiHost,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    };

    try {
        const response = await fetchFn(rapidApiUrl, options);
        if (!response.ok) {
            throw new Error(`RapidAPI Error: ${response.status} - ${await response.text()}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            let data = await response.json();
            
            let textResponse = "";
            if (data.choices && data.choices[0] && data.choices[0].message) {
                textResponse = data.choices[0].message.content;
            } else if (data.result) {
                textResponse = data.result;
            } else if (data.response) {
                textResponse = data.response;
            } else if (data.message) {
                textResponse = data.message;
            } else if (data.text) {
                textResponse = data.text;
            } else {
                textResponse = typeof data === 'string' ? data : JSON.stringify(data);
            }
            return textResponse;
        } else {
            return await response.text();
        }
    } catch (e) {
        console.error("RapidAPI Error details:", e);
        throw e;
    }
}

const aiController = {
    // Match Experts
    matchExperts: async (req, res) => {
        try {
            const { projectDescription, requirements } = req.body;

            // 1. Fetch all vetted experts
            const expertsResult = await pool.query(
                `SELECT u.id, u.name, ep.title, ep.skills, ep.bio, ep.hourly_rate 
                 FROM users u
                 JOIN expert_profiles ep ON u.id = ep.user_id
                 WHERE u.role = 'expert' AND ep.vetting_status = 'verified'`
            );
            const experts = expertsResult.rows;

            if (experts.length === 0) {
                return res.json({ matches: [] });
            }

            // 2. Construct Prompt
            const prompt = `
                You are an expert technical recruiter matching candidates to a project.
                
                PROJECT REQUIREMENTS:
                ${projectDescription}
                ${requirements ? `Requirements: ${requirements}` : ''}

                CANDIDATES:
                ${JSON.stringify(experts.map(e => ({
                id: e.id,
                name: e.name,
                title: e.title,
                skills: e.skills,
                bio: e.bio
            })))}

                TASK:
                Identify the top 3 matches based on skills and experience.
                
                OUTPUT FORMAT:
                Return ONLY a JSON object with a "matches" array.
                Each match should have:
                - "expert_id": The ID of the expert (UUID)
                - "score": Compatibility score (0-100)
                - "reason": A concise reason for the match
            `;

            const text = await callRapidAPI(prompt);

            let parsedResult;
            try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                const cleanedText = jsonMatch ? jsonMatch[0] : text;
                parsedResult = JSON.parse(cleanedText);
            } catch (e) {
                console.error("Failed to parse AI JSON response:", text);
                return res.status(500).json({ error: "AI response parsing failed" });
            }

            // 4. Merge with expert details
            const enrichedMatches = (parsedResult.matches || []).map(match => {
                const expert = experts.find(e => e.id === match.expert_id);
                return expert ? { ...expert, ...match } : null;
            }).filter(Boolean);

            res.json({ matches: enrichedMatches });

        } catch (error) {
            console.error('AI Match Error:', error);
            res.status(500).json({ error: 'Failed to perform AI match', details: error.message });
        }
    },

    // Generate Chat Response (Blocking)
    chat: async (req, res) => {
        try {
            const { message, context } = req.body;

            const systemPrompt = `
                You are the Africa Konnect AI Assistant, the official premium expert guide for Africa's leading platform connecting global businesses with vetted African talent.
                
                PLATFORM KNOWLEDGE BASE:
                - Mission: Bridging the gap between African technical talent and global innovation. Our vision is "Made in Africa" as a global standard of excellence.
                - Impact: 2,500+ Vetted Experts, 30+ Countries served, 10,000+ Projects completed, 98% Client satisfaction.
                - Pricing: 
                  - Starter: Free to join, 1 project post, 5% platform fee.
                  - Growth: $49/month, Unlimited projects, Priority matching, 3% platform fee.
                  - Enterprise: Custom pricing, White-glove matching, SLA guarantees, 1% platform fee.
                - How It Works (6 Steps):
                  1. Register & Profile
                  2. Company Vault: Securely upload brand assets and technical requirements.
                  3. AI Match Engine: Proprietary algorithm for technical/cultural matching.
                  4. Integrated Interview: Built-in video platform with whiteboard.
                  5. Smart Contract: Instant, fair contracts with IP protection.
                  6. Escrow & Collaborate: Milestone-based secure payments.
                - Security: Enterprise-grade security. TLS 1.3/AES-256 encryption. PCI-DSS Level 1 payment compliance via Stripe/PayPal. MFA enabled.
                - Legal: Latest updates to Privacy Policy and Terms of Service (Jan 1, 2026). 
                - Commitment: We pledge a portion of income to scholarships and learning resources (computers, textbooks) for African schools.
                - Contact: 
                  - USA: +1 (404) 713-2428 | Waterford Way, Conyers, GA.
                  - Sierra Leone: +232 88 580 063 | Tech Avenue, Freetown.
                  - Emails: hello@africakonnect.com, support@africakonnect.com.

                YOUR IDENTITY:
                - Helpful, professional, culturally aware, and supportive.
                - Expert in African tech ecosystem, freelancing, and collaboration.
                
                CONTEXT:
                Current Page: ${context?.currentPath || 'Unknown'}
                User: ${context?.userName || 'Guest'} (${context?.userRole || 'General Reader'})
                Page Info: ${context?.pageTitle || 'Africa Konnect Platform'}

                GUIDELINES:
                - Always reference specific platform features (e.g., "Company Vault", "Escrow Protection") when explaining how things work.
                - If asked about contracts, suggest our "Smart Contract" tool.
                - Keep responses concise (under 150 words) unless detail is specifically requested.
                - Use markdown for lists and bold text.
            `;

            const fullPrompt = systemPrompt + "\n\nUser Message: " + message;
            const reply = await callRapidAPI(fullPrompt);

            res.json({ reply });

        } catch (error) {
            console.error('AI Chat Error:', error);
            res.status(500).json({ error: error.message || 'Failed to generate AI response' });
        }
    },

    // Streaming Chat Response (Simulated Stream from unified response)
    chatStream: async (req, res) => {
        try {
            const { message, context } = req.body;

            // Set headers for SSE immediately
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no');

            // 1. Send immediate signal to frontend to start typing animation
            res.write(`data: ${JSON.stringify({ text: "", status: "thinking" })}\n\n`);

            const systemPrompt = `
                You are the Africa Konnect AI Assistant. Provide helpful, platform-specific information.
                Platform Context: Vetted African Talent, Escrow Protection, Company Vault, Smart Contracts.
                Current Page: ${context?.currentPath || 'General'}
                User: ${context?.userName || 'User'} (${context?.userRole || 'User'})
            `;
            const fullPrompt = systemPrompt + "\n\nUser: " + message;

            // Handle client disconnect
            let isClosed = false;
            req.on('close', () => {
                isClosed = true;
                res.end();
            });

            // Get full response from RapidAPI
            const fullText = await callRapidAPI(fullPrompt);
            
            if (isClosed) return;

            // 2. Simulate realtime word-by-word streaming for a "living" experience
            const words = fullText.split(' ');
            
            for (let i = 0; i < words.length; i++) {
                if (isClosed) break;
                
                // Add space back except for the last word
                const chunk = words[i] + (i === words.length - 1 ? "" : " ");
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
                
                // Control timing for "realtime" feel
                // Faster if the response is long
                const delay = words.length > 100 ? 20 : 50; 
                await new Promise(r => setTimeout(r, delay));
            }

            if (!isClosed) {
                res.write('data: [DONE]\n\n');
                res.end();
            }

        } catch (error) {
            console.error('AI Stream Error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    },

    // Draft Contract
    draftContract: async (req, res) => {
        try {
            const { projectName, clientName, expertName, rate, deliverables, duration } = req.body;

            const prompt = `
                Draft a professional, legally-sound independent contractor agreement for a freelance engagement on Africa Konnect.
                
                PROJECT DETAILS:
                - Project Name: ${projectName}
                - Client: ${clientName}
                - Expert: ${expertName}
                - Payment Rate: $${rate}/hr
                - Estimated Duration: ${duration || 'TBD'}
                - Key Deliverables: ${deliverables || 'Specific services as defined in project milestones'}

                REQUIREMENTS:
                1. Professional, standard contract language.
                2. Explicit sections for Parties, Services, Compensation, Intellectual Property, and Confidentiality.
                3. Clear Markdown formatting with H1, H2, and Bullet points.
                4. Tone: Serious and authoritative.
            `;

            const contract = await callRapidAPI(prompt);
            res.json({ contract });

        } catch (error) {
            console.error('AI Contract Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 1. AI Project Generator
    generateProjectDetails: async (req, res) => {
        try {
            const { idea } = req.body;
            if (!idea) return res.status(400).json({ error: "No idea provided" });

            const prompt = `Generate a detailed project structure for the following idea: ${idea}. Include title, description, and list of milestones. Format as JSON.`;

            const text = await callRapidAPI(prompt);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);

            res.json(parsedResult);
        } catch (error) {
            console.error('AI Project Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 2. AI Proposal Generator
    generateProposal: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const prompt = `Expert: ${expert?.name || 'Expert'} (${expert?.title || 'Professional'})\nProject: ${project?.title || 'Project'}\n\nDraft a professional project proposal emphasizing the expert's suitability for the project requirements.`;

            const proposal = await callRapidAPI(prompt);
            res.json({ proposal });
        } catch (error) {
            console.error('AI Proposal Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 3. AI Interview Generator
    generateInterviewQuestions: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const prompt = `Generate 5 technical interview questions for ${expert?.name || 'the expert'} regarding project "${project?.title || 'the project'}".`;

            const questions = await callRapidAPI(prompt);
            res.json({ questions });
        } catch (error) {
            console.error('AI Interview Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 4. AI Collaboration AI
    getCollaborationSuggestions: async (req, res) => {
        try {
            const { project } = req.body;

            const prompt = `Project Title: ${project?.title || ''}\nDescription: ${project?.description || ''}\n\nSuggest a roadmap for this project. Return ONLY a JSON object with: 1. "milestones": array of {title, description}. 2. "tasks": array of {title, description}`;

            const text = await callRapidAPI(prompt);
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);

            res.json(parsedResult);
        } catch (error) {
            console.error('AI Collab Suggestions Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = aiController;
