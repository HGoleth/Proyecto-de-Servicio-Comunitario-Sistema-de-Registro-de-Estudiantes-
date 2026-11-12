import React from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AnimatePresence } from "framer-motion";
import { GraduationCap, X, UserSquare2, Camera, BookOpen, Check, Save } from "lucide-react";

interface DocenteEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocente: any;
  setSelectedDocente: React.Dispatch<any>;
  docentes: any[];
  onSave: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  toggleMateria: (materia: string) => void;
  planEstudio: Record<string, string[]>;
  secciones: string[];
}

export const DocenteEditModal: React.FC<DocenteEditModalProps> = ({
  isOpen,
  onClose,
  selectedDocente,
  setSelectedDocente,
  docentes,
  onSave,
  onInputChange,
  onPhotoChange,
  toggleMateria,
  planEstudio,
  secciones,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={true}
          onClose={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <DialogPanel className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50">
              <DialogTitle className="text-2xl font-black text-gray-800 uppercase tracking-tighter flex items-center gap-3">
                <GraduationCap className="text-[#5564eb]" size={32} />{" "}
                {selectedDocente.id ? "Editar Docente" : "Registro de Docentes"}
              </DialogTitle>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"
              >
                <X size={28} />
              </button>
            </div>

            <form onSubmit={onSave} className="overflow-y-auto p-8 flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div className="w-40 h-40 rounded-[2.5rem] bg-gray-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                      {selectedDocente.foto ? (
                        <img
                          src={selectedDocente.foto}
                          className="w-full h-full object-cover"
                          alt="Docente"
                        />
                      ) : (
                        <UserSquare2 size={64} className="text-gray-300" />
                      )}
                    </div>
                    <label className="absolute bottom-2 right-2 bg-[#5564eb] text-white p-3 rounded-2xl shadow-lg cursor-pointer hover:bg-[#4353d8] transition">
                      <Camera size={20} />
                      <input type="file" hidden accept="image/*" onChange={onPhotoChange} />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Nivel Educativo
                    </label>
                    <select
                      name="nivel"
                      value={selectedDocente.nivel}
                      onChange={onInputChange}
                      className="w-full border p-3 rounded-2xl bg-gray-50 outline-none font-bold text-sm"
                    >
                      <option value="Primaria">Primaria</option>
                      <option value="Secundaria">Secundaria</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Cédula (Solo números)
                    </label>
                    <input
                      name="ci"
                      required
                      value={selectedDocente.ci}
                      onChange={onInputChange}
                      className={`w-full border p-3 rounded-2xl bg-gray-50 outline-none transition-all text-sm font-bold ${
                        docentes.some(
                          (d) => d.ci === selectedDocente.ci && d.id !== selectedDocente.id
                        )
                          ? "ring-2 ring-red-400 border-red-100"
                          : "focus:ring-2 focus:ring-[#5564eb]"
                      }`}
                    />
                    {docentes.some(
                      (d) => d.ci === selectedDocente.ci && d.id !== selectedDocente.id
                    ) && (
                      <p className="text-[9px] text-red-500 font-bold ml-2 italic uppercase">
                        Esta cédula ya está registrada
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Nombre
                    </label>
                    <input
                      name="nombre"
                      placeholder="Nombre"
                      required
                      value={selectedDocente.nombre}
                      onChange={onInputChange}
                      className="w-full border p-3 rounded-2xl bg-gray-50 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Apellido
                    </label>
                    <input
                      name="apellido"
                      placeholder="Apellido"
                      required
                      value={selectedDocente.apellido}
                      onChange={onInputChange}
                      className="w-full border p-3 rounded-2xl bg-gray-50 outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Correo Electrónico
                    </label>
                    <input
                      name="email"
                      placeholder="ejemplo@correo.com"
                      value={selectedDocente.email}
                      onChange={onInputChange}
                      className="w-full border p-3 rounded-2xl bg-gray-50 outline-none text-sm"
                    />
                  </div>
                  {/* TELÉFONO */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Teléfono Móvil
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selectedDocente.telefono?.substring(0, 4) || "0424"}
                        onChange={(e) =>
                          setSelectedDocente((prev: any) => ({
                            ...prev,
                            telefono: e.target.value + (prev.telefono?.substring(4) || ""),
                          }))
                        }
                        className="w-1/3 border p-3 rounded-2xl bg-gray-50 outline-none font-bold text-sm cursor-pointer appearance-none"
                      >
                        {["0424", "0412", "0426", "0416", "0422", "0414"].map((pref) => (
                          <option key={pref} value={pref}>
                            {pref}
                          </option>
                        ))}
                      </select>
                      <input
                        placeholder="7 números"
                        value={selectedDocente.telefono?.substring(4) || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 7);
                          setSelectedDocente((prev: any) => ({
                            ...prev,
                            telefono: (prev.telefono?.substring(0, 4) || "0424") + val,
                          }));
                        }}
                        className={`w-2/3 border p-3 rounded-2xl bg-gray-50 outline-none text-sm font-bold ${
                          selectedDocente.telefono?.length > 4 && selectedDocente.telefono.length < 11
                            ? "ring-2 ring-red-300"
                            : "focus:ring-2 focus:ring-[#5564eb]"
                        }`}
                      />
                    </div>
                    {selectedDocente.telefono?.length > 4 &&
                      selectedDocente.telefono.length < 11 && (
                        <p className="text-[9px] text-red-500 font-bold ml-2">
                          Debe completar los 7 dígitos
                        </p>
                      )}
                  </div>

                  {/* TOGGLE ESPECIALISTA */}
                  {selectedDocente.nivel === "Primaria" && (
                    <div className="md:col-span-2 mt-4 p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
                          <GraduationCap size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-purple-900 uppercase tracking-tighter">
                            Especialista Educación Especial
                          </p>
                          <p className="text-[9px] text-purple-500 uppercase font-bold italic">
                            Habilitado para niños con condiciones especiales
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedDocente.es_especialista || false}
                          onChange={(e) =>
                            setSelectedDocente((prev: any) => ({
                              ...prev,
                              es_especialista: e.target.checked,
                            }))
                          }
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600" />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* ASIGNACIÓN ACADÉMICA */}
              <div className="mt-10 pt-8 border-t border-gray-100 text-left">
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <BookOpen className="text-blue-600" size={18} /> Asignación Académica
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                        Grado / Año
                      </label>
                      <select
                        name="grado_asignado"
                        required
                        value={selectedDocente.grado_asignado}
                        onChange={onInputChange}
                        className="w-full border p-3 rounded-2xl bg-blue-50/30 outline-none font-bold text-sm"
                      >
                        <option value="">Seleccione...</option>
                        {Object.keys(planEstudio)
                          .filter((grado) =>
                            selectedDocente.nivel === "Primaria"
                              ? (!grado.includes("Año") && !grado.includes("°"))
                              : (grado.includes("Año") || grado.includes("°"))
                          )
                          .map((grado) => (
                            <option key={grado} value={grado}>
                              {grado}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                        Sección
                      </label>
                      <select
                        name="seccion_asignada"
                        required
                        value={selectedDocente.seccion_asignada}
                        onChange={onInputChange}
                        className="w-full border p-3 rounded-2xl bg-blue-50/30 outline-none font-bold text-sm"
                      >
                        <option value="">Sección...</option>
                        {secciones.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">
                      Materias de {selectedDocente.grado_asignado || "..."}
                    </label>
                    <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedDocente.grado_asignado ? (
                        planEstudio[selectedDocente.grado_asignado]?.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => toggleMateria(m)}
                            className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                              selectedDocente.materias.includes(m)
                                ? "bg-[#5564eb] border-[#5564eb] text-white"
                                : "bg-white border-gray-200 text-gray-600"
                            }`}
                          >
                            <span className="text-[11px] font-bold">{m}</span>
                            {selectedDocente.materias.includes(m) && <Check size={14} />}
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed text-gray-400 text-xs">
                          Seleccione nivel y grado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end gap-3 bg-gray-50 -mx-8 -mb-8 p-8 border-t">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-8 py-3 text-gray-400 font-bold uppercase text-[10px] hover:bg-gray-200 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-[#5564eb] text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-[#4353d8] text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-blue-200"
                >
                  <Save size={18} /> Guardar Cambios
                </button>
              </div>
            </form>
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default DocenteEditModal;
