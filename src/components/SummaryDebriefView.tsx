import React, { useState, useEffect } from 'react';
import {
  CandidateInfo,
  InterviewerInfo,
  JobInfo,
  QuestionAnswerItem,
  SummaryReport,
} from '../types/interview';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  ArrowLeft,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  Download,
  Share2,
} from 'lucide-react';

interface SummaryDebriefViewProps {
  candidate: CandidateInfo;
  interviewer: InterviewerInfo;
  job: JobInfo;
  sessionHistory: QuestionAnswerItem[];
  onBackToLive: () => void;
  onResetSession: () => void;
}

export const SummaryDebriefView: React.FC<SummaryDebriefViewProps> = ({
  candidate,
  interviewer,
  job,
  sessionHistory,
  onBackToLive,
  onResetSession,
}) => {
  const [report, setReport] = useState<SummaryReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    async function fetchSummary() {
      if (sessionHistory.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/interview/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionHistory,
            candidateInfo: candidate,
            interviewerInfo: interviewer,
            jobInfo: job,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setReport(data);
        }
      } catch (err) {
        console.error('Error fetching summary:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [candidate, interviewer, job, sessionHistory]);

  const handleCopyTranscript = () => {
    const text = sessionHistory
      .map(
        (item, idx) =>
          `Q${idx + 1} (${item.category || 'General'}):\n${item.question}\n\nSpoken Answer:\n${
            item.answer
          }\n-----------------------------------\n`
      )
      .join('\n');

    navigator.clipboard.writeText(
      `AcePrompt Interview Session Transcript\nRole: ${job.title} at ${job.company}\nInterviewer: ${interviewer.name} (${interviewer.role})\nCandidate: ${candidate.name}\n\n${text}`
    );
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto p-4 pb-24 text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToLive}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Live</span>
        </button>

        <button
          onClick={handleCopyTranscript}
          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700"
        >
          {copiedTranscript ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Notes</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Session Completed
        </div>
        <h1 className="text-2xl font-extrabold text-white">Interview Debrief</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {job.title} • {job.company}
        </p>
        <p className="text-[11px] text-teal-400 font-medium">
          Interviewer: {interviewer.name} ({interviewer.role})
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3 bg-slate-900/60 rounded-2xl border border-slate-800">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-200">
            Evaluating Interview Responses & Hiring Signals...
          </p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
            Analyzing technical accuracy, conversational delivery, and interviewer alignment.
          </p>
        </div>
      ) : report ? (
        <div className="space-y-4">
          {/* Score & Rating Hero */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 shadow-lg flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Performance Rating
              </span>
              <h2 className="text-xl font-bold text-white mt-0.5">{report.readinessRating}</h2>
              <p className="text-[11px] text-emerald-400 font-medium mt-1">
                Grounded in candidate verified background
              </p>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-emerald-400">{report.overallScore}</span>
              <span className="text-[9px] font-semibold text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Hiring Manager Perspective */}
          {report.hiringManagerPerspective && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 text-xs">
              <span className="text-[11px] font-bold text-teal-400 block mb-1">
                {interviewer.name}'s Likely Impression:
              </span>
              <p className="text-slate-300 italic leading-relaxed">
                "{report.hiringManagerPerspective}"
              </p>
            </div>
          )}

          {/* Strengths */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Key Strengths Observed</span>
            </div>
            <div className="space-y-1.5">
              {report.strengths.map((str, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="text-emerald-400 font-bold">•</span>
                  <span>{str}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gaps & Weaknesses */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Identified Gaps & Follow-Up Risks</span>
            </div>
            <div className="space-y-1.5">
              {report.gaps.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Study Topics */}
          {report.recommendedStudies?.length > 0 && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-teal-400">
                <BookOpen className="w-4 h-4" />
                <span>Recommended Prep Topics</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.recommendedStudies.map((topic, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-slate-800 text-slate-200 px-2.5 py-1 rounded-lg border border-slate-700"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Question Reviews */}
          {report.questionReviews?.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Question Critiques & Honest Polished Answers
              </h3>

              {report.questionReviews.map((qr, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs"
                >
                  <p className="font-bold text-white text-xs">"{qr.question}"</p>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    <span className="text-slate-300 font-semibold">Coach Feedback:</span>{' '}
                    {qr.critique}
                  </p>
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-emerald-500/20 text-slate-200 text-xs">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1">
                      Direct Human Spoken Answer (No Fake Hooks):
                    </span>
                    <p className="leading-relaxed whitespace-pre-wrap">
                      "{qr.improvedSpokenAnswer}"
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400 bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
          <p className="mb-2">No answers recorded yet in this session.</p>
          <button
            onClick={onBackToLive}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Start Answering Questions
          </button>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-6 flex gap-2">
        <button
          onClick={onResetSession}
          className="flex-1 py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700"
        >
          New Interview Setup
        </button>
        <button
          onClick={onBackToLive}
          className="flex-1 py-3 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md"
        >
          Resume Live Mode
        </button>
      </div>
    </div>
  );
};
