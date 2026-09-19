import React, { useState, useEffect, useRef } from 'react';
import { StageEngineeringDoc } from '../types';
import {
  FileCode2,
  X,
  Maximize2,
  RotateCw,
  Eye,
  CheckCircle2,
  Layers,
  ZoomIn,
  ZoomOut,
  Download,
  Info,
  ShieldCheck
} from 'lucide-react';

interface CadViewerModalProps {
  doc: StageEngineeringDoc;
  partName: string;
  orderNumber: string;
  onClose: () => void;
}

export const CadViewerModal: React.FC<CadViewerModalProps> = ({
  doc,
  partName,
  orderNumber,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [wireframe, setWireframe] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(25);
  const [isRotating, setIsRotating] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeTab, setActiveTab] = useState<'3d_cad' | 'drawing_pdf'>('3d_cad');

  // Animation loop for 3D rotation of the mechanical part
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = rotationAngle;

    const render = () => {
      if (isRotating) {
        angle = (angle + 0.5) % 360;
        setRotationAngle(angle);
      }

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw subtle engineering grid background
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
      ctx.lineWidth = 1;
      const step = 20 * zoomLevel;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.scale(zoomLevel, zoomLevel);

      const rad = (angle * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const shape = doc.cadPreviewData?.primitiveShape || 'cylinder_rotor';

      if (shape === 'cylinder_rotor') {
        // Render 3D Screw Rotor / Lobe profile with flutes
        const length = 180;
        const radius = 60;
        const flutes = 5;

        // Draw center shaft line
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(-length * 1.3, 0);
        ctx.lineTo(length * 1.3, 0);
        ctx.stroke();
        ctx.setLineDash([]);

        // Render Flutes & Ribs
        for (let i = 0; i < flutes; i++) {
          const fluteAngle = rad + (i * 2 * Math.PI) / flutes;
          const currentY = Math.sin(fluteAngle) * radius;
          const depth = Math.cos(fluteAngle);

          ctx.fillStyle = depth > 0 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(30, 58, 138, 0.2)';
          ctx.strokeStyle = depth > 0 ? '#38bdf8' : 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = wireframe ? 1 : 2;

          ctx.beginPath();
          // Helical curve simulation
          for (let x = -length; x <= length; x += 15) {
            const twist = (x / length) * Math.PI * 1.5;
            const py = Math.sin(fluteAngle + twist) * radius * 0.9;
            if (x === -length) ctx.moveTo(x, py);
            else ctx.lineTo(x, py);
          }
          ctx.stroke();
          if (!wireframe && depth > 0) {
            ctx.fill();
          }
        }

        // Rotor end bearings journals
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#94a3b8';
        ctx.fillRect(-length - 50, -20, 50, 40);
        ctx.strokeRect(-length - 50, -20, 50, 40);
        ctx.fillRect(length, -20, 50, 40);
        ctx.strokeRect(length, -20, 50, 40);

      } else if (shape === 'casing_block') {
        // Render Heavy Casing / Cylinder block with double-bore
        const bw = 160;
        const bh = 110;
        const bd = 70;

        // Isometric projection
        const px = cos * 40;
        const py = sin * 20;

        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.fillStyle = wireframe ? 'transparent' : 'rgba(15, 23, 42, 0.85)';

        // Front Face
        ctx.beginPath();
        ctx.rect(-bw / 2 + px, -bh / 2 + py, bw, bh);
        ctx.stroke();
        if (!wireframe) ctx.fill();

        // Twin screw bore holes
        ctx.strokeStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(-bw / 4 + px, py, 35, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(bw / 4 + px, py, 35, 0, Math.PI * 2);
        ctx.stroke();

        // Flange bolt holes
        ctx.fillStyle = '#38bdf8';
        [-bw / 2 + 15, bw / 2 - 15].forEach(bx => {
          [-bh / 2 + 15, bh / 2 - 15].forEach(by => {
            ctx.beginPath();
            ctx.arc(bx + px, by + py, 4, 0, Math.PI * 2);
            ctx.fill();
          });
        });

      } else {
        // Generic Precision Mechanical Flange Head
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 80, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();

      // Dimension callout
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.fillText(`ROTATION: ${Math.round(angle)}° | SCALE: ${(zoomLevel * 100).toFixed(0)}%`, 20, h - 20);
      ctx.fillText(`FORMAT: STEP AP214 (ISO 10303)`, 20, 30);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [rotationAngle, isRotating, zoomLevel, wireframe, doc]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 text-cyan-400 border border-cyan-700/50 flex items-center justify-center">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm sm:text-base">
                  مشاهده مدارک فنی و مدل سه‌بعدی CAD / STEP
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                  تایید مهندسی شده
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {partName} | {doc.stageName} (شماره نقشه: {doc.drawingNumber})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
              <button
                onClick={() => setActiveTab('3d_cad')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === '3d_cad' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                مدل ۳D STEP
              </button>
              <button
                onClick={() => setActiveTab('drawing_pdf')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                  activeTab === 'drawing_pdf' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                نقشه ساخت ۲D
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
          
          {activeTab === '3d_cad' ? (
            <div className="relative w-full h-full flex flex-col justify-between p-4">
              
              {/* Interactive Canvas */}
              <div className="w-full flex-1 flex items-center justify-center relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-b from-slate-900/50 to-slate-950">
                <canvas
                  ref={canvasRef}
                  width={750}
                  height={420}
                  className="w-full h-full max-w-full max-h-full cursor-grab active:cursor-grabbing"
                />

                {/* Floating CAD HUD Overlay */}
                <div className="absolute top-3 right-3 bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 space-y-1 backdrop-blur shadow-lg">
                  <div className="font-bold text-white flex items-center gap-1.5 text-[11px] mb-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    مشخصات فایل STEP مهندسی:
                  </div>
                  <div>نام فایل: <span className="font-mono text-cyan-300">{doc.stepFileName || 'MODEL-STAGE.step'}</span></div>
                  <div>استاندارد: <span className="text-slate-300">ISO 10303-214 Solid Model</span></div>
                  <div>واحد طول: <span className="text-emerald-400 font-mono">Millimeters (mm)</span></div>
                  <div>تلورانس بحرانی: <span className="text-amber-400 font-mono">±0.008 mm</span></div>
                </div>

                {/* Controls Bar on bottom */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700 rounded-2xl px-4 py-2 flex items-center gap-3 backdrop-blur shadow-xl">
                  <button
                    onClick={() => setIsRotating(!isRotating)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                      isRotating ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                    چرخش خودکار
                  </button>

                  <button
                    onClick={() => setWireframe(!wireframe)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition ${
                      wireframe ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    حالت وایرفریم
                  </button>

                  <div className="h-4 w-px bg-slate-700" />

                  <button
                    onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.15))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="بزرگ‌نمایی"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.15))}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                    title="کوچک‌نمایی"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* 2D Manufacturing Drawing Simulation */
            <div className="w-full flex-1 p-6 flex flex-col justify-center items-center overflow-auto">
              <div className="w-full max-w-2xl bg-white text-slate-900 p-8 rounded-xl shadow-2xl border-4 border-slate-400 font-mono text-xs space-y-4">
                {/* Drawing Title Block */}
                <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-start">
                  <div>
                    <h2 className="text-base font-black text-slate-950">
                      کارخانجات ساخت کمپرسور و بلوئر صنعتی
                    </h2>
                    <p className="text-[11px] text-slate-600">واحد مهندسی و نقشه‌کشی مکانیک (CAD/CAM Department)</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">نقشه ساخت مرحله {doc.stageNumber}</div>
                    <div className="text-[10px] text-slate-700">شماره: {doc.drawingNumber}</div>
                  </div>
                </div>

                {/* Technical Drawing Blueprint Diagram */}
                <div className="h-64 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center p-4 bg-slate-50 relative">
                  <div className="w-48 h-28 border-2 border-slate-800 bg-white flex items-center justify-center relative">
                    <span className="text-[11px] font-bold text-slate-800">
                      نمای برش خورده مقطع A-A
                    </span>
                    {/* Dimension marks */}
                    <div className="absolute -top-5 w-full flex justify-between text-[9px] text-blue-700">
                      <span>|&lt;</span>
                      <span className="font-bold">Ø 145.00 ±0.01</span>
                      <span>&gt;|</span>
                    </div>
                    <div className="absolute -left-6 h-full flex flex-col justify-between text-[9px] text-blue-700">
                      <span>^</span>
                      <span className="font-bold rotate-90">Ra 0.4</span>
                      <span>v</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-4 text-center">
                    تمامی ابعاد به میلی‌متر می‌باشد. زوایای پخ‌زنی ۱×۴۵ درجه. بدون پلیسه.
                  </p>
                </div>

                {/* Approval Sign-off Box */}
                <div className="grid grid-cols-3 gap-2 border-t-2 border-slate-900 pt-2 text-[10px]">
                  <div>طراح: <span className="font-bold">مهندس رهنما</span></div>
                  <div>تایید مهندسی: <span className="font-bold text-emerald-700">مهندس کریمی (تایید شد)</span></div>
                  <div>تاریخ انتشار: <span className="font-bold">{doc.uploadedAt || '۱۴۰۳/۰۶/۱۵'}</span></div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>مجوز تولید برای این مرحله توسط واحد مهندسی صادر شده است.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => alert(`دانلود فایل نقشه و STEP: ${doc.stepFileName || 'CAD-Model.step'}`)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              دانلود فایل نقشه و STEP
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
            >
              بستن
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
