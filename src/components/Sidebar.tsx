import React, { useState, useEffect } from "react";
import { 
  Folder as FolderIcon, FolderPlus, Compass, BookOpen, FlaskConical, 
  ChevronRight, ChevronDown, Plus, Trash2, Hash, BookOpenCheck, ListTodo, Star,
  HardDrive
} from "lucide-react";
import { Folder, Tag } from "../types";

interface SidebarProps {
  folders: Folder[];
  tags: Tag[];
  activeFolderId: string | null;
  activeTagId: string | null;
  activeSection: 'lectures' | 'papers' | 'projects' | 'logs' | 'notes' | 'memory';
  onSelectFolder: (id: string | null) => void;
  onSelectTag: (id: string | null) => void;
  onSelectSection: (section: 'lectures' | 'papers' | 'projects' | 'logs' | 'notes' | 'memory') => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onDeleteFolder: (id: string) => void;
  onCreateTag: (name: string) => void;
  onOpenStorageInspector?: () => void;
}

export default function Sidebar({
  folders,
  tags,
  activeFolderId,
  activeTagId,
  activeSection,
  onSelectFolder,
  onSelectTag,
  onSelectSection,
  onCreateFolder,
  onDeleteFolder,
  onCreateTag,
  onOpenStorageInspector
}: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<string[]>([]);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 0 });

  useEffect(() => {
    if (navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((estimate) => {
        setStorageUsage({
          used: estimate.usage || 0,
          total: estimate.quota || 0,
        });
      });
    }
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (expandedFolders.includes(id)) {
      setExpandedFolders(expandedFolders.filter((fId) => fId !== id));
    } else {
      setExpandedFolders([...expandedFolders, id]);
    }
  };

  const handleCreateFolderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    onCreateFolder(newFolderName.trim(), newFolderParentId);
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  const handleCreateTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    onCreateTag(newTagName.trim());
    setNewTagName("");
    setShowNewTagInput(false);
  };

  // Filter root folders
  const rootFolders = folders.filter((f) => f.parentId === null);

  // Render a single folder recursively
  const renderFolderNode = (folder: Folder, depth = 0) => {
    const children = folders.filter((f) => f.parentId === folder.id);
    const isExpanded = expandedFolders.includes(folder.id);
    const isSelected = activeFolderId === folder.id;

    return (
      <div key={folder.id} className="select-none">
        <div 
          onClick={() => {
            onSelectFolder(folder.id);
            onSelectTag(null); // Clear tag selection
          }}
          className={`flex items-center justify-between group py-1 px-2.5 rounded-lg cursor-pointer text-[13px] font-medium transition ${
            isSelected 
              ? "bg-[#E5A93B]/20 text-[#1D1D1F] font-semibold" 
              : "text-[#3A3A3C] hover:bg-[#EBEBE6]"
          }`}
          style={{ paddingLeft: `${Math.max(10, depth * 12)}px` }}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <button 
              onClick={(e) => toggleExpand(folder.id, e)}
              className="p-0.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-sm transition"
            >
              {children.length > 0 ? (
                isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />
              ) : (
                <div className="w-3 h-3" />
              )}
            </button>
            <FolderIcon size={13} className={isSelected ? "text-[#E5A93B]" : "text-[#8E8E93]"} />
            <span className="truncate">{folder.name}</span>
          </div>

          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setNewFolderParentId(folder.id);
                setShowNewFolderModal(true);
              }}
              className="p-0.5 text-[#8E8E93] hover:text-[#1D1D1F] rounded-sm"
              title="Add Subfolder"
            >
              <Plus size={10} />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete folder ${folder.name} and all subelements?`)) {
                  onDeleteFolder(folder.id);
                }
              }}
              className="p-0.5 text-[#8E8E93] hover:text-red-500 rounded-sm"
              title="Delete Folder"
            >
              <Trash2 size={10} />
            </button>
          </div>
        </div>

        {isExpanded && children.length > 0 && (
          <div className="mt-0.5">
            {children.map((child) => renderFolderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-[#F2F2F0] border-r border-[#E5E5E5] flex flex-col h-full text-[#1D1D1F] font-sans shrink-0">
      
      {/* App Branded Header */}
      <div className="px-4 py-4 border-b border-[#E5E5E5] flex items-center justify-between bg-[#F2F2F0]">
        <div className="flex items-center space-x-2">
          {/* Mini dots */}
          <div className="flex space-x-1.5 shrink-0 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29] inline-block" />
          </div>
          <div className="pl-1 flex items-center space-x-1.5">
            <h1 className="text-[13px] font-bold text-[#1D1D1F] tracking-tight">Academic OS</h1>
            <span className="text-[8px] bg-[#E3E3DE] border border-[#D0D0CB] text-[#515154] px-1 rounded-sm font-semibold tracking-wider uppercase">V1.0</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {/* Core Sections List */}
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold text-[#8E8E93] tracking-wider uppercase px-2 mb-1.5">Academic System</p>
          
          {[
            { id: 'memory', label: 'Academic Memory Engine', icon: Compass, color: 'text-[#D19A00]' },
            { id: 'lectures', label: 'Lectures Workspace', icon: BookOpen, color: 'text-blue-600' },
            { id: 'papers', label: 'Research Library', icon: BookOpenCheck, color: 'text-green-600' },
            { id: 'logs', label: 'Experimental Labs', icon: FlaskConical, color: 'text-[#AF52DE]' },
            { id: 'projects', label: 'Research Projects', icon: ListTodo, color: 'text-teal-600' },
            { id: 'notes', label: 'Academic Notebook', icon: FolderIcon, color: 'text-amber-600' },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id as any);
                  onSelectFolder(null); // Reset detail filter
                  onSelectTag(null);
                }}
                className={`w-full flex items-center space-x-3 px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition ${
                  isSelected 
                    ? "bg-[#E7E7E2] text-[#1D1D1F] font-semibold border border-[#D5D5D0]" 
                    : "text-[#515154] hover:bg-[#EBEBE6] hover:text-[#1D1D1F]"
                }`}
              >
                <Icon size={14} className={isSelected ? item.color : "text-[#8E8E93]"} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Nested Folders Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-bold text-[#8E8E93] tracking-wider uppercase">Cognitive Folders</p>
            <button 
              onClick={() => {
                setNewFolderParentId(null);
                setShowNewFolderModal(true);
              }}
              className="text-[#8E8E93] hover:text-[#E5A93B] hover:scale-110 active:scale-95 transition"
              title="New Top-level Folder"
            >
              <FolderPlus size={14} />
            </button>
          </div>

          <div className="space-y-0.5">
            {rootFolders.length === 0 && (
              <p className="text-[11px] text-[#8E8E93] italic px-2 py-0.5">No folders created yet</p>
            )}
            {rootFolders.map((folder) => renderFolderNode(folder))}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-2">
            <p className="text-[10px] font-bold text-[#8E8E93] tracking-wider uppercase">Universal Tags</p>
            <button 
              onClick={() => setShowNewTagInput(!showNewTagInput)}
              className="text-[#8E8E93] hover:text-[#E5A93B] hover:scale-110 active:scale-95 transition"
            >
              <Plus size={14} />
            </button>
          </div>

          {showNewTagInput && (
            <form onSubmit={handleCreateTagSubmit} className="px-2 py-1">
              <input 
                type="text" 
                placeholder="New tag name"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full text-xs bg-[#FAF9F6] border border-[#E5E5E5] text-[#1D1D1F] rounded-lg px-2 py-1 focus:outline-hidden focus:border-[#E5A93B]"
                autoFocus
              />
            </form>
          )}

          <div className="flex flex-wrap gap-1 px-2">
            {tags.length === 0 && (
              <span className="text-[11px] text-[#8E8E93] italic">No tags</span>
            )}
            {tags.map((tag) => {
              const isSelected = activeTagId === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => {
                    onSelectTag(isSelected ? null : tag.id);
                    onSelectFolder(null); // Reset active folder if tag selected
                  }}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full border flex items-center space-x-1 font-medium transition ${
                    isSelected 
                      ? "bg-[#E5A93B] border-[#C58D2D] text-black" 
                      : "bg-[#EBEBE6] hover:bg-[#E2E2DC] text-[#515154] border-[#DCDCDE]"
                  }`}
                >
                  <Hash size={9} />
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Branded Footer / Storage Status */}
      <div 
        className="p-3 border-t border-[#E5E5E5] bg-[#E7E7E2] flex flex-col space-y-2 cursor-pointer hover:bg-[#DEDEC9] transition-colors"
        onClick={onOpenStorageInspector}
        title="View Storage Inspector"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center space-x-1.5 text-[9px] text-[#D19A00] font-semibold tracking-wide">
            <HardDrive size={10} />
            <span>LOCAL STORAGE</span>
          </div>
          <span className="text-[9px] text-[#8E8E93] font-bold">
            {storageUsage.total > 0 ? `${(storageUsage.used / 1024 / 1024 / 1024).toFixed(2)} GB` : "0 GB"} used
          </span>
        </div>
        
        {storageUsage.total > 0 && (
          <div className="w-full h-1.5 bg-[#Dcdcde] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#E5A93B] rounded-full" 
              style={{ width: `${Math.min((storageUsage.used / storageUsage.total) * 100, 100)}%` }}
            />
          </div>
        )}

        <div className="text-center pt-1 mt-1 border-t border-[#D5D5D0]">
          <span className="text-[9px] text-[#8E8E93] uppercase font-bold tracking-widest">AOS Engine v1.0.0</span>
          <div className="flex items-center justify-center space-x-1.5 text-[8px] text-[#27C93F] font-bold mt-0.5 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#27C93F] animate-pulse shadow-[0_0_4px_#27C93F]" />
            <span>OFFLINE SECURE WORKSPACE</span>
          </div>
        </div>
      </div>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-[#E5E5E5] rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-[#1D1D1F] tracking-wider flex items-center">
              <FolderPlus size={16} className="mr-2 text-[#E5A93B]" /> Create Dynamic Folder
            </h3>
            
            <form onSubmit={handleCreateFolderSubmit} className="space-y-4">
              <input 
                type="text" 
                placeholder="Physics II, Semester Research... etc"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-[#F2F2F0] border border-[#E5E5E5] text-[#1D1D1F] rounded-xl px-3 py-2.5 text-sm focus:outline-hidden focus:border-[#E5A93B]"
                autoFocus
                required
              />

              <div className="flex justify-end space-x-2 text-xs">
                <button 
                  type="button" 
                  onClick={() => setShowNewFolderModal(false)}
                  className="bg-[#F2F2F0] text-[#636366] hover:bg-[#EBEBE6] px-3.5 py-1.5 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-[#E5A93B] text-black px-4 py-1.5 rounded-lg font-bold hover:bg-[#C58C25] active:scale-95 transition"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
