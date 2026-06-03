import React, { useState } from "react";
import { 
  Compass, Sparkles, BookOpen, FileText, FlaskConical, Hash, 
  Search, ArrowRight, Lightbulb, BookOpenCheck, ChevronRight
} from "lucide-react";
import { Lecture, ResearchPaper, AcademicNote, ExperimentalLog, Formula } from "../types";

interface AcademicMemoryProps {
  lectures: Lecture[];
  papers: ResearchPaper[];
  notes: AcademicNote[];
  logs: ExperimentalLog[];
  onNavigateToEntity: (type: 'lecture' | 'paper' | 'note' | 'log', id: string) => void;
}

export default function AcademicMemory({
  lectures,
  papers,
  notes,
  logs,
  onNavigateToEntity
}: AcademicMemoryProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Memory Synthesized Answer State
  const [answer, setAnswer] = useState<string | null>(null);
  const [takeaways, setTakeaways] = useState<string[]>([]);
  const [referencedFormulas, setReferencedFormulas] = useState<Formula[]>([]);
  const [sources, setSources] = useState<{ id: string; type: string; title: string }[]>([]);

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    // Compile entire snapshot index securely to feed Gemini. (Retrieval-based logic)
    const databaseSnapshot = {
      lectures: lectures.map((l) => ({
        id: l.id,
        title: l.title,
        subject: l.subject,
        teacher: l.teacher,
        summary: l.summary,
        formulas: l.formulas,
        notes: l.generatedNotes?.slice(0, 5000)
      })),
      papers: papers.map((p) => ({
        id: p.id,
        title: p.title,
        authors: p.authors,
        readingStatus: p.readingStatus,
        notes: p.notes?.slice(0, 5000),
        highlights: p.highlights
      })),
      notes: notes.map((n) => ({
        id: n.id,
        title: n.title,
        content: n.content?.slice(0, 5000),
        checklist: n.checklist
      })),
      logs: logs.map((lg) => ({
        id: lg.id,
        title: lg.title,
        hypothesis: lg.hypothesis,
        observations: lg.observations,
        conclusions: lg.conclusions
      }))
    };

    try {
      const response = await fetch("/api/ai/memory-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), databaseSnapshot })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Retrieval engine failure.");
      }

      const data = await response.json();
      setAnswer(data.answer);
      setTakeaways(data.takeaways || []);
      setReferencedFormulas(data.referencedFormulas || []);
      setSources(data.sources || []);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during synthesis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF9F5] text-gray-900 font-sans">
      
      {/* Header Banner */}
      <div className="bg-white border-b border-gray-200 px-8 py-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <Compass className="text-[#E5A93B]" size={24} />
          <div>
            <h2 className="text-lg font-bold text-gray-900">Academic Memory Engine</h2>
            <p className="text-xs text-gray-450 font-medium">Cross-reference and synthesize unified concept records instantly</p>
          </div>
        </div>

        <div className="bg-orange-50 text-[#E5A93B] border border-orange-100 rounded-lg px-3 py-1 text-[11px] font-bold flex items-center">
          <Sparkles size={12} className="mr-1.5 animate-pulse" />
          Active Retrieval Loop
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 max-w-4xl mx-auto w-full">
        
        {/* Memory Search Bar */}
        <div className="space-y-3 bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-stone-700 font-semibold text-sm">
            <Lightbulb size={16} className="text-[#E5A93B]" />
            <span>Search Your Combined Memory Space</span>
          </div>

          <form onSubmit={handleQuerySubmit} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='e.g., "What have I learned about entropy?" or "Show formulas in thermodynamics."'
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-12 pr-4 text-[14px] outline-hidden placeholder-gray-450 focus:border-[#E5A93B] focus:ring-1 focus:ring-[#E5A93B] transition"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-[#E5A93B] text-white font-semibold text-xs tracking-wider uppercase rounded-2xl px-6 py-3.5 hover:bg-[#C58C25] hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:scale-100 transition-all shadow-md shadow-amber-500/10 flex items-center shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  Query Memory
                  <ArrowRight size={14} className="ml-2" />
                </>
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-3">
            <span className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mr-1.5">Quick Queries:</span>
            {[
              "Entropy dynamics", 
              "Fourier transform references", 
              "Physics formula reference",
              "Review active notes"
            ].map((suggest) => (
              <button
                key={suggest}
                onClick={() => {
                  setQuery(`Explain ${suggest}`);
                }}
                className="text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-650 rounded-full py-1 px-3 transition-colors border border-gray-200"
              >
                {suggest}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-650 border border-red-200 rounded-2xl p-4 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* AI Answer Card Synthesis */}
        {answer && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
              
              <div className="flex items-center space-x-2 border-b border-gray-100 pb-4">
                <Sparkles size={18} className="text-[#E5A93B]" />
                <h3 className="font-bold text-gray-900 tracking-tight text-base">Synthesized Concept Brief</h3>
              </div>

              {/* Main Text Content */}
              <div className="prose text-gray-800 text-[14px] leading-relaxed space-y-4">
                {answer.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* High precision takeaways */}
              {takeaways.length > 0 && (
                <div className="bg-yellow-50/50 border border-yellow-100 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold text-[#C58C25] uppercase tracking-wider flex items-center">
                    <Sparkles size={14} className="mr-1.5 animate-pulse" /> Core Academic Takeaways
                  </h4>
                  <ul className="space-y-2">
                    {takeaways.map((takeaway, i) => (
                      <li key={i} className="flex items-start text-xs text-gray-700 leading-relaxed font-medium">
                        <span className="text-[#E5A93B] mr-2">✦</span>
                        {takeaway}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Formulas associated */}
              {referencedFormulas.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#636366] tracking-wider uppercase">Extracted Formulas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {referencedFormulas.map((f, i) => (
                      <div key={i} className="bg-[#151619] border border-black rounded-lg p-4 flex flex-col justify-between font-mono text-sm text-emerald-400 shadow-inner">
                        <div className="text-[#8E9299] text-[10px] uppercase mb-4 border-b border-[#2C2D31] pb-1.5">
                          Synthesized Formula Reference
                        </div>
                        <div className="text-center py-3 overflow-x-auto text-sm text-emerald-300 font-semibold select-all leading-relaxed whitespace-nowrap bg-black/40 rounded-md border border-stone-900/50 font-mono">
                          {f.expression}
                        </div>
                        <div className="pt-2 border-t border-[#2C2D31] mt-2 flex justify-between items-center text-[10px]">
                          <span className="font-bold text-gray-200">{f.description}</span>
                          <span className="text-[#8E9299] italic font-medium">{f.context || "AOS Database"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verified Original Bibliographical links */}
              {sources.length > 0 && (
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <h4 className="text-xs font-bold text-gray-450 tracking-wider uppercase">Citation Reference Sources</h4>
                  <div className="flex flex-wrap gap-2">
                    {sources.map((src, i) => {
                      let badgeColor = "bg-blue-50 border-blue-200 text-blue-600";
                      let typeLabel = "Lecture";
                      if (src.type === "paper") {
                        badgeColor = "bg-green-50 border-green-200 text-green-600";
                        typeLabel = "Paper";
                      } else if (src.type === "note") {
                        badgeColor = "bg-amber-50 border-amber-200 text-amber-600";
                        typeLabel = "Personal Note";
                      } else if (src.type === "log") {
                        badgeColor = "bg-purple-50 border-purple-200 text-purple-600";
                        typeLabel = "Experiment Lab";
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => onNavigateToEntity(src.type as any, src.id)}
                          className={`flex items-center space-x-1.5 text-xs border rounded-xl py-2 px-3 font-semibold hover:scale-[1.02] active:scale-95 transition-all ${badgeColor}`}
                        >
                          <span>[{typeLabel}]</span>
                          <span className="truncate max-w-[140px] font-medium">{src.title}</span>
                          <ChevronRight size={12} className="opacity-60" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Database state indicators */}
        {!answer && (
          <div className="text-center py-16 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-[#E5A93B] border border-amber-100 flex items-center justify-center mx-auto text-xl shadow-inner">
              ✦
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-gray-800 text-sm">AOS Knowledge Base Connected</h3>
              <p className="text-xs text-gray-450 max-w-md mx-auto leading-relaxed">
                Your database lists <span className="font-bold text-gray-850">{lectures.length} lectures</span>, <span className="font-bold text-gray-850">{papers.length} peer-reviewed papers</span>, and <span className="font-bold text-gray-850">{notes.length} notebook entries</span>. Ask a synthesis question above to begin retrieval analysis.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
