export type InterviewLevel =
  | 'Internship'
  | 'Entry Level'
  | 'Junior'
  | 'Mid-Level'
  | 'Senior'
  | 'Lead'
  | 'Engineering Manager';

export type InterviewType =
  | 'HR'
  | 'Recruiter'
  | 'Technical'
  | 'Coding'
  | 'System Design'
  | 'Behavioral'
  | 'Manager'
  | 'Final'
  | 'General'
  | 'Multiple interviewers'
  | 'Unknown';

export type InterviewStage =
  | 'Screening interview'
  | 'HR interview'
  | 'Technical interview'
  | 'Manager interview'
  | 'Final interview';

export type InterviewGoal =
  | 'Everything'
  | 'Technical questions'
  | 'Behavioral questions'
  | 'Communication'
  | 'Job-specific questions'
  | 'General interview';

export type LengthPreference = 'short' | 'normal' | 'detailed';
export type ToneTuning = 'default' | 'more_natural' | 'more_technical';

export interface CandidateInfo {
  name: string;
  rawResume: string;
  education: string;
  degree?: string;
  university?: string;
  experience: string;
  internships?: string;
  projects: string;
  skills: string[];
  programmingLanguages?: string[];
  frameworks?: string[];
  databases?: string[];
  tools?: string[];
  certifications?: string;
  achievements?: string;
  languages?: string;
  otherRelevantInfo?: string;
}

export interface InterviewerInfo {
  name: string;
  role: string; // e.g. HR Manager, Senior Backend Engineer, CTO, Engineering Manager
  department: string;
  stage: InterviewStage;
  professionalBioOrProfile?: string; // Public bio, LinkedIn notes, perspective
}

export interface JobInfo {
  title: string;
  company: string;
  companyWebsite?: string;
  companyInfo: string;
  department?: string;
  industry?: string;
  location?: string;
  description: string;
  responsibilities?: string;
  requiredSkills?: string;
  preferredSkills?: string;
  technologies: string[];
  level: InterviewLevel;
}

export interface InterviewIntelligenceProfile {
  candidateSummary: {
    verifiedStrengths: string[];
    verifiedLimitations: string[];
    evidenceAnchors: string[];
  };
  interviewerPerspective: {
    roleCategory: 'Technical' | 'HR/Recruiter' | 'Manager/Leadership' | 'Executive';
    focusPriorities: string[];
    likelyEvaluationMindset: string;
  };
  companyUnderstanding: {
    coreNeeds: string[];
    industryContext: string;
    cultureValues: string;
  };
  positionExpectations: string[];
  precompactedContext: string;
}

export interface QuestionAnswerItem {
  id: string;
  question: string;
  answer: string;
  category?: string;
  timestamp: number;
  followUps?: string[];
  lengthPreference?: LengthPreference;
  toneTuning?: ToneTuning;
  isUnclearAudio?: boolean;
}

export interface SummaryReport {
  overallScore: number;
  readinessRating: 'Interview Ready' | 'Strong Contender' | 'Needs Practice';
  strengths: string[];
  gaps: string[];
  recommendedStudies: string[];
  questionReviews: Array<{
    question: string;
    critique: string;
    improvedSpokenAnswer: string;
  }>;
  hiringManagerPerspective: string;
}

export type LiveListeningState =
  | 'ready'
  | 'listening'
  | 'processing'
  | 'answering'
  | 'paused'
  | 'question_unclear'
  | 'error';
