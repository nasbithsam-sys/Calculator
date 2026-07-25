"use client";

import { useEffect, useRef, useState } from 'react';
import { env } from '@/lib/env';

export interface MapSection {
  id: string;
  name: string;
  type: 'horizontal_eave' | 'horizontal_perimeter' | 'sloped_peak' | 'hidden_section' | 'uncertain';
  path: { lat: number; lng: number }[];
  lengthFeet: number; // For horizontal, this is geolength. For sloped, it requires manual adjustment later
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
  
  // Undo/Redo stack for current section
  const [history, setHistory] = useState<google.maps.LatLngLiteral[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const polylineRefs = useRef<Record<string, google.maps.Polyline>>({});

  useEffect(() => {
    if (!window.google && !document.getElementById('google-maps-script')) {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${env.NEXT_PUBLIC_GOOGLE_MAPS_BROWSER_KEY}&libraries=geometry&v=weekly`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
      
      script.onload = initMap;
    } else if (window.google) {
      initMap();
    }

    function initMap() {
      if (!mapRef.current) return;
      const m = new window.google.maps.Map(mapRef.current, {
        center: initialCenter,
        zoom: 20, // Max zoom for satellite
        mapTypeId: 'satellite',
        tilt: 0, // Force top-down view
        disableDefaultUI: true, // We will build custom UI
        zoomControl: true,
      });
      setMap(m);
    }
  }, [initialCenter]);

  // Sync sections to polylines
  useEffect(() => {
    if (!map) return;

    // Remove deleted polylines
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
          strokeColor: isActive ? '#3b82f6' : '#10b981', // Blue if active, Green if done
          strokeOpacity: 1.0,
          strokeWeight: 4,
          editable: isActive,
        });
        
        polyline.addListener('click', () => {
          setActiveSectionId(sec.id);
        });

        // Listen for edits
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
        // Update existing
        polyline.setOptions({
          strokeColor: isActive ? '#3b82f6' : '#10b981',
          editable: isActive,
        });
        
        // Only update path if it changed externally (to avoid loop)
        const currentPath = polyline.getPath().getArray().map(p => ({ lat: p.lat(), lng: p.lng() }));
        if (JSON.stringify(currentPath) !== JSON.stringify(sec.path)) {
          polyline.setPath(sec.path);
        }
      }
    });

    onSectionsChange(sections);
  }, [sections, activeSectionId, map]);

  const updateSectionPath = (id: string, newPath: google.maps.LatLngLiteral[]) => {
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
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
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
  };

  useEffect(() => {
    if (map) {
      const listener = map.addListener('click', handleMapClick);
      return () => google.maps.event.removeListener(listener);
    }
  }, [map, activeSectionId, history, historyIndex]);

  const startNewSection = () => {
    const id = Math.random().toString();
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

  const finishSection = () => {
    setActiveSectionId(null);
  };

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

  const recenter = () => {
    if (map) map.setCenter(initialCenter);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[70vh] min-h-[500px]">
      <div className="w-full md:w-3/4 relative rounded-xl overflow-hidden border border-slate-200 shadow-sm flex flex-col">
        <div ref={mapRef} className="flex-1 w-full h-full" />
        
        {/* Map Overlays & Controls - Desktop overlay, Mobile bottom bar */}
        <div className="absolute top-4 left-4 hidden md:flex flex-col bg-white/95 backdrop-blur-sm shadow-lg rounded-xl p-3 space-y-2 w-48 border border-slate-200/60 z-10">
          {!activeSectionId ? (
            <button onClick={startNewSection} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-all">
              + Add Section
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-bold text-blue-800 uppercase tracking-wider bg-blue-50 px-2 py-1 rounded">Drawing...</div>
              <button onClick={finishSection} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition-all">
                Finish Section
              </button>
              <div className="flex gap-2">
                <button onClick={undo} disabled={historyIndex < 0} className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                  Undo
                </button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors">
                  Redo
                </button>
              </div>
            </div>
          )}
          <button onClick={recenter} className="w-full bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 transition-colors">
            Recenter Map
          </button>
        </div>

        {/* Mobile bottom bar */}
        <div className="md:hidden bg-white border-t border-slate-200 p-3 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          {!activeSectionId ? (
            <div className="flex gap-2">
              <button onClick={startNewSection} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-semibold shadow-sm">
                + Add Section
              </button>
              <button onClick={recenter} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-lg text-sm font-medium border border-slate-200">
                Recenter
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button onClick={undo} disabled={historyIndex < 0} className="bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 px-4 py-3 rounded-lg text-sm font-semibold">
                Undo
              </button>
              <button onClick={finishSection} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg text-sm font-semibold shadow-sm">
                Finish
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sections Drawer/Sidebar */}
      <div className="w-full md:w-1/4 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900">Measured Sections</h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">{sections.length}</span>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 bg-slate-50/50">
          {sections.length === 0 ? (
            <div className="text-sm text-slate-500 text-center mt-10 bg-white p-6 rounded-xl border border-dashed border-slate-200">
              No sections drawn. Click "Add Section" to start clicking points on the roof.
            </div>
          ) : (
            <div className="space-y-3">
              {sections.map(sec => (
                <div key={sec.id} className={`p-3 rounded-xl border transition-all ${sec.id === activeSectionId ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-100' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <input 
                      type="text" 
                      value={sec.name}
                      onChange={(e) => setSections(prev => prev.map(s => s.id === sec.id ? { ...s, name: e.target.value } : s))}
                      className="font-bold text-sm text-slate-900 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none p-0 w-3/4 pb-0.5 transition-colors"
                    />
                    <button onClick={() => deleteSection(sec.id)} className="text-slate-400 hover:text-red-600 bg-slate-100 hover:bg-red-50 p-1.5 rounded-md transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                    </button>
                  </div>
                  
                  <select 
                    value={sec.type}
                    onChange={(e) => updateSectionType(sec.id, e.target.value as any)}
                    className="w-full text-xs font-medium text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="horizontal_eave">Horizontal Eave</option>
                    <option value="horizontal_perimeter">Horizontal Perimeter</option>
                    <option value="sloped_peak">Sloped Peak (Caution)</option>
                    <option value="hidden_section">Hidden Section</option>
                    <option value="uncertain">Uncertain</option>
                  </select>

                  <div className="flex justify-between items-end bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                    <div className="text-xs text-slate-500">
                      {sec.type === 'sloped_peak' && (
                        <span className="text-orange-600 font-medium block mb-1">Requires slope adjustment</span>
                      )}
                      {sec.path.length} points
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {sec.lengthFeet.toFixed(1)} <span className="text-slate-500 font-medium text-xs">ft</span>
                    </div>
                  </div>
                  
                  {sec.id !== activeSectionId && (
                    <button onClick={() => setActiveSectionId(sec.id)} className="w-full text-xs font-semibold bg-white border border-slate-200 shadow-sm hover:bg-slate-50 text-slate-700 py-2 rounded-lg mt-3 transition-colors">
                      Edit Shape
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {sections.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)] z-10">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total</span>
            <span className="text-xl font-bold text-slate-900">
              {sections.reduce((sum, s) => sum + s.lengthFeet, 0).toFixed(1)} <span className="text-sm font-medium text-slate-500">ft</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
