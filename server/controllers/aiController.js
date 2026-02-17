const Anthropic = require("@anthropic-ai/sdk");
const OpenAI = require("openai");
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
const DEEPSEEK_MODEL = "deepseek-chat";

// Initialize DeepSeek (OpenAI-compatible)
const getDeepSeekClient = () => {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return null;
    return new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com'
    });
};

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
            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();

            if (!deepseek && !anthropic) {
                console.warn("AI Match skipped: No API Key provided.");
                return res.json({ matches: experts.map(e => ({ ...e, score: 0, reason: "AI features require a DeepSeek or Anthropic API Key." })) });
            }

            let text;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                text = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 1024,
                    messages: [{ role: "user", content: prompt }],
                });
                text = msg.content[0].text;
            }

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

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();

            if (!deepseek && !anthropic) {
                return res.json({ reply: "AI features require a DeepSeek or Anthropic API Key." });
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

            let reply;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: message }
                    ],
                });
                reply = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 1024,
                    system: systemPrompt,
                    messages: [{ role: "user", content: message }],
                });
                reply = msg.content[0].text;
            }

            res.json({ reply });

        } catch (error) {
            console.error('AI Chat Claude Error:', error);
            res.status(500).json({ error: error.message || 'Failed to generate AI response' });
        }
    },

    // Streaming Chat Response (Real-time)
    chatStream: async (req, res) => {
        try {
            const { message, context } = req.body;

            // Set headers for SSE immediately
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();

            if (!deepseek && !anthropic) {
                res.write(`data: ${JSON.stringify({ error: "AI keys missing. Please set DEEPSEEK_API_KEY or ANTHROPIC_API_KEY." })}\n\n`);
                return res.end();
            }

            const systemPrompt = `You are the Africa Konnect AI Assistant. Respond professionally and helpfully. Current Page: ${context?.currentPath || 'General'}`;

            // Handle client disconnect
            req.on('close', () => {
                res.end();
            });

            if (deepseek) {
                // Try DeepSeek first as it's the requested integration
                try {
                    const stream = await deepseek.chat.completions.create({
                        model: DEEPSEEK_MODEL,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: message }
                        ],
                        stream: true,
                    });

                    for await (const chunk of stream) {
                        const content = chunk.choices[0]?.delta?.content || "";
                        if (content) {
                            res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                        }
                    }
                } catch (dsError) {
                    console.error('DeepSeek Stream Error:', dsError);
                    if (!anthropic) throw dsError;
                    // Fallback to Anthropic if available
                    console.log('Falling back to Anthropic Claude...');
                }
            }

            if (anthropic && (!deepseek || res.writableFinished === false)) {
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
            }

            res.write('data: [DONE]\n\n');
            res.end();

        } catch (error) {
            console.error('AI Stream Error:', error);
            // If we already started the stream, we can't change status code
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

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();

            if (!deepseek && !anthropic) return res.json({ contract: "Contract drafting unavailable (No AI Key)." });

            let contract;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                contract = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 2500,
                    messages: [{ role: "user", content: prompt }],
                });
                contract = msg.content[0].text;
            }

            res.json({ contract });

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

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();
            if (!deepseek && !anthropic) return res.json({ error: "AI disabled" });

            let text;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                text = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 1024,
                    messages: [{ role: "user", content: prompt }],
                });
                text = msg.content[0].text;
            }
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

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();
            if (!deepseek && !anthropic) return res.json({ error: "AI disabled" });

            let proposal;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                proposal = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 1500,
                    messages: [{ role: "user", content: prompt }],
                });
                proposal = msg.content[0].text;
            }

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

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();
            if (!deepseek && !anthropic) return res.json({ error: "AI disabled" });

            let questions;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                questions = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 1500,
                    messages: [{ role: "user", content: prompt }],
                });
                questions = msg.content[0].text;
            }

            res.json({ questions });
        } catch (error) {
            console.error('AI Interview Gen Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 4. AI Collaboration AI (Refined for Real-time action)
    getCollaborationSuggestions: async (req, res) => {
        try {
            const { project } = req.body;

            const deepseek = getDeepSeekClient();
            const anthropic = getAnthropicClient();
            if (!deepseek && !anthropic) return res.json({ error: "AI disabled" });

            let text;
            if (deepseek) {
                const completion = await deepseek.chat.completions.create({
                    model: DEEPSEEK_MODEL,
                    messages: [{ role: "user", content: prompt }],
                });
                text = completion.choices[0].message.content;
            } else {
                const msg = await anthropic.messages.create({
                    model: CLAUDE_MODEL,
                    max_tokens: 1500,
                    messages: [{ role: "user", content: prompt }],
                });
                text = msg.content[0].text;
            }
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
