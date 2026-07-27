"use client";

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';

const Stage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });
const Image = dynamic(() => import('react-konva').then(mod => mod.Image), { ssr: false });
const Line = dynamic(() => import('react-konva').then(mod => mod.Line), { ssr: false });

export interface AnnotationLine {
  id: string;
  points: number[]; // [x1, y1, x2, y2]
  color: string;
  type: 'reference' | 'target';
  planeId: string;
  realLength?: number;
  pixels?: number;
}

export interface Plane {
  id: string;
  name: string;
  referenceLengthFeet: string;
}

export interface CalibrationResult {
  lines: AnnotationLine[];
  isCalibrated: boolean;
  planesData: Record<string, { calibrationRatio?: number, isValid: boolean, warning?: string }>;
  validationWarning?: string;
  planes: Plane[];
}

interface PhotoAnnotatorProps {
  imageUrl: string;
  initialLines?: AnnotationLine[];
  initialPlanes?: Plane[];
  onSave: (result: CalibrationResult) => void;
  onCancel: () => void;
}

export default function PhotoAnnotator({ imageUrl, initialLines = [], initialPlanes = [], onSave, onCancel }: PhotoAnnotatorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [lines, setLines] = useState<AnnotationLine[]>(initialLines);
  
  const [planes, setPlanes] = useState<Plane[]>(initialPlanes.length > 0 ? initialPlanes : [{ id: 'plane-1', name: 'Front Wall', referenceLengthFeet: '16' }]);
  const [activePlaneId, setActivePlaneId] = useState<string>(initialPlanes.length > 0 ? initialPlanes[0].id : 'plane-1');
  
  const [drawingMode, setDrawingMode] = useState<'reference' | 'target'>('reference');
  const [isDrawing, setIsDrawing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const img = new window.Image();
    img.src = imageUrl;
    img.onload = () => {
      setImage(img);
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const scale = containerWidth / img.width;
        setDimensions({
          width: containerWidth,
          height: img.height * scale
        });
      }
    };
  }, [imageUrl]);

  const getStageFromEvent = (event: unknown) => {
    return (event as { target?: { getStage?: () => { getPointerPosition: () => { x: number; y: number } | null } } }).target?.getStage?.();
  };

  const handleMouseDown = (event: unknown) => {
    // Only allow one reference line per plane for now
    if (drawingMode === 'reference' && lines.some(l => l.type === 'reference' && l.planeId === activePlaneId)) {
      setNotice("Only one reference line is allowed per plane. Delete the existing one first.");
      return;
    }

    setIsDrawing(true);
    const pos = getStageFromEvent(event)?.getPointerPosition();
    if (!pos) return;
    const id = crypto.randomUUID();
    setLines([...lines, { 
      id, 
      points: [pos.x, pos.y, pos.x, pos.y], 
      color: drawingMode === 'reference' ? '#ef4444' : '#3b82f6',
      type: drawingMode,
      planeId: activePlaneId
    }]);
  };

  const handleMouseMove = (event: unknown) => {
    if (!isDrawing) return;
    
    const point = getStageFromEvent(event)?.getPointerPosition();
    if (!point) return;
    const newLines = [...lines];
    const lastLine = newLines[newLines.length - 1];
    
    lastLine.points[2] = point.x;
    lastLine.points[3] = point.y;
    
    setLines(newLines);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    
    // Calculate pixel lengths for all lines
    const newLines = lines.map(line => {
      const pxLength = Math.sqrt(
        Math.pow(line.points[2] - line.points[0], 2) + 
        Math.pow(line.points[3] - line.points[1], 2)
      );
      return { ...line, pixels: pxLength };
    });
    setLines(newLines);
  };

  const deleteLine = (id: string) => {
    setLines(lines.filter(l => l.id !== id));
  };

  const addPlane = () => {
    const id = `plane-${crypto.randomUUID()}`;
    setPlanes([...planes, { id, name: `Plane ${planes.length + 1}`, referenceLengthFeet: '16' }]);
    setActivePlaneId(id);
  };

  const deletePlane = (id: string) => {
    if (planes.length === 1) {
      setNotice("At least one plane is required.");
      return;
    }
    setPlanes(planes.filter(p => p.id !== id));
    setLines(lines.filter(l => l.planeId !== id));
    if (activePlaneId === id) {
      setActivePlaneId(planes.find(p => p.id !== id)!.id);
    }
  };

  const updatePlane = (id: string, updates: Partial<Plane>) => {
    setPlanes(planes.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSave = () => {
    let globalIsCalibrated = true;
    let globalValidationWarning = undefined;
    const planesData: Record<string, { calibrationRatio?: number, isValid: boolean, warning?: string }> = {};

    let hasAnyTargets = false;

    const updatedLines = [...lines];

    planes.forEach(plane => {
      const planeLines = updatedLines.filter(l => l.planeId === plane.id);
      const reference = planeLines.find(l => l.type === 'reference');
      const targets = planeLines.filter(l => l.type === 'target');
      
      if (targets.length === 0) {
        // Empty plane is technically valid but doesn't contribute
        planesData[plane.id] = { isValid: true };
        return;
      }
      
      hasAnyTargets = true;

      if (!reference) {
        planesData[plane.id] = { isValid: false, warning: `No reference line in ${plane.name}.` };
        globalIsCalibrated = false;
        globalValidationWarning = "One or more planes lack a reference line. Requires expert review.";
        return;
      }

      const realLen = parseFloat(plane.referenceLengthFeet);
      if (isNaN(realLen) || realLen <= 0) {
        planesData[plane.id] = { isValid: false, warning: `Invalid reference length in ${plane.name}.` };
        globalIsCalibrated = false;
        globalValidationWarning = "Invalid reference length provided.";
        return;
      }

      reference.realLength = realLen;
      const pixelsPerFoot = reference.pixels! / realLen;
      
      let planeWarning = undefined;
      targets.forEach(t => {
        if (t.pixels! > reference.pixels! * 5) {
          planeWarning = `Excessive perspective distortion in ${plane.name}.`;
          globalValidationWarning = "Some lines are significantly larger than the reference. Excessive perspective distortion may cause inaccurate calculation. Requires expert review.";
          globalIsCalibrated = false;
        }
      });

      planesData[plane.id] = {
        isValid: !planeWarning,
        calibrationRatio: pixelsPerFoot,
        warning: planeWarning
      };
    });

    if (!hasAnyTargets) {
      globalIsCalibrated = false;
    }

    onSave({
      lines: updatedLines,
      planes,
      isCalibrated: globalIsCalibrated,
      planesData,
      validationWarning: globalValidationWarning
    });
  };

  if (!image || dimensions.width === 0) {
    return (
      <div ref={containerRef} className="w-full h-64 bg-slate-100 animate-pulse flex items-center justify-center rounded-lg">
        Loading editor...
      </div>
    );
  }

  const scaleX = dimensions.width / image.width;
  const scaleY = dimensions.height / image.height;

  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Sidebar for Planes */}
      <div className="w-full md:w-64 bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col gap-4">
        <div className="font-bold text-slate-800 flex justify-between items-center">
          Planes
          <button onClick={addPlane} className="text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 px-2 py-1 rounded">
            + Add Plane
          </button>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[400px]">
          {planes.map(plane => (
            <div 
              key={plane.id} 
              className={`p-3 rounded-md border cursor-pointer ${activePlaneId === plane.id ? 'bg-white border-blue-400 shadow-sm' : 'bg-slate-100 border-slate-200 opacity-70'}`}
              onClick={() => setActivePlaneId(plane.id)}
            >
              <div className="flex justify-between items-center mb-2">
                <input 
                  type="text"
                  value={plane.name}
                  onChange={e => updatePlane(plane.id, { name: e.target.value })}
                  className="font-medium text-sm w-32 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-400 focus:outline-none"
                />
                <button onClick={(e) => { e.stopPropagation(); deletePlane(plane.id); }} className="text-slate-400 hover:text-red-500">
                  <span className="text-xs">✕</span>
                </button>
              </div>
              
              {activePlaneId === plane.id && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs text-slate-500 mb-1">Reference Length (ft):</div>
                  <input 
                    type="number" 
                    value={plane.referenceLengthFeet}
                    onChange={(e) => updatePlane(plane.id, { referenceLengthFeet: e.target.value })}
                    className="w-full p-1.5 border rounded-md text-sm"
                    placeholder="e.g. 16"
                  />
                  
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDrawingMode('reference'); }}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border ${drawingMode === 'reference' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                      Set Ref
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setDrawingMode('target'); }}
                      className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border ${drawingMode === 'target' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
                    >
                      Target Line
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Canvas Area */}
      <div className="flex-1 space-y-4">
        <div 
          ref={containerRef}
          className="w-full border border-slate-300 overflow-hidden cursor-crosshair touch-none bg-black rounded-lg"
        >
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={handleMouseDown}
            onMousemove={handleMouseMove}
            onMouseup={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
          >
            <Layer>
              <Image image={image} scaleX={scaleX} scaleY={scaleY} alt="House" />
              {lines.map((line) => {
                // Dim lines not in active plane
                const isActive = line.planeId === activePlaneId;
                return (
                  <Line
                    key={line.id}
                    points={line.points}
                    stroke={line.color}
                    strokeWidth={isActive ? 4 : 2}
                    opacity={isActive ? 1 : 0.4}
                    lineCap="round"
                    lineJoin="round"
                  />
                );
              })}
            </Layer>
          </Stage>
        </div>

        <div className="space-y-2">
          {notice && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium p-3 rounded-lg flex justify-between gap-3">
              <span>{notice}</span>
              <button type="button" onClick={() => setNotice(null)} className="font-bold text-amber-900">Dismiss</button>
            </div>
          )}
          {lines.filter(l => l.planeId === activePlaneId).map(line => (
            <div key={line.id} className="flex justify-between items-center bg-slate-50 p-2 rounded border">
              <span className="text-sm">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${line.type === 'reference' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
                {line.type === 'reference' ? 'Reference Line' : 'Target Line'}
              </span>
              <button onClick={() => deleteLine(line.id)} className="text-red-500 text-sm hover:underline">Remove</button>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
          <button onClick={onCancel} className="px-4 py-2 border border-slate-300 rounded-md font-medium text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition-colors">
            Save Annotations
          </button>
        </div>
      </div>
    </div>
  );
}
