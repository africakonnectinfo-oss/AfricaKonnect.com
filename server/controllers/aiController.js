const Anthropic = require("@anthropic-ai/sdk");
const pool = require('../database/db');

// Initialize Anthropic AI lazily to ensure environment variables are loaded
const getAnthropicClient = () => {
    const apiKey = process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        console.warn("AI Client initialization skipped: No Anthropic API Key provided.");
        return null;
    }
    return new Anthropic({ apiKey });
};

const CLAUDE_MODEL = "claude-3-5-sonnet-20241022";

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

            // 3. Call AI
            const anthropic = getAnthropicClient();
            if (!anthropic) {
                console.warn("AI Match skipped: No Anthropic API Key provided.");
                return res.json({ matches: experts.map(e => ({ ...e, score: 0, reason: "AI features require an Anthropic API Key." })) });
            }

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }],
            });

            const text = msg.content[0].text;

            let parsedResult;
            try {
                // Find JSON block if Claude adds preamble
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

            const anthropic = getAnthropicClient();
            if (!anthropic) {
                return res.json({ reply: "AI features require an Anthropic API Key." });
            }

            const systemPrompt = `
                You are the Africa Konnect AI Assistant, a premium AI expert dedicated to helping users thrive on Africa's leading expert platform.
                
                YOUR IDENTITY:
                - Helpful, professional, and culturally aware.
                - Expert in freelancing, project management, and collaboration.
                
                YOUR GOALS:
                1. Help Clients define project requirements and find the best experts.
                2. Help Experts draft winning proposals and manage their workflow.
                3. Answer general platform questions (pricing, escrow, how it works).
                4. Assist with legal document drafting (contracts/NDAs).
                
                CONTEXT:
                Current Page: ${context?.currentPath || 'Unknown'}
                User Context: ${context ? JSON.stringify(context) : 'General Inquiry'}

                GUIDELINES:
                - If asked about contracts, suggest the "Draft Contract" tool.
                - Keep responses concise (under 150 words) unless detail is asked.
                - Use markdown for lists and bold text.
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: "user", content: message }],
            });

            res.json({ reply: msg.content[0].text });

        } catch (error) {
            console.error('AI Chat Claude Error:', error);
            res.status(500).json({ error: error.message || 'Failed to generate AI response' });
        }
    },

    // Streaming Chat Response (Real-time)
    chatStream: async (req, res) => {
        try {
            const { message, context } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) {
                return res.write(`data: ${JSON.stringify({ error: "No API Key" })}\n\n`);
            }

            // Set headers for SSE
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            const systemPrompt = `You are the Africa Konnect AI Assistant. Respond professionally and helpfully to the user's request regarding the platform. Current Page: ${context?.currentPath || 'General'}`;

            // Handle client disconnect
            req.on('close', () => {
                res.end();
            });

            const stream = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                system: systemPrompt,
                messages: [{ role: "user", content: message }],
                stream: true,
            });

            for await (const event of stream) {
                if (event.type === 'content_block_delta') {
                    res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
                }
            }

            res.write('data: [DONE]\n\n');
            res.end();

        } catch (error) {
            console.error('AI Stream Error:', error);
            res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
            res.end();
        }
    },

    // Draft Contract (Refined for Perfection)
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

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ contract: "Contract drafting unavailable (No API Key)." });

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 2500,
                messages: [{ role: "user", content: prompt }],
            });

            res.json({ contract: msg.content[0].text });

        } catch (error) {
            console.error('AI Contract Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 1. AI Project Generator (Refined for Accuracy)
    generateProjectDetails: async (req, res) => {
        try {
            const { idea } = req.body;
            if (!idea) return res.status(400).json({ error: "No idea provided" });

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI disabled" });

            const prompt = `
                Task: Act as a Senior Project Architect. Transform a raw project idea into a professional project brief for the Africa Konnect platform.
                
                IDEA: ${idea}

                OUTPUT REQUIREMENTS (STRICT JSON ONLY):
                {
                    "title": "A compelling, professional project name",
                    "description": "A high-quality 3-sentence summary highlighting the value proposition and core goals.",
                    "techStack": ["Primary Tech", "Secondary Tech", "Supporting Tools"],
                    "estimated_budget": 2000,
                    "estimated_duration": "4_12_weeks"
                }
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }],
            });

            const text = msg.content[0].text;
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            const parsedResult = JSON.parse(jsonMatch ? jsonMatch[0] : text);

            res.json(parsedResult);
        } catch (error) {
            console.error('AI Project Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 2. AI Proposal Generator (Refined for Success)
    generateProposal: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI disabled" });

            const prompt = `
                Task: Draft a high-converting, professional project proposal for an expert on Africa Konnect.
                
                PROJECT CONTEXT:
                Title: ${project.title}
                Description: ${project.description}

                EXPERT PROFILE:
                Name: ${expert.name}
                Title: ${expert.title}
                Skills: ${expert.skills}
                Bio: ${expert.bio}

                PROPOSAL REQUIREMENTS:
                1. Professional and respectful tone.
                2. Highlight specific skills that match the project's needs.
                3. Propose a clear value proposition.
                4. Length: Under 250 words.
                5. Format: Markdown.
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1500,
                messages: [{ role: "user", content: prompt }],
            });

            res.json({ proposal: msg.content[0].text });
        } catch (error) {
            console.error('AI Proposal Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 3. AI Interview Generator
    generateInterviewQuestions: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI disabled" });

            const prompt = `
                Generate a list of 5 deeply technical and 2 behavioral interview questions for this specific project and candidate.
                
                PROJECT: ${project.title} - ${project.description}
                CANDIDATE: ${expert.name} - ${expert.title} (${expert.skills})

                STRUCTURE:
                1. Question
                2. Evaluation Criteria: What should the client look for in the answer?
                Format as a clean Markdown list.
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1500,
                messages: [{ role: "user", content: prompt }],
            });

            res.json({ questions: msg.content[0].text });
        } catch (error) {
            console.error('AI Interview Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 4. AI Collaboration AI (Refined for Real-time action)
    getCollaborationSuggestions: async (req, res) => {
        try {
            const { project } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI disabled" });

            const prompt = `
                As a Project Manager, suggest a 4-milestone roadmap and 5 initial urgent tasks for this project.
                
                PROJECT: ${project.title} - ${project.description}

                OUTPUT FORMAT (STRICT JSON ONLY):
                {
                    "milestones": [
                        {"title": "Planning & Discovery", "description": "Defining requirements and architecture."},
                        {"title": "Core Development Phase 1", "description": "Building foundational features."},
                        {"title": "Core Development Phase 2", "description": "Building advanced features and integrations."},
                        {"title": "Testing & Deployment", "description": "Quality assurance and production launch."}
                    ],
                    "tasks": [
                        {"title": "Finalize Requirements Document", "priority": "high"},
                        {"title": "Setup Development Environment", "priority": "high"},
                        {"title": "Design Database Schema", "priority": "medium"},
                        {"title": "Build Authentication System", "priority": "high"},
                        {"title": "Create Project Roadmap in Hub", "priority": "medium"}
                    ]
                }
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1500,
                messages: [{ role: "user", content: prompt }],
            });

            const text = msg.content[0].text;
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
