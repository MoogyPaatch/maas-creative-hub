import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Type,
  MousePointer2,
  Plus,
  Download,
  ArrowLeft,
  Layers,
  ChevronUp,
  ChevronDown,
  Trash2,
  RotateCw,
  Image as ImageIcon,
} from "lucide-react";
import type { CanvasElement, ProductionAsset } from "@/types";

interface Props {
  assets: ProductionAsset[];
  onBack: () => void;
}

type Tool = "select" | "text";
type Handle = "nw" | "ne" | "sw" | "se" | "rotate";

const TEMPLATES = [
  { label: "Grille 2×2", layout: (w: number, h: number): Partial<CanvasElement>[] => [
    { x: 40, y: 40, width: w/2 - 60, height: h/2 - 60 },
    { x: w/2 + 20, y: 40, width: w/2 - 60, height: h/2 - 60 },
    { x: 40, y: h/2 + 20, width: w/2 - 60, height: h/2 - 60 },
    { x: w/2 + 20, y: h/2 + 20, width: w/2 - 60, height: h/2 - 60 },
  ]},
  { label: "Panoramique", layout: (w: number, h: number): Partial<CanvasElement>[] => [
    { x: 40, y: h/4, width: w - 80, height: h/2 },
  ]},
  { label: "Story (3 vertical)", layout: (w: number, _h: number): Partial<CanvasElement>[] => [
    { x: w/2 - 120, y: 30, width: 240, height: 320 },
    { x: w/2 - 120, y: 370, width: 240, height: 320 },
    { x: w/2 - 120, y: 710, width: 240, height: 320 },
  ]},
];

const HANDLE_SIZE = 10;

const CreativeCanvas = ({ assets, onBack }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<Tool>("select");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [showLayers, setShowLayers] = useState(false);
  const [showAssetPicker, setShowAssetPicker] = useState(false);

  // Drag state refs for performance
  const dragRef = useRef<{
    type: "move" | "resize" | "rotate" | "pan";
    id?: string;
    handle?: Handle;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
    origR: number;
    origPanX: number;
    origPanY: number;
  } | null>(null);

  const nextZIndex = useCallback(() => {
    return elements.length > 0 ? Math.max(...elements.map(e => e.zIndex)) + 1 : 1;
  }, [elements]);

  const addImageElement = useCallback((asset: ProductionAsset) => {
    const el: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "image",
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: 240,
      height: 240,
      rotation: 0,
      zIndex: nextZIndex(),
      src: asset.thumbnail_url || asset.url,
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
    setShowAssetPicker(false);
  }, [nextZIndex]);

  const addTextElement = useCallback((x: number, y: number) => {
    const el: CanvasElement = {
      id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: "text",
      x, y,
      width: 200,
      height: 48,
      rotation: 0,
      zIndex: nextZIndex(),
      text: "Double-cliquez pour éditer",
      fontSize: 20,
      color: "hsl(var(--foreground))",
    };
    setElements(prev => [...prev, el]);
    setSelectedId(el.id);
    setTool("select");
  }, [nextZIndex]);

  const updateElement = useCallback((id: string, patch: Partial<CanvasElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const moveLayer = useCallback((id: string, dir: "up" | "down") => {
    setElements(prev => {
      const sorted = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted.findIndex(e => e.id === id);
      if (dir === "up" && idx < sorted.length - 1) {
        const tempZ = sorted[idx].zIndex;
        sorted[idx] = { ...sorted[idx], zIndex: sorted[idx + 1].zIndex };
        sorted[idx + 1] = { ...sorted[idx + 1], zIndex: tempZ };
      } else if (dir === "down" && idx > 0) {
        const tempZ = sorted[idx].zIndex;
        sorted[idx] = { ...sorted[idx], zIndex: sorted[idx - 1].zIndex };
        sorted[idx - 1] = { ...sorted[idx - 1], zIndex: tempZ };
      }
      return sorted;
    });
  }, []);

  // Apply template
  const applyTemplate = useCallback((templateIdx: number) => {
    const container = containerRef.current;
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    const tmpl = TEMPLATES[templateIdx];
    const positions = tmpl.layout(w, h);
    const imageAssets = assets.filter(a => a.type === "image");
    const newElements: CanvasElement[] = positions.map((pos, i) => {
      const asset = imageAssets[i % imageAssets.length];
      return {
        id: `el-${Date.now()}-${i}`,
        type: "image" as const,
        x: pos.x || 0,
        y: pos.y || 0,
        width: pos.width || 200,
        height: pos.height || 200,
        rotation: 0,
        zIndex: i + 1,
        src: asset ? (asset.thumbnail_url || asset.url) : "/placeholder.svg",
      };
    });
    setElements(newElements);
    setSelectedId(null);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [assets]);

  // Export to PNG
  const exportPNG = useCallback(async () => {
    const canvas = document.createElement("canvas");
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--background")
      ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue("--background").trim()})`
      : "#fafafa";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    for (const el of sorted) {
      ctx.save();
      ctx.translate(el.x + el.width / 2, el.y + el.height / 2);
      ctx.rotate((el.rotation * Math.PI) / 180);
      if (el.type === "image" && el.src) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = el.src!; });
          ctx.drawImage(img, -el.width / 2, -el.height / 2, el.width, el.height);
        } catch { /* skip broken images */ }
      } else if (el.type === "text" && el.text) {
        ctx.font = `${el.fontSize || 20}px Inter, sans-serif`;
        ctx.fillStyle = el.color || "#000";
        ctx.textBaseline = "top";
        ctx.fillText(el.text, -el.width / 2, -el.height / 2);
      }
      ctx.restore();
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "canvas-export.png";
      a.click();
      URL.revokeObjectURL(url);
    });
  }, [elements]);

  // Pointer handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const container = containerRef.current;
    if (!container) return;

    // Text tool — add text on background click
    if (tool === "text") {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      addTextElement(x, y);
      return;
    }

    // Check if clicking on an element handle or element itself
    const target = e.target as HTMLElement;
    const elId = target.closest("[data-canvas-el]")?.getAttribute("data-canvas-el");
    const handleType = target.getAttribute("data-handle") as Handle | null;

    if (elId && handleType) {
      e.stopPropagation();
      const el = elements.find(el => el.id === elId);
      if (!el) return;
      container.setPointerCapture(e.pointerId);
      dragRef.current = {
        type: handleType === "rotate" ? "rotate" : "resize",
        id: elId,
        handle: handleType,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width,
        origH: el.height,
        origR: el.rotation,
        origPanX: 0, origPanY: 0,
      };
      setSelectedId(elId);
      return;
    }

    if (elId) {
      e.stopPropagation();
      const el = elements.find(el => el.id === elId);
      if (!el) return;
      container.setPointerCapture(e.pointerId);
      dragRef.current = {
        type: "move",
        id: elId,
        startX: e.clientX,
        startY: e.clientY,
        origX: el.x,
        origY: el.y,
        origW: el.width, origH: el.height, origR: el.rotation,
        origPanX: 0, origPanY: 0,
      };
      setSelectedId(elId);
      return;
    }

    // Background click — pan
    setSelectedId(null);
    container.setPointerCapture(e.pointerId);
    dragRef.current = {
      type: "pan",
      startX: e.clientX,
      startY: e.clientY,
      origX: 0, origY: 0, origW: 0, origH: 0, origR: 0,
      origPanX: pan.x,
      origPanY: pan.y,
    };
  }, [tool, elements, pan, zoom, addTextElement]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    if (d.type === "pan") {
      setPan({ x: d.origPanX + dx, y: d.origPanY + dy });
      return;
    }

    if (d.type === "move" && d.id) {
      updateElement(d.id, { x: d.origX + dx / zoom, y: d.origY + dy / zoom });
      return;
    }

    if (d.type === "resize" && d.id && d.handle) {
      const ddx = dx / zoom;
      const ddy = dy / zoom;
      let newX = d.origX, newY = d.origY, newW = d.origW, newH = d.origH;
      switch (d.handle) {
        case "se": newW = Math.max(40, d.origW + ddx); newH = Math.max(40, d.origH + ddy); break;
        case "sw": newX = d.origX + ddx; newW = Math.max(40, d.origW - ddx); newH = Math.max(40, d.origH + ddy); break;
        case "ne": newY = d.origY + ddy; newW = Math.max(40, d.origW + ddx); newH = Math.max(40, d.origH - ddy); break;
        case "nw": newX = d.origX + ddx; newY = d.origY + ddy; newW = Math.max(40, d.origW - ddx); newH = Math.max(40, d.origH - ddy); break;
      }
      updateElement(d.id, { x: newX, y: newY, width: newW, height: newH });
      return;
    }

    if (d.type === "rotate" && d.id) {
      const container = containerRef.current;
      if (!container) return;
      const el = elements.find(e => e.id === d.id);
      if (!el) return;
      const rect = container.getBoundingClientRect();
      const cx = rect.left + pan.x + (el.x + el.width / 2) * zoom;
      const cy = rect.top + pan.y + (el.y + el.height / 2) * zoom;
      const angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI) + 90;
      updateElement(d.id, { rotation: Math.round(angle / 5) * 5 });
    }
  }, [zoom, pan, elements, updateElement]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(3, Math.max(0.1, prev - e.deltaY * 0.001)));
  }, []);

  // Keyboard delete
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const el = elements.find(el => el.id === selectedId);
        if (el?.type === "text") {
          // Don't delete text while editing
          const active = document.activeElement;
          if (active?.tagName === "INPUT" || active?.tagName === "TEXTAREA" || (active as HTMLElement)?.isContentEditable) return;
        }
        deleteElement(selectedId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, elements, deleteElement]);

  // Snap guides
  const snapGuides = (() => {
    if (!selectedId) return { vLines: [] as number[], hLines: [] as number[] };
    const sel = elements.find(e => e.id === selectedId);
    if (!sel) return { vLines: [] as number[], hLines: [] as number[] };
    const THRESH = 6;
    const vLines: number[] = [];
    const hLines: number[] = [];
    const selCx = sel.x + sel.width / 2;
    const selCy = sel.y + sel.height / 2;
    for (const other of elements) {
      if (other.id === selectedId) continue;
      const oCx = other.x + other.width / 2;
      const oCy = other.y + other.height / 2;
      if (Math.abs(selCx - oCx) < THRESH) vLines.push(oCx);
      if (Math.abs(sel.x - other.x) < THRESH) vLines.push(other.x);
      if (Math.abs(sel.x + sel.width - (other.x + other.width)) < THRESH) vLines.push(other.x + other.width);
      if (Math.abs(selCy - oCy) < THRESH) hLines.push(oCy);
      if (Math.abs(sel.y - other.y) < THRESH) hLines.push(other.y);
      if (Math.abs(sel.y + sel.height - (other.y + other.height)) < THRESH) hLines.push(other.y + other.height);
    }
    return { vLines, hLines };
  })();

  const selectedEl = elements.find(e => e.id === selectedId);
  const imageAssets = assets.filter(a => a.type === "image");

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-card/80 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-1">
          <button onClick={onBack} className="mr-2 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition">
            <ArrowLeft className="h-3.5 w-3.5" /> Galerie
          </button>
          <div className="mx-2 h-5 w-px bg-border" />
          <button
            onClick={() => setTool("select")}
            className={`rounded-lg p-2 transition ${tool === "select" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            title="Sélection"
          >
            <MousePointer2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setTool("text")}
            className={`rounded-lg p-2 transition ${tool === "text" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
            title="Ajouter du texte"
          >
            <Type className="h-4 w-4" />
          </button>
          <div className="mx-2 h-5 w-px bg-border" />
          <button onClick={() => setShowAssetPicker(!showAssetPicker)} className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition" title="Ajouter un asset">
            <Plus className="h-3.5 w-3.5" /> Asset
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Templates */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition">
              <Layers className="h-3.5 w-3.5" /> Template
            </button>
            <div className="absolute right-0 top-full z-50 hidden min-w-[140px] rounded-lg border border-border bg-card p-1 shadow-lg group-hover:block">
              {TEMPLATES.map((t, i) => (
                <button key={i} onClick={() => applyTemplate(i)} className="w-full rounded-md px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted transition">
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mx-2 h-5 w-px bg-border" />
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition" title="Zoom +">
            <ZoomIn className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs font-mono text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.max(0.1, z - 0.2))} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition" title="Zoom −">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted transition" title="Reset vue">
            <Maximize className="h-4 w-4" />
          </button>
          <div className="mx-2 h-5 w-px bg-border" />
          <button onClick={exportPNG} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition">
            <Download className="h-3.5 w-3.5" /> Exporter PNG
          </button>
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {/* Asset picker dropdown */}
        <AnimatePresence>
          {showAssetPicker && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute left-4 top-2 z-40 w-64 rounded-xl border border-border bg-card p-3 shadow-xl"
            >
              <p className="mb-2 text-xs font-semibold text-foreground">Ajouter un asset</p>
              {imageAssets.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucun asset image disponible</p>
              )}
              <div className="grid grid-cols-3 gap-2">
                {imageAssets.map(a => (
                  <button
                    key={a.id}
                    onClick={() => addImageElement(a)}
                    className="group aspect-square overflow-hidden rounded-lg border border-border bg-muted hover:border-primary transition"
                  >
                    <img src={a.thumbnail_url || a.url} alt={a.title} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layers panel */}
        <AnimatePresence>
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="absolute right-3 top-2 z-40 w-56 rounded-xl border border-border bg-card p-3 shadow-xl"
            >
              <p className="mb-2 text-xs font-semibold text-foreground">Calques</p>
              {[...elements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
                <div
                  key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs cursor-pointer transition ${
                    selectedId === el.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                  }`}
                >
                  {el.type === "image" ? <ImageIcon className="h-3 w-3" /> : <Type className="h-3 w-3" />}
                  <span className="flex-1 truncate">{el.type === "text" ? (el.text?.slice(0, 20) || "Texte") : "Image"}</span>
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "up"); }} className="p-0.5 hover:text-primary"><ChevronUp className="h-3 w-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, "down"); }} className="p-0.5 hover:text-primary"><ChevronDown className="h-3 w-3" /></button>
                  <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-0.5 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              {elements.length === 0 && <p className="text-xs text-muted-foreground">Aucun élément</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Layers toggle */}
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="absolute right-3 bottom-3 z-30 flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm hover:bg-muted transition"
        >
          <Layers className="h-3.5 w-3.5" /> Calques ({elements.length})
        </button>

        {/* Canvas surface */}
        <div
          ref={containerRef}
          className="h-full w-full cursor-crosshair"
          style={{ cursor: tool === "text" ? "text" : dragRef.current?.type === "pan" ? "grabbing" : "grab" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Dot grid background */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle, hsl(var(--border)) 1px, transparent 1px)`,
              backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
            }}
          />

          {/* Transform container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          >
            {/* Snap guides */}
            {snapGuides.vLines.map((x, i) => (
              <div key={`v-${i}`} className="absolute top-0 h-full w-px bg-primary/40" style={{ left: x }} />
            ))}
            {snapGuides.hLines.map((y, i) => (
              <div key={`h-${i}`} className="absolute left-0 w-full h-px bg-primary/40" style={{ top: y }} />
            ))}

            {/* Elements */}
            {[...elements].sort((a, b) => a.zIndex - b.zIndex).map(el => (
              <div
                key={el.id}
                data-canvas-el={el.id}
                className={`absolute ${selectedId === el.id ? "ring-2 ring-primary ring-offset-1" : ""}`}
                style={{
                  left: el.x,
                  top: el.y,
                  width: el.width,
                  height: el.height,
                  transform: `rotate(${el.rotation}deg)`,
                  zIndex: el.zIndex,
                  cursor: tool === "select" ? "move" : undefined,
                }}
              >
                {el.type === "image" && el.src && (
                  <img
                    src={el.src}
                    alt=""
                    className="h-full w-full rounded-sm object-cover pointer-events-none select-none"
                    draggable={false}
                  />
                )}
                {el.type === "text" && (
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    className="h-full w-full outline-none select-text"
                    style={{ fontSize: el.fontSize || 20, color: el.color || "hsl(var(--foreground))", lineHeight: 1.3 }}
                    onBlur={(e) => updateElement(el.id, { text: e.currentTarget.textContent || "" })}
                  >
                    {el.text}
                  </div>
                )}

                {/* Selection handles */}
                {selectedId === el.id && (
                  <>
                    {(["nw", "ne", "sw", "se"] as Handle[]).map(h => (
                      <div
                        key={h}
                        data-handle={h}
                        className="absolute bg-primary border-2 border-primary-foreground rounded-sm shadow-sm"
                        style={{
                          width: HANDLE_SIZE,
                          height: HANDLE_SIZE,
                          top: h.includes("n") ? -HANDLE_SIZE / 2 : undefined,
                          bottom: h.includes("s") ? -HANDLE_SIZE / 2 : undefined,
                          left: h.includes("w") ? -HANDLE_SIZE / 2 : undefined,
                          right: h.includes("e") ? -HANDLE_SIZE / 2 : undefined,
                          cursor: h === "nw" || h === "se" ? "nwse-resize" : "nesw-resize",
                        }}
                      />
                    ))}
                    {/* Rotate handle */}
                    <div
                      data-handle="rotate"
                      className="absolute -top-8 left-1/2 -translate-x-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm cursor-grab"
                    >
                      <RotateCw className="h-3 w-3" />
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeCanvas;
