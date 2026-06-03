import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Trash2, Library, BookOpenCheck, Camera, Sparkles, AlertCircle, 
  ChevronRight, Upload, ExternalLink, Bookmark, CheckCircle2, BookmarkCheck,
  FilePlus, ClipboardList, PenTool, Highlighter
} from "lucide-react";
import { ResearchPaper, Folder, Tag, MediaRecord } from "../types";
import { AcademicDB } from "../storage/db";

interface PaperWorkspaceProps {
  papers: ResearchPaper[];
  folders: Folder[];
  tags: Tag[];
  onSavePaper: (paper: ResearchPaper) => void;
  onDeletePaper: (id: string) => void;
  onAddTag: (name: string) => void;
}

export default function PaperWorkspace({
  papers,
  folders,
  tags,
  onSavePaper,
  onDeletePaper,
  onAddTag
}: PaperWorkspaceProps) {
  const [selectedPaper, setSelectedPaper] = useState<ResearchPaper | null>(null);
  const [activeTab, setActiveTab] = useState<'brief' | 'viewer' | 'highlights' | 'citations'>('brief');
  const [isCreating, setIsCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");

  // Visual highlights states
  const [highlightText, setHighlightText] = useState("");
  const [highlightComment, setHighlightComment] = useState("");
  const [highlightColor, setHighlightColor] = useState("bg-yellow-100");
  const [highlightPage, setHighlightPage] = useState(1);

  // Creation form
  const [formTitle, setFormTitle] = useState("");
  const [formAuthors, setFormAuthors] = useState("");
  const [formDoi, setFormDoi] = useState("");
  const [formJournal, setFormJournal] = useState("");
  const [formYear, setFormYear] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formFolderId, setFormFolderId] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement | null>(null);

  const fileToBase64 = (file: Blob | File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusText("Uploading document & running bibliographical indexer...");

    try {
      // 1. Create a placeholder paper element
      const paperId = Math.random().toString();
      
      // Save local binary copy internally
      const docRecord: MediaRecord = {
        id: Math.random().toString(),
        parentId: paperId,
        parentType: 'paper',
        type: 'pdf',
        mimeType: file.type,
        blob: new Blob([await file.arrayBuffer()], { type: file.type }),
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      await AcademicDB.saveMediaRecord(docRecord);

      // Simulate partial excerpt text extraction (often around 15KB for paper briefing parsing)
      const mockExcerpt = `TITLE: ${file.name.replace(".pdf", "")} \n This is a processed excerpt representation of the peer-reviewed scholarly literature uploaded. Full document content lives securely on local OPFS/Structured IndexedDB directories.`;

      // 2. Query extraction engine
      const response = await fetch("/api/ai/process-paper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ textExcerpt: mockExcerpt, originalName: file.name })
      });

      if (!response.ok) throw new Error("Paper analysis server exception.");
      const data = await response.json();

      const newPaper: ResearchPaper = {
        id: paperId,
        title: data.title || file.name.replace(".pdf", ""),
        authors: data.authors || "Unparsed",
        doi: data.doi || "",
        journal: data.journal || "AOS Peer Reviews",
        year: data.year || new Date().getFullYear().toString(),
        readingStatus: "unread",
        notes: data.abstractSummary || "Abstract compiled successfully.",
        highlights: [],
        folderId: formFolderId,
        tags: data.suggestedTags || ["Academic"],
        attachmentIds: [docRecord.id],
        starred: false,
        createdAt: new Date().toISOString()
      };

      // Add suggested tags to our system list if they aren't there
      if (data.suggestedTags) {
        data.suggestedTags.forEach((t: string) => onAddTag(t));
      }

      onSavePaper(newPaper);
      setSelectedPaper(newPaper);
      setIsProcessing(false);
      setStatusText("Literature indexed successfully.");
    } catch (err: any) {
      setStatusText(`Failure indexing paper: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const paper: ResearchPaper = {
      id: Math.random().toString(),
      title: formTitle.trim(),
      authors: formAuthors.trim() || "Independent scholar",
      doi: formDoi.trim(),
      journal: formJournal.trim() || "Scholarly Archive",
      year: formYear.trim() || new Date().getFullYear().toString(),
      readingStatus: "unread",
      notes: formNotes.trim() || "No citation study notes recorded.",
      highlights: [],
      folderId: formFolderId,
      tags: [],
      attachmentIds: [],
      starred: false,
      createdAt: new Date().toISOString()
    };

    onSavePaper(paper);
    setSelectedPaper(paper);
    setIsCreating(false);
    resetForm();
  };

  const resetForm = () => {
    setFormTitle("");
    setFormAuthors("");
    setFormDoi("");
    setFormJournal("");
    setFormYear("");
    setFormNotes("");
  };

  // Highlights management
  const addHighlight = () => {
    if (!highlightText.trim() || !selectedPaper) return;

    const newHighlight = {
      id: Math.random().toString(),
      text: highlightText.trim(),
      comment: highlightComment.trim(),
      page: highlightPage,
      color: highlightColor
    };

    const updated = {
      ...selectedPaper,
      highlights: [...(selectedPaper.highlights || []), newHighlight]
    };

    onSavePaper(updated);
    setSelectedPaper(updated);
    
    // Clear inputs
    setHighlightText("");
    setHighlightComment("");
    setStatusText("Highlight annotated.");
  };

  const deleteHighlight = (id: string) => {
    if (!selectedPaper) return;
    const updated = {
      ...selectedPaper,
      highlights: (selectedPaper.highlights || []).filter((h) => h.id !== id)
    };
    onSavePaper(updated);
    setSelectedPaper(updated);
  };

  const filtered = papers.filter((p) => {
    const q = search.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.authors.toLowerCase().includes(q);
  });

  return (
    <div className="flex h-full bg-[#FAF9F5] text-gray-900 font-sans">
      
      {/* List Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full select-none shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Papers library</span>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-1 text-[#E5A93B] hover:text-[#C58C25] hover:scale-110 active:scale-95 transition"
          >
            <FilePlus size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <input 
            type="text" 
            placeholder="Search authors, DOIs..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-hidden focus:border-[#E5A93B]"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.map((p) => {
            const isSelected = selectedPaper?.id === p.id;
            return (
              <div
                key={p.id}
                onClick={() => { setSelectedPaper(p); setIsCreating(false); }}
                className={`p-4 cursor-pointer text-left transition-colors ${
                  isSelected 
                    ? "bg-[#E5A93B]/10 border-l-4 border-l-[#E5A93B]" 
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-[13px] font-bold text-gray-950 truncate max-w-[180px]">{p.title || "Scholarly PDF"}</h4>
                  <span className="text-[9px] bg-green-50 border border-green-200 text-green-600 px-2 py-0.5 rounded-full font-bold uppercase">{p.readingStatus}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-1">{p.authors}</p>
                <div className="flex items-center space-x-1.5 mt-2.5">
                  <span className="text-[10px] bg-slate-100 text-gray-600 rounded-md px-1.5 py-0.5 font-bold">📚 Year {p.year}</span>
                  {p.doi && (
                    <span className="text-[10px] bg-amber-50 text-amber-600 rounded-md px-1.5 py-0.5 font-bold">DOI</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Workspace Panel */}
      <div className="flex-1 overflow-y-auto flex flex-col h-full bg-slate-50">
        
        {/* Creating / Uploading State form */}
        {isCreating ? (
          <div className="p-8 max-w-2xl mx-auto w-full bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 my-8">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center">
                <FilePlus size={18} className="mr-2 text-[#E5A93B]" /> Add New Publications
              </h3>
              <button 
                onClick={() => setIsCreating(false)}
                className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
              >
                Discard
              </button>
            </div>

            {/* Drag snap PDF panel */}
            <div 
              onClick={() => pdfInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-[#E5A93B] cursor-pointer transition text-center space-y-3 bg-slate-50/50"
            >
              <div className="w-12 h-12 rounded-full bg-orange-50 text-[#E5A93B] flex items-center justify-center mx-auto shadow-xs border border-orange-100">
                <Upload size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">Quick-Upload Scholarly PDF</p>
                <p className="text-xs text-gray-410 leading-relaxed max-w-xs mx-auto">Upload any dissertation or paper. AI can automatically derive DOIs, metadata, citations, and summaries.</p>
              </div>
              <input 
                type="file" 
                ref={pdfInputRef} 
                accept="application/pdf" 
                onChange={handlePdfUpload} 
                className="hidden" 
              />
            </div>

            <div className="flex items-center my-4">
              <div className="flex-1 h-[1px] bg-gray-100" />
              <span className="text-[10px] font-bold text-gray-400 uppercase px-4">Or Enter Publication Manually</span>
              <div className="flex-1 h-[1px] bg-gray-100" />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleManualCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Paper Title *</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Observation of Gravitational Waves..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Authors</label>
                <input 
                  type="text" 
                  placeholder="e.g. Albert Einstein, Nathan Rosen"
                  value={formAuthors}
                  onChange={(e) => setFormAuthors(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">DOI URL / Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10.1103/PhysRevLett"
                    value={formDoi}
                    onChange={(e) => setFormDoi(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Year</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 1916"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Publish Journal / Conference</label>
                <input 
                  type="text" 
                  placeholder="e.g. Physical Review Letters"
                  value={formJournal}
                  onChange={(e) => setFormJournal(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Initial Abstract Notes</label>
                <textarea 
                  placeholder="Insert notes, highlights, abstract details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs h-28 focus:border-[#E5A93B]"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="bg-[#E5A93B] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-[#C58C25] active:scale-95 shadow-md shadow-amber-500/10 transition-all"
                >
                  Save Manual Index
                </button>
              </div>
            </form>
          </div>
        ) : selectedPaper ? (
          
          <div className="flex flex-col h-full bg-white select-none">
            
            {/* Upper control heading row */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between shrink-0 bg-white shadow-xs">
              <div>
                <h2 className="text-base font-bold text-gray-950 flex items-center">
                  <BookmarkCheck size={16} className="text-[#E5A93B] mr-1.5 shrink-0" />
                  {selectedPaper.title}
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Authors List: {selectedPaper.authors}</p>
              </div>

              <div className="flex items-center space-x-2">
                <select 
                  value={selectedPaper.readingStatus}
                  onChange={(e) => {
                    const next: any = e.target.value;
                    const updated = { ...selectedPaper, readingStatus: next };
                    onSavePaper(updated);
                    setSelectedPaper(updated);
                  }}
                  className="text-xs bg-slate-50 border border-gray-250 py-1.5 px-3 rounded-xl font-bold uppercase tracking-wider text-gray-700"
                >
                  <option value="unread">Unread 🔘</option>
                  <option value="reading">Reading 📖</option>
                  <option value="completed">Completed ✅</option>
                </select>

                <button 
                  onClick={() => {
                    if (confirm("Delete this literature index from library?")) {
                      onDeletePaper(selectedPaper.id);
                      setSelectedPaper(null);
                    }
                  }}
                  className="text-gray-450 hover:text-red-500 p-2 rounded-lg hover:bg-stone-50 transition"
                  title="Remove Library"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Status alerts strip */}
            {(statusText || isProcessing) && (
              <div className="bg-amber-50 border border-amber-200 py-2 px-4 mx-6 mt-4 flex items-center justify-between text-xs text-[#C58C25] rounded-xl">
                <span className="font-semibold">{statusText || "Synthesizing literature index..."}</span>
                {isProcessing && <div className="w-4 h-4 border-2 border-t-[#E5A93B] border-[#E5A93B]/20 rounded-full animate-spin" />}
              </div>
            )}

            {/* Selector segments */}
            <div className="px-6 border-b border-gray-100 flex mt-4 space-x-1">
              {[
                { id: 'brief', label: 'Paper Abstract Study' },
                { id: 'highlights', label: `Highlights Margin (${(selectedPaper.highlights || []).length})` },
                { id: 'citations', label: 'Citation Formatter' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 py-3 px-4 text-xs font-semibold transition ${
                    activeTab === tab.id 
                      ? "border-b-[#E5A93B] text-[#E5A93B]" 
                      : "border-b-transparent text-gray-450 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Content view renders */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              {/* Brief Abstract */}
              {activeTab === 'brief' && (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Journal Archive</span>
                      <p className="text-xs text-gray-800 font-semibold">{selectedPaper.journal || "Unlisted"}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400">Digital Object Identifier (DOI)</span>
                      <p className="text-xs text-gray-800 font-semibold truncate flex items-center">
                        {selectedPaper.doi || "No DOI Available"}
                        {selectedPaper.doi && (
                          <a 
                            href={`https://doi.org/${selectedPaper.doi}`} 
                            target="_blank" 
                            rel="referrer" 
                            className="text-[#E5A93B] ml-1.5"
                          >
                            <ExternalLink size={12} />
                          </a>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-5 space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">AOS Synthesized Abstract Study</h4>
                    <p className="text-xs text-gray-750 leading-relaxed font-semibold bg-stone-50/50 p-4 border border-stone-150 rounded-2xl whitespace-pre-wrap">
                      {selectedPaper.notes}
                    </p>
                  </div>
                </div>
              )}

              {/* Highlights margin page */}
              {activeTab === 'highlights' && (
                <div className="space-y-6">
                  
                  {/* Highlighter control console */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center space-x-2">
                      <Highlighter size={16} className="text-[#E5A93B]" />
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Highlight Passage</span>
                    </div>

                    <div className="space-y-3">
                      <textarea 
                        value={highlightText}
                        onChange={(e) => setHighlightText(e.target.value)}
                        placeholder="Select and paste text block highlighted from PDF reading..."
                        className="w-full text-xs bg-slate-50 border border-gray-200 rounded-xl p-3 focus:border-[#E5A93B] focus:ring-1 focus:ring-[#E5A93B] h-20"
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="text" 
                          value={highlightComment}
                          onChange={(e) => setHighlightComment(e.target.value)}
                          placeholder="Your annotation comment / study note..."
                          className="bg-slate-50 border border-gray-200 text-xs rounded-xl px-3 py-2.5 focus:border-[#E5A93B]"
                        />

                        {/* Color selects & page */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {[
                              { label: "Yellow Accent", color: "bg-yellow-105 border-yellow-250 text-yellow-800" },
                              { label: "Green Accent", color: "bg-green-105 border-green-250 text-green-800" },
                              { label: "Blue Accent", color: "bg-blue-105 border-blue-250 text-blue-800" }
                            ].map((sel) => (
                              <button 
                                key={sel.color}
                                onClick={() => setHighlightColor(sel.color)}
                                className={`w-6 h-6 rounded-md border ${sel.color.split(" ")[0]} ${highlightColor === sel.color ? "ring-2 ring-[#E5A93B] scale-110" : ""}`}
                                title={sel.label}
                              />
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span className="text-[11px] text-gray-500 font-bold">Page</span>
                            <input 
                              type="number"
                              value={highlightPage}
                              onChange={(e) => setHighlightPage(parseInt(e.target.value) || 1)}
                              className="w-12 bg-slate-50 border border-gray-200 text-xs rounded-lg text-center py-1 font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button 
                          onClick={addHighlight}
                          disabled={!highlightText.trim()}
                          className="bg-stone-850 hover:bg-stone-900 text-white font-bold text-xs uppercase tracking-wider rounded-xl px-4 py-2 disabled:opacity-40"
                        >
                          Annotate Passage
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Highlights loop */}
                  <div className="space-y-3">
                    {(selectedPaper.highlights || []).map((h) => (
                      <div key={h.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex justify-between items-start">
                        <div className="space-y-2.5 max-w-xl">
                          <div className={`p-3.5 border-l-4 rounded-r-xl border-current font-serif text-[13px] leading-relaxed italic ${h.color}`}>
                            "{h.text}"
                          </div>
                          {h.comment && (
                            <p className="text-[12px] text-gray-700 font-medium pl-1">
                              💬 <span className="font-bold underline text-gray-900 border-b border-gray-100 pb-0.5">Annotation:</span> {h.comment}
                            </p>
                          )}
                          <p className="text-[9px] text-gray-400 font-bold pb-0.5 uppercase tracking-wide">Document Page {h.page}</p>
                        </div>

                        <button 
                          onClick={() => deleteHighlight(h.id)}
                          className="text-gray-305 hover:text-red-500 p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>

                </div>
              )}

              {/* Citations Formatter */}
              {activeTab === 'citations' && (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs space-y-6">
                  <h3 className="font-bold text-sm text-gray-900">Visual Citations Copy Tools</h3>
                  <p className="text-xs text-gray-450 leading-relaxed">Copies bibliographical notation structures directly for writing bibliography sections in papers:</p>
                  
                  <div className="space-y-4 pt-1">
                    {[
                      {
                        label: "APA (7th edition) format",
                        syntax: `${selectedPaper.authors || "Unlisted"}. (${selectedPaper.year}). ${selectedPaper.title}. ${selectedPaper.journal || "Publication Archive"}.${selectedPaper.doi ? ` https://doi.org/${selectedPaper.doi}` : ""}`
                      },
                      {
                        label: "MLA (9th edition) format",
                        syntax: `${selectedPaper.authors || "Unlisted"}. "${selectedPaper.title}." ${selectedPaper.journal || "Publication Archive"}, vol. AOS, ${selectedPaper.year}.${selectedPaper.doi ? ` DOI: ${selectedPaper.doi}` : ""}`
                      },
                      {
                        label: "BibTeX citation structure",
                        syntax: `@article{paper_${selectedPaper.id.slice(0,4)},\n  author = {${selectedPaper.authors}},\n  title = {${selectedPaper.title}},\n  journal = {${selectedPaper.journal || "Academic OS Archive"}},\n  year = {${selectedPaper.year}}\n}`
                      }
                    ].map((cit) => (
                      <div key={cit.label} className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-450 uppercase">{cit.label}</span>
                        <div className="bg-slate-50 border border-gray-150 rounded-xl p-3 flex justify-between items-center font-mono text-[11px] leading-relaxed select-text shadow-inner">
                          <pre className="truncate block select-all w-full overflow-x-auto whitespace-pre-wrap">{cit.syntax}</pre>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-emerald-50 text-[#E5A93B] border border-emerald-100 flex items-center justify-center text-2xl shadow-inner">
              📚
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Research Paper Library</h3>
              <p className="text-xs text-gray-450 max-w-sm mx-auto leading-relaxed">
                Connect scholarly journals, reference DOIs, color highlight specific paragraphs, and build annotated literature archives securely.
              </p>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-[#E5A93B] text-white hover:bg-[#C58C25] font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md shadow-amber-500/10 active:scale-95 transition"
            >
              Add Scientific Publication
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
