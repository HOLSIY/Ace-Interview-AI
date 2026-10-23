import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { SetupView } from './components/SetupView';
import { LiveInterviewView } from './components/LiveInterviewView';
import { SummaryDebriefView } from './components/SummaryDebriefView';
import {
  CandidateInfo,
  JobInfo,
  InterviewerInfo,
  InterviewType,
  InterviewGoal,
  InterviewIntelligenceProfile,
  QuestionAnswerItem,
} from './types/interview';
import { PRESET_PROFILES } from './utils/sampleData';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';

const STORAGE_KEYS = {
  CANDIDATE: 'aceprompt_candidate',
  INTERVIEWER: 'aceprompt_interviewer',
  JOB: 'aceprompt_job',
  TYPE: 'aceprompt_type',
  GOAL: 'aceprompt_goal',
  PROFILE: 'aceprompt_profile',
  HISTORY: 'aceprompt_history',
};

export default function App() {
  const defaultPreset = PRESET_PROFILES[0];

  // State with localStorage hydration
  const [candidate, setCandidate] = useState<CandidateInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CANDIDATE);
      return saved ? JSON.parse(saved) : defaultPreset.candidate;
    } catch {
      return defaultPreset.candidate;
    }
  });

  const [interviewer, setInterviewer] = useState<InterviewerInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERVIEWER);
      return saved ? JSON.parse(saved) : defaultPreset.interviewer;
    } catch {
      return defaultPreset.interviewer;
    }
  });

  const [job, setJob] = useState<JobInfo>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOB);
      return saved ? JSON.parse(saved) : defaultPreset.job;
    } catch {
      return defaultPreset.job;
    }
  });

  const [interviewType, setInterviewType] = useState<InterviewType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TYPE);
      return saved ? (saved as InterviewType) : defaultPreset.interviewType;
    } catch {
      return defaultPreset.interviewType;
    }
  });

  const [interviewGoal, setInterviewGoal] = useState<InterviewGoal>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOAL);
      return saved ? (saved as InterviewGoal) : defaultPreset.interviewGoal;
    } catch {
      return defaultPreset.interviewGoal;
    }
  });

  const [intelligenceProfile, setIntelligenceProfile] =
    useState<InterviewIntelligenceProfile | null>(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
        return saved ? JSON.parse(saved) : defaultPreset.mockAnalysis;
      } catch {
        return defaultPreset.mockAnalysis;
      }
    });

  const [sessionHistory, setSessionHistory] = useState<QuestionAnswerItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentScreen, setCurrentScreen] = useState<'setup' | 'live' | 'summary'>('setup');
  const liveQuestionCallbackRef = useRef<((q: string) => void) | null>(null);

  // Hook: Speech recognition directly at app level
  const {
    micStatus,
    isListening,
    interimTranscript,
    audioLevel,
    errorMessage: micErrorMessage,
    startListening,
    stopListening,
  } = useSpeechRecognition({
    onQuestionDetected: (detectedQuestion) => {
      if (liveQuestionCallbackRef.current) {
        liveQuestionCallbackRef.current(detectedQuestion);
      }
    },
    silenceThresholdMs: 1400,
  });

  // Sync state changes to localStorage for resilience
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CANDIDATE, JSON.stringify(candidate));
      localStorage.setItem(STORAGE_KEYS.INTERVIEWER, JSON.stringify(interviewer));
      localStorage.setItem(STORAGE_KEYS.JOB, JSON.stringify(job));
      localStorage.setItem(STORAGE_KEYS.TYPE, interviewType);
      localStorage.setItem(STORAGE_KEYS.GOAL, interviewGoal);
      if (intelligenceProfile) {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(intelligenceProfile));
      }
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(sessionHistory));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }, [candidate, interviewer, job, interviewType, interviewGoal, intelligenceProfile, sessionHistory]);

  // Click handler for START INTERVIEW: directly calls startListening() on user gesture!
  const handleStartInterview = async () => {
    // 1. Trigger microphone permission and stream directly in the click event
    await startListening();
    // 2. Switch to live interview view
    setCurrentScreen('live');
  };

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleAddHistoryItem = (newItem: QuestionAnswerItem) => {
    setSessionHistory((prev) => {
      const exists = prev.some((item) => item.id === newItem.id);
      if (exists) return prev;
      return [...prev, newItem];
    });
  };

  const handleResetSession = () => {
    stopListening();
    setSessionHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (_) {}
    setCurrentScreen('setup');
  };

  const precompactedContext =
    intelligenceProfile?.precompactedContext ||
    `${candidate.name}: ${job.title} at ${job.company}. Interviewer: ${interviewer.name} (${interviewer.role}). Skills: ${candidate.skills.join(
      ', '
    )}. Projects: ${candidate.projects}. Verified experience only; no fabrications.`;

  return (
    <div className="min-h-screen bg-slate-950 font-sans antialiased text-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <Header
        currentScreen={currentScreen}
        onGoToSetup={() => {
          stopListening();
          setCurrentScreen('setup');
        }}
        onViewSummary={() => setCurrentScreen('summary')}
        historyCount={sessionHistory.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 w-full">
        {currentScreen === 'setup' && (
          <SetupView
            candidate={candidate}
            interviewer={interviewer}
            job={job}
            interviewType={interviewType}
            interviewGoal={interviewGoal}
            intelligenceProfile={intelligenceProfile}
            micStatus={micStatus}
            micErrorMessage={micErrorMessage}
            onTestMicrophone={startListening}
            onUpdateCandidate={setCandidate}
            onUpdateInterviewer={setInterviewer}
            onUpdateJob={setJob}
            onStartInterview={handleStartInterview}
          />
        )}

        {currentScreen === 'live' && (
          <LiveInterviewView
            candidate={candidate}
            interviewer={interviewer}
            job={job}
            interviewType={interviewType}
            interviewGoal={interviewGoal}
            intelligenceProfile={intelligenceProfile}
            precompactedContext={precompactedContext}
            sessionHistory={sessionHistory}
            micStatus={micStatus}
            isListening={isListening}
            interimTranscript={interimTranscript}
            audioLevel={audioLevel}
            micErrorMessage={micErrorMessage}
            onToggleMic={handleToggleMic}
            onAddHistoryItem={handleAddHistoryItem}
            onRegisterQuestionHandler={(fn) => {
              liveQuestionCallbackRef.current = fn;
            }}
            onEndInterview={() => {
              stopListening();
              setCurrentScreen('summary');
            }}
          />
        )}

        {currentScreen === 'summary' && (
          <SummaryDebriefView
            candidate={candidate}
            interviewer={interviewer}
            job={job}
            sessionHistory={sessionHistory}
            onBackToLive={() => {
              startListening();
              setCurrentScreen('live');
            }}
            onResetSession={handleResetSession}
          />
        )}
      </main>
    </div>
  );
}
