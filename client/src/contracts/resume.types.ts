export type ResumeStatus = "uploaded" | "parsing" | "parsed" | "failed";

export interface ResumeUploadResult {
  jobId: string;
  resumeId: string;
  status: ResumeStatus;
}

export interface ResumeStatusResult {
  jobId: string;
  status: ResumeStatus;
  resumeId?: string;
}

export interface Resume {
  _id: string;
  fileName: string;
  fileUrl: string;
  status: ResumeStatus;
  parsedData?: {
    fullName?: string;
    skills?: string[];
    experience?: { company: string; title: string }[];
  };
}
