import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { globeDefaulterPoints, defaulters } from '../../data/mockData';

// Theme Configurations for Globe Visualization
const THEMES = {
  blueprint: {
    bgGradStart: '#1a3a5c',
    bgGradMid: '#0a1f35',
    bgGradEnd: '#020b18',
    gridColor: 'rgba(30,144,255,0.05)',
    borderColor: 'rgba(0, 220, 255, 0.22)',
    landFill: 'rgba(30, 144, 255, 0.08)',
    globeOutline: 'rgba(30,144,255,0.25)',
    glowStart: 'rgba(30,144,255,0.15)',
    selectedRing: 'rgba(0, 212, 255, 0.45)',
    dotGradStartSel: 'rgba(100, 230, 255, ',
    dotGradEndSel: 'rgba(0, 212, 255, ',
    dotGradStart: 'rgba(255, 100, 120, ',
    dotGradEnd: 'rgba(255, 45, 85, ',
    pulseColorSel: '0, 212, 255',
    pulseColor: '255, 45, 85',
    labelTextColor: 'var(--cyber-cyan)',
    arcColor: 'rgba(0, 212, 255, 0.25)',
    particleColor: 'rgba(0, 212, 255, 0.8)',
    outerGlowStart: 'rgba(30,144,255,0.05)',
    outerGlowEnd: 'rgba(30,144,255,0)',
    labelSubColor: 'rgba(232,244,255,',
    inspectBg: 'rgba(6, 20, 35, 0.92)'
  },
  magma: {
    bgGradStart: '#3a1a1a',
    bgGradMid: '#240b0b',
    bgGradEnd: '#0d0202',
    gridColor: 'rgba(255,69,0,0.06)',
    borderColor: 'rgba(255, 99, 71, 0.24)',
    landFill: 'rgba(255, 69, 0, 0.08)',
    globeOutline: 'rgba(255,69,0,0.25)',
    glowStart: 'rgba(255,69,0,0.15)',
    selectedRing: 'rgba(255, 215, 0, 0.55)',
    dotGradStartSel: 'rgba(255, 230, 100, ',
    dotGradEndSel: 'rgba(255, 140, 0, ',
    dotGradStart: 'rgba(255, 50, 50, ',
    dotGradEnd: 'rgba(180, 0, 0, ',
    pulseColorSel: '255, 140, 0',
    pulseColor: '220, 20, 60',
    labelTextColor: '#FF8C00',
    arcColor: 'rgba(255, 140, 0, 0.25)',
    particleColor: 'rgba(255, 215, 0, 0.8)',
    outerGlowStart: 'rgba(255,69,0,0.05)',
    outerGlowEnd: 'rgba(255,69,0,0)',
    labelSubColor: 'rgba(255,220,220,',
    inspectBg: 'rgba(30, 10, 10, 0.92)'
  },
  matrix: {
    bgGradStart: '#0d2b14',
    bgGradMid: '#06170a',
    bgGradEnd: '#010502',
    gridColor: 'rgba(0,255,136,0.05)',
    borderColor: 'rgba(0, 255, 136, 0.22)',
    landFill: 'rgba(0, 255, 136, 0.08)',
    globeOutline: 'rgba(0,255,136,0.25)',
    glowStart: 'rgba(0,255,136,0.15)',
    selectedRing: 'rgba(173, 255, 47, 0.5)',
    dotGradStartSel: 'rgba(200, 255, 100, ',
    dotGradEndSel: 'rgba(124, 252, 0, ',
    dotGradStart: 'rgba(50, 205, 50, ',
    dotGradEnd: 'rgba(0, 100, 0, ',
    pulseColorSel: '173, 255, 47',
    pulseColor: '0, 255, 136',
    labelTextColor: '#00FF88',
    arcColor: 'rgba(0, 255, 136, 0.25)',
    particleColor: 'rgba(173, 255, 47, 0.8)',
    outerGlowStart: 'rgba(0,255,136,0.05)',
    outerGlowEnd: 'rgba(0,255,136,0)',
    labelSubColor: 'rgba(220,255,220,',
    inspectBg: 'rgba(5, 20, 10, 0.92)'
  }
};

// Interactive 3D Globe with Country Map outlines using Canvas 2D
function GlobeCanvas({ selected, onSelect, autoRotate, theme }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({ rotation: 0, dragging: false, lastX: 0, startX: 0, startY: 0, animFrame: null });
  const mapDataRef = useRef(null);
  const projectedPointsRef = useRef([]);
  
  // Use refs for selected, autoRotate, and theme to avoid stale closures in canvas loop
  const selectedRef = useRef(selected);
  const autoRotateRef = useRef(autoRotate);
  const themeRef = useRef(theme);

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  // Load simplified world map GeoJSON from public folder
  useEffect(() => {
    fetch('/world-countries.json')
      .then(res => res.json())
      .then(data => {
        mapDataRef.current = data;
      })
      .catch(err => console.error("Error loading globe map data:", err));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * 0.42;

    const toXY = (lat, lng, rot) => {
      const latR = (lat * Math.PI) / 180;
      const lngR = ((lng + rot) * Math.PI) / 180;
      const x = cx + R * Math.cos(latR) * Math.sin(lngR);
      const y = cy - R * Math.sin(latR);
      const z = Math.cos(latR) * Math.cos(lngR);
      return { x, y, z };
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const rot = stateRef.current.rotation;
      projectedPointsRef.current = [];

      const tStyle = THEMES[themeRef.current] || THEMES.blueprint;

      // Outer glow
      const outerGlow = ctx.createRadialGradient(cx, cy, R * 0.8, cx, cy, R * 1.3);
      outerGlow.addColorStop(0, tStyle.outerGlowStart);
      outerGlow.addColorStop(1, tStyle.outerGlowEnd);
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.3, 0, Math.PI * 2);
      ctx.fillStyle = outerGlow; ctx.fill();

      // Globe background
      const globeGrad = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R);
      globeGrad.addColorStop(0, tStyle.bgGradStart);
      globeGrad.addColorStop(0.5, tStyle.bgGradMid);
      globeGrad.addColorStop(1, tStyle.bgGradEnd);
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = globeGrad; ctx.fill();

      // Latitude/longitude grid lines
      ctx.strokeStyle = tStyle.gridColor;
      ctx.lineWidth = 0.6;
      for (let lat = -75; lat <= 75; lat += 30) {
        ctx.beginPath();
        for (let lng = -180; lng <= 180; lng += 5) {
          const { x, y, z } = toXY(lat, lng, rot);
          if (z > 0) lng === -180 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const { x, y, z } = toXY(lat, lng, rot);
          if (z > 0) lat === -90 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw country shapes
      const mapData = mapDataRef.current;
      if (mapData) {
        ctx.beginPath();
        mapData.features.forEach(feature => {
          const geometry = feature.geometry;
          if (!geometry) return;

          const drawRing = (ring) => {
            let openPath = false;
            for (let i = 0; i < ring.length; i++) {
              const [lng, lat] = ring[i];
              const { x, y, z } = toXY(lat, lng, rot);
              
              if (z > 0) {
                if (!openPath) {
                  ctx.moveTo(x, y);
                  openPath = true;
                } else {
                  ctx.lineTo(x, y);
                }
              } else {
                openPath = false;
              }
            }
          };

          if (geometry.type === 'Polygon') {
            geometry.coordinates.forEach(ring => drawRing(ring));
          } else if (geometry.type === 'MultiPolygon') {
            geometry.coordinates.forEach(polygon => {
              polygon.forEach(ring => drawRing(ring));
            });
          }
        });
        
        ctx.fillStyle = tStyle.landFill;
        ctx.fill();
        ctx.strokeStyle = tStyle.borderColor;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Globe edge
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = tStyle.globeOutline; ctx.lineWidth = 1.5; ctx.stroke();

      // Atmosphere edge glow
      const atmoGrad = ctx.createRadialGradient(cx, cy, R - 4, cx, cy, R + 20);
      atmoGrad.addColorStop(0, tStyle.glowStart);
      atmoGrad.addColorStop(1, tStyle.outerGlowEnd);
      ctx.beginPath(); ctx.arc(cx, cy, R + 20, 0, Math.PI * 2);
      ctx.fillStyle = atmoGrad; ctx.fill();

      // Plot defaulter city points
      globeDefaulterPoints.forEach((pt) => {
        const { x, y, z } = toXY(pt.lat, pt.lng, rot);
        if (z < 0) return;

        const isSelected = selectedRef.current === pt.city;
        const alpha = (0.5 + z * 0.5) * (isSelected ? 1.0 : 0.8);
        const size = (4 + pt.intensity * 8) * (isSelected ? 1.4 : 1.0);

        // Keep track of projected points for click detection
        projectedPointsRef.current.push({ x, y, city: pt.city });

        // Highlight selection crosshair if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(x, y, size * 2.2, 0, Math.PI * 2);
          ctx.strokeStyle = tStyle.selectedRing;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([3, 3]);
          ctx.stroke();
          ctx.setLineDash([]); // Reset
        }

        // Pulse rings
        const time = Date.now() / 1000;
        const pulseColor = isSelected ? tStyle.pulseColorSel : tStyle.pulseColor;
        for (let ring = 0; ring < 3; ring++) {
          const pulseR = size + (ring * 8) + ((time * 2 + ring) % 1) * 12;
          const pulseAlpha = ((1 - ((time * 2 + ring) % 1)) * 0.4 * alpha);
          ctx.beginPath(); ctx.arc(x, y, pulseR, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${pulseColor}, ${pulseAlpha})`; ctx.lineWidth = isSelected ? 1.5 : 1; ctx.stroke();
        }

        // Core dot
        ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        const dotGrad = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
        if (isSelected) {
          dotGrad.addColorStop(0, `${tStyle.dotGradStartSel}${alpha})`);
          dotGrad.addColorStop(1, `${tStyle.dotGradEndSel}${alpha * 0.8})`);
          ctx.shadowColor = `rgba(${tStyle.pulseColorSel}, 0.9)`;
        } else {
          dotGrad.addColorStop(0, `${tStyle.dotGradStart}${alpha})`);
          dotGrad.addColorStop(1, `${tStyle.dotGradEnd}${alpha * 0.8})`);
          ctx.shadowColor = `rgba(${tStyle.pulseColor}, 0.8)`;
        }
        ctx.fillStyle = dotGrad;
        ctx.shadowBlur = isSelected ? 20 : 12;
        ctx.fill(); ctx.shadowBlur = 0;

        // Label
        if (z > 0.25 || isSelected) {
          ctx.fillStyle = isSelected ? '#ffffff' : `${tStyle.labelSubColor}${alpha * 0.9})`;
          ctx.font = `${isSelected ? 'bold 11px' : 'bold 10px'} Inter, sans-serif`;
          ctx.fillText(pt.city, x + size / 2 + 5, y + 3);
          
          ctx.fillStyle = isSelected ? tStyle.labelTextColor : `rgba(${tStyle.pulseColor}, ${alpha * 0.85})`;
          ctx.font = `9px JetBrains Mono, monospace`;
          ctx.fillText(`${pt.count} defaulters`, x + size / 2 + 5, y + 13);
        }
      });

      // Draw connection arcs from selected city
      const selCity = selectedRef.current;
      if (selCity) {
        const startPt = globeDefaulterPoints.find(p => p.city === selCity);
        if (startPt) {
          const { x: x1, y: y1, z: z1 } = toXY(startPt.lat, startPt.lng, rot);
          
          if (z1 > 0) { // Only draw if visible
            globeDefaulterPoints.forEach((pt) => {
              if (pt.city === selCity) return;
              
              const { x: x2, y: y2, z: z2 } = toXY(pt.lat, pt.lng, rot);
              if (z2 < 0) return; // Hide arcs to back side
              
              // Bow control point outward relative to globe center (cx, cy)
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2;
              const vx = mx - cx;
              const vy = my - cy;
              const len = Math.sqrt(vx * vx + vy * vy) || 1;
              
              const distBetween = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
              const heightFactor = Math.min(R * 0.5, distBetween * 0.4);
              const cx_arc = mx + (vx / len) * heightFactor;
              const cy_arc = my + (vy / len) * heightFactor;
              
              // Draw arc
              ctx.beginPath();
              ctx.moveTo(x1, y1);
              ctx.quadraticCurveTo(cx_arc, cy_arc, x2, y2);
              const avgZ = (z1 + z2) / 2;
              ctx.strokeStyle = tStyle.arcColor;
              ctx.lineWidth = 1.0 + avgZ * 0.8;
              ctx.stroke();
              
              // Draw moving particle
              const time = Date.now() / 1500;
              const t = (time + pt.lat * 0.05 + pt.lng * 0.03) % 1;
              const px = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx_arc + t * t * x2;
              const py = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy_arc + t * t * y2;
              
              ctx.beginPath();
              ctx.arc(px, py, 2.5, 0, Math.PI * 2);
              ctx.fillStyle = tStyle.particleColor;
              ctx.shadowColor = tStyle.particleColor;
              ctx.shadowBlur = 8;
              ctx.fill();
              ctx.shadowBlur = 0;
            });
          }
        }
      }

      // Smoothly rotate to selected city or auto-rotate
      if (!stateRef.current.dragging) {
        const selCity = selectedRef.current;
        const selPoint = selCity ? globeDefaulterPoints.find(p => p.city === selCity) : null;
        
        if (selPoint) {
          const targetRot = -selPoint.lng;
          let diff = ((targetRot - stateRef.current.rotation + 180) % 360) - 180;
          if (diff < -180) diff += 360;
          
          if (Math.abs(diff) > 0.05) {
            stateRef.current.rotation += diff * 0.08;
          }
        } else if (autoRotateRef.current) {
          stateRef.current.rotation += 0.12;
        }
      }
      stateRef.current.animFrame = requestAnimationFrame(draw);
    };

    draw();

    const onMouseDown = (e) => {
      stateRef.current.dragging = true;
      stateRef.current.lastX = e.clientX;
      stateRef.current.startX = e.clientX;
      stateRef.current.startY = e.clientY;
    };

    const onMouseMove = (e) => {
      if (stateRef.current.dragging) {
        stateRef.current.rotation += (e.clientX - stateRef.current.lastX) * 0.35;
        stateRef.current.lastX = e.clientX;
      }
    };

    const onMouseUp = (e) => {
      stateRef.current.dragging = false;
      
      const dx = e.clientX - stateRef.current.startX;
      const dy = e.clientY - stateRef.current.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < 5) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let clickedPin = null;
        for (const pt of projectedPointsRef.current) {
          const pdx = mouseX - pt.x;
          const pdy = mouseY - pt.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < 15) {
            clickedPin = pt.city;
            break;
          }
        }
        
        onSelect(clickedPin);
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      cancelAnimationFrame(stateRef.current.animFrame);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={700}
      height={580}
      style={{ width: '100%', height: '100%', cursor: 'grab', display: 'block' }}
    />
  );
}

export default function RiskGlobe() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedCity, setSelectedCity] = useState(location.state?.highlightCity || null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [theme, setTheme] = useState('blueprint');
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic statistics
  const totalDefaulters = globeDefaulterPoints.reduce((sum, pt) => sum + pt.count, 0);
  const totalOutstanding = (totalDefaulters * 0.076).toFixed(1); // ₹ Cr representation
  const citiesTracked = globeDefaulterPoints.length;

  const activeCityData = selectedCity 
    ? globeDefaulterPoints.find(p => p.city === selectedCity) 
    : null;

  // Filter cities by search query
  const filteredPoints = globeDefaulterPoints.filter(pt =>
    pt.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter defaulters in the selected city cluster
  const cityBorrowers = selectedCity
    ? defaulters.filter(d => d.location.toLowerCase() === selectedCity.toLowerCase())
    : [];

  const tStyle = THEMES[theme] || THEMES.blueprint;

  return (
    <div className="page-container" style={{ height: 'calc(100vh - 84px)', overflow: 'hidden', paddingBottom: '10px' }}>
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <div className="section-title" style={{ fontSize: '18px' }}>
          <span className="dot" />🌐 3D Defaulter Risk Globe
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Click or Drag to Rotate · Click pins directly to inspect
        </span>
      </div>

      <div className="globe-page">
        {/* Globe Canvas */}
        <motion.div
          className="glass-card globe-canvas-wrapper"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'relative', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '520px',
            background: theme === 'magma' ? 'rgba(20, 5, 5, 0.45)' : theme === 'matrix' ? 'rgba(5, 20, 5, 0.45)' : 'rgba(13,27,42,0.4)'
          }}
        >
          {/* Controls Overlay */}
          <div style={{
            position: 'absolute', top: '16px', right: '16px', zIndex: 10,
            display: 'flex', gap: '8px', alignItems: 'center'
          }}>
            {/* Play/Pause Button */}
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              style={{
                background: 'rgba(6, 20, 35, 0.85)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
                padding: '6px 12px', fontSize: '11px', color: 'white', cursor: 'pointer',
                fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              {autoRotate ? '⏸️ Pause' : '▶️ Play'}
            </button>
            
            {/* Theme Tabs */}
            <div style={{
              background: 'rgba(6, 20, 35, 0.85)', backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px',
              padding: '2px', display: 'flex', gap: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
            }}>
              {[
                { id: 'blueprint', label: 'Blueprint' },
                { id: 'magma', label: 'Magma' },
                { id: 'matrix', label: 'Matrix' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={{
                    background: theme === t.id ? 'var(--electric-blue)' : 'transparent',
                    border: 'none', borderRadius: '6px',
                    padding: '4px 10px', fontSize: '11px', color: 'white', cursor: 'pointer',
                    fontFamily: 'var(--font-main)', fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <GlobeCanvas selected={selectedCity} onSelect={setSelectedCity} autoRotate={autoRotate} theme={theme} />

          {/* Overlay Stats */}
          <div className="globe-overlay">
            <div className="globe-stat">
              <div className="globe-stat-label">Total Defaulters</div>
              <div className="globe-stat-val" style={{ color: 'var(--risk-vhigh)' }}>
                {totalDefaulters.toLocaleString()}
              </div>
            </div>
            <div className="globe-stat">
              <div className="globe-stat-label">Outstanding</div>
              <div className="globe-stat-val">₹{totalOutstanding} Cr</div>
            </div>
            <div className="globe-stat">
              <div className="globe-stat-label">Cities Tracked</div>
              <div className="globe-stat-val" style={{ color: 'var(--electric-blue)' }}>
                {citiesTracked}
              </div>
            </div>
          </div>

          {/* Interactive Inspect Panel */}
          {selectedCity && activeCityData && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '16px',
                width: '280px',
                background: tStyle.inspectBg,
                backdropFilter: 'blur(12px)',
                border: `1px solid ${theme === 'magma' ? 'var(--risk-high)' : theme === 'matrix' ? '#00FF88' : 'var(--electric-blue)'}`,
                boxShadow: theme === 'magma' ? '0 0 20px rgba(255, 69, 0, 0.25)' : theme === 'matrix' ? '0 0 20px rgba(0, 255, 136, 0.25)' : 'var(--glow-blue)',
                borderRadius: '12px',
                padding: '16px',
                zIndex: 10
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white' }}>📍 {activeCityData.city} Cluster</span>
                <button
                  onClick={() => setSelectedCity(null)}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    cursor: 'pointer', fontSize: '14px', padding: '0 4px'
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Defaulters Count:</span>
                  <span style={{ color: 'white', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                    {activeCityData.count}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Risk Density:</span>
                  <span style={{
                    color: activeCityData.intensity > 0.75 ? 'var(--risk-vhigh)' :
                           activeCityData.intensity > 0.5  ? 'var(--risk-high)' : 'var(--risk-mod)',
                    fontFamily: 'var(--font-mono)', fontWeight: 'bold'
                  }}>
                    {Math.round(activeCityData.intensity * 100)}%
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Est. Exposure:</span>
                  <span style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                    ₹{(activeCityData.count * 0.082).toFixed(2)} Cr
                  </span>
                </div>
              </div>

              {/* Defaulter cluster list */}
              <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>Defaulters in Cluster:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '110px', overflowY: 'auto', paddingRight: '4px' }}>
                  {cityBorrowers.length === 0 ? (
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>No detailed profile in database.</div>
                  ) : (
                    cityBorrowers.map(b => (
                      <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: 'white' }}>{b.name}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{b.id} · DPD {b.dpd}d</div>
                        </div>
                        <button
                          onClick={() => navigate('/defaulters', { state: { searchQuery: b.id } })}
                          style={{
                            background: 'rgba(30,144,255,0.15)', border: '1px solid rgba(30,144,255,0.3)',
                            borderRadius: '4px', color: 'var(--cyber-cyan)', fontSize: '9px', padding: '3px 8px',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          Track
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Interaction hint */}
          <div style={{
            position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(6,20,35,0.85)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px',
            padding: '6px 16px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            display: 'flex', gap: '8px', alignItems: 'center', pointerEvents: 'none'
          }}>
            <span style={{ color: 'var(--risk-vhigh)' }}>●</span> Pulsing = Active Defaults
            <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>·</span>
            🖱️ Drag to rotate / Click to inspect
          </div>
        </motion.div>

        {/* City List */}
        <motion.div 
          className="glass-card" 
          style={{ padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} 
          initial={{ opacity: 0, x: 20 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 0.2 }}
        >
          <div style={{ marginBottom: '12px', fontSize: '13px', fontWeight: 700, color: 'white' }}>📍 Global Default Density</div>
          
          {/* Search box */}
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search cities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '8px 12px 8px 30px', fontSize: '12px', width: '100%', background: 'rgba(255,255,255,0.03)' }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: 'var(--text-muted)' }}>🔍</span>
          </div>

          <div className="city-list" style={{ flex: 1, overflowY: 'auto' }}>
            {filteredPoints.sort((a, b) => b.count - a.count).map((pt, i) => (
              <motion.div
                key={pt.city}
                className="city-item"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.08 + i * 0.03 }}
                onClick={() => setSelectedCity(selectedCity === pt.city ? null : pt.city)}
                whileHover={{ scale: 1.02 }}
                style={{
                  border: selectedCity === pt.city ? '1px solid var(--electric-blue)' : '1px solid var(--glass-border)',
                  background: selectedCity === pt.city ? 'rgba(30,144,255,0.1)' : '',
                  boxShadow: selectedCity === pt.city ? 'var(--glow-blue)' : ''
                }}
              >
                <div className="city-rank" style={{ color: selectedCity === pt.city ? 'var(--cyber-cyan)' : 'var(--text-muted)' }}>
                  #{i + 1}
                </div>
                <div className="city-info">
                  <div className="city-name" style={{ color: selectedCity === pt.city ? 'var(--cyber-cyan)' : 'white' }}>
                     {pt.city}
                  </div>
                  <div className="city-count">{pt.count} defaulters · {Math.round(pt.intensity * 100)}% density</div>
                </div>
                <div>
                  <div className="city-bar-bg">
                    <motion.div
                      className="city-bar"
                      initial={{ width: 0 }}
                      animate={{ width: `${pt.intensity * 100}%` }}
                      transition={{ delay: 0.3 + i * 0.03, duration: 0.8 }}
                      style={{
                        background: selectedCity === pt.city 
                          ? 'linear-gradient(90deg, var(--cyber-cyan), var(--electric-blue))' 
                          : 'linear-gradient(90deg, var(--electric-blue), var(--cyber-cyan))'
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px' }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '8px', textTransform: 'uppercase' }}>Risk Density Legend</div>
            {[
              { label: 'Critical (>200)', color: 'var(--risk-vhigh)' },
              { label: 'High (100-200)', color: 'var(--risk-high)' },
              { label: 'Moderate (50-100)', color: 'var(--risk-mod)' },
              { label: 'Low (<50)', color: 'var(--risk-low)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
