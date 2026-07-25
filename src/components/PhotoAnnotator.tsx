"use client";

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';

const Stage = dynamic(() => import('react-konva').then(mod => mod.Stage), { ssr: false });
const Layer = dynamic(() => import('react-konva').then(mod => mod.Layer), { ssr: false });
const Image = dynamic(() => import('react-konva').then(mod => mod.Image), { ssr: false });
const Line = dynamic(() => import('react-konva').then(mod => mod.Line), { ssr: false });
const Circle = dynamic(() => import('react-konva').then(mod => mod.Circle), { ssr: false });

export interface AnnotationLine {
  id: string;
  points: number[]; // [x1, y1, x2, y2]
  color: string;
  type: 'reference' | 'target';
  realLength?: number;
  pixels?: number;
}

export interface CalibrationResult {
  lines: AnnotationLine[];
  isCalibrated: boolean;
  calibrationRatio?: number; // pixels per foot
  validationWarning?: string;
}

interface PhotoAnnotatorProps {
  imageUrl: string;
  initialLines?: AnnotationLine[];
  onSave: (result: CalibrationResult) => void;
  onCancel: () => void;
}

export default function PhotoAnnotator({ imageUrl, initialLines = [], onSave, onCancel }: PhotoAnnotatorProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [lines, setLines] = useState<AnnotationLine[]>(initialLines);
  const [drawingMode, setDrawingMode] = useState<'reference' | 'target'>('reference');
  const [isDrawing, setIsDrawing] = useState(false);
  const [referenceLengthFeet, setReferenceLengthFeet] = useState<string>('16');
  
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

  const handleMouseDown = (e: any) => {
    // Only allow one reference line per plane for now
    if (drawingMode === 'reference' && lines.some(l => l.type === 'reference')) {
      alert("Only one reference line allowed. Delete the existing one first.");
      return;
    }

    setIsDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    const id = Math.random().toString();
    setLines([...lines, { 
      id, 
      points: [pos.x, pos.y, pos.x, pos.y], 
      color: drawingMode === 'reference' ? '#ef4444' : '#3b82f6',
      type: drawingMode
    }]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    const point = stage.getPointerPosition();
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

  const handleSave = () => {
    const reference = lines.find(l => l.type === 'reference');
    const targets = lines.filter(l => l.type === 'target');

    if (!reference && targets.length > 0) {
      // No reference, fallback to expert review
      onSave({
        lines,
        isCalibrated: false,
        validationWarning: "No scale reference provided. Requires expert review."
      });
      return;
    }

    if (reference) {
      const realLen = parseFloat(referenceLengthFeet);
      if (isNaN(realLen) || realLen <= 0) {
        alert("Please enter a valid real length for the reference line.");
        return;
      }
      
      const updatedLines = [...lines].map(l => {
        if (l.type === 'reference') return { ...l, realLength: realLen };
        return l;
      });

      const pixelsPerFoot = reference.pixels! / realLen;
      
      // Basic perspective validation - check if targets are way too big/small compared to reference
      let validationWarning = undefined;
      targets.forEach(t => {
        if (t.pixels! > reference.pixels! * 5) {
          validationWarning = "Some lines are significantly larger than the reference. Excessive perspective distortion may cause inaccurate calculation. Requires expert review.";
        }
      });

      onSave({
        lines: updatedLines,
        isCalibrated: !validationWarning,
        calibrationRatio: pixelsPerFoot,
        validationWarning
      });
    } else {
      // Nothing drawn
      onSave({ lines: [], isCalibrated: false });
    }
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

  const refLine = lines.find(l => l.type === 'reference');

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 border border-slate-200 p-4 rounded-t-lg">
        <div className="space-y-2">
          <div className="text-sm font-semibold">1. Draw a reference line</div>
          <div className="flex gap-2 text-sm">
            <button 
              onClick={() => setDrawingMode('reference')}
              className={`px-3 py-1.5 rounded-md font-medium border ${drawingMode === 'reference' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              Set Reference
            </button>
            <input 
              type="number" 
              value={referenceLengthFeet}
              onChange={(e) => setReferenceLengthFeet(e.target.value)}
              className="w-24 p-1.5 border rounded-md"
              placeholder="e.g. 16"
              disabled={drawingMode !== 'reference'}
            />
            <span className="self-center">feet</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-semibold">2. Draw lighting lines</div>
          <button 
            onClick={() => setDrawingMode('target')}
            className={`px-3 py-1.5 rounded-md font-medium border ${drawingMode === 'target' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-600'}`}
          >
            Draw Target Line
          </button>
        </div>
      </div>
      
      <div 
        ref={containerRef}
        className="w-full border border-slate-300 overflow-hidden cursor-crosshair touch-none bg-black"
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
            {lines.map((line) => (
              <Line
                key={line.id}
                points={line.points}
                stroke={line.color}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            ))}
          </Layer>
        </Stage>
      </div>

      <div className="space-y-2">
        {lines.map(line => (
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
  );
}
