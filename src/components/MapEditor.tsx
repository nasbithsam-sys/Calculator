"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { PenTool, CheckCircle2, RotateCcw, X, AlertCircle, Calculator, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';

export interface MapSection {
  id: string;
  name: string;
  type: 'horizontal_eave' | 'horizontal_perimeter' | 'sloped_peak' | 'hidden_section' | 'uncertain';
  path: { lat: number; lng: number }[];
  lengthFeet: number;
  geodesicLengthFeet: number;
}

interface MapEditorProps {
  initialCenter: { lat: number; lng: number };
  onSectionsChange: (sections: MapSection[]) => void;
}

export function MapEditor({ initialCenter, onSectionsChange }: MapEditorProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [sections, setSections] = useState<MapSection[]>([]);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<google.maps.LatLngLiteral[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const polylineRefs = useRef<Record<string, google.maps.Polyline>>({});
  
  const { isLoaded, error: scriptError } = useGoogleMaps();

  const updateSectionPath = useCallback((id: string, newPath: google.maps.LatLngLiteral[]) => {
    setSections(prev => prev.map(s => {
      if (s.id === id) {
        let lengthMeters = 0;
        if (newPath.length > 1 && window.google?.maps?.geometry) {
          lengthMeters = window.google.maps.geometry.spherical.computeLength(newPath);
        }
        const feet = lengthMeters * 3.28084;
        return { ...s, path: newPath, lengthFeet: feet, geodesicLengthFeet: feet };
      }
      return s;
    }));
  }, []);

  useEffect(() => {
    if (isLoaded && !map) {
      if (!mapRef.current || !window.google) return;
      const m = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 20,
        mapTypeId: 'satellite',
        tilt: 0,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: {
          position: window.google?.maps?.ControlPosition?.RIGHT_BOTTOM || 9
        }
      });
      setMap(m);
    }
  }, [initialCenter, isLoaded, map]);

  useEffect(() => {
    if (!map) return;

    Object.keys(polylineRefs.current).forEach(id => {
      if (!sections.find(s => s.id === id)) {
        polylineRefs.current[id].setMap(null);
        delete polylineRefs.current[id];
      }
    });

    sections.forEach(sec => {
      const isActive = sec.id === activeSectionId;
      
      let polyline = polylineRefs.current[sec.id];
      if (!polyline) {
        polyline = new window.google.maps.Polyline({
          map,
          path: sec.path,
          strokeColor: isActive ? '#0ea5e9' : '#10b981', // brand primary vs success
          strokeOpacity: 1.0,
          strokeWeight: isActive ? 6 : 4,
          editable: isActive,
        });
        
        polyline.addListener('click', () => {
          setActiveSectionId(sec.id);
        });

        const path = polyline.getPath();
        const handlePathChange = () => {
          const newPath = path.getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
          updateSectionPath(sec.id, newPath);
        };

        path.addListener('insert_at', handlePathChange);
        path.addListener('remove_at', handlePathChange);
        path.addListener('set_at', handlePathChange);
        
        polylineRefs.current[sec.id] = polyline;
      } else {
        polyline.setOptions({
          strokeColor: isActive ? '#0ea5e9' : '#10b981',
          strokeWeight: isActive ? 6 : 4,
          editable: isActive,
        });
        
        const currentPath = polyline.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
        if (JSON.stringify(currentPath) !== JSON.stringify(sec.path)) {
          polyline.setPath(sec.path);
        }
      }
    });

    onSectionsChange(sections);
  }, [sections, activeSectionId, map, onSectionsChange, updateSectionPath]);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!activeSectionId || !e.latLng) return;
    
    setSections(prev => prev.map(s => {
      if (s.id === activeSectionId) {
        const newPath = [...s.path, { lat: e.latLng!.lat(), lng: e.latLng!.lng() }];
        
        let lengthMeters = 0;
        if (newPath.length > 1 && window.google?.maps?.geometry) {
          lengthMeters = window.google.maps.geometry.spherical.computeLength(newPath);
        }
        
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newPath);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);

        return { ...s, path: newPath, lengthFeet: lengthMeters * 3.28084, geodesicLengthFeet: lengthMeters * 3.28084 };
      }
      return s;
    }));
  }, [activeSectionId, history, historyIndex]);

  useEffect(() => {
    if (map) {
      const listener = map.addListener('click', handleMapClick);
      return () => google.maps.event.removeListener(listener);
    }
  }, [handleMapClick, map]);

  const startNewSection = () => {
    const id = crypto.randomUUID();
    setSections(prev => [...prev, {
      id,
      name: `Section ${prev.length + 1}`,
      type: 'horizontal_eave',
      path: [],
      lengthFeet: 0,
      geodesicLengthFeet: 0
    }]);
    setActiveSectionId(id);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const finishSection = () => setActiveSectionId(null);

  const undo = () => {
    if (historyIndex > 0 && activeSectionId) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      updateSectionPath(activeSectionId, history[newIndex]);
    } else if (historyIndex === 0 && activeSectionId) {
      setHistoryIndex(-1);
      updateSectionPath(activeSectionId, []);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1 && activeSectionId) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      updateSectionPath(activeSectionId, history[newIndex]);
    }
  };

  const deleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    if (activeSectionId === id) setActiveSectionId(null);
  };
  
  const updateSectionType = (id: string, type: MapSection['type']) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, type } : s));
  };

  const updateSectionName = (id: string, name: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const clearAll = () => {
    setSections([]);
    setActiveSectionId(null);
    setHistory([]);
    setHistoryIndex(-1);
    setIsConfirmingClear(false);
  };

  const recenter = () => { if (map) map.setCenter(initialCenter); };

  const totalFeet = sections.reduce((sum, s) => sum + s.lengthFeet, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[75vh] min-h-[600px] w-full">
      
      {/* MAP AREA (Left/Top) */}
      <div className="flex-1 relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        
        {/* Drawing Tools Overlay */}
        <div className="absolute top-4 left-4 right-16 z-10 flex flex-wrap gap-2">
          {!activeSectionId ? (
            <div className="flex gap-2">
              <Button onClick={startNewSection} className="bg-primary hover:bg-primary/90 text-white font-bold shadow-md h-12 px-6 rounded-xl text-base">
                <PenTool className="w-5 h-5 mr-2" /> Start Drawing
              </Button>
              {sections.length > 0 && (
                <Button onClick={() => setIsConfirmingClear(true)} variant="outline" className="bg-white/95 backdrop-blur font-bold text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 h-12 rounded-xl shadow-sm">
                  <Trash className="w-5 h-5 mr-2" /> Clear All
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2 bg-white/95 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-primary/20 items-center">
              <div className="px-4 py-1 bg-primary/10 text-primary font-bold rounded-lg text-sm whitespace-nowrap flex items-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2" />
                Drawing Active
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button onClick={undo} disabled={historyIndex < 0} variant="outline" className="flex-1 sm:flex-none h-10 border-slate-200 bg-white">
                  <RotateCcw className="w-4 h-4 mr-2" /> Undo
                </Button>
                <Button onClick={redo} disabled={historyIndex >= history.length - 1} variant="outline" className="flex-1 sm:flex-none h-10 border-slate-200 bg-white">
                  Redo
                </Button>
                <Button onClick={finishSection} className="flex-1 sm:flex-none h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Finish
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-4 z-10">
          <Button onClick={recenter} variant="secondary" size="sm" className="bg-white/90 backdrop-blur shadow-md font-medium text-slate-700 hover:bg-white h-9 rounded-lg border border-slate-200">
            Recenter Map
          </Button>
        </div>

        <div ref={mapRef} className="w-full h-full cursor-crosshair" />
        {scriptError && (
          <div className="absolute inset-0 z-20 bg-white/95 flex items-center justify-center p-6 text-center">
            <div className="max-w-sm">
              <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
              <p className="font-bold text-slate-900">Map could not load</p>
              <p className="text-sm text-slate-600 mt-2">{scriptError.message}</p>
            </div>
          </div>
        )}
        {isConfirmingClear && (
          <div className="absolute inset-0 z-30 bg-slate-950/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-200 max-w-sm w-full">
              <h4 className="font-extrabold text-slate-900 text-lg">Clear drawn sections?</h4>
              <p className="text-sm text-slate-600 mt-2">This removes all roofline sections from the map.</p>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" className="flex-1" onClick={() => setIsConfirmingClear(false)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={clearAll}>Clear</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SIDEBAR (Right/Bottom) */}
      <div className="w-full lg:w-[400px] shrink-0 flex flex-col bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Measured Sections</h3>
            <p className="text-sm text-slate-500 font-medium">Click on the map to trace rooflines</p>
          </div>
          <div className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-lg text-sm">
            {sections.length}
          </div>
        </div>
        
        {/* Sections List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
              <Calculator className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-bold text-slate-500">No sections drawn yet.</p>
              <p className="text-sm text-slate-400 mt-1">Click &quot;Start Drawing&quot; to measure your home.</p>
            </div>
          ) : (
            sections.map(sec => {
              const isActive = sec.id === activeSectionId;
              return (
                <div key={sec.id} className={`p-4 rounded-xl border-2 transition-all ${isActive ? 'bg-blue-50 border-primary shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  
                  <div className="flex justify-between items-start mb-3 gap-2">
                    <input 
                      type="text" 
                      value={sec.name}
                      onChange={(e) => updateSectionName(sec.id, e.target.value)}
                      className="font-bold text-base text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-primary focus:outline-none p-0 w-full pb-0.5"
                    />
                    <Button variant="ghost" size="icon" onClick={() => deleteSection(sec.id)} className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 -mt-1 -mr-1 shrink-0">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <select 
                    value={sec.type}
                    onChange={(e) => updateSectionType(sec.id, e.target.value as MapSection['type'])}
                    className="w-full text-sm font-semibold text-slate-700 bg-slate-100/50 p-2.5 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary cursor-pointer appearance-none"
                  >
                    <option value="horizontal_eave">Horizontal Eave</option>
                    <option value="horizontal_perimeter">Horizontal Perimeter</option>
                    <option value="sloped_peak">Sloped Peak (Caution)</option>
                    <option value="hidden_section">Hidden Section</option>
                    <option value="uncertain">Uncertain / Other</option>
                  </select>

                  <div className="flex justify-between items-end bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="text-xs font-medium text-slate-500">
                      {sec.type === 'sloped_peak' && (
                        <span className="flex items-center text-amber-600 font-bold mb-1"><AlertCircle className="w-3 h-3 mr-1"/> Slope offset</span>
                      )}
                      {sec.path.length} points
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-slate-900 text-lg leading-none">
                        {sec.lengthFeet.toFixed(1)} <span className="text-slate-400 font-bold text-sm">ft</span>
                      </div>
                    </div>
                  </div>
                  
                  {!isActive && (
                    <Button variant="outline" onClick={() => setActiveSectionId(sec.id)} className="w-full mt-3 h-9 text-xs font-bold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 hover:text-primary">
                      Edit Shape
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
        
        {/* Sidebar Footer (Total) */}
        {sections.length > 0 && (
          <div className="p-5 bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-10 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <div className="text-3xl font-extrabold text-slate-900">
              {totalFeet.toFixed(1)} <span className="text-lg font-bold text-slate-400">ft</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
