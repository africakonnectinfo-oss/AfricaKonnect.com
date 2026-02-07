const OpenAI = require('openai');
const pool = require('../database/db');

// Initialize OpenAI (DeepSeek Compatible)
// Initialize OpenAI (DeepSeek Compatible)
const apiKey = process.env.AI_API_KEY;
console.log("Initializing AI Controller. API Key present:", !!apiKey);

const openai = apiKey ? new OpenAI({
    apiKey: apiKey,
    baseURL: 'https://api.deepseek.com',
}) : null;

const aiController = {
    // Match Experts
    matchExperts: async (req, res) => {
        try {
            const { projectDescription, requirements } = req.body;

            // 1. Fetch all vetted experts
            // Join users and expert_profiles to get full details
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
                You are an expert technical recruiter. 
                
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
                Identify the top 3 matches. 
                For each match, provide a compatibility score (0-100) and a concise reason.
                
                RETURN FORMAT (JSON ONLY):
                {
                    "matches": [
                        { "expert_id": "uuid", "score": 95, "reason": "..." }
                    ]
                }
            `;

            // 3. Call AI
            if (!openai) {
                console.warn("AI Match skipped: No API Key provided.");
                // Return all experts as fallback matches
                return res.json({ matches: experts.map(e => ({ ...e, score: 0, reason: "AI matching unavailable (No API Key)" })) });
            }

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: "You are a helpful assistant that outputs JSON." }, { role: "user", content: prompt }],
                model: "deepseek-chat",
                response_format: { type: "json_object" },
            });

            const result = JSON.parse(completion.choices[0].message.content);

            // 4. Merge with expert details
            const enrichedMatches = result.matches.map(match => {
                const expert = experts.find(e => e.id === match.expert_id);
                return { ...expert, ...match };
            });

            res.json({ matches: enrichedMatches });

        } catch (error) {
            console.error('AI Match Error:', error);
            // Fallback: return empty matches if AI fails/key missing
            res.status(500).json({ error: 'Failed to perform AI match', details: error.message });
        }
    },

    // Generate Chat Response
    chat: async (req, res) => {
        try {
            const { message, context } = req.body; // context can include project details, user role, etc.

            if (!openai) {
                return res.json({ reply: "I'm sorry, but I'm currently offline (API Key missing). Please try again later." });
            }

            const prompt = `
                You are the Africa Konnect AI Assistant.
                Your goal is to help users (Clients and Experts) navigate the platform, draft contracts, and collaborate effectively.
                
                CONTEXT:
                ${context ? JSON.stringify(context) : 'No specific context provided.'}

                USER MESSAGE:
                ${message}

                RESPONSE GUIDELINES:
                - Be helpful, professional, and concise.
                - If asked about contracts, suggest using the "Draft Contract" feature.
                - If asked about fees, mention the standard platform fee (e.g., 10%).
                - Keep responses under 200 words unless detailed explanation is requested.
            `;

            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "You are a helpful assistant for a freelance platform." },
                    { role: "user", content: prompt }
                ],
                model: "deepseek-chat",
            });

            res.json({ reply: completion.choices[0].message.content });

        } catch (error) {
            console.error('AI Chat Error:', error);
            res.status(500).json({ error: 'Failed to generate response' });
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
                *Generated by Africa Konnect AI*
            `;

            if (!openai) {
                return res.json({ contract: "Contract drafting unavailable (No AI API Key provided). Please contact support or draft manually." });
            }

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: "You are a legal assistant specializing in freelance contracts." }, { role: "user", content: prompt }],
                model: "deepseek-chat",
            });

            res.json({ contract: completion.choices[0].message.content });

        } catch (error) {
            console.error('AI Contract Error:', error);
            res.status(500).json({ error: 'Failed to draft contract' });
        }
    }
};

module.exports = aiController;
