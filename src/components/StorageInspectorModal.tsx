import React, { useState, useEffect } from 'react';
import { AcademicDB } from '../storage/db';
import { X, HardDrive, Image as ImageIcon, Video, FileText, Music, Database, PieChart } from 'lucide-react';

interface StorageStats {
  videos: number;
  images: number;
  audio: number;
  pdfs: number;
  textData: number;
  total: number;
  quota: number;
}

export default function StorageInspectorModal({ onClose }: { onClose: () => void }) {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function calculateStorage() {
      try {
        let videos = 0;
        let images = 0;
        let audio = 0;
        let pdfs = 0;
        let textData = 0;

        const media = await AcademicDB.getAllMediaRecords();
        for (const m of media) {
          const size = m.blob.size;
          if (m.mimeType.startsWith('video/')) videos += size;
          else if (m.mimeType.startsWith('image/')) images += size;
          else if (m.mimeType.startsWith('audio/')) audio += size;
          else if (m.mimeType === 'application/pdf') pdfs += size;
          else textData += size;
        }

        const notes = await AcademicDB.getNotes();
        const logs = await AcademicDB.getLogs();
        const projects = await AcademicDB.getProjects();
        const lectures = await AcademicDB.getLectures();
        const papers = await AcademicDB.getPapers();

        textData += new Blob([JSON.stringify(notes)]).size;
        textData += new Blob([JSON.stringify(logs)]).size;
        textData += new Blob([JSON.stringify(projects)]).size;
        textData += new Blob([JSON.stringify(lectures)]).size;
        textData += new Blob([JSON.stringify(papers)]).size;

        let quota = 0;
        let navTotal = videos + images + audio + pdfs + textData;
        
        if (navigator.storage && navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          quota = estimate.quota || 0;
          if (estimate.usage && estimate.usage > navTotal) {
             // System usage may include IndexedDB overhead
             navTotal = estimate.usage;
          }
        }

        setStats({
          videos,
          images,
          audio,
          pdfs,
          textData,
          total: navTotal,
          quota
        });
      } catch (err) {
        console.error('Failed to calculate storage', err);
      } finally {
        setLoading(false);
      }
    }
    calculateStorage();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPct = (val: number, contextTotal: number) => {
    if (contextTotal === 0) return 0;
    return (val / contextTotal) * 100;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col font-sans">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
              <PieChart size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-gray-900 tracking-tight leading-tight">App Storage Inspector</h2>
              <p className="text-xs text-gray-500 font-medium">Real-time local IndexedDB usage analysis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <HardDrive size={32} className="text-gray-300 animate-bounce" />
              <p className="text-sm text-gray-500 font-bold animate-pulse uppercase tracking-widest">Scanning Sectors...</p>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Storage Overview Bar */}
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5 font-bold text-gray-800">
                    <Database size={16} className="text-indigo-500" />
                    <span>Total Database Size</span>
                  </div>
                  <div className="text-sm font-black text-indigo-600">
                    {formatBytes(stats.videos + stats.images + stats.audio + stats.pdfs + stats.textData)}
                  </div>
                </div>
                
                <div className="h-4 flex rounded-full overflow-hidden bg-gray-200 mt-4 mb-2">
                  <div style={{ width: `${getPct(stats.videos, stats.total)}%` }} className="bg-red-400" />
                  <div style={{ width: `${getPct(stats.images, stats.total)}%` }} className="bg-amber-400" />
                  <div style={{ width: `${getPct(stats.audio, stats.total)}%` }} className="bg-blue-400" />
                  <div style={{ width: `${getPct(stats.pdfs, stats.total)}%` }} className="bg-emerald-400" />
                  <div style={{ width: `${getPct(stats.textData, stats.total)}%` }} className="bg-slate-500" />
                </div>
                
                {stats.quota > 0 && (
                  <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                    <span>{formatBytes(stats.total)} Used</span>
                    <span>{formatBytes(stats.quota)} Storage Quota</span>
                  </div>
                )}
              </div>

              {/* Data Type Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <Video size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Videos</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{formatBytes(stats.videos)}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <ImageIcon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Images</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{formatBytes(stats.images)}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <Music size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Audio</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{formatBytes(stats.audio)}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-150 p-4 rounded-xl flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                    <FileText size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">PDF Documents</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{formatBytes(stats.pdfs)}</p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-150 p-4 rounded-xl sm:col-span-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Database size={18} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Text & Transcripts</p>
                        <p className="text-[10px] text-gray-400">Notes, logs, projects, and transcript JSON</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{formatBytes(stats.textData)}</p>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
