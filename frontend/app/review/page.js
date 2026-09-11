"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppLayout,
  AnnotationToolbar,
  IssueCard,
  AuthGuard,
  LoadingSkeleton,
  Input,
  Textarea,
  SubmissionDetailView,
} from "@/components";
import { reviewsAPI, submissionsAPI } from "@/lib/api";
import { authService } from "@/lib/services/auth";
import {
  Image as ImageIcon,
  Check,
  Loader2,
  HelpCircle,
  X,
  Plus,
} from "lucide-react";

function getFullImageUrl(url) {
  if (!url) return "";
  return url;
}

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}

function getAnnotationBounds(ann) {
  if (!ann) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  const sw = ann.strokeWidth || 2;
  const pad = sw / 2 + 4;

  if (ann.tool_type === "pen" || ann.tool_type === "highlight") {
    if (!ann.points || ann.points.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of ann.points) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }

  if (ann.tool_type === "rect" || ann.tool_type === "circle") {
    const minX = Math.min(ann.x, ann.x + ann.width);
    const minY = Math.min(ann.y, ann.y + ann.height);
    const maxX = Math.max(ann.x, ann.x + ann.width);
    const maxY = Math.max(ann.y, ann.y + ann.height);
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }

  if (ann.tool_type === "arrow" || ann.tool_type === "line") {
    const minX = Math.min(ann.startX, ann.endX);
    const minY = Math.min(ann.startY, ann.endY);
    const maxX = Math.max(ann.startX, ann.endX);
    const maxY = Math.max(ann.startY, ann.endY);
    return {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
      width: maxX - minX + pad * 2,
      height: maxY - minY + pad * 2,
    };
  }

  if (ann.tool_type === "text") {
    const fontSize = ann.fontSize || 18;
    const estWidth = Math.max((ann.text || "").length * (fontSize * 0.6), 40);
    const estHeight = fontSize * 1.3;
    return {
      minX: ann.x - 4,
      minY: ann.y - 4,
      maxX: ann.x + estWidth + 4,
      maxY: ann.y + estHeight + 4,
      width: estWidth + 8,
      height: estHeight + 8,
    };
  }

  return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
}

function hitTestAnnotation(px, py, ann) {
  if (!ann) return false;
  const tol = Math.max((ann.strokeWidth || 2) / 2 + 6, 10);

  if (ann.tool_type === "pen" || ann.tool_type === "highlight") {
    if (!ann.points || ann.points.length === 0) return false;
    if (ann.points.length === 1) {
      return Math.hypot(px - ann.points[0].x, py - ann.points[0].y) <= tol;
    }
    for (let i = 0; i < ann.points.length - 1; i++) {
      const p1 = ann.points[i];
      const p2 = ann.points[i + 1];
      if (distToSegment(px, py, p1.x, p1.y, p2.x, p2.y) <= tol) {
        return true;
      }
    }
    return false;
  }

  if (ann.tool_type === "rect") {
    const minX = Math.min(ann.x, ann.x + ann.width);
    const minY = Math.min(ann.y, ann.y + ann.height);
    const maxX = Math.max(ann.x, ann.x + ann.width);
    const maxY = Math.max(ann.y, ann.y + ann.height);
    // Near border or inside
    const inside = px >= minX && px <= maxX && py >= minY && py <= maxY;
    const nearBorder =
      distToSegment(px, py, minX, minY, maxX, minY) <= tol ||
      distToSegment(px, py, maxX, minY, maxX, maxY) <= tol ||
      distToSegment(px, py, maxX, maxY, minX, maxY) <= tol ||
      distToSegment(px, py, minX, maxY, minX, minY) <= tol;
    return inside || nearBorder;
  }

  if (ann.tool_type === "circle") {
    const rx = Math.abs(ann.width / 2);
    const ry = Math.abs(ann.height / 2);
    if (rx === 0 || ry === 0) return false;
    const cx = Math.min(ann.x, ann.x + ann.width) + rx;
    const cy = Math.min(ann.y, ann.y + ann.height) + ry;
    const norm = Math.pow((px - cx) / rx, 2) + Math.pow((py - cy) / ry, 2);
    return norm <= 1.25;
  }

  if (ann.tool_type === "arrow" || ann.tool_type === "line") {
    return (
      distToSegment(px, py, ann.startX, ann.startY, ann.endX, ann.endY) <= tol
    );
  }

  if (ann.tool_type === "text") {
    const b = getAnnotationBounds(ann);
    return px >= b.minX && px <= b.maxX && py >= b.minY && py <= b.maxY;
  }

  return false;
}

export default function ReviewPage() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [user, setUser] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submission, setSubmission] = useState(null);
  const [activeImage, setActiveImage] = useState(null);
  const [loadedImg, setLoadedImg] = useState(null);

  // Tools & Styling
  const [activeTool, setActiveTool] = useState("pen");
  const [color, setColor] = useState("#7C3AED");
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Annotations & History
  const [annotations, setAnnotations] = useState([]);
  const [history, setHistory] = useState([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Interaction State
  const [isDrawing, setIsDrawing] = useState(false);
  const [liveAnnotation, setLiveAnnotation] = useState(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Move / Resize state for Selection Tool
  const [dragState, setDragState] = useState(null);

  // Text Tool Inline State
  const [textPrompt, setTextPrompt] = useState(null);

  // Backend Sync / Saving State
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Issues Board
  const [issues, setIssues] = useState([]);
  const [issueForm, setIssueForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    mark_deduction: 0,
  });
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [selectedAnnotationForIssue, setSelectedAnnotationForIssue] =
    useState(null);

  const [loading, setLoading] = useState(true);

  // -------------------------------------------------------------
  // 1. Initial Data Fetching
  // -------------------------------------------------------------
  useEffect(() => {
    const load = async () => {
      try {
        const { user: currentUser } = await authService.getMe().catch(() => ({ user: null }));
        if (currentUser) setUser(currentUser);

        const res = await submissionsAPI.getAll();
        const subs = res.data.submissions || [];
        setSubmissions(subs);

        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const subId = params.get("submission");
          const candId = params.get("candidate");

          if (subId) {
            const found = subs.find((s) => s.id === subId);
            if (found) selectSubmission(found);
          } else if (candId) {
            const found = subs.find(
              (s) => s.user_id === candId || s.user?.id === candId
            );
            if (found) selectSubmission(found);
          } else if (subs.length > 0) {
            selectSubmission(subs[0]);
          }
        }
      } catch (err) {
        console.error("Failed to load submissions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectSubmission = (sub) => {
    setSubmission(sub);
    setActiveImage(sub.review_files?.[0] || null);
    setSelectedIds(new Set());
    setShowIssueForm(false);
    setSelectedAnnotationForIssue(null);
  };

  // -------------------------------------------------------------
  // 2. Load Active Image
  // -------------------------------------------------------------
  useEffect(() => {
    if (!activeImage) {
      setLoadedImg(null);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
      return;
    }

    const img = new window.Image();
    const fullUrl = getFullImageUrl(activeImage.image_url);
    img.crossOrigin = "anonymous";
    img.src = fullUrl;

    img.onload = () => {
      setLoadedImg(img);
      // Center and fit image to container
      if (containerRef.current) {
        const cw = containerRef.current.clientWidth || 800;
        const ch = containerRef.current.clientHeight || 550;
        const scale = Math.min((cw - 40) / img.naturalWidth, (ch - 40) / img.naturalHeight, 1);
        setZoom(Math.max(0.25, Math.min(1.0, scale)));
        setPan({
          x: Math.max(20, (cw - img.naturalWidth * scale) / 2),
          y: Math.max(20, (ch - img.naturalHeight * scale) / 2),
        });
      }
      loadAnnotationsFromBackend(activeImage.id);
    };

    img.onerror = (e) => {
      console.error("Failed to load screenshot:", fullUrl, e);
      if (img.src !== activeImage.image_url) {
        img.crossOrigin = null;
        img.src = activeImage.image_url;
      }
    };
  }, [activeImage]);

  // Load annotations for image
  const loadAnnotationsFromBackend = async (imageId) => {
    try {
      const res = await reviewsAPI.getAnnotations(imageId);
      const serverAnns = (res.data.annotations || []).map((a) => {
        const coords = a.coordinates || {};
        return {
          id: a.id,
          annotationId: a.id,
          tool_type: a.tool_type,
          color: a.color || "#7C3AED",
          strokeWidth: coords.strokeWidth || 4,
          opacity: a.tool_type === "highlight" ? 0.35 : 1.0,
          points: coords.points || coords.path || [],
          x: coords.x ?? coords.left ?? 0,
          y: coords.y ?? coords.top ?? 0,
          width: coords.width ?? (coords.radiusX ? coords.radiusX * 2 : 100),
          height: coords.height ?? (coords.radiusY ? coords.radiusY * 2 : 100),
          startX: coords.startX ?? coords.x ?? 0,
          startY: coords.startY ?? coords.y ?? 0,
          endX: coords.endX ?? coords.x ?? 100,
          endY: coords.endY ?? coords.y ?? 100,
          text: a.text || coords.text || "Text",
          fontSize: coords.fontSize || 18,
          isBold: coords.isBold || false,
        };
      });
      setAnnotations(serverAnns);
      setHistory([serverAnns]);
      setHistoryIndex(0);
    } catch (err) {
      console.error("Failed to fetch annotations:", err);
    }
  };

  // -------------------------------------------------------------
  // 3. History (Undo / Redo) Management
  // -------------------------------------------------------------
  const commitToHistory = useCallback(
    (newAnnotations) => {
      setHistory((prev) => {
        const next = prev.slice(0, historyIndex + 1);
        return [...next, newAnnotations];
      });
      setHistoryIndex((prev) => prev + 1);
      setAnnotations(newAnnotations);
    },
    [historyIndex]
  );

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setAnnotations(history[newIdx]);
      setSelectedIds(new Set());
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setAnnotations(history[newIdx]);
      setSelectedIds(new Set());
    }
  }, [historyIndex, history]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    const toDelete = annotations.filter((a) => selectedIds.has(a.id));
    // Remove from backend if saved
    toDelete.forEach((a) => {
      if (a.annotationId) {
        reviewsAPI.deleteAnnotation(a.annotationId).catch(console.error);
        setIssues((prev) => prev.filter((i) => i.annotation_id !== a.annotationId));
      }
    });
    const remaining = annotations.filter((a) => !selectedIds.has(a.id));
    commitToHistory(remaining);
    setSelectedIds(new Set());
    setSelectedAnnotationForIssue(null);
    setShowIssueForm(false);
  }, [selectedIds, annotations, commitToHistory]);

  // -------------------------------------------------------------
  // 4. Keyboard Shortcuts
  // -------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if typing inside an input or textarea
      const tag = e.target.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.code === "Space" && !isSpaceDown) {
        e.preventDefault();
        setIsSpaceDown(true);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        handleDeleteSelected();
      } else if (e.key.toLowerCase() === "v") {
        setActiveTool("select");
      } else if (e.key.toLowerCase() === "p") {
        setActiveTool("pen");
      } else if (e.key.toLowerCase() === "h") {
        setActiveTool("highlight");
      } else if (e.key.toLowerCase() === "r") {
        setActiveTool("rect");
      } else if (e.key.toLowerCase() === "c") {
        setActiveTool("circle");
      } else if (e.key.toLowerCase() === "a") {
        setActiveTool("arrow");
      } else if (e.key.toLowerCase() === "l") {
        setActiveTool("line");
      } else if (e.key.toLowerCase() === "t") {
        setActiveTool("text");
      } else if (e.key.toLowerCase() === "e") {
        setActiveTool("eraser");
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === "Space") {
        setIsSpaceDown(false);
        setIsPanning(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isSpaceDown, handleUndo, handleRedo, handleDeleteSelected]);

  // -------------------------------------------------------------
  // 5. Canvas Coordinate Helpers
  // -------------------------------------------------------------
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { imgX: 0, imgY: 0, clientX: 0, clientY: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const imgX = (clientX - pan.x) / zoom;
    const imgY = (clientY - pan.y) / zoom;
    return { imgX, imgY, clientX, clientY };
  };

  // -------------------------------------------------------------
  // 6. Pointer Event Handlers (Live Drawing, Selecting, Erasing)
  // -------------------------------------------------------------
  const handlePointerDown = (e) => {
    if (!loadedImg) return;
    const { imgX, imgY, clientX, clientY } = getCanvasCoords(e);

    // Pan with Space or Middle click
    if (isSpaceDown || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
      return;
    }

    if (e.button !== 0) return; // Left click only for drawing

    e.currentTarget.setPointerCapture(e.pointerId);

    // SELECT TOOL
    if (activeTool === "select") {
      // Check if clicking an existing annotation
      let hit = null;
      // Search from top to bottom
      for (let i = annotations.length - 1; i >= 0; i--) {
        if (hitTestAnnotation(imgX, imgY, annotations[i])) {
          hit = annotations[i];
          break;
        }
      }

      if (hit) {
        if (e.shiftKey) {
          const next = new Set(selectedIds);
          if (next.has(hit.id)) next.delete(hit.id);
          else next.add(hit.id);
          setSelectedIds(next);
        } else {
          if (!selectedIds.has(hit.id)) {
            setSelectedIds(new Set([hit.id]));
          }
        }
        setSelectedAnnotationForIssue(hit);
        setShowIssueForm(true);
        // Start dragging selected annotations
        setDragState({
          type: "move",
          startX: imgX,
          startY: imgY,
          initialAnns: annotations.map((a) => ({ ...a })),
        });
      } else {
        // Clicked outside: clear selection
        if (!e.shiftKey) {
          setSelectedIds(new Set());
          setSelectedAnnotationForIssue(null);
          setShowIssueForm(false);
        }
      }
      return;
    }

    // ERASER TOOL
    if (activeTool === "eraser") {
      setIsDrawing(true);
      eraseAt(imgX, imgY);
      return;
    }

    // TEXT TOOL
    if (activeTool === "text") {
      setTextPrompt({
        x: imgX,
        y: imgY,
        text: "",
        fontSize: 18,
        isBold: false,
        color: color,
      });
      return;
    }

    // DRAWING TOOLS (Pen, Highlighter, Rect, Circle, Arrow, Line)
    setIsDrawing(true);
    const newId = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    if (activeTool === "pen") {
      setLiveAnnotation({
        id: newId,
        tool_type: "pen",
        color: color,
        strokeWidth: strokeWidth,
        opacity: 1.0,
        points: [{ x: imgX, y: imgY }],
      });
    } else if (activeTool === "highlight") {
      setLiveAnnotation({
        id: newId,
        tool_type: "highlight",
        color: color === "#7C3AED" ? "#FACC15" : color,
        strokeWidth: Math.max(strokeWidth * 3, 14),
        opacity: 0.35,
        points: [{ x: imgX, y: imgY }],
      });
    } else if (activeTool === "rect" || activeTool === "circle") {
      setLiveAnnotation({
        id: newId,
        tool_type: activeTool,
        color: color,
        strokeWidth: strokeWidth,
        opacity: 1.0,
        x: imgX,
        y: imgY,
        width: 0,
        height: 0,
        startX: imgX,
        startY: imgY,
      });
    } else if (activeTool === "arrow" || activeTool === "line") {
      setLiveAnnotation({
        id: newId,
        tool_type: activeTool,
        color: color,
        strokeWidth: strokeWidth,
        opacity: 1.0,
        startX: imgX,
        startY: imgY,
        endX: imgX,
        endY: imgY,
      });
    }
  };

  const handlePointerMove = (e) => {
    const { imgX, imgY, clientX, clientY } = getCanvasCoords(e);

    // Handle Pan
    if (isPanning) {
      setPan({ x: clientX - panStart.x, y: clientY - panStart.y });
      return;
    }

    // Handle Select Move
    if (dragState && dragState.type === "move") {
      const dx = imgX - dragState.startX;
      const dy = imgY - dragState.startY;
      setAnnotations(
        dragState.initialAnns.map((a) => {
          if (!selectedIds.has(a.id)) return a;
          if (a.tool_type === "pen" || a.tool_type === "highlight") {
            return {
              ...a,
              points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
            };
          }
          if (a.tool_type === "rect" || a.tool_type === "circle" || a.tool_type === "text") {
            return { ...a, x: a.x + dx, y: a.y + dy };
          }
          if (a.tool_type === "arrow" || a.tool_type === "line") {
            return {
              ...a,
              startX: a.startX + dx,
              startY: a.startY + dy,
              endX: a.endX + dx,
              endY: a.endY + dy,
            };
          }
          return a;
        })
      );
      return;
    }

    // Handle Eraser Drag
    if (isDrawing && activeTool === "eraser") {
      eraseAt(imgX, imgY);
      return;
    }

    // Handle Active Drawing
    if (isDrawing && liveAnnotation) {
      if (liveAnnotation.tool_type === "pen" || liveAnnotation.tool_type === "highlight") {
        setLiveAnnotation((prev) => ({
          ...prev,
          points: [...prev.points, { x: imgX, y: imgY }],
        }));
      } else if (liveAnnotation.tool_type === "rect" || liveAnnotation.tool_type === "circle") {
        setLiveAnnotation((prev) => ({
          ...prev,
          x: Math.min(prev.startX, imgX),
          y: Math.min(prev.startY, imgY),
          width: Math.abs(imgX - prev.startX),
          height: Math.abs(imgY - prev.startY),
        }));
      } else if (liveAnnotation.tool_type === "arrow" || liveAnnotation.tool_type === "line") {
        setLiveAnnotation((prev) => ({
          ...prev,
          endX: imgX,
          endY: imgY,
        }));
      }
    }
  };

  const handlePointerUp = (e) => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (dragState) {
      commitToHistory(annotations);
      setDragState(null);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    if (activeTool === "eraser") return;

    if (liveAnnotation) {
      let isValid = false;
      if (liveAnnotation.tool_type === "pen" || liveAnnotation.tool_type === "highlight") {
        isValid = liveAnnotation.points.length >= 2;
      } else if (liveAnnotation.tool_type === "rect" || liveAnnotation.tool_type === "circle") {
        isValid = liveAnnotation.width > 3 && liveAnnotation.height > 3;
      } else if (liveAnnotation.tool_type === "arrow" || liveAnnotation.tool_type === "line") {
        isValid = Math.hypot(liveAnnotation.endX - liveAnnotation.startX, liveAnnotation.endY - liveAnnotation.startY) > 5;
      }

      if (isValid) {
        const next = [...annotations, liveAnnotation];
        commitToHistory(next);
        // Persist to backend
        saveSingleAnnotation(liveAnnotation);
      }
      setLiveAnnotation(null);
    }
  };

  // Erase intersecting annotations
  const eraseAt = (imgX, imgY) => {
    let removed = false;
    const remaining = annotations.filter((a) => {
      const hit = hitTestAnnotation(imgX, imgY, a);
      if (hit) {
        removed = true;
        if (a.annotationId) {
          reviewsAPI.deleteAnnotation(a.annotationId).catch(console.error);
          setIssues((prev) => prev.filter((i) => i.annotation_id !== a.annotationId));
        }
        return false;
      }
      return true;
    });

    if (removed) {
      commitToHistory(remaining);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of prev) {
          if (!remaining.find((a) => a.id === id)) next.delete(id);
        }
        return next;
      });
    }
  };

  // Save single annotation to backend
  const saveSingleAnnotation = async (ann) => {
    if (!activeImage) return;
    try {
      const coordinates = {
        strokeWidth: ann.strokeWidth,
        points: ann.points,
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        startX: ann.startX,
        startY: ann.startY,
        endX: ann.endX,
        endY: ann.endY,
        fontSize: ann.fontSize,
        isBold: ann.isBold,
      };

      const res = await reviewsAPI.createAnnotation({
        image_id: activeImage.id,
        tool_type: ann.tool_type,
        coordinates,
        color: ann.color,
        text: ann.text,
      });

      const backendId = res.data.annotation.id;
      setAnnotations((prev) =>
        prev.map((a) =>
          a.id === ann.id ? { ...a, annotationId: backendId } : a
        )
      );
    } catch (err) {
      console.error("Failed to save annotation to server:", err);
    }
  };

  // -------------------------------------------------------------
  // 7. Text Tool Submit Handler
  // -------------------------------------------------------------
  const handleCommitText = () => {
    if (!textPrompt || !textPrompt.text.trim()) {
      setTextPrompt(null);
      return;
    }
    const newTextAnn = {
      id: `ann_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      tool_type: "text",
      color: textPrompt.color || color,
      strokeWidth: 1,
      opacity: 1.0,
      x: textPrompt.x,
      y: textPrompt.y,
      text: textPrompt.text.trim(),
      fontSize: textPrompt.fontSize || 18,
      isBold: textPrompt.isBold || false,
    };
    const next = [...annotations, newTextAnn];
    commitToHistory(next);
    saveSingleAnnotation(newTextAnn);
    setTextPrompt(null);
  };

  // -------------------------------------------------------------
  // 8. Canvas Rendering Loop (HTML5 2D Canvas + requestAnimationFrame)
  // -------------------------------------------------------------
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 550;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Apply Pan & Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Immutable Background Screenshot Image
    if (loadedImg) {
      ctx.drawImage(
        loadedImg,
        0,
        0,
        loadedImg.naturalWidth,
        loadedImg.naturalHeight
      );
    }

    // 2. Draw Committed Annotations
    for (const ann of annotations) {
      const isSelected = selectedIds.has(ann.id);
      drawAnnotation(ctx, ann, isSelected, zoom);
    }

    // 3. Draw Live In-progress Annotation
    if (liveAnnotation) {
      drawAnnotation(ctx, liveAnnotation, false, zoom);
    }

    ctx.restore();
  }, [loadedImg, annotations, liveAnnotation, selectedIds, pan, zoom]);

  useEffect(() => {
    let animId;
    const loop = () => {
      renderCanvas();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderCanvas]);

  // Render individual annotation helper
  const drawAnnotation = (ctx, ann, isSelected, currentZoom) => {
    ctx.save();
    ctx.strokeStyle = ann.color || "#7C3AED";
    ctx.lineWidth = ann.strokeWidth || 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (ann.opacity) ctx.globalAlpha = ann.opacity;

    if (ann.tool_type === "pen" || ann.tool_type === "highlight") {
      const pts = ann.points || [];
      if (pts.length > 0) {
        ctx.beginPath();
        if (pts.length === 1) {
          ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fillStyle = ctx.strokeStyle;
          ctx.fill();
        } else {
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length - 1; i++) {
            const xc = (pts[i].x + pts[i + 1].x) / 2;
            const yc = (pts[i].y + pts[i + 1].y) / 2;
            ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
          }
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.stroke();
        }
      }
    } else if (ann.tool_type === "rect") {
      ctx.strokeRect(ann.x, ann.y, ann.width, ann.height);
    } else if (ann.tool_type === "circle") {
      const rx = Math.abs(ann.width / 2);
      const ry = Math.abs(ann.height / 2);
      const cx = ann.x + ann.width / 2;
      const cy = ann.y + ann.height / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(rx, 0.1), Math.max(ry, 0.1), 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (ann.tool_type === "arrow") {
      const headLen = Math.max(12, ann.strokeWidth * 3);
      const angle = Math.atan2(ann.endY - ann.startY, ann.endX - ann.startX);
      // Line
      ctx.beginPath();
      ctx.moveTo(ann.startX, ann.startY);
      ctx.lineTo(ann.endX, ann.endY);
      ctx.stroke();
      // Arrowhead
      ctx.beginPath();
      ctx.moveTo(ann.endX, ann.endY);
      ctx.lineTo(
        ann.endX - headLen * Math.cos(angle - Math.PI / 6),
        ann.endY - headLen * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ann.endX - headLen * Math.cos(angle + Math.PI / 6),
        ann.endY - headLen * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    } else if (ann.tool_type === "line") {
      ctx.beginPath();
      ctx.moveTo(ann.startX, ann.startY);
      ctx.lineTo(ann.endX, ann.endY);
      ctx.stroke();
    } else if (ann.tool_type === "text") {
      const fontSize = ann.fontSize || 18;
      ctx.font = `${ann.isBold ? "bold " : ""}${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = ann.color || "#7C3AED";
      ctx.fillText(ann.text || "", ann.x, ann.y + fontSize);
    }

    // Draw Selection Bounding Box & Handles
    if (isSelected) {
      ctx.restore();
      ctx.save();
      const b = getAnnotationBounds(ann);
      ctx.strokeStyle = "#7C3AED";
      ctx.lineWidth = 1.5 / currentZoom;
      ctx.setLineDash([4 / currentZoom, 4 / currentZoom]);
      ctx.strokeRect(b.minX, b.minY, b.width, b.height);

      // 4 Corner Handles
      ctx.setLineDash([]);
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#7C3AED";
      ctx.lineWidth = 1.5 / currentZoom;
      const handleSize = 6 / currentZoom;
      const corners = [
        { x: b.minX, y: b.minY },
        { x: b.maxX, y: b.minY },
        { x: b.maxX, y: b.maxY },
        { x: b.minX, y: b.maxY },
      ];
      for (const c of corners) {
        ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
        ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize);
      }
    }

    ctx.restore();
  };

  // -------------------------------------------------------------
  // 9. Download PNG (Full Resolution)
  // -------------------------------------------------------------
  const handleDownload = () => {
    if (!loadedImg) return;
    const off = document.createElement("canvas");
    off.width = loadedImg.naturalWidth;
    off.height = loadedImg.naturalHeight;
    const ctx = off.getContext("2d");
    if (!ctx) return;

    // Draw image
    ctx.drawImage(loadedImg, 0, 0);
    // Draw annotations
    for (const ann of annotations) {
      drawAnnotation(ctx, ann, false, 1);
    }

    const a = document.createElement("a");
    a.href = off.toDataURL("image/png");
    a.download = `annotated-${activeImage?.file_name || "screenshot"}.png`;
    a.click();
  };

  // -------------------------------------------------------------
  // 10. Save All Annotations to Backend
  // -------------------------------------------------------------
  const handleSaveAnnotations = async () => {
    if (!activeImage) return;
    setSaving(true);
    try {
      // Save any annotations that don't have annotationId yet
      const promises = annotations.map(async (ann) => {
        const coordinates = {
          strokeWidth: ann.strokeWidth,
          points: ann.points,
          x: ann.x,
          y: ann.y,
          width: ann.width,
          height: ann.height,
          startX: ann.startX,
          startY: ann.startY,
          endX: ann.endX,
          endY: ann.endY,
          fontSize: ann.fontSize,
          isBold: ann.isBold,
        };

        if (ann.annotationId) {
          return reviewsAPI.updateAnnotation(ann.annotationId, {
            coordinates,
            color: ann.color,
            text: ann.text,
          });
        } else {
          const res = await reviewsAPI.createAnnotation({
            image_id: activeImage.id,
            tool_type: ann.tool_type,
            coordinates,
            color: ann.color,
            text: ann.text,
          });
          ann.annotationId = res.data.annotation.id;
          return res;
        }
      });

      await Promise.all(promises);
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 2500);
    } catch (err) {
      console.error("Failed to save annotations:", err);
      alert("Failed to save annotations. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // -------------------------------------------------------------
  // 11. Zoom Controls
  // -------------------------------------------------------------
  const handleZoomIn = () => {
    setZoom((z) => Math.min(4.0, z * 1.25));
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(0.25, z * 0.8));
  };

  const handleResetZoom = () => {
    if (!loadedImg || !containerRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }
    const cw = containerRef.current.clientWidth || 800;
    const ch = containerRef.current.clientHeight || 550;
    const scale = Math.min((cw - 40) / loadedImg.naturalWidth, (ch - 40) / loadedImg.naturalHeight, 1);
    setZoom(scale);
    setPan({
      x: Math.max(20, (cw - loadedImg.naturalWidth * scale) / 2),
      y: Math.max(20, (ch - loadedImg.naturalHeight * scale) / 2),
    });
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.25, Math.min(4.0, zoom * factor));
    const { clientX, clientY } = getCanvasCoords(e);
    setPan({
      x: clientX - (clientX - pan.x) * (newZoom / zoom),
      y: clientY - (clientY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // -------------------------------------------------------------
  // 12. Issue Management
  // -------------------------------------------------------------
  const createIssue = async () => {
    if (!selectedAnnotationForIssue) return;
    try {
      let annotationId = selectedAnnotationForIssue.annotationId;
      if (!annotationId) {
        // Save annotation first
        const coordinates = {
          strokeWidth: selectedAnnotationForIssue.strokeWidth,
          points: selectedAnnotationForIssue.points,
          x: selectedAnnotationForIssue.x,
          y: selectedAnnotationForIssue.y,
          width: selectedAnnotationForIssue.width,
          height: selectedAnnotationForIssue.height,
        };
        const resAnn = await reviewsAPI.createAnnotation({
          image_id: activeImage.id,
          tool_type: selectedAnnotationForIssue.tool_type,
          coordinates,
          color: selectedAnnotationForIssue.color,
          text: selectedAnnotationForIssue.text,
        });
        annotationId = resAnn.data.annotation.id;
        selectedAnnotationForIssue.annotationId = annotationId;
      }

      const res = await reviewsAPI.createIssue({
        annotation_id: annotationId,
        ...issueForm,
      });
      setIssues([...issues, res.data.issue]);
      setShowIssueForm(false);
      setIssueForm({
        title: "",
        description: "",
        priority: "Medium",
        mark_deduction: 0,
      });
    } catch (err) {
      console.error("Failed to create issue:", err);
    }
  };

  const updateIssue = async (id, data) => {
    try {
      const res = await reviewsAPI.updateIssue(id, data);
      setIssues(issues.map((i) => (i.id === id ? res.data.issue : i)));
    } catch (err) {
      console.error("Failed to update issue:", err);
    }
  };

  const deleteIssue = async (id) => {
    try {
      await reviewsAPI.deleteIssue(id);
      setIssues(issues.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to delete issue:", err);
    }
  };

  useEffect(() => {
    if (!submission) return;
    const load = async () => {
      try {
        const res = await reviewsAPI.getIssuesBySubmission(submission.id);
        setIssues(res.data.issues || []);
      } catch (err) {
        console.error("Failed to load issues:", err);
      }
    };
    load();
  }, [submission]);

  // Cursor style based on tool and space key
  const getCursor = () => {
    if (isSpaceDown || isPanning) return isPanning ? "grabbing" : "grab";
    if (activeTool === "select") return "default";
    if (activeTool === "eraser") return "cell";
    if (activeTool === "text") return "text";
    return "crosshair";
  };

  if (loading) {
    return (
      <AppLayout>
        <LoadingSkeleton rows={4} />
      </AppLayout>
    );
  }

  return (
    <AuthGuard requiredRole="admin">
      <AppLayout>
        <div className="space-y-6 max-w-7xl mx-auto pb-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Mentor Review Workspace
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Annotate screenshots with live tools, create issues, and submit feedback
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar: Submissions & Screenshots */}
            <div className="lg:col-span-1 space-y-4">
              <div className="card-static">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">Submissions</h3>
                {submissions.length === 0 && (
                  <p className="text-xs text-gray-400">No submissions available</p>
                )}
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {submissions.map((sub) => (
                    <motion.button
                      key={sub.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => selectSubmission(sub)}
                      className={`w-full text-left p-3 rounded-xl transition-all duration-200 border ${
                        submission?.id === sub.id
                          ? "bg-primary-50/80 border-primary-200/80 shadow-sm"
                          : "bg-white/50 hover:bg-white/80 border-gray-100"
                      }`}
                    >
                      <p className="font-semibold text-xs text-gray-900 truncate">
                        {sub.user?.name || "Candidate"}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5 truncate">
                        {sub.week?.week_title || "Week Roadmap"}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {sub.review_files?.length || 0} screenshot(s)
                      </p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {submission && submission.review_files?.length > 0 && (
                <div className="card-static">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">Screenshots</h3>
                  <div className="space-y-2">
                    {submission.review_files.map((file, idx) => (
                      <motion.button
                        key={file.id}
                        whileHover={{ scale: 1.01 }}
                        onClick={() => setActiveImage(file)}
                        className={`w-full text-left p-2.5 rounded-xl flex items-center gap-2.5 text-xs transition-all duration-200 border ${
                          activeImage?.id === file.id
                            ? "bg-primary-50/80 border-primary-200/80 font-semibold text-primary-900"
                            : "bg-white/50 hover:bg-white/80 border-gray-100 text-gray-700"
                        }`}
                      >
                        <ImageIcon size={15} className="text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {file.file_name || `Screenshot ${idx + 1}`}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Center / Right: Canvas & Annotation Station */}
            <div className="lg:col-span-3 space-y-4">
              {submission && (
                <SubmissionDetailView
                  submission={submission}
                  week={submission.week}
                  projectName={submission.week?.project_id ? "Assigned Project" : undefined}
                  isAdmin={true}
                  onSelectScreenshotForReview={(file) => setActiveImage(file)}
                />
              )}

              {/* Annotation Workspace */}
              {activeImage ? (
                <div className="space-y-3">
                  {/* Toolbar */}
                  <AnnotationToolbar
                    activeTool={activeTool}
                    setActiveTool={(tool) => {
                      setActiveTool(tool);
                      if (tool !== "select") {
                        setSelectedIds(new Set());
                      }
                    }}
                    color={color}
                    setColor={setColor}
                    strokeWidth={strokeWidth}
                    setStrokeWidth={setStrokeWidth}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                    onDelete={handleDeleteSelected}
                    hasSelection={selectedIds.size > 0}
                    zoom={zoom}
                    onZoomIn={handleZoomIn}
                    onZoomOut={handleZoomOut}
                    onResetZoom={handleResetZoom}
                    onDownload={handleDownload}
                    onSave={handleSaveAnnotations}
                    saving={saving}
                    saved={savedToast}
                  />

                  {/* Canvas Container */}
                  <div
                    ref={containerRef}
                    onWheel={handleWheel}
                    className="relative bg-gray-900/5 backdrop-blur-sm border border-gray-200/80 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center min-h-[550px] select-none"
                    style={{ cursor: getCursor() }}
                  >
                    <canvas
                      ref={canvasRef}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      className="block touch-none"
                    />

                    {/* Quick Helper Overlay */}
                    <div className="absolute bottom-3 left-3 bg-gray-900/75 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-2 pointer-events-none shadow-sm">
                      <HelpCircle size={13} className="text-primary-400" />
                      <span>
                        {isSpaceDown
                          ? "Drag to Pan"
                          : "Space + Drag to Pan • Scroll to Zoom • Ctrl+Z Undo"}
                      </span>
                    </div>

                    {/* Inline Text Tool Overlay Prompt */}
                    {textPrompt && (
                      <div
                        className="absolute z-20 bg-white rounded-xl shadow-2xl border border-primary-200 p-2.5 flex flex-col gap-2 min-w-[200px]"
                        style={{
                          left: Math.max(
                            10,
                            Math.min(
                              (containerRef.current?.clientWidth || 800) - 220,
                              pan.x + textPrompt.x * zoom
                            )
                          ),
                          top: Math.max(
                            10,
                            Math.min(
                              (containerRef.current?.clientHeight || 550) - 100,
                              pan.y + textPrompt.y * zoom
                            )
                          ),
                        }}
                      >
                        <input
                          autoFocus
                          type="text"
                          placeholder="Type text annotation..."
                          value={textPrompt.text}
                          onChange={(e) =>
                            setTextPrompt((p) => ({ ...p, text: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCommitText();
                            if (e.key === "Escape") setTextPrompt(null);
                          }}
                          className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-primary-500 font-sans"
                        />
                        <div className="flex items-center justify-between text-[11px] gap-2 pt-1 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() =>
                              setTextPrompt((p) => ({ ...p, isBold: !p.isBold }))
                            }
                            className={`px-2 py-0.5 rounded ${
                              textPrompt.isBold
                                ? "bg-primary-100 text-primary-700 font-bold"
                                : "text-gray-500 hover:bg-gray-100 font-normal"
                            }`}
                          >
                            B
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setTextPrompt(null)}
                              className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 rounded"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleCommitText}
                              className="btn-primary px-2.5 py-0.5 rounded text-[11px]"
                            >
                              Place
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="card-static text-center py-20 text-gray-400">
                  {submission
                    ? "No screenshots available to annotate"
                    : "Select a submission from the list to start reviewing"}
                </div>
              )}

              {/* Issue Form Linked to Selected Annotation */}
              {showIssueForm && selectedAnnotationForIssue && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="card-static border border-primary-200/80 bg-white/95"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                      <span>Create Issue for Selected Annotation</span>
                    </h3>
                    <button
                      onClick={() => setShowIssueForm(false)}
                      className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Input
                      type="text"
                      value={issueForm.title}
                      onChange={(e) =>
                        setIssueForm({ ...issueForm, title: e.target.value })
                      }
                      placeholder="Issue title (e.g. Broken navigation button)"
                      required
                    />
                    <Textarea
                      value={issueForm.description}
                      onChange={(e) =>
                        setIssueForm({
                          ...issueForm,
                          description: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="Detailed issue description and expected behavior..."
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                          Priority
                        </label>
                        <select
                          value={issueForm.priority}
                          onChange={(e) =>
                            setIssueForm({
                              ...issueForm,
                              priority: e.target.value,
                            })
                          }
                          className="input-field text-xs py-1.5"
                        >
                          <option>High</option>
                          <option>Medium</option>
                          <option>Low</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-gray-600 uppercase mb-1">
                          Mark Deduction
                        </label>
                        <Input
                          type="number"
                          value={issueForm.mark_deduction}
                          onChange={(e) =>
                            setIssueForm({
                              ...issueForm,
                              mark_deduction: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0"
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div className="flex items-end">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={createIssue}
                          disabled={!issueForm.title.trim()}
                          className="btn-primary w-full py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                        >
                          Save Issue
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Issue Board */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 text-sm flex items-center justify-between">
                  <span>Issue Board</span>
                  {issues.length > 0 && (
                    <span className="text-xs text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full font-semibold">
                      {issues.length} {issues.length === 1 ? "issue" : "issues"}
                    </span>
                  )}
                </h3>
                {issues.length === 0 ? (
                  <div className="card-static text-center py-10 text-gray-400 text-xs">
                    No issues created yet. Select any annotation to link an issue.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {issues.map((issue) => (
                      <IssueCard
                        key={issue.id}
                        issue={issue}
                        onUpdate={updateIssue}
                        onDelete={deleteIssue}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
