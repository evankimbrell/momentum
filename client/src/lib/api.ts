import type { Person, Interaction, ChatAnalysis, VoiceMemoResult } from './types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, options);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// People
export const getPeople = (all = false) =>
  request<Person[]>(`/people${all ? '?all=true' : ''}`);

export const getPerson = (id: string) =>
  request<Person>(`/people/${id}`);

export const createPerson = (data: Partial<Person>) =>
  request<Person>('/people', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const updatePerson = (id: string, data: Partial<Person>) =>
  request<Person>(`/people/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const deletePerson = (id: string) =>
  fetch(`${BASE}/people/${id}`, { method: 'DELETE' });

// Interactions
export const getInteractions = (personId: string) =>
  request<Interaction[]>(`/people/${personId}/interactions`);

export const createInteraction = (personId: string, data: Partial<Interaction>) =>
  request<Interaction>(`/people/${personId}/interactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

// Follow-ups
export const getFollowupsToday = () =>
  request<Person[]>('/followups/today');

export const markFollowupDone = (personId: string) =>
  request<Person>(`/followups/${personId}/done`, { method: 'PATCH' });

// AI
export const analyzeChat = (formData: FormData) =>
  request<ChatAnalysis>('/ai/analyze-chat', { method: 'POST', body: formData });

export const sendVoiceMemo = (transcript: string, personId?: string) =>
  request<VoiceMemoResult>('/ai/voice-memo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript, personId }),
  });

export const applyVoiceMemo = (data: {
  extracted: VoiceMemoResult['extracted'];
  personId?: string;
  audioNoteId?: string;
}) =>
  request<Person>('/ai/voice-memo/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

export const suggestFollowup = (personId: string) =>
  request<{ message: string }>('/ai/suggest-followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ personId }),
  });
