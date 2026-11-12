// src/components/Titlebar.tsx
import React from "react";
import WindowControls from "./common/WindowControls";

export const TitleBar: React.FC = () => {
  return (
    <div
      className="w-full h-9 bg-white border-b border-gray-100 flex justify-between items-center px-4 select-none z-50"
      style={{ WebkitAppRegion: "drag" as any }}
    >
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: "no-drag" as any }}>
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
          U.E. República de Chile — Sistema Escolar
        </span>
      </div>
      <WindowControls variant="header" />
    </div>
  );
};

export default TitleBar;
