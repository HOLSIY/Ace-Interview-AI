import React, { useState, useRef } from 'react';
import {
  CandidateInfo,
  JobInfo,
  InterviewerInfo,
  InterviewType,
  InterviewGoal,
  InterviewIntelligenceProfile,
} from '../types/interview';
import { PRESET_PROFILES } from '../utils/sampleData';
import {
  Mic,
  Play,
  Upload,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MicrophoneStatus } from '../hooks/useSpeechRecognition';

interface SetupViewProps {
  candidate: CandidateInfo;
  interviewer: InterviewerInfo;
  job: JobInfo;
  interviewType: InterviewType;
  interviewGoal: InterviewGoal;
  intelligenceProfile: InterviewIntelligenceProfile | null;
  micStatus: MicrophoneStatus;
  micErrorMessage?: string | null;
  onTestMicrophone: () => Promise<boolean>;
  onUpdateCandidate: (c: CandidateInfo) => void;
  onUpdateInterviewer: (i: InterviewerInfo) => void;
  onUpdateJob: (j: JobInfo) => void;
  onStartInterview: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({
  candidate,
  interviewer,
  job,
  micStatus,
  micErrorMessage,
  onTestMicrophone,
  onUpdateCandidate,
  onUpdateInterviewer,
  onUpdateJob,
  onStartInterview,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('fullstack-fintech');
  const [isExtractingCV, setIsExtractingCV] = useState(false);
  const [testingMic, setTestingMic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = PRESET_PROFILES.find((p) => p.id === presetId);
    if (!preset) return;
    onUpdateCandidate(preset.candidate);
    onUpdateInterviewer(preset.interviewer);
    onUpdateJob(preset.job);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (text) {
        onUpdateCandidate({ ...candidate, rawResume: text });
        handleExtractCV(text);
      }
    };
    reader.readAsText(file);
  };

  const handleExtractCV = async (textToExtract?: string) => {
    const text = textToExtract || candidate.rawResume;
    if (!text.trim()) return;

    setIsExtractingCV(true);
    try {
      const res = await fetch('/api/extract-cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText: text }),
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateCandidate({
          ...candidate,
          name: data.name || candidate.name,
          education: data.education || candidate.education,
          experience: data.experience || candidate.experience,
          projects: data.projects || candidate.projects,
          skills: data.skills?.length ? data.skills : candidate.skills,
        });
      }
    } catch (_) {
    } finally {
      setIsExtractingCV(false);
    }
  };

  const handleMicCheck = async () => {
    setTestingMic(true);
    await onTestMicrophone();
    setTestingMic(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-20 text-slate-100">
      {/* Title */}
      <div className="mb-4 text-center">
        <h1 className="text-xl font-bold tracking-tight text-white">
          AI Interview Assistant
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Listens to the interviewer & provides natural, truthful answers.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="mb-4">
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
          Select Interview Profile
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_PROFILES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.id)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                selectedPresetId === p.id
                  ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <p className="text-xs font-bold leading-tight truncate">{p.job.title}</p>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">@{p.job.company}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Form Details */}
      <div className="space-y-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 mb-4">
        {/* Candidate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-300">
              Candidate Name & Resume
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              <span>Upload CV</span>
            </button>
          </div>
          <input
            type="text"
            value={candidate.name}
            onChange={(e) => onUpdateCandidate({ ...candidate, name: e.target.value })}
            placeholder="Candidate Name"
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 mb-1.5"
          />
          <textarea
            rows={2}
            value={candidate.rawResume}
            onChange={(e) => onUpdateCandidate({ ...candidate, rawResume: e.target.value })}
            placeholder="Paste CV or work history..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-[11px] text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
          />
          {candidate.rawResume && (
            <button
              type="button"
              onClick={() => handleExtractCV()}
              disabled={isExtractingCV}
              className="mt-1 text-[10px] text-teal-400 hover:underline flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>{isExtractingCV ? 'Extracting...' : 'Auto-Extract Fields'}</span>
            </button>
          )}
        </div>

        {/* Target Job */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Position
            </label>
            <input
              type="text"
              value={job.title}
              onChange={(e) => onUpdateJob({ ...job, title: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Software Engineer"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Company
            </label>
            <input
              type="text"
              value={job.company}
              onChange={(e) => onUpdateJob({ ...job, company: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. PayFlow"
            />
          </div>
        </div>

        {/* Interviewer */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Interviewer Name
            </label>
            <input
              type="text"
              value={interviewer.name}
              onChange={(e) => onUpdateInterviewer({ ...interviewer, name: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Marcus Vance"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              Interviewer Role
            </label>
            <input
              type="text"
              value={interviewer.role}
              onChange={(e) => onUpdateInterviewer({ ...interviewer, role: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              placeholder="e.g. Senior Engineer"
            />
          </div>
        </div>
      </div>

      {/* Microphone Status Box */}
      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              micStatus === 'Listening...'
                ? 'bg-emerald-500 animate-pulse'
                : micStatus === 'Microphone ready'
                ? 'bg-teal-400'
                : 'bg-rose-500'
            }`}
          />
          <div>
            <p className="text-xs font-bold text-white leading-none">{micStatus}</p>
            {micErrorMessage && (
              <p className="text-[10px] text-rose-400 mt-0.5">{micErrorMessage}</p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleMicCheck}
          disabled={testingMic}
          className="text-[11px] font-semibold text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1"
        >
          <Mic className="w-3.5 h-3.5 text-emerald-400" />
          <span>{testingMic ? 'Checking...' : 'Test Mic'}</span>
        </button>
      </div>

      {/* START INTERVIEW CTA */}
      <button
        type="button"
        onClick={onStartInterview}
        disabled={!job.title}
        className="w-full py-3.5 px-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
      >
        <Play className="w-4 h-4 fill-current" />
        <span>START INTERVIEW</span>
      </button>
      <p className="text-[10px] text-center text-slate-400 mt-2">
        Continuous listening starts immediately when you tap START.
      </p>
    </div>
  );
};
