import React, { useState, useEffect } from "react";
import { Minus, Square, Copy, X } from "lucide-react";

interface WindowControlsProps {
  className?: string;
  variant?: "header" | "compact" | "mac";
}

export const WindowControls: React.FC<WindowControlsProps> = ({
  className = "",
  variant = "header",
}) => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Verificar estado inicial si electron está disponible
    if (window.electron?.isMaximized) {
      window.electron
        .isMaximized()
        .then((max) => {
          setIsMaximized(!!max);
        })
        .catch(() => {});
    }

    // Escuchar eventos de cambio de estado de ventana
    if (window.electron?.onWindowStateChange) {
      const unsubscribe = window.electron.onWindowStateChange((max) => {
        setIsMaximized(max);
      });
      return () => {
        if (typeof unsubscribe === "function") unsubscribe();
      };
    }
  }, []);

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.electron?.minimize) {
      window.electron.minimize();
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.electron?.maximize) {
      const res = await window.electron.maximize();
      if (typeof res === "boolean") {
        setIsMaximized(res);
      } else if (window.electron.isMaximized) {
        const current = await window.electron.isMaximized();
        setIsMaximized(!!current);
      }
    } else {
      // Fallback para navegador web (pantalla completa)
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
        setIsMaximized(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsMaximized(false);
      }
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.electron?.close) {
      window.electron.close();
    } else {
      window.close();
    }
  };

  if (variant === "mac") {
    return (
      <div
        className={`flex items-center gap-2 select-none ${className}`}
        style={{ WebkitAppRegion: "no-drag" as any }}
      >
        <button
          type="button"
          onClick={handleClose}
          style={{ WebkitAppRegion: "no-drag" as any }}
          className="w-3.5 h-3.5 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center group shadow-sm active:scale-95 focus:outline-none cursor-pointer"
          title="Cerrar programa"
        >
          <X size={9} className="text-red-900 opacity-0 group-hover:opacity-100 transition" />
        </button>
        <button
          type="button"
          onClick={handleMinimize}
          style={{ WebkitAppRegion: "no-drag" as any }}
          className="w-3.5 h-3.5 rounded-full bg-amber-400 hover:bg-amber-500 transition flex items-center justify-center group shadow-sm active:scale-95 focus:outline-none cursor-pointer"
          title="Minimizar"
        >
          <Minus size={9} className="text-amber-900 opacity-0 group-hover:opacity-100 transition" />
        </button>
        <button
          type="button"
          onClick={handleMaximize}
          style={{ WebkitAppRegion: "no-drag" as any }}
          className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 transition flex items-center justify-center group shadow-sm active:scale-95 focus:outline-none cursor-pointer"
          title={isMaximized ? "Restaurar" : "Maximizar"}
        >
          <Square size={8} className="text-emerald-950 opacity-0 group-hover:opacity-100 transition" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center select-none ${className}`}
      style={{ WebkitAppRegion: "no-drag" as any }}
    >
      {/* BOTÓN MINIMIZAR */}
      <button
        type="button"
        onClick={handleMinimize}
        style={{ WebkitAppRegion: "no-drag" as any }}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95 focus:outline-none cursor-pointer"
        title="Minimizar"
      >
        <Minus size={15} strokeWidth={2.4} />
      </button>

      {/* BOTÓN MAXIMIZAR / RESTAURAR */}
      <button
        type="button"
        onClick={handleMaximize}
        style={{ WebkitAppRegion: "no-drag" as any }}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors active:scale-95 focus:outline-none cursor-pointer"
        title={isMaximized ? "Restaurar tamaño" : "Maximizar"}
      >
        {isMaximized ? (
          <Copy size={13} strokeWidth={2.4} className="rotate-90" />
        ) : (
          <Square size={13} strokeWidth={2.4} />
        )}
      </button>

      {/* BOTÓN CERRAR */}
      <button
        type="button"
        onClick={handleClose}
        style={{ WebkitAppRegion: "no-drag" as any }}
        className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-white hover:bg-red-500 transition-colors active:scale-95 focus:outline-none cursor-pointer ml-0.5"
        title="Cerrar programa"
      >
        <X size={16} strokeWidth={2.4} />
      </button>
    </div>
  );
};

export default WindowControls;
