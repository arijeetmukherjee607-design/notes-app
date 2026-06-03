import React, { useState, useEffect } from "react";
import { MediaRecord } from "../types";
import { AcademicDB } from "../storage/db";
import { Image as ImageIcon, FileText, Download, Trash2 } from "lucide-react";

export default function MediaGallery() {
  const [mediaItems, setMediaItems] = useState<MediaRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMedia();
  }, []);

  const loadMedia = async () => {
    try {
      setLoading(true);
      const items = await AcademicDB.getAllMediaRecords();
      // Sort by creation date, newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMediaItems(items);
    } catch (err) {
      console.error("Failed to load media items", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this media item?")) return;
    try {
      await AcademicDB.deleteMediaRecord(id);
      setMediaItems(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete media item", err);
    }
  };

  const handleDownload = (item: MediaRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = URL.createObjectURL(item.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name || `export-${item.id}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-400">Loading gallery...</div>;
  }

  if (mediaItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-full">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <ImageIcon size={28} className="text-gray-300" />
        </div>
        <p className="text-gray-400 font-medium">No media records found.</p>
        <p className="text-xs text-gray-400 mt-2">Captured board snaps, audio, and uploaded PDFs will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Media Gallery</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">All your research snaps, PDFs, and assets centrally collected.</p>
        </div>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs">
          {mediaItems.length} items
        </div>
      </div>
      
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {mediaItems.map((item) => {
          const isImage = item.mimeType.startsWith("image/");
          const isPdf = item.mimeType === "application/pdf";
          
          let previewUrl = "";
          if (isImage) {
            previewUrl = URL.createObjectURL(item.blob);
          }

          return (
            <div 
              key={item.id} 
              className="break-inside-avoid bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow flex flex-col relative"
            >
              {isImage ? (
                <div className="w-full relative bg-gray-50 aspect-auto">
                  <img src={previewUrl} alt={item.name} className="w-full h-auto object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 bg-gray-50 flex items-center justify-center">
                  {isPdf ? (
                    <FileText size={48} className="text-gray-300" />
                  ) : (
                    <ImageIcon size={48} className="text-gray-300" />
                  )}
                </div>
              )}
              
              <div className="p-4 bg-white z-10 border-t border-gray-50 flex flex-col justify-between">
                <div className="mb-3">
                  <p className="font-bold text-sm text-gray-900 truncate" title={item.name}>{item.name}</p>
                  <div className="flex items-center text-[10px] uppercase font-bold text-gray-400 mt-1 mb-2 tracking-wider">
                    <span className="mr-2 px-1.5 py-0.5 bg-gray-100 rounded-md">
                      {isImage ? 'Image' : isPdf ? 'PDF' : item.type}
                    </span>
                    <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={(e) => handleDownload(item, e)}
                    className="flex-1 flex items-center justify-center bg-slate-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 transition active:scale-95"
                  >
                    <Download size={14} className="mr-1.5" /> Download
                  </button>
                  <button 
                    onClick={(e) => deleteMedia(item.id, e)}
                    className="shrink-0 flex items-center justify-center bg-red-50 text-red-500 w-8 h-8 rounded-lg text-xs font-bold hover:bg-red-100 transition active:scale-95"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
