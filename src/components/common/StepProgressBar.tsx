import React from "react";
import { CheckCircle } from "lucide-react";
import { StepItem } from "../../types/student";

interface StepProgressBarProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick: (stepNumber: number) => void;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full transition-all">
      <ul className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
        {steps.map((item, index) => {
          const stepNumber = index + 1;
          const isCompleted = currentStep > stepNumber;
          const isActive = item.active;
          return (
            <li
              key={item.label}
              className={`flex flex-col items-center cursor-pointer transition-all hover:scale-105 ${
                isActive ? "opacity-100" : "opacity-60 hover:opacity-100"
              }`}
              onClick={() => onStepClick(stepNumber)}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full border-2 transition font-bold shadow-sm ${
                  isActive || isCompleted
                    ? "bg-green-600 border-green-600 text-white shadow-green-200"
                    : "border-gray-200 text-gray-400 bg-gray-50"
                }`}
              >
                {isCompleted ? <CheckCircle size={20} /> : stepNumber}
              </div>
              <span
                className={`mt-1.5 text-xs text-center font-bold tracking-tight ${
                  isActive ? "text-green-700 font-black" : "text-gray-400"
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
