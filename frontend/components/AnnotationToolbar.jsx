"use client";

import { motion } from "framer-motion";
import {
  MousePointer,
  Pen,
  Highlighter,
  Square,
  Circle,
  ArrowUpRight,
  Minus,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Save,
  Check,
  Loader2,
} from "lucide-react";

const tools = [
  { id: "select", icon: MousePointer, label: "Select (V)" },
  { id: "pen", icon: Pen, label: "Pen (P)" },
  { id: "highlight", icon: Highlighter, label: "Highlighter (H)" },
  { id: "rect", icon: Square, label: "Rectangle (R)" },
  { id: "circle", icon: Circle, label: "Circle (C)" },
  { id: "arrow", icon: ArrowUpRight, label: "Arrow (A)" },
  { id: "line", icon: Minus, label: "Line (L)" },
  { id: "text", icon: Type, label: "Text (T)" },
  { id: "eraser", icon: Eraser, label: "Eraser (E)" },
];

const colors = [
  "#7C3AED", // Purple / Primary
  "#EF4444", // Red
  "#F59E0B", // Amber / Yellow
  "#10B981", // Emerald / Green
  "#3B82F6", // Blue
  "#000000", // Black
  "#FFFFFF", // White
];

const strokeWidths = [2, 4, 6, 8, 14];

export default function AnnotationToolbar({
  activeTool,
  setActiveTool,
  color = "#7C3AED",
  setColor,
  strokeWidth = 2,
  setStrokeWidth,
  onUndo,
  onRedo,
  canUndo = true,
  canRedo = false,
  onDelete,
  hasSelection = false,
  zoom = 1,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onDownload,
  onSave,
  saving = false,
  saved = false,
}) {
  return (
    <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-2.5 flex items-center justify-between gap-3 flex-wrap shadow-glass select-none">
      {/* 1. Primary Tool Selection */}
      <div className="flex items-center gap-1 pr-3 border-r border-gray-200/70 flex-wrap">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          return (
            <motion.button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className={`p-2 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? "bg-primary-600 text-white shadow-glow"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              title={tool.label}
            >
              <Icon size={17} />
            </motion.button>
          );
        })}
      </div>

      {/* 2. Stroke Width Selector */}
      {setStrokeWidth && (
        <div className="flex items-center gap-1 px-3 border-r border-gray-200/70">
          <span className="text-[11px] font-semibold text-gray-500 mr-1 uppercase tracking-wider">
            Width
          </span>
          {strokeWidths.map((sw) => (
            <button
              key={sw}
              onClick={() => setStrokeWidth(sw)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                strokeWidth === sw
                  ? "bg-primary-100 border border-primary-400 text-primary-800 font-bold"
                  : "hover:bg-gray-100 text-gray-600 border border-transparent"
              }`}
              title={`${sw}px`}
            >
              <span
                className="rounded-full bg-current block"
                style={{
                  width: Math.min(sw * 2, 14),
                  height: Math.min(sw * 2, 14),
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* 3. Color Picker */}
      <div className="flex items-center gap-1.5 px-3 border-r border-gray-200/70">
        {colors.map((c) => (
          <motion.button
            key={c}
            onClick={() => setColor(c)}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.9 }}
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
              color.toLowerCase() === c.toLowerCase()
                ? "border-gray-900 scale-110 shadow-md ring-2 ring-primary-300"
                : "border-gray-300"
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
        {/* Custom Color Input */}
        <label
          className="relative w-6 h-6 rounded-full border border-gray-300 overflow-hidden cursor-pointer hover:scale-110 transition-transform flex items-center justify-center bg-gradient-to-tr from-rose-400 via-purple-400 to-cyan-400"
          title="Custom Color"
        >
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
          />
        </label>
      </div>

      {/* 4. History Actions (Undo, Redo, Delete) */}
      <div className="flex items-center gap-1 px-3 border-r border-gray-200/70">
        <motion.button
          onClick={onUndo}
          disabled={!canUndo}
          whileHover={{ scale: canUndo ? 1.1 : 1 }}
          whileTap={{ scale: canUndo ? 0.9 : 1 }}
          className={`p-2 rounded-xl transition-colors ${
            canUndo
              ? "text-gray-700 hover:bg-gray-100/90"
              : "text-gray-300 cursor-not-allowed"
          }`}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={17} />
        </motion.button>

        <motion.button
          onClick={onRedo}
          disabled={!canRedo}
          whileHover={{ scale: canRedo ? 1.1 : 1 }}
          whileTap={{ scale: canRedo ? 0.9 : 1 }}
          className={`p-2 rounded-xl transition-colors ${
            canRedo
              ? "text-gray-700 hover:bg-gray-100/90"
              : "text-gray-300 cursor-not-allowed"
          }`}
          title="Redo (Ctrl+Shift+Z / Ctrl+Y)"
        >
          <Redo2 size={17} />
        </motion.button>

        <motion.button
          onClick={onDelete}
          disabled={!hasSelection}
          whileHover={{ scale: hasSelection ? 1.1 : 1 }}
          whileTap={{ scale: hasSelection ? 0.9 : 1 }}
          className={`p-2 rounded-xl transition-colors ${
            hasSelection
              ? "text-red-600 hover:bg-red-50"
              : "text-gray-300 cursor-not-allowed"
          }`}
          title="Delete selected annotation (Delete/Backspace)"
        >
          <Trash2 size={17} />
        </motion.button>
      </div>

      {/* 5. Zoom & Pan Controls */}
      {onZoomIn && (
        <div className="flex items-center gap-1 px-2 border-r border-gray-200/70">
          <button
            onClick={onZoomOut}
            disabled={zoom <= 0.25}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-gray-700 hover:bg-gray-100 transition-colors"
            title="Reset Zoom (100%)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            disabled={zoom >= 4.0}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={onResetZoom}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Reset View"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      )}

      {/* 6. Export & Save Buttons */}
      <div className="flex items-center gap-2 pl-1">
        {onDownload && (
          <button
            onClick={onDownload}
            className="p-2 rounded-xl text-gray-700 hover:text-primary-700 hover:bg-primary-50 border border-gray-200 hover:border-primary-200 transition-all shadow-sm flex items-center gap-1.5 text-xs font-semibold"
            title="Download annotated PNG at full resolution"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        )}

        {onSave && (
          <button
            onClick={onSave}
            disabled={saving}
            className="px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-glow transition-all flex items-center gap-1.5 text-xs font-semibold disabled:opacity-60"
            title="Save annotations to server"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check size={14} className="text-emerald-300" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
