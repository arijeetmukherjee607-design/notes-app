import React, { useState, useRef, useEffect } from "react";
import { 
  Heading1, Heading2, List, CheckSquare, Table, Palette, Sparkles, 
  Trash2, Plus, RefreshCw, Star, Save, ArrowLeft, Image as ImageIcon,
  Eraser, Undo, ChevronDown
} from "lucide-react";
import { AcademicNote, Tag } from "../types";

interface AppleNotesEditorProps {
  note: AcademicNote;
  availableTags: Tag[];
  onSave: (updated: AcademicNote) => void;
  onClose: () => void;
  onAddTag: (name: string) => void;
}

export default function AppleNotesEditor({
  note,
  availableTags,
  onSave,
  onClose,
  onAddTag
}: AppleNotesEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [starred, setStarred] = useState(note.starred || false);
  const [tags, setTags] = useState<string[]>(note.tags || []);
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>(note.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  
  // Custom interactive Table State in Note
  const [tableRows, setTableRows] = useState<string[][]>([]);
  
  // Interactive LaTeX Equation Block State
  const [formulas, setFormulas] = useState<{ id: string; formula: string; description: string }[]>([]);
  const [newFormula, setNewFormula] = useState("");
  const [newFormulaDesc, setNewFormulaDesc] = useState("");

  // Stylus Sketching States
  const [isDrawing, setIsDrawing] = useState(false);
  const [pencilColor, setPencilColor] = useState("#FFCC00"); // Yellow Accent
  const [pencilWidth, setPencilWidth] = useState(4);
  const [canvasMode, setCanvasMode] = useState<"draw" | "erase">("draw");
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [sketchExpanded, setSketchExpanded] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Initialize sketch / load sketch on load or sketch expansion
  useEffect(() => {
    if (note.drawingData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = note.drawingData;
      }
    }
  }, [note.drawingData, sketchExpanded]);

  // Handle Note Save triggers
  const handleSave = () => {
    let finalDrawingData = note.drawingData;
    if (canvasRef.current) {
      // Save canvas state
      finalDrawingData = canvasRef.current.toDataURL("image/png");
    }
    onSave({
      ...note,
      title: title || "Untitled Note",
      content,
      starred,
      tags,
      checklist,
      drawingData: finalDrawingData,
      updatedAt: new Date().toISOString()
    });
  };

  // Canvas Drawing setup
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Retina support scaling sizing
    canvas.width = canvas.parentElement?.clientWidth ? canvas.parentElement.clientWidth * 2 : 800;
    canvas.height = 360;
    canvas.style.width = "100%";
    canvas.style.height = "180px";

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(2, 2);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = pencilColor;
      ctx.lineWidth = pencilWidth;
      contextRef.current = ctx;

      // Draw original sketch back
      if (note.drawingData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
        };
        img.src = note.drawingData;
      } else {
        // Transparent wash background or Grid line markers
        ctx.fillStyle = "rgba(255,255,255,0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  useEffect(() => {
    if (sketchExpanded) {
      initCanvas();
    }
  }, [sketchExpanded]);

  const startDrawing = ({ nativeEvent }: React.PointerEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    
    // Save state for undo stacking
    const currentFrame = canvas.toDataURL();
    setUndoStack((prev) => [...prev, currentFrame].slice(-10)); // max 10 undos

    const rect = canvas.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left;
    const y = nativeEvent.clientY - rect.top;

    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    nativeEvent.preventDefault();
  };

  const draw = ({ nativeEvent }: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = nativeEvent.clientX - rect.left;
    const y = nativeEvent.clientY - rect.top;

    const ctx = contextRef.current;
    ctx.strokeStyle = canvasMode === "erase" ? "#FFFFFF" : pencilColor;
    ctx.lineWidth = canvasMode === "erase" ? pencilWidth * 3 : pencilWidth;
    ctx.lineTo(x, y);
    ctx.stroke();
    nativeEvent.preventDefault();
  };

  const stopDrawing = () => {
    if (!contextRef.current) return;
    contextRef.current.closePath();
    setIsDrawing(false);
  };

  const triggerUndo = () => {
    if (undoStack.length === 0 || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const prevFrame = undoStack[undoStack.length - 1];
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = prevFrame;
      setUndoStack((prev) => prev.slice(0, -1));
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    contextRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Checklist actions
  const addChecklistItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { id: Math.random().toString(), text: newCheckItem.trim(), done: false }]);
    setNewCheckItem("");
  };

  const toggleCheckItem = (id: string) => {
    setChecklist(checklist.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  };

  const removeCheckItem = (id: string) => {
    setChecklist(checklist.filter((item) => item.id !== id));
  };

  // Table functions
  const insertSampleTable = () => {
    setTableRows([
      ["Parameter", "Experiment Value", "Theoretical Limit"],
      ["Thermal Entropy (S)", "1.42 J/K", "1.50 J/K"],
      ["Efficiency (η)", "34.1%", "37.2%"]
    ]);
  };

  const addTableRow = () => {
    if (tableRows.length === 0) {
      insertSampleTable();
      return;
    }
    const colCount = tableRows[0].length;
    setTableRows([...tableRows, Array(colCount).fill("")]);
  };

  const addTableColumn = () => {
    if (tableRows.length === 0) {
      insertSampleTable();
      return;
    }
    setTableRows(tableRows.map(row => [...row, ""]));
  };

  const updateTableCell = (rowIndex: number, colIndex: number, val: string) => {
    const updated = [...tableRows];
    updated[rowIndex][colIndex] = val;
    setTableRows(updated);
  };

  // Tag helper
  const toggleNoteTag = (tagName: string) => {
    if (tags.includes(tagName)) {
      setTags(tags.filter((t) => t !== tagName));
    } else {
      setTags([...tags, tagName]);
    }
  };

  // Add formula helper
  const addFormulaBlock = () => {
    if (!newFormula.trim()) return;
    setFormulas([...formulas, {
      id: Math.random().toString(),
      formula: newFormula.trim(),
      description: newFormulaDesc.trim() || "Formula definition"
    }]);
    setNewFormula("");
    setNewFormulaDesc("");
  };

  return (
    <div className="flex flex-col h-full bg-[#FAFAFA] text-gray-900 font-sans">
      {/* iOS style Top Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 shadow-xs">
        <button 
          onClick={onClose} 
          className="flex items-center text-[#E5A93B] hover:text-[#C58C25] font-medium transition"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Notes</span>
        </button>

        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setStarred(!starred)} 
            className={`p-1.5 rounded-full transition ${starred ? "text-[#E5A93B]" : "text-gray-400 hover:text-gray-600"}`}
          >
            <Star size={20} fill={starred ? "currentColor" : "none"} />
          </button>
          
          <button 
            onClick={handleSave} 
            className="bg-[#E5A93B] text-white px-4 py-1.5 rounded-full font-medium text-sm flex items-center hover:bg-[#C58C25] active:scale-95 transition-all shadow-xs"
          >
            <Save size={16} className="mr-1.5" />
            Save Note
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full space-y-6">
        {/* Title Block */}
        <input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New Academic Note" 
          className="w-full text-3xl font-bold font-sans text-gray-900 border-none outline-hidden placeholder-gray-300 focus:ring-0 bg-transparent"
        />

        {/* Universal Tagging Row */}
        <div className="flex flex-wrap items-center gap-1.5 border-t border-b border-gray-100 py-3">
          <div className="relative">
            <button 
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 rounded-full px-2.5 py-1 font-medium transition"
            >
              <span>+ Tag</span>
              <ChevronDown size={12} className="ml-1" />
            </button>

            {showTagMenu && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-20 p-2.5 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">Toggle Note Tags</p>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {availableTags.map((tag) => (
                    <label 
                      key={tag.id}
                      className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded-lg cursor-pointer text-xs"
                    >
                      <input 
                        type="checkbox" 
                        checked={tags.includes(tag.name)}
                        onChange={() => toggleNoteTag(tag.name)}
                        className="rounded border-gray-300 text-[#E5A93B] focus:ring-[#E5A93B]"
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-2 flex items-center gap-1">
                  <input 
                    type="text"
                    placeholder="New custom tag"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="text-xs border border-gray-200 rounded-md px-2 py-1 flex-1 focus:outline-hidden"
                  />
                  <button 
                    onClick={() => {
                      if (newTagName.trim()) {
                        onAddTag(newTagName.trim());
                        toggleNoteTag(newTagName.trim());
                        setNewTagName("");
                      }
                    }}
                    className="bg-[#E5A93B] text-white p-1 rounded-md text-xs hover:bg-[#C58C25]"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="bg-yellow-50 text-[#E5A93B] border border-yellow-200 text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Text Area Toolbar options */}
        <div className="bg-gray-100/80 border border-gray-200 rounded-xl p-2 flex items-center space-x-1 shadow-xs">
          <button 
            type="button"
            onClick={() => setContent(c => c + "\n# ")}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition"
            title="Add H1 Heading"
          >
            <Heading1 size={17} />
          </button>
          <button 
            type="button"
            onClick={() => setContent(c => c + "\n## ")}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition"
            title="Add H2 Heading"
          >
            <Heading2 size={17} />
          </button>
          <div className="w-[1px] h-5 bg-gray-200 mx-1" />
          <button 
            type="button"
            onClick={() => {
              if (checklist.length === 0) {
                setChecklist([{ id: "1", text: "Complete derivation details", done: false }]);
              } else {
                setChecklist([...checklist, { id: Math.random().toString(), text: "New tasks checklist", done: false }]);
              }
            }}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition"
            title="Insert Checklists"
          >
            <CheckSquare size={17} />
          </button>
          <button 
            type="button"
            onClick={addTableRow}
            className="p-1.5 text-gray-500 hover:text-gray-900 rounded-lg hover:bg-white transition"
            title="Insert Table Grid"
          >
            <Table size={17} />
          </button>
          <button 
            type="button"
            onClick={() => setSketchExpanded(!sketchExpanded)}
            className={`p-1.5 rounded-lg transition ${sketchExpanded ? "text-[#E5A93B] bg-white border border-gray-200" : "text-gray-500 hover:text-gray-900 hover:bg-white"}`}
            title="Stylus Drawing Sketchboard"
          >
            <Palette size={17} />
          </button>
        </div>

        {/* Core Markdown Body */}
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your research paper extracts, theorems, and study logs directly in Apple Notes style... support markdown headers (# / ##) and outlines."
          className="w-full min-h-[160px] text-[15px] leading-relaxed text-gray-800 border-none outline-hidden placeholder-gray-400 focus:ring-0 bg-transparent resize-y font-sans"
        />

        {/* Stylus Sketch canvas */}
        {sketchExpanded && (
          <div className="border border-gray-200 rounded-2xl bg-white shadow-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 tracking-wider uppercase flex items-center">
                <Palette size={14} className="mr-1 text-[#E5A93B]" /> Stylus Sketchbook / Handwritten Formula
              </span>

              <div className="flex items-center space-x-2">
                {/* Pencil sizes */}
                <select 
                  value={pencilWidth} 
                  onChange={(e) => setPencilWidth(parseInt(e.target.value))}
                  className="text-xs border border-gray-200 rounded-md p-1"
                >
                  <option value={2}>Fine Tip (2px)</option>
                  <option value={4}>Medium Tip (4px)</option>
                  <option value={8}>Marker (8px)</option>
                </select>

                {/* Draw vs Erase toggle */}
                <button
                  onClick={() => setCanvasMode(canvasMode === "draw" ? "erase" : "draw")}
                  className={`p-1 rounded-md border text-xs transition ${canvasMode === "erase" ? "bg-red-50 border-red-200 text-red-500" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                >
                  {canvasMode === "erase" ? <Eraser size={14} /> : "Draw"}
                </button>

                <button 
                  onClick={triggerUndo}
                  title="Undo last stroke"
                  className="p-1 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Undo size={14} />
                </button>

                <button 
                  onClick={clearCanvas}
                  className="bg-red-50 text-red-500 border border-red-200 rounded-md px-2 py-1 text-xs hover:bg-red-100"
                >
                  Clear Screen
                </button>
              </div>
            </div>

            {/* Colors wheel */}
            <div className="flex items-center space-x-1.5 p-1">
              {["#000000", "#FFCC00", "#FF3B30", "#34C759", "#007AFF", "#AF52DE"].map((color) => (
                <button 
                  key={color}
                  onClick={() => { setPencilColor(color); setCanvasMode("draw"); }}
                  className={`w-6 h-6 rounded-full border border-white shadow-xs transition transform ${pencilColor === color && canvasMode === "draw" ? "scale-120 ring-2 ring-gray-300" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            <canvas 
              ref={canvasRef}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerLeave={stopDrawing}
              className="bg-gray-50 rounded-xl border border-gray-100 cursor-crosshair touch-none h-[180px]"
            />
          </div>
        )}

        {/* Dynamic Interactive Checklist */}
        {checklist.length > 0 && (
          <div className="border-t border-gray-150 pt-5 space-y-3">
            <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase">Checklist Task lists</h4>
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center justify-between group">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => toggleCheckItem(item.id)}
                      className={`w-5 h-5 rounded-md border-2 border-[#E5A93B] flex items-center justify-center transition-all ${item.done ? "bg-[#E5A93B] text-white" : "hover:bg-yellow-50"}`}
                    >
                      {item.done && <span className="text-[10px] font-bold">✓</span>}
                    </button>
                    <span className={`text-[14px] ${item.done ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.text}
                    </span>
                  </div>
                  <button 
                    onClick={() => removeCheckItem(item.id)}
                    className="text-gray-300 hover:text-red-550 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1.5">
              <input 
                type="text" 
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                placeholder="Add checklist action"
                onKeyDown={(e) => e.key === "Enter" && addChecklistItem()}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 flex-1 focus:outline-hidden"
              />
              <button 
                onClick={addChecklistItem}
                className="bg-[#E5A93B] text-white p-1.5 rounded-lg text-xs hover:bg-[#C58C25]"
              >
                + ADD
              </button>
            </div>
          </div>
        )}

        {/* Interactive Data Table Component inside Notes */}
        {tableRows.length > 0 && (
          <div className="border-t border-gray-150 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase">Project Study Matrix</h4>
              <div className="flex space-x-2">
                <button onClick={addTableRow} className="text-[11px] font-medium bg-gray-100 hover:bg-gray-250 text-gray-700 px-2 py-1 rounded-md border transition">
                  + Add Row
                </button>
                <button onClick={addTableColumn} className="text-[11px] font-medium bg-gray-100 hover:bg-gray-250 text-gray-700 px-2 py-1 rounded-md border transition">
                  + Add Column
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full text-left text-xs text-gray-500">
                <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                  <tr>
                    {tableRows[0]?.map((_, colIdx) => (
                      <th key={colIdx} className="px-3 py-2 text-center">Col {colIdx + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="hover:bg-gray-50 border-b border-gray-100 last:border-0">
                      {row.map((cell, colIdx) => (
                        <td key={colIdx} className="p-1 px-2">
                          <input 
                            type="text" 
                            value={cell} 
                            onChange={(e) => updateTableCell(rowIdx, colIdx, e.target.value)}
                            className="bg-transparent border-none text-[13px] text-gray-800 text-center focus:ring-[#E5A93B] focus:bg-white rounded-md w-full py-1.5"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Embedded Equation cards */}
        <div className="border-t border-gray-150 pt-5 space-y-4">
          <h4 className="text-sm font-bold text-gray-400 tracking-wider uppercase flex items-center">
            <span className="font-mono text-[11px] mr-1">[f(x)]</span> Equations Card Blocks
          </h4>

          {formulas.map((item) => (
            <div key={item.id} className="bg-gray-50/50 p-4 border border-gray-150 rounded-2xl flex items-center justify-between">
              <div className="space-y-1">
                <p className="font-mono text-lg text-gray-800 bg-[#FAFAFA] border border-gray-100 rounded-lg py-1 px-3 shadow-xs">
                  {item.formula}
                </p>
                <p className="text-[12px] text-gray-550 italic ml-1">{item.description}</p>
              </div>
              <button 
                onClick={() => setFormulas(formulas.filter((f) => f.id !== item.id))}
                className="text-gray-350 hover:text-red-500 p-1 rounded-lg transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <p className="text-xs font-semibold text-gray-650">Add equation to document:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="LaTeX code, e.g. H_e = -\sum p_i \ln p_i"
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg p-2 focus:ring-[#E5A93B] focus:outline-hidden"
              />
              <input 
                type="text" 
                placeholder="Description, e.g. Shannon Entropy formula"
                value={newFormulaDesc}
                onChange={(e) => setNewFormulaDesc(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg p-2 focus:ring-[#E5A93B] focus:outline-hidden"
              />
            </div>
            <button 
              onClick={addFormulaBlock}
              className="bg-stone-850 hover:bg-stone-900 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
            >
              Embed Equation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
