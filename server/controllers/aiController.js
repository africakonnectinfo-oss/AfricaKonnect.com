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

    // Generate Chat Response
    chat: async (req, res) => {
        try {
            const { message, context } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) {
                return res.json({ reply: "AI features require an Anthropic API Key." });
            }

            const systemPrompt = `
                You are the Africa Konnect AI Assistant.
                Your goal is to help users (Clients and Experts) navigate the platform, draft contracts, and collaborate effectively.
                
                CONTEXT:
                ${context ? JSON.stringify(context) : 'No specific context provided.'}

                RESPONSE GUIDELINES:
                - Be helpful, professional, and concise.
                - If asked about contracts, suggest using the "Draft Contract" feature.
                - Keep responses under 200 words unless detailed explanation is requested.
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
            // Return specific error message if available from Anthropic
            const message = error.message || 'Failed to generate AI response';
            res.status(500).json({ error: message });
        }
    },

    // Draft Contract
    draftContract: async (req, res) => {
        try {
            const { projectName, clientName, expertName, rate, deliverables, duration } = req.body;

            const prompt = `
                Draft a professional freelance service agreement for the Africa Konnect platform.
                
                DETAILS:
                - Project: ${projectName}
                - Client: ${clientName}
                - Expert/Freelancer: ${expertName}
                - Rate: $${rate}/hr
                - Duration: ${duration || 'To be determined'}
                - Key Deliverables: ${deliverables || 'As agreed upon in project milestones'}

                FORMAT:
                Markdown.
                
                STRUCTURE:
                # Independent Contractor Agreement
                
                ## 1. Parties
                This agreement is between **${clientName}** (Client) and **${expertName}** (Contractor).
                
                ## 2. Services
                Contractor agrees to provide the following services:
                ${deliverables ? deliverables : '- Professional services as requested by Client related to ' + projectName}
                
                ## 3. Compensation
                Client agrees to pay Contractor at the rate of **$${rate}/hr**.
                
                ## 4. Term
                This agreement shall commence on ${new Date().toLocaleDateString()} and continue until completed or terminated.
                
                ## 5. Confidentiality
                Contractor acknowledges that they may have access to proprietary information and agrees to keep it confidential.
                
                ## 6. Independent Contractor Status
                Contractor is an independent contractor, not an employee.
                
                ---
                *Generated by Africa Konnect AI (Claude Powered)*
            `;

            const anthropic = getAnthropicClient();
            if (!anthropic) {
                return res.json({ contract: "Contract drafting unavailable (No AI API Key provided)." });
            }

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 2048,
                messages: [{ role: "user", content: prompt }],
            });

            res.json({ contract: msg.content[0].text });

        } catch (error) {
            console.error('AI Contract Claude Error:', error);
            res.status(500).json({ error: error.message || 'Failed to draft contract' });
        }
    },

    // 1. AI Project Generator
    generateProjectDetails: async (req, res) => {
        try {
            const { idea } = req.body;
            if (!idea) return res.status(400).json({ error: "No project idea provided" });

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI features require an Anthropic API Key." });

            const prompt = `
                Turn this project idea into a structured project plan:
                IDEA: ${idea}

                OUTPUT FORMAT (JSON ONLY):
                {
                    "title": "Concise Project Title",
                    "description": "Professional 2-3 sentence project overview",
                    "techStack": ["Tech1", "Tech2", "Tech3"],
                    "estimated_budget": 5000,
                    "estimated_duration": "1_3_months"
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
            console.error('AI Generate Project Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 2. AI Proposal Generator
    generateProposal: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI features require an Anthropic API Key." });

            const prompt = `
                Draft a winning project proposal for this expert based on the project description.
                
                PROJECT: ${project.title} - ${project.description}
                EXPERT: ${expert.name} - ${expert.title}. Skills: ${expert.skills}. Bio: ${expert.bio}

                TASK:
                Write a professional, persuasive cover letter (markdown). 
                Focus on how the expert's skills solve the project's specific needs.
                Keep it under 300 words.
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }],
            });

            res.json({ proposal: msg.content[0].text });
        } catch (error) {
            console.error('AI Generate Proposal Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 3. AI Interview Generator
    generateInterviewQuestions: async (req, res) => {
        try {
            const { project, expert } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI features require an Anthropic API Key." });

            const prompt = `
                Generate 5-7 tailored technical/behavioral interview questions for a client to ask a candidate for this specific project.
                
                PROJECT: ${project.title} - ${project.description}
                CANDIDATE: ${expert.name} - ${expert.title}. Skills: ${expert.skills}

                OUTPUT FORMAT:
                Markdown list of questions with brief explanation of what each question evaluates.
            `;

            const msg = await anthropic.messages.create({
                model: CLAUDE_MODEL,
                max_tokens: 1024,
                messages: [{ role: "user", content: prompt }],
            });

            res.json({ questions: msg.content[0].text });
        } catch (error) {
            console.error('AI Generate Interview Error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // 4. AI Collaboration AI
    getCollaborationSuggestions: async (req, res) => {
        try {
            const { project } = req.body;

            const anthropic = getAnthropicClient();
            if (!anthropic) return res.json({ error: "AI features require an Anthropic API Key." });

            const prompt = `
                Suggest a roadmap for this project including key milestones and initial tasks.
                
                PROJECT: ${project.title} - ${project.description}

                OUTPUT FORMAT (JSON ONLY):
                {
                    "milestones": [
                        {"title": "Setup", "description": "Initial environment setup"},
                        {"title": "MVP", "description": "Release of core features"}
                    ],
                    "tasks": [
                        {"title": "Design Mockups", "priority": "high"},
                        {"title": "API Backend", "priority": "medium"}
                    ]
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
            console.error('AI Collaboration Suggestions Error:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = aiController;
