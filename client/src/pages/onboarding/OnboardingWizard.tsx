import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";
import { ResumeStep } from "./steps/ResumeStep";
import { ConnectAccountsStep } from "./steps/ConnectAccountsStep";
import { TargetRoleStep } from "./steps/TargetRoleStep";
import { triggerAnalysis } from "@/api/analysisApi";
import { toast } from "@/components/ui/Toast";
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher";

const STEPS = [
  { id: 1, icon: "person",       label: "Personal"   },
  { id: 2, icon: "description",  label: "Resume"     },
  { id: 3, icon: "link",         label: "Connect"    },
  { id: 4, icon: "rocket_launch",label: "Analyze"    },
] as const;

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();
  const totalSteps = STEPS.length;
  const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const goNext = () => { if (currentStep < totalSteps) setCurrentStep(s => s + 1); };
  const goPrev = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };
  const goToStep = (n: number) => { if (n <= currentStep + 1) setCurrentStep(n); };

  /** CHANGE 7: Triggered by TargetRoleStep on submit.
   * Runs the first analysis immediately so the user never has to
   * click "Run First Scan" again from the dashboard. */
  const handleFinish = async (targetRole: string) => {
    setIsAnalyzing(true);
    try {
      await triggerAnalysis({ targetRole });
      toast.success("Analysis complete! Welcome to your dashboard.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      // Analysis failed — still navigate to dashboard where the user can retry
      toast.error((err as Error).message ?? "Analysis failed. You can run it again from the dashboard.");
      navigate("/dashboard", { replace: true });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-[var(--text-primary)] flex items-center justify-center px-4 md:px-0 py-12 relative overflow-hidden">
      <div className="fixed top-4 right-4 z-50">
        <ThemeSwitcher compact />
      </div>
      <div className="ambient-glow-circle top-[-10%] left-[-10%]" />
      <div className="ambient-glow-circle bottom-[-10%] right-[-10%]" />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl  rounded-[2.5rem] p-8 md:p-12" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {/* Progress Stepper */}
        <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-5 left-0 w-full h-[3px] bg-[var(--bg-subtle)] z-0 rounded-full" />
          <div
            className="absolute top-5 left-0 h-[3px] primary-gradient z-0 transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
          {STEPS.map(step => {
            const isDone   = step.id < currentStep;
            const isActive = step.id === currentStep;
            return (
              <div key={step.id}
                className="relative z-10 flex flex-col items-center gap-2 cursor-pointer"
                onClick={() => goToStep(step.id)}>
                <div className={isDone || isActive
                  ? "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 primary-gradient text-on-primary shadow-lg"
                  : "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-[var(--bg-subtle)] border border-outline-variant text-[var(--text-secondary)]"}>
                  <span className="material-symbols-outlined text-lg">{isDone ? "check" : step.icon}</span>
                </div>
                <span className={`font-syne text-label-sm uppercase italic ${isActive ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="relative min-h-[400px] flex flex-col">
          <div className="flex-1">
            {currentStep === 1 && <PersonalInfoStep onNext={goNext} />}
            {currentStep === 2 && <ResumeStep onNext={goNext} />}
            {currentStep === 3 && <ConnectAccountsStep onNext={goNext} />}
            {currentStep === 4 && (
              <TargetRoleStep
                onFinish={handleFinish}
                isAnalyzing={isAnalyzing}
              />
            )}
          </div>

          {/* Back button */}
          <div className="mt-10 flex items-center">
            <button
              onClick={goPrev}
              type="button"
              disabled={currentStep === 1 || isAnalyzing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[var(--text-secondary)] text-sm uppercase tracking-widest italic transition-all
                ${currentStep === 1 || isAnalyzing ? "opacity-0 pointer-events-none" : "hover:bg-[var(--bg-subtle)]"}`}>
              <span className="material-symbols-outlined">arrow_back</span>
              Back
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
