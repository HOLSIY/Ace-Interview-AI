import React, { useState, useEffect, useRef } from 'react';
import {
  CandidateInfo,
  JobInfo,
  InterviewerInfo,
  InterviewType,
  InterviewGoal,
  InterviewIntelligenceProfile,
  QuestionAnswerItem,
  LengthPreference,
} from '../types/interview';
import { useLiveAnswerStream } from '../hooks/useLiveAnswerStream';
import { MicrophoneStatus } from '../hooks/useSpeechRecognition';
import {
  Mic,
  MicOff,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  Keyboard,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';

interface LiveInterviewViewProps {
  candidate: CandidateInfo;
  interviewer: InterviewerInfo;
  job: JobInfo;
  interviewType: InterviewType;
  interviewGoal: InterviewGoal;
  intelligenceProfile: InterviewIntelligenceProfile | null;
  precompactedContext: string;
  sessionHistory: QuestionAnswerItem[];
  micStatus: MicrophoneStatus;
  isListening: boolean;
  interimTranscript: string;
  audioLevel: number;
  micErrorMessage?: string | null;
  onToggleMic: () => void;
  onAddHistoryItem: (item: QuestionAnswerItem) => void;
  onEndInterview: () => void;
  onRegisterQuestionHandler?: (handler: ((q: string) => void) | null) => void;
}

export const LiveInterviewView: React.FC<LiveInterviewViewProps> = ({
  candidate,
  interviewer,
  job,
  interviewType,
  interviewGoal,
  precompactedContext,
  sessionHistory,
  micStatus,
  isListening,
  interimTranscript,
  audioLevel,
  micErrorMessage,
  onToggleMic,
  onAddHistoryItem,
  onEndInterview,
  onRegisterQuestionHandler,
}) => {
  const [copied, setCopied] = useState(false);
  const [manualInputOpen, setManualInputOpen] = useState(false);
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editedQuestionText, setEditedQuestionText] = useState('');

  // Hook: Live Answer Stream
  const {
    currentQuestion,
    currentAnswer,
    activeLength,
    state: answerState,
    isQuestionUnclear,
    generateAnswer,
    regenerateWithNewLength,
    repeatCurrentQuestion,
  } = useLiveAnswerStream({
    candidateInfo: candidate,
    interviewerInfo: interviewer,
    jobInfo: job,
    interviewType,
    interviewGoal,
    precompactedContext,
    defaultLength: 'normal',
    defaultTone: 'default',
    history: sessionHistory,
    onAnswerComplete: (item) => {
      onAddHistoryItem(item);
    },
  });

  // Wire incoming speech from microphone directly to generateAnswer
  useEffect(() => {
    if (onRegisterQuestionHandler) {
      onRegisterQuestionHandler((q: string) => {
        generateAnswer(q);
      });
    }
    return () => {
      if (onRegisterQuestionHandler) {
        onRegisterQuestionHandler(null);
      }
    };
  }, [generateAnswer, onRegisterQuestionHandler]);

  const handleCopy = () => {
    if (!currentAnswer) return;
    navigator.clipboard.writeText(currentAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (manualQuestionText.trim()) {
      generateAnswer(manualQuestionText.trim());
      setManualQuestionText('');
      setManualInputOpen(false);
    }
  };

  const handleSaveEditedQuestion = () => {
    if (editedQuestionText.trim()) {
      setIsEditingQuestion(false);
      generateAnswer(editedQuestionText.trim());
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col justify-between p-4 pb-20 text-slate-100 select-none">
      {/* 1. TOP MINIMAL BAR */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              {job.title}
            </span>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">
              {job.company} • {interviewer.name || 'Interviewer'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setManualInputOpen(true)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              title="Type question manually"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={onToggleMic}
              className={`p-1.5 rounded-lg border transition-colors ${
                isListening
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
              title={isListening ? 'Mute' : 'Unmute'}
            >
              {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onEndInterview}
              className="text-[11px] font-bold text-rose-300 hover:text-white px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
            >
              End
            </button>
          </div>
        </div>

        {/* 2. REAL MICROPHONE STATUS */}
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {isListening && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  micStatus === 'Listening...'
                    ? 'bg-emerald-500'
                    : micStatus === 'Microphone ready'
                    ? 'bg-teal-400'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <span className="text-xs font-bold text-white tracking-tight">
              {micStatus}
            </span>
          </div>

          {/* Real Audio Level Indicator (only active when mic is hearing sound) */}
          {isListening && (
            <div className="flex items-center gap-1.5">
              <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden flex items-center">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75 rounded-full"
                  style={{ width: `${Math.max(5, audioLevel)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 font-mono w-5 text-right">
                {audioLevel}%
              </span>
            </div>
          )}
        </div>

        {micErrorMessage && (
          <div className="mb-3 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/30 p-2 rounded-xl border border-rose-900/50">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{micErrorMessage}</span>
          </div>
        )}

        {/* 3. QUESTION SECTION */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              QUESTION
            </span>
            {currentQuestion && !isEditingQuestion && (
              <button
                onClick={() => {
                  setEditedQuestionText(currentQuestion);
                  setIsEditingQuestion(true);
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {/* Live speech transcription updates in real time */}
          {interimTranscript && !isEditingQuestion && (
            <div className="mb-2 p-2 rounded-lg bg-slate-950 text-xs text-emerald-300 font-medium animate-pulse border border-emerald-500/20">
              <span className="text-[10px] uppercase font-bold text-emerald-500 block mb-0.5">
                Hearing speech:
              </span>
              "{interimTranscript}"
            </div>
          )}

          {isEditingQuestion ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={editedQuestionText}
                onChange={(e) => setEditedQuestionText(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-1.5">
                <button
                  onClick={() => setIsEditingQuestion(false)}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 text-slate-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEditedQuestion}
                  className="px-3 py-1 text-xs font-bold rounded bg-emerald-500 text-slate-950"
                >
                  Save & Answer
                </button>
              </div>
            </div>
          ) : isQuestionUnclear ? (
            <div className="text-amber-400 font-semibold text-xs py-1 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Question unclear — please repeat.</span>
            </div>
          ) : currentQuestion ? (
            <h2 className="text-base font-bold text-white leading-snug tracking-tight">
              "{currentQuestion}"
            </h2>
          ) : (
            <p className="text-xs text-slate-400 py-1 italic">
              Listening for the interviewer's question...
            </p>
          )}
        </div>

        {/* 4. ANSWER SECTION */}
        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 min-h-[170px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                ANSWER
              </span>

              {currentAnswer && (
                <button
                  onClick={handleCopy}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-[10px] text-emerald-400 font-medium">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px]">Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Streaming Answer Text */}
            {currentAnswer ? (
              <div className="text-[15px] sm:text-[16px] text-slate-100 font-normal leading-relaxed select-text">
                <p className="whitespace-pre-wrap">{currentAnswer}</p>
                {answerState === 'answering' && (
                  <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse align-middle" />
                )}
              </div>
            ) : answerState === 'processing' ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium">Formulating natural answer...</span>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Answer will stream here immediately as the interviewer finishes speaking.
              </p>
            )}
          </div>

          {currentAnswer && (
            <div className="mt-3 pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={repeatCurrentQuestion}
                className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. PRIMARY CONTROLS (Length & Regenerate) */}
      <div className="sticky bottom-2 z-30 bg-slate-950/95 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-xl flex items-center gap-1.5">
        <button
          onClick={() => regenerateWithNewLength('short')}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeLength === 'short'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          SHORT
        </button>
        <button
          onClick={() => regenerateWithNewLength('normal')}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeLength === 'normal'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          NORMAL
        </button>
        <button
          onClick={() => regenerateWithNewLength('detailed')}
          className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeLength === 'detailed'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'bg-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          DETAILED
        </button>
      </div>

      {/* MODAL: MANUAL QUESTION INPUT */}
      {manualInputOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl border border-slate-700 p-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white">Ask Question Manually</span>
              <button
                onClick={() => setManualInputOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <textarea
                rows={3}
                autoFocus
                value={manualQuestionText}
                onChange={(e) => setManualQuestionText(e.target.value)}
                placeholder="Type the interviewer's question..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setManualInputOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!manualQuestionText.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                >
                  <span>Answer</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
