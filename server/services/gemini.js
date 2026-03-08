import dotenv from 'dotenv';

dotenv.config();

// Using Groq API (not Grok - they're different!)
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let isGroqInitialized = false;

if (GROQ_API_KEY) {
    isGroqInitialized = true;
    console.log('✅ Groq AI initialized');
} else {
    console.log('⚠️ Groq API key not found. Using mock responses.');
}

// Helper function to call Groq API
async function callGroqAPI(messages) {
    if (!isGroqInitialized) {
        return null;
    }

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`,
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.7,
                max_tokens: 2048,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API error:', response.status, error);
            return null;
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || null;
    } catch (error) {
        console.error('Groq API request failed:', error.message);
        return null;
    }
}

// Generate interview questions based on interview type
export async function generateInterviewQuestions(interviewType, numQuestions = 5) {
    const randomSeed = Date.now();
    const prompt = `You are an expert interview coach. Generate exactly ${numQuestions} UNIQUE and VARIED interview questions for: "${interviewType}".

IMPORTANT: Generate DIFFERENT questions each time. Be creative and varied. Session ID: ${randomSeed}

The questions should be:
- Highly relevant and specific to the interview type "${interviewType}"
- Appropriate for the context (e.g., if it's a school entry interview, ask age-appropriate questions; if it's a tech job, ask technical questions)
- A good mix of behavioral, situational, and domain-specific questions
- Practical and commonly asked in real interviews of this type
- Answerable verbally

Return ONLY a JSON array in this exact format, nothing else:
[{"id": 1, "question": "...", "tips": "..."}]

Make each question distinct and useful for real interview preparation.`;

    console.log(`Generating ${numQuestions} questions for interview type: "${interviewType}"...`);

    const response = await callGroqAPI([
        { role: 'system', content: 'You are an interview preparation assistant. Always respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: prompt }
    ]);

    if (response) {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const questions = JSON.parse(jsonMatch[0]);
                console.log(`Generated ${questions.length} questions successfully via Groq`);
                return questions;
            }
        } catch (e) {
            console.error('Failed to parse Groq response:', e.message);
        }
    }

    console.log('Using mock questions - Groq unavailable or parse error');
    return getMockQuestions(interviewType, numQuestions);
}

// Evaluate interview response
export async function evaluateResponse(interviewType, question, answer) {
    if (!answer || answer.trim().length < 10) {
        return {
            score: 2,
            strengths: [],
            improvements: ['Answer was too short or empty'],
            betterAnswer: 'Please provide a more detailed response.',
            feedback: 'Your answer needs more content. Try to elaborate on your thoughts.',
        };
    }

    const prompt = `You are an interview coach. Evaluate this interview response for a "${interviewType}" interview.

Question: ${question}
Candidate's Answer: ${answer}

Provide a fair and constructive evaluation. Return ONLY JSON in this exact format, no markdown:
{
  "score": (number 1-10),
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"],
  "betterAnswer": "A brief sample of how to improve the answer",
  "feedback": "2-3 sentence overall feedback"
}`;

    console.log('Evaluating answer via Groq...');

    const response = await callGroqAPI([
        { role: 'system', content: 'You are an interview evaluation assistant. Always respond with valid JSON only, no markdown formatting.' },
        { role: 'user', content: prompt }
    ]);

    if (response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const evaluation = JSON.parse(jsonMatch[0]);
                console.log(`Groq evaluated answer with score: ${evaluation.score}`);
                return evaluation;
            }
        } catch (e) {
            console.error('Failed to parse Groq evaluation:', e.message);
        }
    }

    return getMockEvaluation();
}

// Generate summary insights for dashboard
export async function generateDashboardInsights(performanceData) {
    const prompt = `Based on this interview performance data, generate personalized insights:
${JSON.stringify(performanceData)}

Provide insights in JSON format only, no markdown:
{
  "overallSummary": "Brief 2-sentence summary of performance",
  "topStrength": "Main strength identified",
  "focusArea": "Area needing most improvement",
  "nextSteps": ["action1", "action2", "action3"],
  "motivationalTip": "A brief motivating statement"
}`;

    const response = await callGroqAPI([
        { role: 'system', content: 'You are a career coach. Always respond with valid JSON only, no markdown.' },
        { role: 'user', content: prompt }
    ]);

    if (response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse Groq insights:', e.message);
        }
    }

    return getMockInsights();
}

// Mock data functions
function getMockQuestions(interviewType, numQuestions = 5) {
    const questions = [
        { id: 1, question: "Tell me about yourself and your background.", tips: "Keep it professional, focus on relevant experiences." },
        { id: 2, question: "What are your greatest strengths and how do they help you?", tips: "Use specific examples to back up your claims." },
        { id: 3, question: "Why are you interested in this opportunity?", tips: "Show genuine enthusiasm and connect it to your goals." },
        { id: 4, question: "Describe a challenging situation and how you handled it.", tips: "Use the STAR method: Situation, Task, Action, Result." },
        { id: 5, question: "Where do you see yourself in the future?", tips: "Show ambition while being realistic about growth." },
        { id: 6, question: "What makes you a good fit for this role?", tips: "Focus on your unique value and relevant skills." },
        { id: 7, question: "How do you handle pressure or tight deadlines?", tips: "Give a real example of working under pressure." },
    ];
    // Repeat questions if numQuestions exceeds available mock questions
    while (questions.length < numQuestions) {
        questions = [...questions, ...questions.map((q, i) => ({ ...q, id: questions.length + i + 1 }))];
    }
    return questions.slice(0, numQuestions).map((q, i) => ({ ...q, id: i + 1 }));
}

function getMockEvaluation() {
    return {
        score: 7,
        strengths: ["Clear communication", "Good structure"],
        improvements: ["Add more specific examples", "Be more concise"],
        betterAnswer: "A more detailed answer with specific examples would strengthen your response.",
        feedback: "Good attempt! Focus on adding concrete examples from your experience.",
    };
}

function getMockInsights() {
    return {
        overallSummary: "You're making steady progress in your interview preparation. Your HR skills are strongest, while technical areas need more focus.",
        topStrength: "Communication and confidence in HR interviews",
        focusArea: "Technical problem-solving explanations",
        nextSteps: [
            "Practice explaining code solutions aloud",
            "Review data structures fundamentals",
            "Do mock interviews with a timer",
        ],
        motivationalTip: "Every interview is a learning opportunity. Keep practicing!",
    };
}

export default { generateInterviewQuestions, evaluateResponse, generateDashboardInsights };
