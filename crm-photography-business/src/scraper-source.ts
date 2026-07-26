export interface LeadCandidate {
  university: string;
  date: Date;
  venue?: string;
}

export interface ScraperSource {
  id: string;
  name: string;
  fetchCandidates(): Promise<LeadCandidate[]>;
}
