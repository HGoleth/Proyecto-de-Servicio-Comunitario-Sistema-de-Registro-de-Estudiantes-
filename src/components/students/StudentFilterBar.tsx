import React from "react";
import { Search, X } from "lucide-react";

interface StudentFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterLevel: string;
  setFilterLevel: (value: string) => void;
  filterGrade?: string;
  setFilterGrade?: (value: string) => void;
  filterSection?: string;
  setFilterSection?: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterYear: string;
  setFilterYear: (value: string) => void;
  auditFilter: "all" | "complete" | "incomplete";
  setAuditFilter: (value: "all" | "complete" | "incomplete") => void;
}

const GRADOS_OPTIONS: Record<string, string[]> = {
  Inicial: ["Maternal", "1er Grupo", "2do Grupo", "3er Grupo"],
  Primaria: ["1ero", "2do", "3ero", "4to", "5to", "6to"],
  Secundaria: ["1er Año", "2do Año", "3er Año", "4to Año", "5to Año"],
};

export const StudentFilterBar: React.FC<StudentFilterBarProps> = ({
  searchTerm,
  setSearchTerm,
  filterLevel,
  setFilterLevel,
  filterGrade = "",
  setFilterGrade,
  filterSection = "",
  setFilterSection,
  filterStatus,
  setFilterStatus,
  filterYear,
  setFilterYear,
  auditFilter,
  setAuditFilter,
}) => {
  const availableGrades = filterLevel
    ? GRADOS_OPTIONS[filterLevel] || []
    : [...GRADOS_OPTIONS.Inicial, ...GRADOS_OPTIONS.Primaria, ...GRADOS_OPTIONS.Secundaria];

  const hasFilters = Boolean(
    searchTerm || filterLevel || filterGrade || filterSection || filterStatus || filterYear || auditFilter !== "all"
  );

  const handleClearAll = () => {
    setSearchTerm("");
    setFilterLevel("");
    setFilterGrade?.("");
    setFilterSection?.("");
    setFilterStatus("");
    setFilterYear("");
    setAuditFilter("all");
  };

  return (
    <div className="bg-white p-3.5 rounded-[2rem] shadow-sm border border-gray-100 mb-8 flex flex-col lg:flex-row gap-3 items-center justify-between">
      <div className="relative w-full lg:w-72">
        <Search
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={14}
        />
        <input
          type="text"
          placeholder="Buscar por nombre, cédula o ID..."
          className="w-full pl-10 pr-4 py-2 rounded-2xl border-none bg-gray-50 focus:bg-white focus:ring-4 focus:ring-green-500/10 transition text-[11px] font-bold shadow-inner"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 w-full lg:w-auto justify-end items-center">
        {/* Selector de Auditoría Segmentado (3 Estados) */}
        <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100 shadow-inner mr-1">
          {[
            { id: "all", label: "Todos", color: "text-gray-500" },
            { id: "complete", label: "Completos", color: "text-green-600" },
            { id: "incomplete", label: "Incompletos", color: "text-red-600" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setAuditFilter(opt.id as "all" | "complete" | "incomplete")}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${
                auditFilter === opt.id
                  ? "bg-white shadow-sm scale-105 z-10 " + opt.color
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Selectores Optimizados */}
        <select
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-2.5 py-2 rounded-xl border-none bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-tighter outline-none cursor-pointer shadow-sm w-fit"
        >
          <option value="">Periodo</option>
          <option value="2024-2025">24-25</option>
          <option value="2025-2026">25-26</option>
          <option value="2026-2027">26-27</option>
          <option value="2027-2028">27-28</option>
        </select>

        <select
          value={filterLevel}
          onChange={(e) => {
            setFilterLevel(e.target.value);
            setFilterGrade?.("");
          }}
          className="px-2.5 py-2 rounded-xl border-none bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-tighter outline-none cursor-pointer shadow-sm w-fit"
        >
          <option value="">Nivel</option>
          <option value="Inicial">Inicial</option>
          <option value="Primaria">Primaria</option>
          <option value="Secundaria">Media</option>
        </select>

        {setFilterGrade && (
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-2.5 py-2 rounded-xl border-none bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-tighter outline-none cursor-pointer shadow-sm w-fit"
          >
            <option value="">Grado / Año</option>
            {availableGrades.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        )}

        {setFilterSection && (
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="px-2.5 py-2 rounded-xl border-none bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-tighter outline-none cursor-pointer shadow-sm w-fit"
          >
            <option value="">Sección</option>
            <option value="A">Sección "A"</option>
            <option value="B">Sección "B"</option>
            <option value="C">Sección "C"</option>
          </select>
        )}

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-2.5 py-2 rounded-xl border-none bg-gray-50 text-gray-600 font-black text-[9px] uppercase tracking-tighter outline-none cursor-pointer shadow-sm w-fit"
        >
          <option value="">Estatus</option>
          <option value="Inscrito">Inscrito</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Retirado">Retirado</option>
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="px-2.5 py-2 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-black text-[9px] uppercase tracking-tighter transition flex items-center gap-1"
            title="Limpiar filtros"
          >
            <X size={12} /> Limpiar
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(StudentFilterBar);
