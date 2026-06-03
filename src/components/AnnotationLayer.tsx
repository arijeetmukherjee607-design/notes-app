import React, { useState, useEffect, useRef } from "react";
import { AcademicDB } from "../storage/db";
import { ResearchPaper } from "../types";
import { StickyNote, Trash2, X, Plus } from "lucide-react";

interface AnnotationLayerProps {
  paper: ResearchPaper;
  onSavePaper: (paper: ResearchPaper) => void;
}

export default function AnnotationLayer({ paper, onSavePaper }: AnnotationLayerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState(paper.pdfAnnotations || []);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load the first PDF from attachments if it exists
    const loadPdf = async () => {
      if (paper.attachmentIds && paper.attachmentIds.length > 0) {
        // Just grab the first PDF attached
        const media = await AcademicDB.getMediaRecord(paper.attachmentIds[0]);
        if (media && media.blob) {
          const url = URL.createObjectURL(media.blob);
          setPdfUrl(url);
        }
      }
    };
    loadPdf();
    
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [paper.attachmentIds]);

  const handleDocumentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAnnotating || !containerRef.current) return;
    
    // Check if click was directly on the container (not inside an existing note)
    if ((e.target as HTMLElement).closest('.sticky-note-marker')) return;

    const rect = containerRef.current.getBoundingClientRect();
    
    // Store relatives percentages so they scale somewhat
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const newNote = {
      id: Math.random().toString(),
      x,
      y,
      text: "",
      color: "bg-yellow-200"
    };

    const newSet = [...annotations, newNote];
    setAnnotations(newSet);
    setEditingId(newNote.id);
    setIsAnnotating(false); // turn off placing mode
    
    saveToPaper(newSet);
  };

  const saveToPaper = (newAnnotations: any[]) => {
    onSavePaper({ ...paper, pdfAnnotations: newAnnotations });
  };

  const updateNoteText = (id: string, text: string) => {
    const next = annotations.map(a => a.id === id ? { ...a, text } : a);
    setAnnotations(next);
  };

  const deleteNote = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = annotations.filter(a => a.id !== id);
    setAnnotations(next);
    saveToPaper(next);
    if (editingId === id) setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-3xl overflow-hidden relative border border-gray-200 shadow-xs">
      {/* Top control bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 z-10 shrink-0">
        <div className="flex items-center space-x-2">
          <StickyNote size={16} className="text-[#E5A93B]" />
          <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">Document Annotations Layer</span>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              isAnnotating 
                ? "bg-[#E5A93B] text-white shadow-md"
                : "bg-slate-100 text-gray-600 hover:bg-slate-200"
            }`}
          >
            <Plus size={14} className="mr-1.5" />
            {isAnnotating ? "Click anywhere to place note" : "Add Sticky Note"}
          </button>
        </div>
      </div>

      {/* Main viewer container */}
      <div 
        ref={containerRef}
        onClick={handleDocumentClick}
        className={`flex-1 relative overflow-auto ${isAnnotating ? 'cursor-crosshair' : ''}`}
      >
        {pdfUrl ? (
          <div className="relative w-full h-[800px] min-h-full">
            {/* The actual iframe renderer. pointer-events-none when annotating to allow click-through */}
            <iframe 
              src={pdfUrl} 
              className={`w-full h-full ${isAnnotating ? 'pointer-events-none' : ''}`} 
              title="PDF Viewer"
            />

            {/* Render Notes Layer above it */}
            <div className="absolute inset-0 pointer-events-none">
              {annotations.map((note) => (
                <div
                  key={note.id}
                  className="absolute pointer-events-auto sticky-note-marker"
                  style={{ left: `${note.x}%`, top: `${note.y}%`, transform: 'translate(-50%, -50%)' }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(note.id === editingId ? null : note.id);
                    }}
                    className={`${note.color} w-8 h-8 rounded-full border border-black/10 flex items-center justify-center cursor-pointer shadow-md transform hover:scale-110 transition-transform`}
                  >
                    <StickyNote size={14} className="text-black/60" />
                  </div>

                  {editingId === note.id && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute top-10 left-1/2 transform -translate-x-1/2 bg-yellow-100 p-3 rounded-xl shadow-xl border border-yellow-300 w-56 z-50"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase font-bold text-yellow-800">Sticky Note</span>
                        <div className="flex space-x-2">
                          <button onClick={(e) => deleteNote(note.id, e)} className="text-red-500/70 hover:text-red-600 transition">
                            <Trash2 size={13} />
                          </button>
                          <button onClick={() => { setEditingId(null); saveToPaper(annotations); }} className="text-gray-500 hover:text-black">
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={note.text}
                        onChange={(e) => updateNoteText(note.id, e.target.value)}
                        placeholder="Write note here..."
                        className="w-full bg-yellow-50/50 border border-yellow-200 outline-hidden text-xs text-yellow-900 rounded-lg p-2 resize-none h-24 focus:ring-1 focus:ring-yellow-400"
                        autoFocus
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm font-semibold">
            No PDF attachment found for this visual layer.
          </div>
        )}
      </div>
    </div>
  );
}
