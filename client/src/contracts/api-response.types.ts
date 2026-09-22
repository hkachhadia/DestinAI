// Mirrors backend/src/contracts/*.types.ts — see DestinAI architecture doc §6.
// Every backend response follows this envelope.
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiFailure {
  success: false;
  message: string;
  error?: {
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
