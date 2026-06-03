/**
 * Academic Operating System
 * Core Types & Interfaces
 */

export interface Folder {
  id: string;
  name: string;
  parentId: string | null; // null for root folders
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Formula {
  id: string;
  expression: string;
  description: string;
  context: string; // e.g. lecture title or paper DOI
}

export interface QA {
  id: string;
  question: string;
  answer: string;
}

export interface TranscriptSegment {
  speaker?: string;
  startTime: number; // in seconds
  endTime: number;
  text: string;
}

export interface Lecture {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  date: string;
  startTime: string;
  endTime: string;
  duration?: number | null;
  folderId: string | null;
  tags: string[]; // tag names or IDs
  
  // Media & Transcript
  audioIds: string[];
  videoIds: string[];
  imageIds: string[];
  pdfIds: string[];
  
  transcript: string;
  transcriptSegments: TranscriptSegment[];
  boardNotes?: string;
  
  // AI Generated
  generatedNotes: string; // Rich Markdown text
  summary: string;
  formulas: Formula[];
  qa: QA[];
  
  starred: boolean;
  createdAt: string;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string;
  doi: string;
  journal?: string;
  year?: string;
  citations?: string;
  readingStatus: 'unread' | 'reading' | 'completed';
  notes: string;
  highlights: { id: string; text: string; comment?: string; page?: number; color: string }[];
  pdfAnnotations?: { id: string; x: number; y: number; text: string; color: string; page?: number }[];
  folderId: string | null;
  tags: string[];
  attachmentIds: string[]; // references of PDF/media records
  starred: boolean;
  createdAt: string;
}

export interface ExperimentalLog {
  id: string;
  title: string;
  date: string;
  hypothesis: string;
  methodology: string;
  observations: string;
  conclusions: string;
  tags: string[];
  folderId: string | null;
}

export interface ResearchProject {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  status: 'planning' | 'active' | 'paused' | 'completed';
  folderId: string | null;
  tags: string[];
  createdAt: string;
}

export interface AcademicNote {
  id: string;
  title: string;
  content: string; // JSON or rich string representation
  checklist?: { id: string; text: string; done: boolean }[];
  drawingData?: string; // Base64 or JSON canvas paths SVG
  folderId: string | null;
  tags: string[];
  starred: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MediaRecord {
  id: string;
  parentId: string; // lectureId or paperId
  parentType: 'lecture' | 'paper' | 'note';
  type: 'audio' | 'video' | 'image' | 'pdf';
  mimeType: string;
  blob: Blob;
  name: string;
  size: number;
  duration?: number; // in seconds for media
  createdAt: string;
}

// Interfaces for AI Assistant Providers
export interface INotesGenerator {
  generateNotes(transcript: string, boardNotes?: string): Promise<{
    notes: string;
    summary: string;
    formulas: { expression: string; description: string }[];
    qa: { question: string; answer: string }[];
  }>;
}

export interface ISummaryGenerator {
  summarize(content: string): Promise<string>;
}

export interface IFormulaExtractor {
  extractFormulas(content: string | Blob): Promise<Formula[]>;
}

export interface IQuestionGenerator {
  generateQAs(content: string): Promise<QA[]>;
}

export interface IResearchAssistant {
  suggestExperiments(projectDescription: string): Promise<string[]>;
  reviewPaper(paperDetails: string, userNotes: string): Promise<string>;
}

export interface IAcademicMemoryAssistant {
  queryMemory(
    query: string,
    context: {
      lectures: any[];
      papers: any[];
      notes: any[];
      formulas: any[];
      qa: any[];
    }
  ): Promise<{
    answer: string;
    takeaways: string[];
    referencedFormulas: Formula[];
    sources: { id: string; type: string; title: string }[];
  }>;
}
