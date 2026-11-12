import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface QuickRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    firstName: string;
    lastName: string;
    ci: string;
    level: string;
    grade: string;
  }) => Promise<void>;
}

export const QuickRegisterModal: React.FC<QuickRegisterModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [quickStudent, setQuickStudent] = useState({
    firstName: "",
    lastName: "",
    ci: "",
    level: "Primaria",
    grade: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(quickStudent);
    setQuickStudent({ firstName: "", lastName: "", ci: "", level: "Primaria", grade: "" });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog
          open={true}
          onClose={onClose}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
          <DialogPanel className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <DialogTitle className="text-2xl font-black text-green-700 uppercase tracking-tighter">
                Ficha Rápida
              </DialogTitle>
              <button type="button" onClick={onClose}>
                <X className="text-gray-400 hover:text-red-500" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6 italic text-left">
              Cree un registro base. El alumno quedará como <b>Pendiente</b> hasta completar los datos.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Nombres
                  </label>
                  <input
                    placeholder="Ej: Juan"
                    className="w-full border p-4 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold uppercase"
                    value={quickStudent.firstName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]/g, "");
                      setQuickStudent({ ...quickStudent, firstName: val });
                    }}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Apellidos
                  </label>
                  <input
                    placeholder="Ej: Perez"
                    className="w-full border p-4 rounded-2xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-green-500 outline-none text-sm font-bold uppercase"
                    value={quickStudent.lastName}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^a-zA-Z\sñÑáéíóúÁÉÍÓÚüÜ]/g, "");
                      setQuickStudent({ ...quickStudent, lastName: val });
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                  Cédula / ID (7-8 dígitos u opcional)
                </label>
                <input
                  placeholder="Dejar vacío si no posee"
                  className={`w-full border p-4 rounded-2xl bg-gray-50 focus:bg-white outline-none transition-all text-sm font-bold uppercase ${
                    quickStudent.ci.length > 0 &&
                    (quickStudent.ci.length < 7 || quickStudent.ci.length > 8)
                      ? "border-red-300 ring-2 ring-red-50"
                      : "focus:ring-2 focus:ring-green-500"
                  }`}
                  value={quickStudent.ci}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 8);
                    setQuickStudent({ ...quickStudent, ci: val });
                  }}
                />
                {quickStudent.ci.length > 0 &&
                  (quickStudent.ci.length < 7 || quickStudent.ci.length > 8) && (
                    <p className="text-[9px] text-red-500 font-bold ml-2 italic">
                      Debe tener 7 u 8 dígitos
                    </p>
                  )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Nivel
                  </label>
                  <select
                    className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-xs font-black uppercase appearance-none cursor-pointer shadow-sm focus:bg-white focus:ring-2 focus:ring-green-500"
                    value={quickStudent.level}
                    onChange={(e) =>
                      setQuickStudent({ ...quickStudent, level: e.target.value, grade: "" })
                    }
                  >
                    <option value="Inicial">Inicial</option>
                    <option value="Primaria">Primaria</option>
                    <option value="Secundaria">Secundaria</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase ml-2 tracking-widest">
                    Grado / Año
                  </label>
                  <select
                    className="w-full border p-4 rounded-2xl bg-gray-50 outline-none text-xs font-black uppercase appearance-none cursor-pointer shadow-sm focus:bg-white focus:ring-2 focus:ring-green-500"
                    value={quickStudent.grade}
                    onChange={(e) => setQuickStudent({ ...quickStudent, grade: e.target.value })}
                    required
                  >
                    <option value="">Seleccione...</option>
                    {quickStudent.level === "Inicial" ? (
                      <>
                        <option value="Maternal">Maternal</option>
                        <option value="1er Grupo">1er Grupo</option>
                        <option value="2do Grupo">2do Grupo</option>
                        <option value="3er Grupo">3er Grupo</option>
                      </>
                    ) : quickStudent.level === "Primaria" ? (
                      <>
                        <option value="1ero">1ero</option>
                        <option value="2do">2DO</option>
                        <option value="3ero">3ero</option>
                        <option value="4to">4to</option>
                        <option value="5to">5to</option>
                        <option value="6to">6to</option>
                      </>
                    ) : (
                      <>
                        <option value="1er Año">1er Año</option>
                        <option value="2do Año">2do Año</option>
                        <option value="3er Año">3er Año</option>
                        <option value="4to Año">4to Año</option>
                        <option value="5to Año">5to Año</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 font-black uppercase text-xs tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    quickStudent.ci.length > 0 &&
                    (quickStudent.ci.length < 7 || quickStudent.ci.length > 8)
                  }
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg hover:bg-green-700 transition-all uppercase text-xs tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generar Ficha
                </button>
              </div>
            </form>
          </DialogPanel>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

export default QuickRegisterModal;
