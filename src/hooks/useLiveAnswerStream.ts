import { useState, useRef, useCallback } from 'react';
import {
  CandidateInfo,
  JobInfo,
  InterviewerInfo,
  InterviewType,
  InterviewGoal,
  LengthPreference,
  ToneTuning,
  QuestionAnswerItem,
  LiveListeningState,
} from '../types/interview';

interface UseLiveAnswerStreamProps {
  candidateInfo: CandidateInfo;
  interviewerInfo: InterviewerInfo;
  jobInfo: JobInfo;
  interviewType: InterviewType;
  interviewGoal: InterviewGoal;
  precompactedContext: string;
  defaultLength: LengthPreference;
  defaultTone: ToneTuning;
  history: QuestionAnswerItem[];
  onAnswerComplete: (item: QuestionAnswerItem) => void;
}

export function useLiveAnswerStream({
  candidateInfo,
  interviewerInfo,
  jobInfo,
  interviewType,
  interviewGoal,
  precompactedContext,
  defaultLength,
  defaultTone,
  history,
  onAnswerComplete,
}: UseLiveAnswerStreamProps) {
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [currentCategory, setCurrentCategory] = useState<string>('General Question');
  const [currentFollowUps, setCurrentFollowUps] = useState<string[]>([]);
  const [activeLength, setActiveLength] = useState<LengthPreference>(defaultLength);
  const [activeTone, setActiveTone] = useState<ToneTuning>(defaultTone);
  const [state, setState] = useState<LiveListeningState>('ready');
  const [isQuestionUnclear, setIsQuestionUnclear] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const generateAnswer = useCallback(
    async (
      question: string,
      options?: {
        lengthPreference?: LengthPreference;
        toneTuning?: ToneTuning;
      }
    ) => {
      if (!question || !question.trim()) return;

      // Abort any ongoing stream
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const chosenLength = options?.lengthPreference || activeLength;
      const chosenTone = options?.toneTuning || activeTone;

      setCurrentQuestion(question.trim());
      setCurrentAnswer('');
      setCurrentFollowUps([]);
      setIsQuestionUnclear(false);
      setErrorMessage(null);
      setState('processing');

      let accumulatedAnswer = '';
      let detectedCategory = 'General Question';
      let followUps: string[] = [];
      let unclearAudioDetected = false;

      try {
        const response = await fetch('/api/interview/stream-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.trim(),
            precompactedContext,
            candidateInfo,
            interviewerInfo,
            jobInfo,
            interviewType,
            interviewGoal,
            lengthPreference: chosenLength,
            toneTuning: chosenTone,
            recentHistory: history.map((h) => ({
              question: h.question,
              answer: h.answer,
              category: h.category,
            })),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `Server responded with ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Response body stream not available');

        const decoder = new TextDecoder('utf-8');

        setState('answering');

        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            const eventMatch = line.match(/^event:\s*(.+)$/m);
            const dataMatch = line.match(/^data:\s*(.+)$/m);

            const eventType = eventMatch ? eventMatch[1].trim() : 'message';
            const dataStr = dataMatch ? dataMatch[1].trim() : '';

            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (eventType === 'chunk') {
                  accumulatedAnswer += data.text || '';
                  setCurrentAnswer(accumulatedAnswer);
                } else if (eventType === 'unclear') {
                  unclearAudioDetected = true;
                  setIsQuestionUnclear(true);
                  setState('question_unclear');
                } else if (eventType === 'complete') {
                  if (data.finalAnswer) {
                    accumulatedAnswer = data.finalAnswer;
                    setCurrentAnswer(data.finalAnswer);
                  }
                  if (data.category) {
                    detectedCategory = data.category;
                    setCurrentCategory(data.category);
                  }
                  if (data.followUps && Array.isArray(data.followUps)) {
                    followUps = data.followUps;
                    setCurrentFollowUps(data.followUps);
                  }
                  if (data.isUnclear) {
                    unclearAudioDetected = true;
                    setIsQuestionUnclear(true);
                  }
                } else if (eventType === 'error') {
                  if (accumulatedAnswer.trim().length > 0) {
                    console.warn('Ignoring trailing error event since answer was already received:', data.message);
                  } else {
                    throw new Error(data.message || 'Stream error occurred');
                  }
                }
              } catch (e: any) {
                if (e.message && eventType === 'error' && !accumulatedAnswer.trim()) throw e;
              }
            }
          }
        }

        if (unclearAudioDetected) {
          setState('question_unclear');
        } else {
          setState('ready');
        }

        // Deliver completed item
        const completedItem: QuestionAnswerItem = {
          id: 'qa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          question: question.trim(),
          answer: accumulatedAnswer.trim(),
          category: detectedCategory,
          timestamp: Date.now(),
          followUps,
          lengthPreference: chosenLength,
          toneTuning: chosenTone,
          isUnclearAudio: unclearAudioDetected,
        };

        onAnswerComplete(completedItem);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          return;
        }
        if (accumulatedAnswer.trim().length > 0) {
          console.warn('Preserving received answer despite trailing stream error:', err?.message);
          setState('ready');
          onAnswerComplete({
            id: 'qa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            question: question.trim(),
            answer: accumulatedAnswer.trim(),
            category: detectedCategory,
            timestamp: Date.now(),
            followUps,
            lengthPreference: chosenLength,
            toneTuning: chosenTone,
            isUnclearAudio: false,
          });
          return;
        }
        console.error('Streaming answer error:', err);
        setErrorMessage(err.message || 'Could not stream answer');
        setState('error');
      }
    },
    [
      activeLength,
      activeTone,
      candidateInfo,
      history,
      interviewerInfo,
      interviewGoal,
      interviewType,
      jobInfo,
      onAnswerComplete,
      precompactedContext,
    ]
  );

  const regenerateWithNewLength = useCallback(
    (newLength: LengthPreference) => {
      setActiveLength(newLength);
      if (currentQuestion) {
        generateAnswer(currentQuestion, { lengthPreference: newLength });
      }
    },
    [currentQuestion, generateAnswer]
  );

  const regenerateWithNewTone = useCallback(
    (newTone: ToneTuning) => {
      setActiveTone(newTone);
      if (currentQuestion) {
        generateAnswer(currentQuestion, { toneTuning: newTone });
      }
    },
    [currentQuestion, generateAnswer]
  );

  const repeatCurrentQuestion = useCallback(() => {
    if (currentQuestion) {
      generateAnswer(currentQuestion);
    }
  }, [currentQuestion, generateAnswer]);

  return {
    currentQuestion,
    currentAnswer,
    currentCategory,
    currentFollowUps,
    activeLength,
    activeTone,
    state,
    isQuestionUnclear,
    errorMessage,
    setCurrentQuestion,
    generateAnswer,
    regenerateWithNewLength,
    regenerateWithNewTone,
    repeatCurrentQuestion,
  };
}
