import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MdErrorOutline, MdCheckCircle } from "react-icons/md";
import { ToastNotificationState } from "../../types/student";

interface ToastNotificationProps {
  notification?: ToastNotificationState;
  show?: boolean;
  type?: "error" | "success" | "info" | "";
  msg?: string;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  notification,
  show,
  type,
  msg,
}) => {
  const isVisible = notification ? notification.show : !!show;
  const notifType = notification ? notification.type : type;
  const notifMsg = notification ? notification.msg : msg;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.9 }}
          className={`fixed top-24 right-10 z-[200] flex items-center gap-3 bg-white pl-4 pr-6 py-3 rounded-lg shadow-2xl border-l-4 ${
            notifType === "error" ? "border-red-500" : "border-green-500"
          }`}
        >
          <div
            className={`p-1.5 rounded-full ${
              notifType === "error"
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {notifType === "error" ? (
              <MdErrorOutline className="text-xl" />
            ) : (
              <MdCheckCircle className="text-xl" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800">
              {notifType === "error" ? "Atención" : "Éxito"}
            </span>
            <span className="text-[10px] text-gray-500 font-medium leading-tight">
              {notifMsg}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
