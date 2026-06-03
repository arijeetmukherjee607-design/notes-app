import React, { useState, useEffect, useCallback } from "react";
import { 
  Folder, Tag, Lecture, ResearchPaper, ExperimentalLog, ResearchProject, AcademicNote 
} from "./types";
import { AcademicDB } from "./storage/db";
import Sidebar from "./components/Sidebar";
import AppleNotesEditor from "./components/AppleNotesEditor";
import AcademicMemory from "./components/AcademicMemory";
import LectureWorkspace from "./components/LectureWorkspace";
import PaperWorkspace from "./components/PaperWorkspace";
import ResearchWorkspace from "./components/ResearchWorkspace";
import StorageInspectorModal from "./components/StorageInspectorModal";
import { 
  Search, Plus, Sparkles, FolderPlus, Compass, BookOpen, Star,
  BookmarkCheck, FlaskConical, ListTodo, FileText, Calendar, Trash2, ArrowUpRight, Menu
} from "lucide-react";

export default function App() {
  // Database States
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [logs, setLogs] = useState<ExperimentalLog[]>([]);
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [notes, setNotes] = useState<AcademicNote[]>([]);

  // Navigation Filter States
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'memory' | 'lectures' | 'papers' | 'projects' | 'logs' | 'notes'>('memory');
  const [searchQuery, setSearchQuery] = useState("");

  // Editor overlays states
  const [editingNote, setEditingNote] = useState<AcademicNote | null>(null);
  const [dbReady, setDbReady] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isStorageInspectorOpen, setIsStorageInspectorOpen] = useState(false);

  // Load and seed database on initial render (offline-first persistent storage)
  useEffect(() => {
    async function loadDB() {
      try {
        const foldersList = await AcademicDB.getFolders();
        const tagsList = await AcademicDB.getTags();
        const lecturesList = await AcademicDB.getLectures();
        const papersList = await AcademicDB.getPapers();
        const logsList = await AcademicDB.getLogs();
        const projectsList = await AcademicDB.getProjects();
        const notesList = await AcademicDB.getNotes();

        // Seeding database with a rich academic starting point if empty
        if (foldersList.length === 0) {
          const defaultFolders: Folder[] = [
            { id: "f1", name: "Physics II (Semester)", parentId: null, createdAt: new Date().toISOString() },
            { id: "f2", name: "Quantum Mechanics", parentId: "f1", createdAt: new Date().toISOString() },
            { id: "f3", name: "Synthesis Lab Papers", parentId: null, createdAt: new Date().toISOString() }
          ];
          for (const f of defaultFolders) await AcademicDB.saveFolder(f);
          setFolders(defaultFolders);

          const defaultTags: Tag[] = [
            { id: "t1", name: "Entropy", color: "#E5A93B" },
            { id: "t2", name: "Schrodinger", color: "#3B82F6" },
            { id: "t3", name: "Lab-Report", color: "#8B5CF6" },
            { id: "t4", name: "Exam-Takeaway", color: "#10B981" }
          ];
          for (const t of defaultTags) await AcademicDB.saveTag(t);
          setTags(defaultTags);

          const seedLecture: Lecture = {
            id: "l1",
            title: "Schrodinger wave-equation and derivations",
            subject: "Physics",
            teacher: "Dr. Richard Feynman",
            date: new Date().toISOString(),
            startTime: "09:00",
            endTime: "10:30",
            duration: 90,
            folderId: "f2",
            tags: ["Schrodinger", "Exam-Takeaway"],
            audioIds: [],
            videoIds: [],
            imageIds: [],
            pdfIds: [],
            transcript: "We are introducing the wave function of psi which matches state variables. Under wave duality, the particle position uncertainty and momentum uncertainty holds the quantum constant limits.",
            transcriptSegments: [
              { startTime: 0, endTime: 30, speaker: "Dr. Feynman", text: "We are introducing the wave function of psi which matches state variables." },
              { startTime: 30, endTime: 90, speaker: "Dr. Feynman", text: "Under wave duality, the particle position uncertainty and momentum uncertainty holds the quantum constant limits." }
            ],
            generatedNotes: "Quantum wave equations regulate state distribution probabilities. ★ EXAM HINT: Schrodinger's time-dependent wave function provides real-state dynamics. Be sure to memorize psi amplitudes! ★ \n [unclear — verify] Multi-dimensional wave barrier segments will be on the final exam.",
            summary: "Core quantum mechanics introduce wave amplitudes and state uncertainties.",
            formulas: [
              { id: "frm1", expression: "i\\hbar \\frac{\\partial\\psi}{\\partial t} = \\hat{H}\\psi", description: "Time-dependent Schrodinger equation", context: "Schrodinger wave-equation and derivations" }
            ],
            qa: [
              { id: "q1", question: "What is wave probability amplitude?", answer: "Represented by psi, its absolute square indicates probability dispersion density." }
            ],
            starred: true,
            createdAt: new Date().toISOString()
          };
          await AcademicDB.saveLecture(seedLecture);
          setLectures([seedLecture]);

          const seedPaper: ResearchPaper = {
            id: "p1",
            title: "Observations of small entropy changes in Nanostructures",
            authors: "Marie Curie, Albert Einstein",
            doi: "10.1103/PhysRevB.24",
            journal: "Journal of Physics B",
            year: "1924",
            citations: "Einstein e1",
            readingStatus: "reading",
            notes: "This publication analyzes structural entropy in crystalline thin films under low temperature limits. Demonstrates partial validation on Clausius-Planck parameters.",
            highlights: [
              { id: "h1", text: "entropy does not degrade beneath structural barriers", comment: "Essential validation constraint", page: 4, color: "bg-yellow-105" }
            ],
            folderId: "f3",
            tags: ["Entropy"],
            attachmentIds: [],
            starred: true,
            createdAt: new Date().toISOString()
          };
          await AcademicDB.savePaper(seedPaper);
          setPapers([seedPaper]);

          const seedLog: ExperimentalLog = {
            id: "lg1",
            title: "Thermal conductivity in Carbon layers",
            date: new Date().toISOString(),
            hypothesis: "Conductivity scales linearly on material thin boundaries",
            methodology: "Physical probe tracking beneath thermal vacuum chambers",
            observations: "Conductivity showed linear spike, expanding from 3.4 to 5.2 W/mK",
            conclusions: "Validates structural thin film model predictions.",
            tags: ["Lab-Report"],
            folderId: "f3"
          };
          await AcademicDB.saveLog(seedLog);
          setLogs([seedLog]);

          const seedProject: ResearchProject = {
            id: "pr1",
            title: "Cognitive Materials Thesis outline",
            description: "Deep investigation on Superlattice graphene sheets and mechanical entropy changes.",
            objectives: ["Publish experimental results", "Assemble peer bibliography index", "Defend semester proposal"],
            status: "active",
            folderId: "f1",
            tags: ["Entropy"],
            createdAt: new Date().toISOString()
          };
          await AcademicDB.saveProject(seedProject);
          setProjects([seedProject]);

          const seedNote: AcademicNote = {
            id: "n1",
            title: "Active derivations brainstorming notes",
            content: "Draft notes for weekly colloquium. DERIVATION ROADMAP: Ensure we match Clausius limits on entropy formulas under close boundary metrics. Ensure we refer back to Marie Curie (1924) publication.",
            checklist: [
              { id: "nc1", text: "Derive Shannon limits", done: false },
              { id: "nc2", text: "Cross-reference Einstein paper citations", done: true }
            ],
            folderId: "f2",
            tags: ["Entropy"],
            starred: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await AcademicDB.saveNote(seedNote);
          setNotes([seedNote]);
        } else {
          setFolders(foldersList);
          setTags(tagsList);
          setLectures(lecturesList);
          setPapers(papersList);
          setLogs(logsList);
          setProjects(projectsList);
          setNotes(notesList);
        }
        
        setDbReady(true);
      } catch (err) {
        console.error("IndexedDB startup crash", err);
      }
    }

    loadDB();
  }, []);

  // === FOLDERS MIDDLEWARE ===
  const handleCreateFolder = async (name: string, parentId: string | null) => {
    const newFolder: Folder = {
      id: Math.random().toString(),
      name,
      parentId,
      createdAt: new Date().toISOString()
    };
    await AcademicDB.saveFolder(newFolder);
    setFolders((prev) => [...prev, newFolder]);
  };

  const handleDeleteFolder = async (id: string) => {
    await AcademicDB.deleteFolder(id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
    
    // Clear selections or associations if necessary
    if (activeFolderId === id) setActiveFolderId(null);
  };

  // === TAGS MIDDLEWARE ===
  const handleCreateTag = async (name: string) => {
    if (tags.some((t) => t.name === name)) return;
    const newTag: Tag = {
      id: Math.random().toString(),
      name,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}` // random color hex
    };
    await AcademicDB.saveTag(newTag);
    setTags((prev) => [...prev, newTag]);
  };

  // === LECTURES ===
  const handleSaveLecture = async (lecture: Lecture) => {
    await AcademicDB.saveLecture(lecture);
    setLectures((prev) => 
      prev.some((x) => x.id === lecture.id)
        ? prev.map((x) => x.id === lecture.id ? lecture : x)
        : [lecture, ...prev]
    );
  };

  const handleDeleteLecture = async (id: string) => {
    await AcademicDB.deleteLecture(id);
    setLectures((prev) => prev.filter((x) => x.id !== id));
  };

  // === RESEARCH PAPERS ===
  const handleSavePaper = async (paper: ResearchPaper) => {
    await AcademicDB.savePaper(paper);
    setPapers((prev) => 
      prev.some((x) => x.id === paper.id)
        ? prev.map((x) => x.id === paper.id ? paper : x)
        : [paper, ...prev]
    );
  };

  const handleDeletePaper = async (id: string) => {
    await AcademicDB.deletePaper(id);
    setPapers((prev) => prev.filter((x) => x.id !== id));
  };

  // === RESEARCH PROJECTS ===
  const handleSaveProject = async (project: ResearchProject) => {
    await AcademicDB.saveProject(project);
    setProjects((prev) => 
      prev.some((x) => x.id === project.id)
        ? prev.map((x) => x.id === project.id ? project : x)
        : [project, ...prev]
    );
  };

  const handleDeleteProject = async (id: string) => {
    await AcademicDB.deleteProject(id);
    setProjects((prev) => prev.filter((x) => x.id !== id));
  };

  // === LAB LOGS ===
  const handleSaveLog = async (log: ExperimentalLog) => {
    await AcademicDB.saveLog(log);
    setLogs((prev) => 
      prev.some((x) => x.id === log.id)
        ? prev.map((x) => x.id === log.id ? log : x)
        : [log, ...prev]
    );
  };

  const handleDeleteLog = async (id: string) => {
    await AcademicDB.deleteLog(id);
    setLogs((prev) => prev.filter((x) => x.id !== id));
  };

  // === PERSONAL NOTES ===
  const handleSaveNote = async (note: AcademicNote) => {
    await AcademicDB.saveNote(note);
    setNotes((prev) => 
      prev.some((x) => x.id === note.id)
        ? prev.map((x) => x.id === note.id ? note : x)
        : [note, ...prev]
    );
  };

  const handleDeleteNote = async (id: string) => {
    await AcademicDB.deleteNote(id);
    setNotes((prev) => prev.filter((x) => x.id !== id));
  };

  // === CROSS-INDEX NAVIGATION helper ===
  const handleNavigateToEntity = (type: 'lecture' | 'paper' | 'note' | 'log', id: string) => {
    setActiveSection(type === 'log' ? 'logs' : `${type}s` as any);
    setActiveFolderId(null);
    setActiveTagId(null);
    
    if (type === 'note') {
      const target = notes.find((n) => n.id === id);
      if (target) setEditingNote(target);
    }
  };

  // === UNIFIED GLOBAL SEARCH ENGINE ===
  // Searches across ALL collections containing notes, formulas, OCR, papers, tags, checklists, lectures etc.
  const getGlobalSearchResults = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const fuzzyMatch = (text: string | undefined, query: string) => {
      if (!text) return false;
      const t = text.toLowerCase();
      if (t.includes(query)) return true;
      const queryWords = query.split(/\s+/);
      if (queryWords.length > 1 && queryWords.every((word) => t.includes(word))) return true;
      let qIdx = 0;
      const qFiltered = query.replace(/\s+/g, '');
      for (let i = 0; i < t.length; i++) {
        if (t[i] === qFiltered[qIdx]) qIdx++;
        if (qIdx === qFiltered.length) return true;
      }
      return false;
    };

    const results: {
      lectures: Lecture[];
      papers: ResearchPaper[];
      notes: AcademicNote[];
      logs: ExperimentalLog[];
    } = { lectures: [], papers: [], notes: [], logs: [] };

    // Notes
    results.notes = notes.filter((n) => 
      n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q) || 
      n.tags.some((t) => t.toLowerCase().includes(q)) ||
      n.checklist?.some((i) => i.text.toLowerCase().includes(q))
    );

    // Lectures Formulas & notes
    results.lectures = lectures.filter((l) => 
      l.title.toLowerCase().includes(q) || 
      l.subject.toLowerCase().includes(q) || 
      l.generatedNotes.toLowerCase().includes(q) ||
      fuzzyMatch(l.transcript, q) ||
      l.formulas.some((f) => f.expression.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)) ||
      l.qa.some((qa) => qa.question.toLowerCase().includes(q) || qa.answer.toLowerCase().includes(q))
    );

    // Research Papers citation, doi, highlights
    results.papers = papers.filter((p) => 
      p.title.toLowerCase().includes(q) || 
      p.authors.toLowerCase().includes(q) || 
      p.journal?.toLowerCase().includes(q) || 
      p.doi.toLowerCase().includes(q) || 
      p.notes.toLowerCase().includes(q) ||
      p.highlights.some((h) => h.text.toLowerCase().includes(q) || h.comment?.toLowerCase().includes(q))
    );

    // Lab logs observations, methodologies
    results.logs = logs.filter((l) => 
      l.title.toLowerCase().includes(q) || 
      l.hypothesis.toLowerCase().includes(q) || 
      l.methodology.toLowerCase().includes(q) || 
      l.observations.toLowerCase().includes(q) || 
      l.conclusions.toLowerCase().includes(q)
    );

    return results;
  };

  const globalSearchMatches = getGlobalSearchResults();
  const searchMatchCount = globalSearchMatches 
    ? (globalSearchMatches.lectures.length + globalSearchMatches.papers.length + globalSearchMatches.notes.length + globalSearchMatches.logs.length)
    : 0;

  // Render Note list inside right dashboard column if Personal notes section active
  const renderPersonalNotesDashboard = () => {
    const filteredNotes = notes.filter((n) => {
      if (activeFolderId) return n.folderId === activeFolderId;
      if (activeTagId) {
        const tagName = tags.find((t) => t.id === activeTagId)?.name;
        return tagName ? n.tags.includes(tagName) : true;
      }
      return true;
    });

    return (
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Academic Notebook</h2>
            <p className="text-xs text-gray-450 font-medium">Apple Notes styled rich documentation logs</p>
          </div>
          <button 
            onClick={async () => {
              const newNote: AcademicNote = {
                id: Math.random().toString(),
                title: "Brainstorm Derivations Idea",
                content: "Derive Clausius Limit equations below:",
                folderId: activeFolderId,
                tags: [],
                starred: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              await handleSaveNote(newNote);
              setEditingNote(newNote);
            }}
            className="bg-[#E5A93B] text-white hover:bg-[#C58C25] font-bold text-xs uppercase tracking-wider px-4.5 py-2.5 rounded-xl flex items-center shadow-md shadow-amber-500/10 active:scale-95 transition-all"
          >
            <Plus size={16} className="mr-1.5" />
            New Note
          </button>
        </div>

        {/* Note Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div 
              key={note.id}
              onClick={() => setEditingNote(note)}
              className="bg-white border border-gray-200 hover:border-[#E5A93B] hover:shadow-md cursor-pointer transition-all p-5 rounded-2xl flex flex-col h-44 justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-gray-950 truncate max-w-[140px]">{note.title}</h4>
                  <span className="text-[9px] text-gray-400 font-bold">{new Date(note.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed truncate-3-lines leading-5 font-semibold">
                  {note.content}
                </p>
              </div>

              {/* Badges footer */}
              <div className="flex items-center justify-between border-t border-gray-50 pt-2 shrink-0">
                <span className="text-[10px] bg-amber-50 text-[#E5A93B] border border-amber-100 rounded-lg px-2 py-0.5 font-bold">📝 Note</span>
                <span className="text-[10px] text-gray-400 font-bold">Updated: {new Date(note.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            </div>
          ))}

          {filteredNotes.length === 0 && (
            <div className="text-center py-12 col-span-full italic text-gray-400 text-xs select-none">
              No private study notes created in this folder yet. Click New Note to draft outlines.
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!dbReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAF9F5] select-none">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#E5A93B]/30 border-t-[#E5A93B] rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Starting Academic OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAF9F5] text-gray-900 font-sans antialiased">
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 1. Left Navigation Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 transition duration-300 ease-in-out z-50 md:z-0 flex-shrink-0 h-full`}>
        <Sidebar 
          folders={folders}
          tags={tags}
          activeFolderId={activeFolderId}
          activeTagId={activeTagId}
          activeSection={activeSection}
          onSelectFolder={(id) => { setActiveFolderId(id); setActiveTagId(null); setSearchQuery(""); setIsMobileMenuOpen(false); }}
          onSelectTag={(id) => { setActiveTagId(id); setActiveFolderId(null); setSearchQuery(""); setIsMobileMenuOpen(false); }}
          onSelectSection={(sec) => { setActiveSection(sec); setSearchQuery(""); setIsMobileMenuOpen(false); }}
          onCreateFolder={handleCreateFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateTag={handleCreateTag}
          onOpenStorageInspector={() => setIsStorageInspectorOpen(true)}
        />
      </div>

      {/* Primary Right Workspace Frame */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
        
        {/* Universal Top Header panel with global search engine */}
        <div className="bg-white px-4 md:px-8 py-3.5 border-b border-gray-250 flex items-center justify-between shrink-0 shadow-xs gap-3">
          <div className="flex flex-1 items-center space-x-2 md:space-x-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-1 min-w-[28px] text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center space-x-2 w-full max-w-sm bg-[#FAF9F5] border border-gray-200.5 rounded-xl px-3.5 py-1.5 focus-within:ring-1 focus-within:ring-[#E5A93B] focus-within:border-[#E5A93B] transition-all">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search lectures, formulas, DOIs, lab hypothesis..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-0 outline-hidden focus:ring-0 text-xs font-semibold placeholder-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-xs text-gray-400 font-semibold hover:text-gray-600">✕</button>
            )}
            </div>
          </div>

          <div className="flex items-center space-x-4 hidden sm:flex">
            <div className="text-right">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block leading-3">Offline Index</span>
              <span className="text-xs font-bold text-gray-800 flex items-center justify-end leading-4">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                Active Store
              </span>
            </div>
          </div>
        </div>

        {/* Workspace Dynamic render container based on Selection and Global Search overrides */}
        <div className="flex-1 overflow-hidden relative">
          
          {searchQuery ? (
            
            // UNIFIED INDEPENDENT SEARCH ENGINE OVERLAY 
            <div className="h-full overflow-y-auto px-8 py-8 space-y-6 bg-slate-50">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <div className="flex items-center space-x-2">
                  <Search className="text-[#E5A93B]" size={18} />
                  <h3 className="font-bold text-gray-900 text-sm tracking-tight">Unified Global Search Indices</h3>
                </div>
                <span className="text-xs font-bold bg-[#E5A93B]/10 text-[#E5A93B] px-3 py-1 rounded-full">{searchMatchCount} matching records found</span>
              </div>

              {searchMatchCount === 0 ? (
                <div className="text-center py-16 text-gray-400 italic text-xs">
                  No matching items found inside notes, checklists, OCR formulas, publications, or experiment logs. Check your spelling or query.
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* Notes Matches */}
                  {globalSearchMatches && globalSearchMatches.notes.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Personal Notes ({globalSearchMatches.notes.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {globalSearchMatches.notes.map((n) => (
                          <div 
                            key={n.id} 
                            onClick={() => { setEditingNote(n); setSearchQuery(""); }}
                            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#E5A93B] transition shadow-xs flex justify-between items-center"
                          >
                            <div className="truncate max-w-[180px]">
                              <p className="text-xs font-bold text-gray-850 truncate">{n.title}</p>
                              <p className="text-[10px] text-gray-410 mt-0.5 truncate">{n.content}</p>
                            </div>
                            <ArrowUpRight size={14} className="text-gray-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lectures Matches */}
                  {globalSearchMatches && globalSearchMatches.lectures.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Lectures Workspace ({globalSearchMatches.lectures.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {globalSearchMatches.lectures.map((l) => (
                          <div 
                            key={l.id} 
                            onClick={() => { setActiveSection("lectures"); setActiveFolderId(null); setSearchQuery(""); }}
                            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#E5A93B] transition shadow-xs flex justify-between items-center"
                          >
                            <div className="truncate max-w-[180px]">
                              <p className="text-xs font-bold text-gray-850 truncate">{l.title}</p>
                              <p className="text-[10px] text-gray-410 mt-0.5 truncate bg-blue-50/50 text-blue-600 rounded px-1.5 py-0.5 w-max font-bold">🎓 Subject: {l.subject}</p>
                            </div>
                            <ArrowUpRight size={14} className="text-gray-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Papers Matches */}
                  {globalSearchMatches && globalSearchMatches.papers.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Peer Literature Library ({globalSearchMatches.papers.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {globalSearchMatches.papers.map((p) => (
                          <div 
                            key={p.id} 
                            onClick={() => { setActiveSection("papers"); setActiveFolderId(null); setSearchQuery(""); }}
                            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#E5A93B] transition shadow-xs flex justify-between items-center"
                          >
                            <div className="truncate max-w-[180px]">
                              <p className="text-xs font-bold text-gray-850 truncate">{p.title}</p>
                              <p className="text-[10px] text-gray-410 mt-0.5 truncate">Authors: {p.authors}</p>
                            </div>
                            <ArrowUpRight size={14} className="text-gray-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Lab Log Matches */}
                  {globalSearchMatches && globalSearchMatches.logs.length > 0 && (
                    <div className="space-y-2.5">
                      <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Laboratory Journals ({globalSearchMatches.logs.length})</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {globalSearchMatches.logs.map((l) => (
                          <div 
                            key={l.id} 
                            onClick={() => { setActiveSection("logs"); setActiveFolderId(null); setSearchQuery(""); }}
                            className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:border-[#E5A93B] transition shadow-xs flex justify-between items-center"
                          >
                            <div className="truncate max-w-[180px]">
                              <p className="text-xs font-bold text-gray-850 truncate">{l.title}</p>
                              <p className="text-[10px] text-gray-410 mt-0.5 truncate">Observations: {l.observations}</p>
                            </div>
                            <ArrowUpRight size={14} className="text-gray-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

          ) : (
            
            // REGULAR CORE BOARD VIEWS
            <>
              {activeSection === 'memory' && (
                <AcademicMemory 
                  lectures={lectures}
                  papers={papers}
                  notes={notes}
                  logs={logs}
                  onNavigateToEntity={handleNavigateToEntity}
                />
              )}

              {activeSection === 'lectures' && (
                <LectureWorkspace 
                  lectures={lectures}
                  folders={folders}
                  tags={tags}
                  onSaveLecture={handleSaveLecture}
                  onDeleteLecture={handleDeleteLecture}
                  onAddTag={handleCreateTag}
                />
              )}

              {activeSection === 'papers' && (
                <PaperWorkspace 
                  papers={papers}
                  folders={folders}
                  tags={tags}
                  onSavePaper={handleSavePaper}
                  onDeletePaper={handleDeletePaper}
                  onAddTag={handleCreateTag}
                />
              )}

              {activeSection === 'notes' && renderPersonalNotesDashboard()}

              {(activeSection === 'projects' || activeSection === 'logs') && (
                <ResearchWorkspace 
                  projects={projects}
                  logs={logs}
                  folders={folders}
                  tags={tags}
                  onSaveProject={handleSaveProject}
                  onDeleteProject={handleDeleteProject}
                  onSaveLog={handleSaveLog}
                  onDeleteLog={handleDeleteLog}
                />
              )}
            </>
          )}

        </div>

      </div>

      {/* Apple Notes Rich Editor Modal popup overlay */}
      {editingNote && (
        <div className="fixed inset-0 z-40 bg-white">
          <AppleNotesEditor 
            note={editingNote}
            availableTags={tags}
            onSave={(updated) => { handleSaveNote(updated); setEditingNote(null); }}
            onClose={() => setEditingNote(null)}
            onAddTag={handleCreateTag}
          />
        </div>
      )}

      {/* Storage Inspector Modal */}
      {isStorageInspectorOpen && (
        <StorageInspectorModal onClose={() => setIsStorageInspectorOpen(false)} />
      )}
    </div>
  );
}
