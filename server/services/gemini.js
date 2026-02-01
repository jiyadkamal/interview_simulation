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

// Topic descriptions for technical interviews
const technicalTopics = {
    dsa: 'Data Structures and Algorithms (arrays, linked lists, trees, graphs, sorting, searching)',
    webdev: 'Web Development (HTML, CSS, JavaScript, React, Node.js, APIs)',
    python: 'Python Programming (syntax, data types, OOP, libraries, best practices)',
    java: 'Java Programming (OOP concepts, collections, multithreading, JVM)',
    database: 'Database and SQL (queries, joins, normalization, indexing, transactions)',
    os: 'Operating Systems (processes, threads, memory management, scheduling)',
    networking: 'Computer Networks (TCP/IP, HTTP, DNS, security, protocols)',
};

// Generate interview questions based on category and optional topic
export async function generateInterviewQuestions(category, topic = null) {
    let prompt;

    if (category === 'hr') {
        const randomSeed = Date.now();
        prompt = `You are an expert HR interview coach. Generate exactly 5 UNIQUE and VARIED HR/behavioral interview questions for a student preparing for job interviews.

IMPORTANT: Generate DIFFERENT questions each time. Be creative and varied. Session ID: ${randomSeed}

Choose from these HR interview themes (pick different combinations):
- Self-introduction and background
- Strengths, weaknesses, skills
- Career goals and motivation
- Teamwork and collaboration
- Leadership and initiative
- Conflict resolution
- Problem-solving scenarios
- Work ethic and values
- Adaptability and learning
- Handling pressure and deadlines

Return ONLY a JSON array in this exact format, nothing else:
[{"id": 1, "question": "...", "tips": "..."}]

Make each question distinct and practical for real interviews.`;
    } else if (category === 'technical') {
        const randomSeed = Date.now();
        const topicDesc = technicalTopics[topic] || 'general programming and computer science concepts';
        prompt = `You are an expert technical interviewer. Generate exactly 5 UNIQUE technical interview questions about ${topicDesc} for a student/fresher level candidate.

IMPORTANT: Generate DIFFERENT questions each time. Be creative and varied. Session ID: ${randomSeed}

Questions should:
- Be appropriate for fresher/entry-level candidates
- Test understanding, not just memorization
- Include a mix of conceptual and practical questions
- Be answerable verbally (not coding problems requiring IDE)

Return ONLY a JSON array in this exact format, nothing else:
[{"id": 1, "question": "...", "tips": "..."}]`;
    } else if (category === 'aptitude') {
        const randomSeed = Date.now();
        prompt = `You are an aptitude test expert. Generate exactly 5 UNIQUE aptitude/reasoning questions for a student preparing for placement tests.

IMPORTANT: Generate DIFFERENT questions each time with different numbers, scenarios, and patterns. Session ID: ${randomSeed}

Include a mix of:
- Mathematical reasoning (percentages, ratios, speed/time/distance, work problems)
- Logical reasoning (sequences, patterns, puzzles)
- Verbal reasoning (analogies, statements, syllogisms)
- Critical thinking and data interpretation

Return ONLY a JSON array in this exact format, nothing else:
[{"id": 1, "question": "...", "tips": "..."}]

Make questions challenging but solvable verbally without paper.`;
    }

    console.log(`Generating ${category} questions${topic ? ` for topic: ${topic}` : ''}...`);

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
    return getMockQuestions(category, topic);
}

// Evaluate interview response
export async function evaluateResponse(category, question, answer) {
    if (!answer || answer.trim().length < 10) {
        return {
            score: 2,
            strengths: [],
            improvements: ['Answer was too short or empty'],
            betterAnswer: 'Please provide a more detailed response.',
            feedback: 'Your answer needs more content. Try to elaborate on your thoughts.',
        };
    }

    const prompt = `You are an interview coach. Evaluate this ${category} interview response.

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
function getMockQuestions(category, topic = null) {
    const mockQuestions = {
        hr: [
            { id: 1, question: "Tell me about yourself and your educational background.", tips: "Keep it professional, focus on relevant experiences." },
            { id: 2, question: "What are your greatest strengths and how do they help you?", tips: "Use specific examples to back up your claims." },
            { id: 3, question: "Where do you see yourself in 5 years?", tips: "Show ambition while being realistic about growth." },
            { id: 4, question: "Why should we hire you over other candidates?", tips: "Focus on unique value you can add to the company." },
            { id: 5, question: "Describe a challenging situation and how you handled it.", tips: "Use the STAR method: Situation, Task, Action, Result." },
        ],
        technical: {
            dsa: [
                { id: 1, question: "Explain the difference between an array and a linked list. When would you use each?", tips: "Compare access time, insertion, deletion operations." },
                { id: 2, question: "What is the time complexity of binary search and why is it efficient?", tips: "Explain the divide and conquer approach." },
                { id: 3, question: "Describe how a stack data structure works and give a real-world example.", tips: "LIFO principle, mention function call stack." },
                { id: 4, question: "What is a hash table and how does it handle collisions?", tips: "Discuss chaining and open addressing methods." },
                { id: 5, question: "Explain the difference between BFS and DFS graph traversal algorithms.", tips: "Queue vs Stack, use cases for each." },
            ],
            default: [
                { id: 1, question: "Explain the difference between stack and queue data structures.", tips: "LIFO vs FIFO, real-world examples." },
                { id: 2, question: "What is object-oriented programming and its four pillars?", tips: "Encapsulation, Inheritance, Polymorphism, Abstraction." },
                { id: 3, question: "How would you optimize a slow database query?", tips: "Indexing, query analysis, caching strategies." },
                { id: 4, question: "Explain RESTful API principles.", tips: "HTTP methods, statelessness, resource-based URLs." },
                { id: 5, question: "Describe a project you worked on and challenges you faced.", tips: "Be specific about your role and contributions." },
            ],
        },
        aptitude: [
            { id: 1, question: "If 6 workers can complete a task in 12 days, how many days would 9 workers take?", tips: "Use inverse proportionality: more workers = fewer days." },
            { id: 2, question: "Find the next number in the sequence: 2, 6, 12, 20, 30, ?", tips: "Look at the differences between consecutive numbers." },
            { id: 3, question: "A train travels 360 km in 4 hours. What is its speed in meters per second?", tips: "Convert km/h to m/s by multiplying by 5/18." },
            { id: 4, question: "If all Roses are Flowers, and some Flowers fade quickly, can we say some Roses fade quickly?", tips: "Be careful with logical deduction in syllogisms." },
            { id: 5, question: "Complete the analogy: Book is to Reading as Fork is to ?", tips: "Identify the functional relationship between pairs." },
        ],
    };

    if (category === 'technical') {
        return mockQuestions.technical[topic] || mockQuestions.technical.default;
    }
    return mockQuestions[category] || mockQuestions.hr;
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
