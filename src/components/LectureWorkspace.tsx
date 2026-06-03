import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, Trash2, Volume2, Video, Camera, FileText, Check, Edit2, 
  Play, Pause, Sparkles, ChevronRight, Hash, FolderOpen, AlertCircle
} from "lucide-react";
import { Lecture, Folder, Tag, MediaRecord, Formula, QA } from "../types";
import { AcademicDB } from "../storage/db";

interface LectureWorkspaceProps {
  lectures: Lecture[];
  folders: Folder[];
  tags: Tag[];
  onSaveLecture: (lecture: Lecture) => void;
  onDeleteLecture: (id: string) => void;
  onAddTag: (name: string) => void;
}

export default function LectureWorkspace({
  lectures,
  folders,
  tags,
  onSaveLecture,
  onDeleteLecture,
  onAddTag
}: LectureWorkspaceProps) {
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'formulas' | 'qa' | 'board' | 'transcript' | 'media'>('notes');
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState("");

  // Media Recording & File Upload States
  const [recording, setRecording] = useState<'audio' | 'video' | null>(null);
  const [recDuration, setRecDuration] = useState(0);
  const [mediaItems, setMediaItems] = useState<MediaRecord[]>([]);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [ocrCorrecting, setOcrCorrecting] = useState(false);
  const [correctedOcrText, setCorrectedOcrText] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");

  // New Lecture Form State
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("Other");
  const [formTeacher, setFormTeacher] = useState("");
  const [formTranscript, setFormTranscript] = useState("");
  const [formBoard, setFormBoard] = useState("");
  const [formFolderId, setFormFolderId] = useState<string | null>(null);

  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const boardInputRef = useRef<HTMLInputElement | null>(null);

  // Load recordings on selection change
  useEffect(() => {
    if (selectedLecture) {
      AcademicDB.getMediaForParent(selectedLecture.id).then(setMediaItems);
    }
  }, [selectedLecture]);

  const [boardSnapStream, setBoardSnapStream] = useState<MediaStream | null>(null);
  const boardSnapVideoRef = useRef<HTMLVideoElement | null>(null);
  const boardSnapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Hook camera preview
  useEffect(() => {
    if (cameraStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    if (boardSnapStream && boardSnapVideoRef.current) {
      boardSnapVideoRef.current.srcObject = boardSnapStream;
    }
  }, [boardSnapStream]);


  const startRecord = async (type: 'audio' | 'video') => {
    try {
      setStatusText("Acquiring media tracks...");
      const constraints = type === 'video'
        ? { video: { facingMode: "environment" }, audio: true }
        : { audio: true };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (type === 'video') setCameraStream(stream);

      chunksRef.current = [];
      const mr = new MediaRecorder(stream, { mimeType: type === 'video' ? 'video/webm' : 'audio/webm' });
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.start(250);
      mediaRecRef.current = mr;
      setRecording(type);
      setRecDuration(0);
      setStatusText("");
      setLiveTranscript("");

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      let isSimulated = false;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          setLiveTranscript(currentTranscript);
        };
        recognition.onerror = () => { isSimulated = true; };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {
          isSimulated = true;
        }
      } else {
        isSimulated = true;
      }

      timerRef.current = setInterval(() => {
        setRecDuration((d) => d + 1);
        if (isSimulated) {
           setLiveTranscript((prev) => prev + (Math.random() > 0.6 ? " [simulating audio transcript...] " : ""));
        }
      }, 1000);
    } catch (err: any) {
      setStatusText(`Hardware error: ${err.message}`);
    }
  };

  const stopRecord = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }

    const mr = mediaRecRef.current;
    const stream = cameraStream;
    
    if (mr) {
      mr.onstop = async () => {
        const mimeType = recording === 'video' ? "video/webm" : "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const mediaId = Math.random().toString();

        const record: MediaRecord = {
          id: mediaId,
          parentId: selectedLecture!.id,
          parentType: 'lecture',
          type: recording === 'video' ? 'video' : 'audio',
          mimeType,
          blob,
          name: `${recording === 'video' ? 'Video' : 'Audio'} Recorded - ${new Date().toLocaleTimeString()}`,
          size: blob.size,
          duration: recDuration,
          createdAt: new Date().toISOString()
        };

        await AcademicDB.saveMediaRecord(record);
        setMediaItems(prev => [...prev, record]);

        const key = recording === 'video' ? 'videoIds' : 'audioIds';
        
        let updatedTranscript = selectedLecture!.transcript || "";
        if (liveTranscript.trim()) {
           updatedTranscript = updatedTranscript ? updatedTranscript + "\n\n[Live Transcript]: " + liveTranscript : "[Live Transcript]: " + liveTranscript;
        }

        const updated = {
          ...selectedLecture!,
          transcript: updatedTranscript,
          [key]: [...(selectedLecture![key] || []), mediaId]
        };
        
        onSaveLecture(updated);
        setSelectedLecture(updated);
        setStatusText("Recording saved local store.");
        setLiveTranscript("");
      };
      
      mr.stop();
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      setCameraStream(null);
      setRecording(null);
    }
  };

  const startBoardSnapCamera = async () => {
    try {
      setStatusText("Acquiring camera for Board Snap...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setBoardSnapStream(stream);
      setStatusText("");
    } catch (err: any) {
      setStatusText(`Camera error: ${err.message}`);
    }
  };

  const stopBoardSnapCamera = () => {
    if (boardSnapStream) {
      boardSnapStream.getTracks().forEach((track) => track.stop());
      setBoardSnapStream(null);
    }
  };

  const takeBoardSnap = async () => {
    if (!boardSnapVideoRef.current || !boardSnapCanvasRef.current || !selectedLecture) return;
    
    setIsProcessing(true);
    setStatusText("Snapping and extracting board items...");

    const video = boardSnapVideoRef.current;
    const canvas = boardSnapCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsProcessing(false);
        return;
      }

      try {
        const localRecordId = Math.random().toString();
        const fileType = "image/jpeg";
        const ocrRecord: MediaRecord = {
          id: localRecordId,
          parentId: selectedLecture.id,
          parentType: 'lecture',
          type: 'image',
          mimeType: fileType,
          blob: blob,
          name: `Board Snap ${new Date().toLocaleTimeString()}`,
          size: blob.size,
          createdAt: new Date().toISOString()
        };
        
        await AcademicDB.saveMediaRecord(ocrRecord);
        setMediaItems(prev => [...prev, ocrRecord]);

        const base64Image = await fileToBase64(blob);
        const response = await fetch("/api/ai/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Image, mimeType: fileType })
        });

        if (!response.ok) throw new Error("Board OCR service error.");
        const data = await response.json();

        // Simulate combining old text + new text
        const newTextContent = data.extractedText || "[Extracted Text]";
        
        const currentNotes = selectedLecture.boardNotes || "";
        const combinedNotes = currentNotes ? currentNotes + "\n\n" + newTextContent : newTextContent;

        const updated: Lecture = {
          ...selectedLecture,
          boardNotes: combinedNotes,
          formulas: [
            ...(selectedLecture.formulas || []),
            ...(data.formulas || []).map((f: any) => ({
              id: Math.random().toString(),
              expression: f.expression,
              description: f.description,
              context: selectedLecture.title
            }))
          ],
          imageIds: [...(selectedLecture.imageIds || []), localRecordId]
        };

        onSaveLecture(updated);
        setSelectedLecture(updated);
        setCorrectedOcrText(combinedNotes);
        setStatusText("Live Board Snap parsed and appended to notes!");
        stopBoardSnapCamera();
      } catch (err: any) {
        setStatusText(`OCR error: ${err.message}`);
      } finally {
        setIsProcessing(false);
      }
    }, 'image/jpeg');
  };

  // Convert File blob -> Base 64 for Gemini API processing
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

  // 1. Audio Transcript generator (Express endpoint)
  const triggerAudioTranscription = async (record: MediaRecord) => {
    setIsProcessing(true);
    setStatusText("Synthesizing student spoken details...");
    try {
      const base64Audio = await fileToBase64(record.blob);
      const response = await fetch("/api/ai/transcribe-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Audio, mimeType: record.mimeType })
      });

      if (!response.ok) throw new Error("Transcription server error.");
      const data = await response.json();

      const updated: Lecture = {
        ...selectedLecture!,
        transcript: data.fullTranscript,
        transcriptSegments: data.segments || []
      };
      onSaveLecture(updated);
      setSelectedLecture(updated);
      setStatusText("Lecture transcript synchronized.");
    } catch (err: any) {
      setStatusText(`Transcription error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Whiteboard Image OCR Scanner
  const handleBoardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLecture) return;

    setIsProcessing(true);
    setStatusText("Scanning board handwriting & extracting LaTeX equations...");
    
    try {
      // 1. Save local board Snapshot copy
      const localRecordId = Math.random().toString();
      const ocrRecord: MediaRecord = {
        id: localRecordId,
        parentId: selectedLecture.id,
        parentType: 'lecture',
        type: 'image',
        mimeType: file.type,
        blob: new Blob([await file.arrayBuffer()], { type: file.type }),
        name: file.name,
        size: file.size,
        createdAt: new Date().toISOString()
      };
      await AcademicDB.saveMediaRecord(ocrRecord);
      setMediaItems(prev => [...prev, ocrRecord]);

      // 2. Call multimodal OCR endpoint
      const base64Image = await fileToBase64(file);
      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Image, mimeType: file.type })
      });

      if (!response.ok) throw new Error("Board scanning service error.");
      const data = await response.json();

      const updated: Lecture = {
        ...selectedLecture,
        boardNotes: data.extractedText,
        formulas: [
          ...(selectedLecture.formulas || []),
          ...(data.formulas || []).map((f: any) => ({
            id: Math.random().toString(),
            expression: f.expression,
            description: f.description,
            context: selectedLecture.title
          }))
        ],
        imageIds: [...(selectedLecture.imageIds || []), localRecordId]
      };

      onSaveLecture(updated);
      setSelectedLecture(updated);
      setCorrectedOcrText(data.extractedText);
      setStatusText("Board OCR parsing complete!");
    } catch (err: any) {
      setStatusText(`OCR error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOcrCorrectionSave = () => {
    if (!selectedLecture) return;
    const updated = { ...selectedLecture, boardNotes: correctedOcrText };
    onSaveLecture(updated);
    setSelectedLecture(updated);
    setOcrCorrecting(false);
    setStatusText("Board scan correction applied.");
  };

  // 3. Process notes summary, formulas, Q&As
  const handleAIGeneration = async () => {
    if (!selectedLecture) return;
    setIsProcessing(true);
    setStatusText("Polishing study guides, questions, and summaries...");

    try {
      const response = await fetch("/api/ai/process-lecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: selectedLecture.transcript,
          boardNotes: selectedLecture.boardNotes,
          subject: selectedLecture.subject
        })
      });

      if (!response.ok) throw new Error("AOS notes synthesis returned error.");
      const data = await response.json();

      const updated: Lecture = {
        ...selectedLecture,
        generatedNotes: data.generatedNotes,
        summary: data.summary,
        formulas: [
          ...(selectedLecture.formulas || []),
          ...(data.formulas || []).map((f: any) => ({
            id: Math.random().toString(),
            expression: f.expression,
            description: f.description,
            context: selectedLecture.title
          }))
        ],
        qa: [
          ...(selectedLecture.qa || []),
          ...(data.qa || []).map((q: any) => ({
            id: Math.random().toString(),
            question: q.question,
            answer: q.answer
          }))
        ],
        subject: data.subject || selectedLecture.subject
      };

      onSaveLecture(updated);
      setSelectedLecture(updated);
      setStatusText("Comprehensive study materials generated!");
    } catch (err: any) {
      setStatusText(`AI processing error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Create primary placeholder
  const handleCreateLecture = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const lecture: Lecture = {
      id: Math.random().toString(),
      title: formTitle.trim(),
      subject: formSubject,
      teacher: formTeacher.trim(),
      date: new Date().toISOString(),
      startTime: "",
      endTime: "",
      folderId: formFolderId,
      tags: [],
      audioIds: [],
      videoIds: [],
      imageIds: [],
      pdfIds: [],
      transcript: formTranscript.trim(),
      transcriptSegments: [],
      generatedNotes: "Awaiting AI processor generation toggle...",
      summary: "",
      formulas: [],
      qa: [],
      starred: false,
      createdAt: new Date().toISOString()
    };

    onSaveLecture(lecture);
    setSelectedLecture(lecture);
    setIsCreating(false);
    setFormTitle("");
    setFormTeacher("");
    setFormTranscript("");
    setFormBoard("");
  };

  const deleteMedia = async (id: string, type: 'audio' | 'video' | 'image') => {
    await AcademicDB.deleteMediaRecord(id);
    setMediaItems(prev => prev.filter((m) => m.id !== id));
    
    const key = type === 'image' ? 'imageIds' : type === 'video' ? 'videoIds' : 'audioIds';
    const updated = {
      ...selectedLecture!,
      [key]: (selectedLecture![key] || []).filter((refId) => refId !== id)
    };
    onSaveLecture(updated);
    setSelectedLecture(updated);
  };

  const filtered = lectures.filter((l) => {
    const q = search.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q);
  });

  const fmtSecs = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="flex h-full bg-[#FAF9F5] text-gray-900 font-sans">
      
      {/* List Panel */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full select-none shrink-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-400 tracking-wider uppercase">Lectures List</span>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-1 text-[#E5A93B] hover:text-[#C58C25] hover:scale-110 active:scale-95 transition"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="p-3 border-b border-gray-100">
          <input 
            type="text" 
            placeholder="Filter lectures..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-hidden focus:border-[#E5A93B]"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filtered.map((l) => {
            const isSelected = selectedLecture?.id === l.id;
            return (
              <div
                key={l.id}
                onClick={() => { setSelectedLecture(l); setIsCreating(false); }}
                className={`p-4 cursor-pointer text-left transition ${
                  isSelected 
                    ? "bg-[#E5A93B]/10 border-l-4 border-l-[#E5A93B]" 
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <h4 className="text-[13px] font-bold text-gray-950 truncate max-w-[180px]">{l.title || "Untitled Lecture"}</h4>
                  <span className="text-[9px] bg-gray-105 border border-gray-200 text-gray-650 px-2 py-0.5 rounded-full font-bold uppercase">{l.subject}</span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-1">{l.teacher || "No teacher listed"}</p>
                <div className="flex items-center space-x-1.5 mt-2.5">
                  <span className="text-[10px] bg-blue-50 text-blue-600 rounded-md px-1.5 py-0.5 font-bold">🎓 Class</span>
                  {(l.audioIds || []).length > 0 && (
                    <span className="text-[10px] bg-purple-50 text-purple-600 rounded-md px-1.5 py-0.5 font-bold">🎙️ Voice</span>
                  )}
                  {(l.imageIds || []).length > 0 && (
                    <span className="text-[10px] bg-green-50 text-green-600 rounded-md px-1.5 py-0.5 font-bold">📷 Board</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Panel Content Workspace */}
      <div className="flex-1 overflow-y-auto flex flex-col h-full bg-slate-50">
        
        {/* Creating State Form */}
        {isCreating ? (
          <div className="p-8 max-w-2xl mx-auto w-full bg-white border border-gray-200 rounded-3xl shadow-sm space-y-6 my-8">
            <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Initiate Personal Lecture Note</h3>
            <form onSubmit={handleCreateLecture} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Lecture Title *</label>
                <input 
                  type="text" 
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Entropy Derivation, Fourier Series expansion... etc"
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Subject Directory</label>
                  <select 
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                  >
                    {["Physics", "Chemistry", "Maths", "Biology", "Other"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Teacher / Presenter</label>
                  <input 
                    type="text" 
                    value={formTeacher}
                    onChange={(e) => setFormTeacher(e.target.value)}
                    placeholder="Prof. Curie, Feynman..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Assign Cognitive Folder</label>
                <select 
                  onChange={(e) => setFormFolderId(e.target.value || null)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:border-[#E5A93B]"
                >
                  <option value="">No folder classification</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Pre-Existing Transcript (Optional)</label>
                <textarea 
                  value={formTranscript}
                  onChange={(e) => setFormTranscript(e.target.value)}
                  placeholder="Paste lecture transcript here if available..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs h-32 focus:border-[#E5A93B]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="bg-gray-100 text-gray-650 hover:bg-gray-200 px-5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-[#E5A93B] text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#C58C25] active:scale-95 shadow-md shadow-amber-500/10 transition"
                >
                  Begin Lecture
                </button>
              </div>
            </form>
          </div>
        ) : selectedLecture ? (
          
          <div className="flex flex-col h-full bg-white">
            
            {/* Top Workspace controls status */}
            <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between shrink-0 bg-white shadow-xs">
              <div>
                <h2 className="text-base font-bold text-gray-950">{selectedLecture.title}</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">{selectedLecture.subject} lecture by {selectedLecture.teacher || "Unnamed presenter"}</p>
              </div>

              <div className="flex items-center space-x-2.5">
                <button 
                  onClick={handleAIGeneration}
                  disabled={isProcessing || !selectedLecture.transcript}
                  className="bg-[#E5A93B] text-white px-4 py-2 border-0 rounded-xl text-xs font-semibold hover:bg-[#C58C25] disabled:opacity-40 transition-all flex items-center shadow-md shadow-amber-500/10 active:scale-95"
                >
                  <Sparkles size={14} className="mr-1.5 animate-pulse" />
                  Format Notes ✦
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Delete this lecture permanently?")) {
                      onDeleteLecture(selectedLecture.id);
                      setSelectedLecture(null);
                    }
                  }}
                  className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Status updates toast strip */}
            {(statusText || isProcessing) && (
              <div className="bg-amber-50 rounded-lg border border-amber-200 py-2.5 px-4 mx-6 mt-4 flex items-center justify-between text-xs text-[#C58C25] animate-pulse">
                <div className="flex items-center space-x-2">
                  <AlertCircle size={14} />
                  <span className="font-semibold">{statusText || "Processing dynamic intelligence block..."}</span>
                </div>
                {isProcessing && (
                  <div className="w-4 h-4 border-2 border-[#E5A93B]/30 border-t-[#E5A93B] rounded-full animate-spin" />
                )}
              </div>
            )}

            {/* Segments toggle selector */}
            <div className="px-6 border-b border-gray-100 flex space-x-1 mt-4 scrollbar-hidden">
              {[
                { id: 'notes', label: 'AI Notes' },
                { id: 'formulas', label: `LaTeX Mathematical Sheets (${(selectedLecture.formulas || []).length})` },
                { id: 'qa', label: `Q&A cards (${(selectedLecture.qa || []).length})` },
                { id: 'board', label: 'Board Scanning OCR' },
                { id: 'transcript', label: 'Spoken Transcript' },
                { id: 'media', label: `Voice Tracks (${mediaItems.length})` }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 py-3 px-3.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id 
                      ? "border-b-[#E5A93B] text-[#E5A93B]" 
                      : "border-b-transparent text-gray-450 hover:text-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Sub-tab Workspace renders */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              
              {/* AI Notes Tab */}
              {activeTab === 'notes' && (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-6">
                  <div className="prose text-gray-800 text-[14px] leading-relaxed space-y-4">
                    {selectedLecture.generatedNotes ? (
                      selectedLecture.generatedNotes.split("\n\n").map((p, i) => (
                        <p key={i}>
                          {p.includes("★ EXAM HINT:") ? (
                            <span className="bg-amber-100/70 text-[#C58C25] border-l-4 border-l-[#E5A93B] px-3.5 py-2 rounded-r-lg block font-semibold text-xs my-2.5">
                              {p.replace(/★ EXAM HINT: ?/g, "").replace(/★/g, "")}
                            </span>
                          ) : p.includes("[unclear — verify]") ? (
                            <span className="text-amber-500 font-medium">
                              ⚠️ {p}
                            </span>
                          ) : (
                            p
                          )}
                        </p>
                      ))
                    ) : (
                      <p className="text-gray-400 italic">No notes created yet. Paste a transcript or record audio, and click Finish & Format.</p>
                    )}
                  </div>
                </div>
              )}

              {/* LaTeX mathematical cards */}
              {activeTab === 'formulas' && (
                <div className="space-y-4">
                  {(selectedLecture.formulas || []).length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs italic">
                      No mathematical equations scanned or extracted. Scan board photo or format transcript.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedLecture.formulas || []).map((f) => (
                      <div key={f.id} className="bg-[#151619] border border-black rounded-lg p-5 flex flex-col justify-between font-mono text-sm text-emerald-400 shadow-inner">
                        <div className="text-[#8E9299] text-[10px] uppercase mb-4 border-b border-[#2C2D31] pb-2">
                          Extracted LaTeX Equation Block
                        </div>
                        <div className="text-center py-4 overflow-x-auto text-base text-emerald-300 font-semibold select-all leading-relaxed whitespace-nowrap bg-black/40 rounded-md border border-stone-900/50 my-1 font-mono">
                          {f.expression}
                        </div>
                        <div className="pt-3 border-t border-[#2C2D31] mt-2">
                          <p className="text-xs font-bold text-gray-200 leading-relaxed truncate">{f.description}</p>
                          <p className="text-[10px] text-[#8E9299] leading-relaxed truncate italic mt-0.5">// Topic: {f.context || "Class reference"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Q&A Practice cards */}
              {activeTab === 'qa' && (
                <div className="space-y-3">
                  {(selectedLecture.qa || []).length === 0 && (
                    <div className="text-center py-12 text-gray-400 text-xs italic">
                      No challenging Q&A blocks formulated. Run AI notes construction to extract practice trials.
                    </div>
                  )}

                  {(selectedLecture.qa || []).map((q) => (
                    <div key={q.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-slate-50 px-4 py-3 border-b border-gray-150 flex items-center space-x-2.5">
                        <span className="text-[#E5A93B] font-bold text-xs">[QI]</span>
                        <span className="text-xs font-bold text-gray-800">{q.question}</span>
                      </div>
                      <div className="p-4 text-xs text-gray-700 leading-relaxed">
                        {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Board snapshot OCR OCR Scanner tab */}
              {activeTab === 'board' && (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1 space-y-2">
                      <h3 className="font-bold text-sm text-gray-905">Snap Whiteboard Photocopy</h3>
                      <p className="text-xs text-gray-450 leading-relaxed">
                        Have board formulas or lecture slides? Upload here. Gemini OCR is extremely accurate at parsing complex mathematical equations directly to LaTeX study blocks.
                      </p>
                      
                      <div className="flex space-x-2 pt-2">
                        {boardSnapStream ? (
                          <div className="flex flex-col space-y-3 w-full max-w-sm">
                            <video ref={boardSnapVideoRef} autoPlay playsInline className="w-full bg-black rounded-xl border border-gray-200 shadow-inner h-48 object-cover" />
                            <canvas ref={boardSnapCanvasRef} className="hidden" />
                            <div className="flex space-x-2">
                              <button
                                onClick={takeBoardSnap}
                                className="bg-[#E5A93B] text-white font-bold px-4 py-2 text-xs rounded-xl hover:bg-[#C58C25] flex-1 transition active:scale-95"
                              >
                                Take & Analyze Snap 📸
                              </button>
                              <button
                                onClick={stopBoardSnapCamera}
                                className="bg-red-50 text-red-600 font-bold px-4 py-2 text-xs rounded-xl hover:bg-red-100 flex-1 transition shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={startBoardSnapCamera}
                              className="bg-[#E5A93B] text-white font-semibold px-4 py-2 text-xs rounded-xl hover:bg-[#C58C25] flex items-center transition shadow-md shadow-amber-500/10 active:scale-95"
                            >
                              <Camera size={14} className="mr-1.5" />
                              Live Board Snap
                            </button>
                            <button
                              onClick={() => boardInputRef.current?.click()}
                              className="bg-white border border-gray-200 text-gray-750 font-semibold px-4 py-2 text-xs rounded-xl hover:bg-gray-50 flex items-center"
                            >
                              <FolderOpen size={14} className="mr-1.5 text-gray-500" />
                              Upload Image
                            </button>
                          </>
                        )}
                        <input 
                          type="file" 
                          ref={boardInputRef} 
                          accept="image/*" 
                          capture="environment" 
                          onChange={handleBoardUpload} 
                          className="hidden" 
                        />
                      </div>
                    </div>

                    <div className="w-16 h-16 rounded-full bg-yellow-50 text-[#E5A93B] flex items-center justify-center text-xl shrink-0 border border-yellow-100">
                      💡
                    </div>
                  </div>

                  {/* Render board snap images */}
                  {mediaItems.filter((m) => m.type === 'image').length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {mediaItems.filter((m) => m.type === 'image').map((record) => (
                        <div key={record.id} className="bg-white border border-gray-200 rounded-2xl p-3 shadow-xs space-y-2.5 relative group">
                          <img 
                            src={record.blob ? URL.createObjectURL(record.blob) : ""} 
                            alt={record.name}
                            className="w-full h-32 object-cover rounded-xl border border-gray-150"
                          />
                          <p className="text-[10px] text-gray-500 font-medium truncate">{record.name}</p>
                          <button 
                            onClick={() => deleteMedia(record.id, 'image')}
                            className="bg-red-500/80 hover:bg-red-555 text-white p-1 rounded-full absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Render board parsed result block with Correction Workflow */}
                  {selectedLecture.boardNotes && (
                    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <span className="text-xs font-bold text-gray-450 tracking-wider uppercase">Scanned Board Transcription</span>
                        <button
                          onClick={() => {
                            setOcrCorrecting(!ocrCorrecting);
                            setCorrectedOcrText(selectedLecture.boardNotes || "");
                          }}
                          className="text-[#E5A93B] hover:text-[#C58C25] font-semibold text-xs flex items-center"
                        >
                          <Edit2 size={13} className="mr-1" />
                          {ocrCorrecting ? "Discard Changes" : "Manual Correction Edit"}
                        </button>
                      </div>

                      {ocrCorrecting ? (
                        <div className="space-y-3">
                          <p className="text-[11px] text-amber-500">Correct any mathematical syntax errors or glitches below manually:</p>
                          <textarea 
                            value={correctedOcrText}
                            onChange={(e) => setCorrectedOcrText(e.target.value)}
                            className="w-full text-xs bg-slate-50 border border-gray-200 rounded-xl p-4 font-mono h-40 focus:border-[#E5A93B]"
                          />
                          <button 
                            onClick={handleOcrCorrectionSave}
                            className="bg-[#E5A93B] hover:bg-[#C58C25] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase transition"
                          >
                            Save Corrected Details
                          </button>
                        </div>
                      ) : (
                        <div className="bg-slate-50 font-mono text-xs text-gray-800 rounded-2xl p-4 border border-gray-150 max-h-60 overflow-y-auto leading-relaxed whitespace-pre-wrap shadow-inner">
                          {selectedLecture.boardNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Spoken Transcript Tab with annotative timeline highlights */}
              {activeTab === 'transcript' && (
                <div className="bg-white border border-gray-200 rounded-3xl p-8 shadow-xs space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <span className="text-xs font-bold text-gray-450 tracking-wider uppercase">Audio Transcripts Logs</span>
                    <button 
                      onClick={() => {
                        const nextPrompt = prompt("Construct manual transcript notes here directly:", selectedLecture.transcript);
                        if (nextPrompt !== null) {
                          onSaveLecture({ ...selectedLecture, transcript: nextPrompt });
                          setSelectedLecture({ ...selectedLecture, transcript: nextPrompt });
                        }
                      }}
                      className="text-xs text-[#E5A93B] font-bold"
                    >
                      Overwrite text
                    </button>
                  </div>

                  {/* Timeline segment map */}
                  {selectedLecture.transcriptSegments && selectedLecture.transcriptSegments.length > 0 ? (
                    <div className="space-y-5">
                      {selectedLecture.transcriptSegments.map((seg, i) => (
                        <div key={i} className="flex gap-4 items-start hover:bg-slate-50 p-2.5 rounded-xl transition">
                          <span className="font-bold text-xs text-[#E5A93B] shrink-0 bg-amber-50/70 border border-amber-100 rounded-md px-1.5 py-0.5 mt-0.5">
                            {fmtSecs(seg.startTime)} - {fmtSecs(seg.endTime)}
                          </span>
                          <div>
                            {seg.speaker && (
                              <p className="text-[11px] font-bold text-gray-850 mb-0.5 uppercase tracking-wider">{seg.speaker}</p>
                            )}
                            <p className="text-xs text-gray-700 leading-relaxed font-semibold">{seg.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{selectedLecture.transcript || "No transcript indexed."}</p>
                  )}
                </div>
              )}

              {/* Voice recordings listing workspace */}
              {activeTab === 'media' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Media acquisition controllers */}
                  <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-xs space-y-4">
                    <span className="text-xs font-bold text-gray-450 tracking-wider uppercase">Acquire Lecture Sound Tracks</span>
                    
                    <div className="flex flex-wrap gap-2 pt-1">
                      {!recording ? (
                        <>
                          <button 
                            onClick={() => startRecord('audio')}
                            className="bg-[#E5A93B] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-[#C58C25] flex items-center shadow-xs"
                          >
                            <Volume2 size={14} className="mr-1.5" />
                            Record Audio Live
                          </button>
                          
                          <button 
                            onClick={() => startRecord('video')}
                            className="bg-stone-850 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-stone-900 flex items-center"
                          >
                            <Video size={14} className="mr-1.5" />
                            Record Video Stream
                          </button>

                          <button 
                            onClick={() => audioInputRef.current?.click()}
                            className="bg-white border border-gray-200 text-gray-750 px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-gray-50 flex items-center shrink-0"
                          >
                            📂 File Upload
                          </button>
                          
                          <input 
                            type="file" 
                            ref={audioInputRef} 
                            accept="audio/*" 
                            className="hidden" 
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              const record: MediaRecord = {
                                id: Math.random().toString(),
                                parentId: selectedLecture.id,
                                parentType: 'lecture',
                                type: 'audio',
                                mimeType: f.type,
                                blob: new Blob([await f.arrayBuffer()], { type: f.type }),
                                name: f.name,
                                size: f.size,
                                createdAt: new Date().toISOString()
                              };
                              await AcademicDB.saveMediaRecord(record);
                              setMediaItems(p => [...p, record]);
                              setStatusText(`Sound track ${f.name} uploaded.`);
                            }}
                          />
                        </>
                      ) : (
                        <div className="flex items-center space-x-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                          <span className="text-xs font-bold text-red-600 uppercase tracking-widest">{recording} Recording... ({recDuration}s)</span>
                          <button 
                            onClick={stopRecord}
                            className="bg-red-500 text-white font-bold text-[10px] uppercase px-3 py-1 rounded-lg"
                          >
                            Stop Stream
                          </button>
                        </div>
                      )}
                    </div>

                    {cameraStream && recording === 'video' && (
                      <video ref={videoPreviewRef} autoPlay muted playsInline className="w-full max-w-sm h-48 bg-black rounded-2xl border border-gray-200 mt-3" />
                    )}

                    {recording && liveTranscript && (
                      <div className="bg-gray-50 border border-gray-150 rounded-xl p-4 mt-3 max-h-40 overflow-y-auto w-full shadow-inner animate-fade-in">
                        <span className="text-[10px] font-bold text-gray-450 uppercase mb-1.5 block">Live Transcription...</span>
                        <p className="text-xs text-gray-800 leading-relaxed font-medium italic">{liveTranscript}</p>
                      </div>
                    )}
                  </div>

                  {/* Listings */}
                  <div className="space-y-3">
                    {mediaItems.filter(m => m.type !== 'image').map((record) => (
                      <div key={record.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-gray-800">{record.name}</h4>
                          <p className="text-[10px] text-gray-400 font-semibold uppercase">{record.mimeType} · {(record.size/1048576).toFixed(2)} MB</p>
                        </div>

                        <div className="flex items-center space-x-3.5">
                          {record.type === 'audio' ? (
                            <audio src={record.blob ? URL.createObjectURL(record.blob) : ""} controls className="h-9 w-60 rounded-lg" />
                          ) : (
                            <video src={record.blob ? URL.createObjectURL(record.blob) : ""} controls className="w-40 h-20 bg-black rounded-lg" />
                          )}

                          <button 
                            onClick={() => triggerAudioTranscription(record)}
                            disabled={isProcessing}
                            className="bg-orange-50 border border-orange-100 text-[#E5A93B] hover:bg-orange-100/50 p-2 rounded-xl text-xs font-bold transition flex items-center active:scale-95 px-3 py-1.5"
                          >
                            <Sparkles size={11} className="mr-1" />
                            Transcribe Audio
                          </button>

                          <button 
                            onClick={() => deleteMedia(record.id, record.type as any)}
                            className="text-gray-350 hover:text-red-500 p-1.5 rounded-lg"
                          >
                            <Trash2 size={15} />
                          </button>
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
            <div className="w-20 h-20 rounded-full bg-blue-50 text-[#E5A93B] border border-blue-100 flex items-center justify-center text-2xl shadow-inner animate-pulse">
              🎓
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-sm">Personal Lecture System</h3>
              <p className="text-xs text-gray-450 max-w-sm mx-auto leading-relaxed">
                Record sound tracks or upload board snapshots. Our AI system will extract clean notes, summaries, challenging questions, and LaTeX formula references.
              </p>
            </div>
            <button 
              onClick={() => setIsCreating(true)}
              className="bg-[#E5A93B] text-white hover:bg-[#C58C25] font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl shadow-md shadow-amber-500/10 active:scale-95 transition"
            >
              Initiate Lecture Notes
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
