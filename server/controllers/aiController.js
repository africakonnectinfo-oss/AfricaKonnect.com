const { GoogleGenerativeAI } = require("@google/generative-ai");
const pool = require('../database/db');

// Initialize Google Generative AI
const apiKey = process.env.AI_API_KEY;
console.log("Initializing AI Controller (Gemini). API Key present:", !!apiKey);

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-1.5-flash" }) : null;

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
                Return a JSON object with a "matches" array.
                Each match should have:
                - "expert_id": The ID of the expert
                - "score": Compatibility score (0-100)
                - "reason": A concise reason for the match
            `;

            // 3. Call AI
            if (!model) {
                console.warn("AI Match skipped: No API Key provided.");
                return res.json({ matches: experts.map(e => ({ ...e, score: 0, reason: "AI matching unavailable (No API Key)" })) });
            }

            // Use JSON mode for structured output
            const jsonModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });
            const result = await jsonModel.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            let parsedResult;
            try {
                const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();
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

            if (!model) {
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
                - Keep responses under 200 words unless detailed explanation is requested.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json({ reply: text });

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
                *Generated by Africa Konnect AI (Gemini Powered)*
            `;

            if (!model) {
                return res.json({ contract: "Contract drafting unavailable (No AI API Key provided). Please contact support or draft manually." });
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json({ contract: text });

        } catch (error) {
            console.error('AI Contract Error:', error);
            res.status(500).json({ error: 'Failed to draft contract' });
        }
    }
};

module.exports = aiController;
