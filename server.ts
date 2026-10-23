import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));

// Initialize GoogleGenAI SDK with required headers
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper with automatic fallback for high-demand spikes
async function generateContentWithFallback(params: {
  contents: any;
  systemInstruction?: string;
  responseMimeType?: string;
}) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const res = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      return res;
    } catch (err: any) {
      console.warn(`Model ${model} failed, checking fallback:`, err?.message || err);
      lastError = err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw lastError;
}

async function generateStreamWithFallback(params: {
  contents: any;
  systemInstruction?: string;
}) {
  const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const config: any = {};
      if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
      if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
      }

      const stream = await ai.models.generateContentStream({
        model,
        contents: params.contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });
      return stream;
    } catch (err: any) {
      console.warn(`Stream model ${model} failed, trying fallback:`, err?.message || err);
      lastError = err;
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw lastError;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Endpoint: Extract & Organize Candidate CV information
app.post('/api/extract-cv', async (req, res) => {
  try {
    const { cvText } = req.body;

    if (!cvText || !cvText.trim()) {
      return res.status(400).json({ error: 'CV text is required for extraction.' });
    }

    const prompt = `You are an expert resume parsing specialist.
Extract and organize the candidate's verified information from the resume below into a clean JSON structure.

CRITICAL RULES:
1. NEVER invent or hallucinate missing information, qualifications, degrees, companies, or tools.
2. If an item is not present, leave the field empty or as an empty array.
3. Extract actual programming languages, frameworks, databases, and tools separately when possible.

RESUME CONTENT:
${cvText}

Return a JSON object with this exact structure:
{
  "name": "Candidate's full name if found",
  "education": "Degree, major, institution, graduation year",
  "degree": "e.g. B.S. in Computer Science",
  "university": "e.g. University of Washington",
  "experience": "Summary of actual work experience and roles",
  "internships": "Summary of internships if any",
  "projects": "Key verified projects and what was built",
  "skills": ["Array of all skills"],
  "programmingLanguages": ["e.g. TypeScript", "Python"],
  "frameworks": ["e.g. React", "Express"],
  "databases": ["e.g. PostgreSQL", "Redis"],
  "tools": ["e.g. Docker", "Git"],
  "certifications": "Certifications if mentioned",
  "achievements": "Notable achievements or honors",
  "languages": "Spoken/written languages if listed"
}`;

    const response = await generateContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error extracting CV:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to extract CV information',
    });
  }
});

// Endpoint: Analyze Setup & Build Pre-computed Interview Intelligence Profile
app.post('/api/analyze-setup', async (req, res) => {
  try {
    const { candidateInfo, interviewerInfo, jobInfo, interviewType, interviewGoal } = req.body;

    if (!jobInfo?.title) {
      return res.status(400).json({ error: 'Job title is required.' });
    }

    const prompt = `You are a Principal Executive Interview Intelligence Architect.
Synthesize the candidate's real verified background, interviewer profile, company, and target position into a high-precision, truthful, ultra-compact Interview Intelligence Profile.

CANDIDATE INFORMATION (GROUND TRUTH):
Full Name: ${candidateInfo?.name || 'Candidate'}
Resume/Background:
${candidateInfo?.rawResume || 'No detailed resume.'}
Education: ${candidateInfo?.education || candidateInfo?.degree || 'N/A'}
Work Experience: ${candidateInfo?.experience || 'N/A'}
Internships: ${candidateInfo?.internships || 'None'}
Projects: ${candidateInfo?.projects || 'N/A'}
Skills: ${candidateInfo?.skills?.join(', ') || 'N/A'}
Certifications: ${candidateInfo?.certifications || 'None'}

INTERVIEWER INFORMATION:
Name: ${interviewerInfo?.name || 'Interviewer'}
Role/Title: ${interviewerInfo?.role || 'Unspecified (General Evaluator)'}
Department: ${interviewerInfo?.department || 'Unspecified'}
Stage: ${interviewerInfo?.stage || 'General interview'}
Interviewer Professional Profile/Bio: ${interviewerInfo?.professionalBioOrProfile || 'None provided'}

COMPANY & POSITION:
Company: ${jobInfo?.company || 'Target Company'}
Website/Info: ${jobInfo?.companyInfo || jobInfo?.companyWebsite || 'N/A'}
Industry: ${jobInfo?.industry || 'Technology'}
Department: ${jobInfo?.department || 'Engineering'}
Position: ${jobInfo?.title}
Level: ${jobInfo?.level || 'Mid-Level'}
Job Description & Responsibilities:
${jobInfo?.description || 'Standard requirements for ' + jobInfo?.title}
Key Technologies: ${jobInfo?.technologies?.join(', ') || 'N/A'}

INTERVIEW CONTEXT:
Type: ${interviewType || 'General / Unknown'}
Goal Focus: ${interviewGoal || 'Everything'}

ABSOLUTE CARDINAL RULES:
1. NO FABRICATION: Never invent work experience, employers, metrics, certificates, or technologies the candidate has not used.
2. HONEST BOUNDARIES: Note what the candidate actually knows vs where they lack direct hands-on experience.
3. INTERVIEWER PERSPECTIVE:
   - If technical engineer/CTO: prioritize technical precision, architecture, trade-offs, code clarity.
   - If HR/Recruiter: prioritize clear communication, teamwork, reliability, cultural alignment.
   - If Manager: prioritize ownership, problem-solving, collaboration, pragmatic outcomes.
4. COMPACT PRECOMPUTED CONTEXT: Synthesize an internal dense context string (under 300 words) that will be prepended to live prompts so live responses are instant.

Return a JSON object with this exact structure:
{
  "candidateSummary": {
    "verifiedStrengths": ["3-4 real verified strengths supported by candidate facts"],
    "verifiedLimitations": ["2-3 areas where candidate lacks direct experience"],
    "evidenceAnchors": ["2-3 real projects/experiences the candidate can reference as proof"]
  },
  "interviewerPerspective": {
    "roleCategory": "Technical" or "HR/Recruiter" or "Manager/Leadership" or "Executive",
    "focusPriorities": ["What this specific interviewer cares most about"],
    "likelyEvaluationMindset": "A 2-sentence description of how this interviewer will evaluate answers"
  },
  "companyUnderstanding": {
    "coreNeeds": ["What the company needs from this hire"],
    "industryContext": "Brief industry landscape",
    "cultureValues": "Likely work culture"
  },
  "positionExpectations": ["Expectation 1", "Expectation 2", "Expectation 3"],
  "precompactedContext": "A high-density 250-word internal context paragraph combining candidate facts, verified projects, honest limitation boundaries, interviewer perspective, and role requirements for live inference."
}`;

    const response = await generateContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error analyzing setup:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to analyze interview setup',
    });
  }
});

// Endpoint: Stream live interview answer (Server-Sent Events)
app.post('/api/interview/stream-answer', async (req, res) => {
  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      question,
      precompactedContext,
      candidateInfo,
      interviewerInfo,
      jobInfo,
      interviewType,
      interviewGoal,
      lengthPreference = 'normal', // 'short' | 'normal' | 'detailed'
      toneTuning = 'default',
      recentHistory = [],
    } = req.body;

    if (!question || !question.trim()) {
      sendEvent('error', { message: 'Question cannot be empty' });
      res.end();
      return;
    }

    const trimmedQuestion = question.trim();

    // Fast check for low-confidence or garbled audio
    const isLikelyGarbled =
      trimmedQuestion.length < 4 ||
      /^(um+|uh+|ah+|hm+|test|testing|hello\??)$/i.test(trimmedQuestion) ||
      !/[a-zA-Z]{3,}/.test(trimmedQuestion);

    if (isLikelyGarbled && recentHistory.length > 0) {
      sendEvent('unclear', { message: 'Question unclear — please repeat.' });
      sendEvent('complete', {
        finalAnswer: 'Question unclear — please repeat.',
        category: 'Unclear Audio',
        followUps: [],
        isUnclear: true,
      });
      res.end();
      return;
    }

    // Determine target spoken length
    let lengthGuideline = '';
    if (lengthPreference === 'short') {
      lengthGuideline = '1 to 2 punchy, direct sentences (15-20 seconds spoken). Zero fluff or filler.';
    } else if (lengthPreference === 'detailed') {
      lengthGuideline = '4 to 6 structured sentences (60-90 seconds spoken). Include concrete context, decision rationale, technical specifics, and tangible outcome.';
    } else {
      lengthGuideline = '2 to 4 conversational sentences (30-45 seconds spoken). Direct answer first, followed by a crisp real-world example or reasoning.';
    }

    // Interviewer perspective guideline
    const interviewerRole = (interviewerInfo?.role || '').toLowerCase();
    let interviewerPerspectiveGuideline = '';
    if (interviewerRole.includes('engineer') || interviewerRole.includes('tech') || interviewerRole.includes('architect') || interviewerRole.includes('developer')) {
      interviewerPerspectiveGuideline = 'INTERVIEWER IS A TECHNICAL ENGINEER: Emphasize technical accuracy, implementation trade-offs, architecture, and concrete code/system mechanics. Be direct and avoid hand-wavy generalizations.';
    } else if (interviewerRole.includes('hr') || interviewerRole.includes('recruiter') || interviewerRole.includes('talent')) {
      interviewerPerspectiveGuideline = 'INTERVIEWER IS HR / RECRUITER: Emphasize clear communication, teamwork, reliability, work ethic, self-awareness, and alignment with company mission.';
    } else if (interviewerRole.includes('manager') || interviewerRole.includes('lead') || interviewerRole.includes('director') || interviewerRole.includes('cto')) {
      interviewerPerspectiveGuideline = 'INTERVIEWER IS A HIRING MANAGER / EXECUTIVE: Emphasize ownership, problem-solving, collaboration, pragmatic business impact, and communication.';
    } else {
      interviewerPerspectiveGuideline = 'INTERVIEWER PERSPECTIVE: Professional, balanced, clear communication of verified competence.';
    }

    // Format conversation history compactly
    const historyText = recentHistory.length > 0
      ? recentHistory
          .slice(-4)
          .map((h: any, idx: number) => `Q${idx + 1}: "${h.question}"\nA${idx + 1}: "${h.answer}"`)
          .join('\n\n')
      : 'None yet (first question).';

    const systemInstruction = `You are AcePrompt, an elite live interview assistant providing real-time spoken guidance to candidate ${candidateInfo?.name || 'the candidate'} during a live interview.
Your output will be spoken aloud by the candidate in real-time.

PRECOMPUTED PROFILE & CONTEXT:
${precompactedContext || `Role: ${jobInfo?.title || 'Engineer'} at ${jobInfo?.company || 'Company'}. Candidate: ${candidateInfo?.name || 'Candidate'}. Skills: ${candidateInfo?.skills?.join(', ')}`}

INTERVIEWER: ${interviewerInfo?.name || 'Interviewer'} (${interviewerInfo?.role || 'Interviewer'}, ${interviewerInfo?.stage || 'Interview'})
${interviewerPerspectiveGuideline}

PREVIOUS CONVERSATION IN THIS INTERVIEW:
${historyText}

ABSOLUTE CARDINAL RULES:
1. ABSOLUTE NO-FABRICATION RULE:
   - NEVER invent work experience, employers, internships, projects, degrees, certificates, technologies, statistics, or personal stories that the candidate does not have.
   - If the candidate lacks direct experience in the queried tool or technology (e.g. "Have you used Kubernetes?"), provide an honest, professional response framing transferable skills or adjacent hands-on experience (e.g., "I haven't worked with Kubernetes directly in production yet, but I've worked with Docker containers and I understand container orchestration concepts..."). Never claim fake production experience!
2. NO FAKE HOOKS:
   - NEVER begin answers with artificial conversational filler or fake hooks such as:
     * "That's a great question."
     * "Absolutely."
     * "Great question, I'd be happy to..."
     * "I've always been passionate about..."
     * "One thing that really excites me..."
   - Jump directly and naturally into the authentic answer.
3. CONVERSATIONAL & NATURAL:
   - Sound like a smart, calm human thinking and answering naturally.
   - For behavioral questions, follow a natural STAR flow (Situation, Task, Action, Result) without visibly labeling the sections.
   - For technical questions, answer directly first, then provide concise technical substance.
4. ANSWER LENGTH:
   - Target length: ${lengthGuideline}
5. CONTEXT MEMORY:
   - If the interviewer refers to something previously discussed ("You mentioned that API earlier...", "Why did you choose that?"), connect to the previous answer seamlessly.
6. UNCERTAIN AUDIO:
   - If the question appears to be gibberish, ambient background noise, or completely truncated audio, respond ONLY with: "Question unclear — please repeat."`;

    const userPrompt = `INTERVIEWER QUESTION: "${trimmedQuestion}"

Generate the spoken answer now.
At the very end of your response, on a new line after the delimiter "---FOLLOWUPS---", provide 2 or 3 likely follow-up questions formatted as a pipe-separated list, plus the question category (e.g. Technical, Behavioral, System Design, Experience, Company Fit).
Format:
Category: <category>
Followups: <question 1> | <question 2>`;

    let fullAccumulated = '';
    let isStreamingAnswer = true;
    let answerText = '';
    let followUpText = '';

    try {
      const streamResponse = await generateStreamWithFallback({
        contents: userPrompt,
        systemInstruction,
      });

      for await (const chunk of streamResponse) {
        const text = chunk.text || '';
        fullAccumulated += text;

        // Check if we hit the follow-ups delimiter
        if (fullAccumulated.includes('---FOLLOWUPS---')) {
          const parts = fullAccumulated.split('---FOLLOWUPS---');
          if (isStreamingAnswer) {
            const delta = parts[0].slice(answerText.length);
            if (delta) {
              sendEvent('chunk', { text: delta });
              answerText = parts[0];
            }
            isStreamingAnswer = false;
          }
          followUpText = parts[1] || '';
        } else {
          if (isStreamingAnswer) {
            sendEvent('chunk', { text });
            answerText += text;
          }
        }
      }
    } catch (streamErr: any) {
      console.warn('Streaming error encountered:', streamErr?.message || streamErr);
      const isSegmentGlitch = streamErr?.message?.includes('Incomplete JSON segment');

      if (isSegmentGlitch && (answerText || fullAccumulated)) {
        console.log('Trailing stream delimiter glitch ignored; content was already captured.');
      } else if (!answerText && !fullAccumulated) {
        console.log('Stream failed early, falling back to unary content generation...');
        try {
          const unaryRes = await generateContentWithFallback({
            contents: userPrompt,
            systemInstruction,
          });
          const unaryText = unaryRes.text || '';
          const parts = unaryText.split('---FOLLOWUPS---');
          answerText = parts[0].trim();
          followUpText = parts[1] || '';
          sendEvent('chunk', { text: answerText });
        } catch (unaryErr) {
          throw streamErr;
        }
      } else {
        throw streamErr;
      }
    }

    // Clean up answer text from any remaining delimiter artifacts
    const cleanedAnswer = (answerText || fullAccumulated.split('---FOLLOWUPS---')[0]).trim();

    // Check if the model itself deemed the question unclear
    const isUnclear = cleanedAnswer.toLowerCase().includes('question unclear — please repeat') || cleanedAnswer.toLowerCase().includes('question unclear');

    let questionCategory = 'General Interview';
    const suggestedFollowUps: string[] = [];

    if (followUpText) {
      const categoryMatch = followUpText.match(/Category:\s*(.+)/i);
      if (categoryMatch) {
        questionCategory = categoryMatch[1].trim();
      }
      const followupsMatch = followUpText.match(/Followups:\s*(.+)/i);
      if (followupsMatch) {
        const list = followupsMatch[1].split('|').map((q) => q.trim()).filter(Boolean);
        suggestedFollowUps.push(...list);
      }
    }

    sendEvent('complete', {
      finalAnswer: cleanedAnswer,
      category: isUnclear ? 'Unclear Audio' : questionCategory,
      followUps: isUnclear ? [] : suggestedFollowUps,
      isUnclear,
    });

    res.end();
  } catch (error: any) {
    console.error('Error streaming answer:', error);
    sendEvent('error', { message: error?.message || 'Error generating live answer' });
    res.end();
  }
});

// Endpoint: Generate post-interview debrief & summary
app.post('/api/interview/summary', async (req, res) => {
  try {
    const { sessionHistory, candidateInfo, interviewerInfo, jobInfo } = req.body;

    if (!sessionHistory || sessionHistory.length === 0) {
      return res.status(400).json({ error: 'Session history is empty.' });
    }

    const conversationTranscript = sessionHistory
      .map(
        (item: any, i: number) =>
          `[Q${i + 1} - ${item.category || 'General'}]: ${item.question}\n[Spoken Answer]: ${item.answer}`
      )
      .join('\n\n');

    const prompt = `You are a Principal Hiring Manager and Executive Interview Coach.
Review this completed job interview session and provide an actionable, insightful debrief for the candidate.

CANDIDATE: ${candidateInfo?.name || 'Candidate'}
ROLE: ${jobInfo?.title} at ${jobInfo?.company || 'Target Company'}
INTERVIEWER: ${interviewerInfo?.name || 'Interviewer'} (${interviewerInfo?.role || 'Evaluator'}, ${interviewerInfo?.stage || 'Interview Stage'})

CONVERSATION TRANSCRIPT:
${conversationTranscript}

Provide a comprehensive JSON analysis with:
1. "overallScore": number between 1 and 100
2. "readinessRating": "Interview Ready" | "Strong Contender" | "Needs Practice"
3. "strengths": array of 3-4 specific positive signals demonstrated in the answers
4. "gaps": array of 2-3 potential risks, missing depths, or interviewer reservations
5. "recommendedStudies": array of 3 topics/technologies to brush up on
6. "questionReviews": array of objects for the most critical 3 questions:
   {
     "question": string,
     "critique": string,
     "improvedSpokenAnswer": string (natural, truthful, highly polished spoken answer without fake hooks)
   }
7. "hiringManagerPerspective": a candid 2-sentence summary of what the interviewer likely thought`;

    const response = await generateContentWithFallback({
      contents: prompt,
      responseMimeType: 'application/json',
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating summary:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to generate interview summary',
    });
  }
});

// Endpoint: Transcribe pre-recorded or audio fallback
app.post('/api/transcribe-audio', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', contextKeywords = [] } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Audio data is required' });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: audioBase64,
      },
    };

    const promptText = `Transcribe this interview audio clip accurately. Pay special attention to technical terms, programming languages, and industry concepts${
      contextKeywords.length > 0 ? ` such as: ${contextKeywords.join(', ')}` : ''
    }. Output only the exact transcribed speech, nothing else.`;

    const response = await generateContentWithFallback({
      contents: { parts: [audioPart, { text: promptText }] },
    });

    return res.json({ transcript: (response.text || '').trim() });
  } catch (error: any) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({
      error: error?.message || 'Failed to transcribe audio',
    });
  }
});

// Configure Vite middleware in development or static serve in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, () => {
    console.log(`AcePrompt server running on http://localhost:${port}`);
  });
}

startServer();
