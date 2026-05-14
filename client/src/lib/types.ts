export type PersonStatus = 'ACTIVE' | 'NEEDS_PING' | 'DATE_PLANNED' | 'GHOSTED' | 'ARCHIVED';
export type UrgencyBadge = 'critical' | 'followup' | 'warm' | 'active';

export interface Interaction {
  id: string;
  personId: string;
  date: string;
  platform: string;
  summary?: string;
  aiInterestScore?: number;
  aiInterestReason?: string;
  rawChatText?: string;
  screenshotUrls: string[];
  createdAt: string;
}

export interface Person {
  id: string;
  name: string;
  age?: number;
  nationality?: string;
  heightCm?: number;
  attractiveness?: number;
  platform: string;
  drinks?: boolean;
  profession?: string;
  status: PersonStatus;
  dealBreakers: string[];
  greenFlags: string[];
  dateNotes?: string;
  followUpDate?: string;
  followUpNote?: string;
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
  interactions: Interaction[];
  urgencyScore: number;
  urgencyBadge: UrgencyBadge;
}

export interface ChatAnalysis {
  conversationSummary: string;
  interestScore: number;
  interestReason: string;
  signals: {
    initiatesTopics: boolean;
    asksQuestions: boolean;
    suggestsPlans: boolean;
    replyLength: 'short' | 'medium' | 'long';
  };
  keyTopicsDiscussed: string[];
  suggestedFollowUpAngle: string;
  extractedFacts: {
    mentionedAvailability?: string;
    mentionedPlans?: string;
    anyRedFlags?: string;
  };
  imageUrls: string[];
}

export interface VoiceMemoResult {
  transcript: string;
  extracted: {
    action: 'create' | 'update';
    person?: Partial<Person>;
    personNameHint?: string;
    updates?: Partial<Person>;
    interactionSummary?: string;
  };
}
