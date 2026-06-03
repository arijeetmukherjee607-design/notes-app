import React, { useState } from "react";
import { 
  FlaskConical, Plus, Trash2, ListTodo, Clipboard, Sparkles, CheckSquare, 
  Square, CheckCircle2, ChevronRight, BookmarkCheck, Calendar, Activity,
  Image as ImageIcon
} from "lucide-react";
import { ResearchProject, ExperimentalLog, Folder, Tag } from "../types";
import MediaGallery from "./MediaGallery";

interface ResearchWorkspaceProps {
  projects: ResearchProject[];
  logs: ExperimentalLog[];
  folders: Folder[];
  tags: Tag[];
  onSaveProject: (project: ResearchProject) => void;
  onDeleteProject: (id: string) => void;
  onSaveLog: (log: ExperimentalLog) => void;
  onDeleteLog: (id: string) => void;
}

export default function ResearchWorkspace({
  projects,
  logs,
  folders,
  tags,
  onSaveProject,
  onDeleteProject,
  onSaveLog,
  onDeleteLog
}: ResearchWorkspaceProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  
  const [activeSegment, setActiveSegment] = useState<'projects' | 'labs' | 'media'>('projects');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingLog, setIsCreatingLog] = useState(false);

  // Project forms state
  const [pTitle, setPTitle] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pObjectives, setPObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");
  const [pStatus, setPStatus] = useState<'planning' | 'active' | 'paused' | 'completed'>('planning');
  const [pFolderId, setPFolderId] = useState<string | null>(null);

  // Lab log form state
  const [lTitle, setLTitle] = useState("");
  const [lHypothesis, setLHypothesis] = useState("");
  const [lMethod, setLMethod] = useState("");
  const [lObserve, setLObserve] = useState("");
  const [lConclude, setLConclude] = useState("");
  const [lFolderId, setLFolderId] = useState<string | null>(null);

  // Helpers
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim()) return;

    const proj: ResearchProject = {
      id: Math.random().toString(),
      title: pTitle.trim(),
      description: pDesc.trim(),
      objectives: pObjectives,
      status: pStatus,
      folderId: pFolderId,
      tags: [],
      createdAt: new Date().toISOString()
    };

    onSaveProject(proj);
    setSelectedProjectId(proj.id);
    setIsCreatingProject(false);
    
    // reset
    setPTitle("");
    setPDesc("");
    setPObjectives([]);
    setPStatus("planning");
  };

  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lTitle.trim()) return;

    const log: ExperimentalLog = {
      id: Math.random().toString(),
      title: lTitle.trim(),
      date: new Date().toISOString(),
      hypothesis: lHypothesis.trim(),
      methodology: lMethod.trim(),
      observations: lObserve.trim(),
      conclusions: lConclude.trim(),
      tags: [],
      folderId: lFolderId
    };

    onSaveLog(log);
    setSelectedLogId(log.id);
    setIsCreatingLog(false);

    // reset
    setLTitle("");
    setLHypothesis("");
    setLMethod("");
    setLObserve("");
    setLConclude("");
  };

  const addObjective = () => {
    if (!newObjective.trim()) return;
    setPObjectives([...pObjectives, newObjective.trim()]);
    setNewObjective("");
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const selectedLog = logs.find(l => l.id === selectedLogId);

  return (
    <div className="flex h-full bg-[#FAF9F5] text-gray-900 font-sans">
      
      {/* Side list selector column */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full select-none shrink-0 border-collapse">
        <div className="p-4 border-b border-gray-105 flex items-center justify-between">
          <select 
            value={activeSegment}
            onChange={(e) => setActiveSegment(e.target.value as any)}
            className="text-xs bg-slate-50 border border-gray-250 py-1.5 px-3 rounded-xl font-bold uppercase tracking-wider text-gray-700 w-full"
          >
            <option value="projects">📂 Active Research Projects</option>
            <option value="labs">🔬 Experimental Lab Briefs</option>
            <option value="media">📸 Media & Assets Gallery</option>
          </select>
        </div>

        <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-stone-50/20">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Record indexes</span>
          <button
            onClick={() => activeSegment === 'projects' ? setIsCreatingProject(true) : setIsCreatingLog(true)}
            className="text-xs bg-[#E5A93B]/10 hover:bg-[#E5A93B]/20 text-[#E5A93B] font-bold uppercase px-2.5 py-1 rounded-lg"
          >
            + Add New
          </button>
        </div>

        {/* Listings */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {activeSegment === 'projects' ? (
            projects.map((p) => {
              const isSelected = selectedProjectId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProjectId(p.id); setIsCreatingProject(false); }}
                  className={`p-4 cursor-pointer text-left transition ${
                    isSelected ? "bg-[#E5A93B]/10 border-l-4 border-l-[#E5A93B]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-[13px] font-bold text-gray-950 truncate max-w-[180px]">{p.title}</h4>
                    <span className="text-[9px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-bold uppercase">{p.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 lines-clamp-2">{p.description}</p>
                </div>
              );
            })
          ) : activeSegment === 'labs' ? (
            logs.map((l) => {
              const isSelected = selectedLogId === l.id;
              return (
                <div
                  key={l.id}
                  onClick={() => { setSelectedLogId(l.id); setIsCreatingLog(false); }}
                  className={`p-4 cursor-pointer text-left transition ${
                    isSelected ? "bg-[#E5A93B]/10 border-l-4 border-l-[#E5A93B]" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-gray-950 truncate">{l.title}</h4>
                    <span className="text-[9px] text-gray-400 flex items-center shrink-0">
                      <Calendar size={10} className="mr-0.5" />
                      {new Date(l.date).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-450 mt-1 truncate">Hypothesis: {l.hypothesis}</p>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              <ImageIcon size={24} className="mx-auto mb-2 opacity-50" />
              Viewing Global Media Gallery
            </div>
          )}
        </div>
      </div>

      {/* Workspace Panel Render Area */}
      <div className="flex-1 overflow-y-auto flex flex-col h-full bg-slate-50">
        
        {/* Creating / Uploading State form */}
        {activeSegment === 'media' ? (
          <MediaGallery />
        ) : isCreatingProject ? (
          <div className="p-8 max-w-2xl mx-auto w-full bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 my-8">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center">
              <ListTodo size={18} className="mr-2 text-[#E5A93B]" /> Initiate Research Project Proposal
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Project Title *</label>
                <input 
                  type="text" 
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="e.g. Graphene Supercapacitor Derivations..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Abstract Description</label>
                <textarea 
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Details concerning hypotheses, resource libraries, and target results..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs h-24 focus:border-[#E5A93B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Objectives Roadmap Checklist</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Add goal goalpost..."
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 flex-1 focus:outline-hidden"
                    />
                    <button 
                      type="button" 
                      onClick={addObjective}
                      className="bg-stone-850 hover:bg-stone-900 text-white rounded-xl px-3.5 text-xs font-semibold"
                    >
                      + Goal
                    </button>
                  </div>
                  <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto">
                    {pObjectives.map((o, index) => (
                      <p key={index} className="text-xs text-gray-650 flex items-center">
                        <span className="text-[#E5A93B] mr-2">✦</span>
                        {o}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">State Status</label>
                  <select 
                    value={pStatus}
                    onChange={(e) => setPStatus(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                  >
                    <option value="planning">Decision Framework (Planning)</option>
                    <option value="active">Active Sprints (Active)</option>
                    <option value="paused">Temporarily Shelved (Paused)</option>
                    <option value="completed">Concluded Paper (Completed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Cognitive Folder Group</label>
                <select 
                  onChange={(e) => setPFolderId(e.target.value || null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                >
                  <option value="">No folder categorization</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="bg-[#E5A93B] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-[#C58C25]"
                >
                  Save Active Project
                </button>
              </div>
            </form>
          </div>
        ) : isCreatingLog ? (
          
          <div className="p-8 max-w-2xl mx-auto w-full bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 my-8">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3 flex items-center">
              <FlaskConical size={18} className="mr-2 text-[#E5A93B]" /> Open Experimental Laboratory Log
            </h3>
            <form onSubmit={handleCreateLog} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Experiment Name *</label>
                <input 
                  type="text" 
                  value={lTitle}
                  onChange={(e) => setLTitle(e.target.value)}
                  placeholder="e.g. Synthesis of C02 compounds via thermal entropy..."
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Primary Hypothesis</label>
                <textarea 
                  value={lHypothesis}
                  onChange={(e) => setLHypothesis(e.target.value)}
                  placeholder="State the core experimental hypothesis explicitly..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 h-16 text-xs focus:border-[#E5A93B]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Scientific Methodology / LaTeX Equations</label>
                <textarea 
                  value={lMethod}
                  onChange={(e) => setLMethod(e.target.value)}
                  placeholder="Equations, physical reagents, and measurement setup codes..."
                  className="w-full bg-slate-50 font-mono border border-gray-200 rounded-xl px-4 py-2 h-20 text-xs focus:border-[#E5A93B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Active Observations</label>
                  <textarea 
                    value={lObserve}
                    onChange={(e) => setLObserve(e.target.value)}
                    placeholder="Physical metrics, visual cues, gas pressure outputs etc."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 h-24 text-xs focus:border-[#E5A93B]"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Theorems / Conclusions</label>
                  <textarea 
                    value={lConclude}
                    onChange={(e) => setLConclude(e.target.value)}
                    placeholder="Resulting derivations and paper citation proposals."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 h-24 text-xs focus:border-[#E5A93B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Cognitive Folder Group</label>
                <select 
                  onChange={(e) => setLFolderId(e.target.value || null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                >
                  <option value="">No folder categorization</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  type="submit"
                  className="bg-[#E5A93B] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-[#C58C25]"
                >
                  Publish Lab Entry Log
                </button>
              </div>
            </form>
          </div>
        ) : activeSegment === 'projects' && selectedProject ? (
          
          <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Project display card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs space-y-6 select-none relative group">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-950">{selectedProject.title}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Date Created: {new Date(selectedProject.createdAt).toLocaleDateString()}</p>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Permanently archive this research project?")) {
                      onDeleteProject(selectedProject.id);
                      setSelectedProjectId(null);
                    }
                  }}
                  className="text-gray-300 hover:text-red-500 p-2 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Project abstract description</span>
                <p className="text-xs text-gray-800 leading-relaxed font-semibold bg-stone-50/50 p-4 border border-stone-150 rounded-2xl">
                  {selectedProject.description || "No description recorded yet for this research effort."}
                </p>
              </div>

              {selectedProject.objectives?.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Objectives Roadmap Checklist</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedProject.objectives.map((o, idx) => (
                      <div key={idx} className="bg-[#FAF9F5] border border-gray-150 rounded-2xl p-4 flex gap-3 items-center shadow-xs">
                        <CheckCircle2 size={16} className="text-[#E5A93B] shrink-0" />
                        <span className="text-xs text-gray-700 leading-relaxed font-semibold">{o}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        ) : activeSegment === 'labs' && selectedLog ? (
          
          <div className="p-8 max-w-4xl mx-auto w-full space-y-6">
            
            {/* Lab Log Display Card */}
            <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs space-y-6 select-none relative group">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex items-center space-x-2.5">
                  <Activity className="text-purple-500 shrink-0" size={17} />
                  <div>
                    <h2 className="text-base font-bold text-gray-950">{selectedLog.title}</h2>
                    <p className="text-[10px] text-gray-400 mt-0.5">Laboratory Log created on {new Date(selectedLog.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (confirm("Delete this physical lab entry permanently?")) {
                      onDeleteLog(selectedLog.id);
                      setSelectedLogId(null);
                    }
                  }}
                  className="text-gray-300 hover:text-red-500 p-2 rounded-lg transition"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* Bento styled details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="bg-[#FAF9F5] border border-gray-150 rounded-2xl p-5 space-y-2.5">
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider">Core Hypothesis</span>
                  <p className="text-xs text-gray-750 font-semibold italic">"{selectedLog.hypothesis || "Not specified."}"</p>
                </div>

                <div className="bg-[#FAF9F5] border border-gray-150 rounded-2xl p-5 space-y-2.5 font-mono text-[11px] select-text">
                  <span className="text-[9px] uppercase font-bold text-stone-400 tracking-wider font-sans">Methodology Equations</span>
                  <p className="text-gray-900 bg-white border border-gray-100 rounded-xl p-3 shadow-inner leading-relaxed overflow-x-auto">
                    {selectedLog.methodology || "No methodology logs recorded."}
                  </p>
                </div>

                <div className="bg-yellow-50/50 border border-yellow-105 rounded-2xl p-5 space-y-2.5">
                  <span className="text-[9px] uppercase font-bold text-stone-405 tracking-wider">Experimental Observations</span>
                  <p className="text-xs text-gray-750 font-semibold leading-relaxed">
                    {selectedLog.observations || "Metrics log empty."}
                  </p>
                </div>

                <div className="bg-emerald-50/50 border border-emerald-105 rounded-2xl p-5 space-y-2.5">
                  <span className="text-[9px] uppercase font-bold text-stone-405 tracking-wider">Theorems & Conclusions</span>
                  <p className="text-xs text-gray-750 font-semibold leading-relaxed">
                    {selectedLog.conclusions || "No conclusions formatted."}
                  </p>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
            <div className="w-20 h-20 rounded-full bg-indigo-50 text-[#E5A93B] border border-indigo-100 flex items-center justify-center text-2xl shadow-inner animate-pulse">
              🔬
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Research Workspace Logs</h3>
              <p className="text-xs text-gray-450 max-w-sm mx-auto leading-relaxed">
                Connect active project goalpost charts, log molecular experimental formulas, and track physical conclusions securely.
              </p>
            </div>
            <button 
              onClick={() => activeSegment === 'projects' ? setIsCreatingProject(true) : setIsCreatingLog(true)}
              className="bg-[#E5A93B] text-white hover:bg-[#C58C25] font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md shadow-amber-500/10 active:scale-95 transition"
            >
              Open Research Portal
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
