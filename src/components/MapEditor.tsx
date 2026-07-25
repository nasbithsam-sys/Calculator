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
    <div className="flex flex-col md:flex-row gap-4 h-[600px]">
      <div className="w-full md:w-3/4 relative rounded-xl overflow-hidden border border-slate-200">
        <div ref={mapRef} className="w-full h-full" />
        
        {/* Map Overlays & Controls */}
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur shadow-md rounded-lg p-2 space-y-2">
          {!activeSectionId ? (
            <button onClick={startNewSection} className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
              + Draw New Section
            </button>
          ) : (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-blue-800">Drawing Active Section</div>
              <button onClick={finishSection} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-sm font-medium">
                Finish Section
              </button>
              <div className="flex gap-2">
                <button onClick={undo} disabled={historyIndex < 0} className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 px-2 py-1 rounded text-xs font-medium">
                  Undo
                </button>
                <button onClick={redo} disabled={historyIndex >= history.length - 1} className="flex-1 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 px-2 py-1 rounded text-xs font-medium">
                  Redo
                </button>
              </div>
            </div>
          )}
          <button onClick={recenter} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 px-4 py-1.5 rounded text-xs font-medium border border-slate-200 mt-2">
            Recenter Map
          </button>
        </div>
      </div>

      <div className="w-full md:w-1/4 bg-slate-50 border border-slate-200 rounded-xl p-4 overflow-y-auto">
        <h3 className="font-semibold text-slate-900 mb-4">Measured Sections</h3>
        
        {sections.length === 0 ? (
          <div className="text-sm text-slate-500 text-center mt-10">
            No sections drawn. Click "Draw New Section" to start clicking points on the roof.
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map(sec => (
              <div key={sec.id} className={`p-3 rounded-lg border ${sec.id === activeSectionId ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                <div className="flex justify-between items-start mb-2">
                  <input 
                    type="text" 
                    value={sec.name}
                    onChange={(e) => setSections(prev => prev.map(s => s.id === sec.id ? { ...s, name: e.target.value } : s))}
                    className="font-medium text-sm text-slate-900 bg-transparent border-none p-0 focus:ring-0"
                  />
                  <button onClick={() => deleteSection(sec.id)} className="text-slate-400 hover:text-red-600 p-1">
                    ×
                  </button>
                </div>
                
                <select 
                  value={sec.type}
                  onChange={(e) => updateSectionType(sec.id, e.target.value as any)}
                  className="w-full text-xs p-1.5 border border-slate-200 rounded mb-2"
                >
                  <option value="horizontal_eave">Horizontal Eave</option>
                  <option value="horizontal_perimeter">Horizontal Perimeter</option>
                  <option value="sloped_peak">Sloped Peak (Caution)</option>
                  <option value="hidden_section">Hidden Section</option>
                  <option value="uncertain">Uncertain</option>
                </select>

                <div className="flex justify-between items-end">
                  <div className="text-xs text-slate-500">
                    {sec.type === 'sloped_peak' && (
                      <span className="text-orange-600 block mb-1">Requires manual slope adjustment</span>
                    )}
                    {sec.path.length} points
                  </div>
                  <div className="font-bold text-slate-900 text-sm">
                    {sec.lengthFeet.toFixed(1)} ft
                  </div>
                </div>
                
                {sec.id !== activeSectionId && (
                  <button onClick={() => setActiveSectionId(sec.id)} className="w-full text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1 rounded mt-2">
                    Edit Shape
                  </button>
                )}
              </div>
            ))}
            
            <div className="pt-4 border-t border-slate-200 mt-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total Measured</span>
              <span className="text-lg font-bold text-blue-700">
                {sections.reduce((sum, s) => sum + s.lengthFeet, 0).toFixed(1)} ft
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
