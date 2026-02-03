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

    // Draft Contract
    draftContract: async (req, res) => {
        try {
            const { projectName, clientName, expertName, rate, deliverables, duration } = req.body;

            const prompt = `
                Draft a professional freelance service agreement.
                
                DETAILS:
                - Project: ${projectName}
                - Client: ${clientName}
                - Expert/Freelancer: ${expertName}
                - Rate: $${rate}/hr
                - Duration: ${duration || 'TBD'}
                - Key Deliverables: ${deliverables || 'As agreed upon in project scope'}

                FORMAT:
                Markdown. Include sections for Services, Payment, Confidentiality, and Termination.
                Keep it concise but legally sound for a general freelance engagement.
            `;

            if (!openai) {
                return res.json({ contract: "Contract drafting unavailable (No AI API Key provided). Please contact support or draft manually." });
            }

            const completion = await openai.chat.completions.create({
                messages: [{ role: "system", content: "You are a legal assistant." }, { role: "user", content: prompt }],
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
