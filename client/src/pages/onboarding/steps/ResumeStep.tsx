import { useRef, useState, type DragEvent } from "react";
import { useResumeUpload } from "@/hooks/useResumeUpload";
import { validateResumeFile } from "@/utils/validators";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { InlineSpinner } from "@/components/ui/FullScreenSpinner";

// Markup copied verbatim from profile_setup_wizard/code.html #step-2's
// dropzone; the years-of-experience buttons live in Step 1 in this build
// since the backend profile schema only stores one experienceLevel field.
export function ResumeStep({ onNext }: { onNext: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const { upload, isUploading, uploadProgress, uploadError, isParsing, isParsed, parseFailed } =
    useResumeUpload();

  const handleFile = (file: File | null) => {
    const validationError = validateResumeFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    setFileName(file!.name);
    upload(file!);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const busy = isUploading || isParsing;

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="space-y-2">
        <h2 className="font-syne text-headline-lg-mobile md:text-headline-lg text-[var(--text-primary)] uppercase tracking-tight italic">
          Experience &amp; Resume
        </h2>
        <p className="font-body-md text-body-md text-[var(--text-secondary)]">
          Upload your latest CV for AI-powered analysis.
        </p>
      </div>

      <ErrorBanner message={localError ?? uploadError} />

      <div className="flex flex-col gap-2">
        <label className="font-syne text-label-sm text-[var(--accent)] uppercase tracking-wider">
          Upload Resume (PDF, DOCX)
        </label>
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          className={
            isDragOver
              ? "border-2 border-dashed border-[var(--accent)] rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-[var(--bg-subtle)] transition-all group cursor-pointer"
              : "border-2 border-dashed border-[var(--accent)]/20 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 bg-[var(--bg-subtle)]/50 hover:bg-[var(--bg-subtle)] hover:border-[var(--accent)] transition-all group cursor-pointer"
          }
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-subtle)] flex items-center justify-center group-hover:scale-110 transition-transform group-hover:rotate-12">
            {busy ? (
              <InlineSpinner className="w-6 h-6 border-[var(--accent)]/30 border-t-[var(--accent)]" />
            ) : (
              <span className="material-symbols-outlined text-[var(--accent)] text-3xl">
                {isParsed ? "task_alt" : "cloud_upload"}
              </span>
            )}
          </div>
          <div className="text-center">
            {fileName ? (
              <>
                <p className="font-syne text-body-lg text-on-surface font-bold uppercase italic">
                  {fileName}
                </p>
                <p className="font-body-md text-body-md text-[var(--text-secondary)]">
                  {isUploading && `Uploading... ${uploadProgress}%`}
                  {isParsing && !isUploading && "AI is parsing your resume..."}
                  {isParsed && "Parsed successfully — click Next Step"}
                  {parseFailed && "Parsing failed — try a different file"}
                </p>
              </>
            ) : (
              <>
                <p className="font-syne text-body-lg text-on-surface font-bold uppercase italic">
                  Drop your resume here
                </p>
                <p className="font-body-md text-body-md text-[var(--text-secondary)]">
                  or click to browse from files
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 rounded-xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-all uppercase text-sm tracking-widest italic"
        >
          Skip for now
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onNext}
          className="flex items-center gap-2 px-8 py-4 rounded-2xl font-syne font-extrabold text-on-primary primary-gradient glow-effect hover:scale-105 active:scale-95 transition-all uppercase tracking-tighter italic disabled:opacity-60"
        >
          <span>Next Step</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
