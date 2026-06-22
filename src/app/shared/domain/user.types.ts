export interface User {
  id: string;
  email: string;
  fullName: string;
}

/** Matches AuthTokensResponse from the .NET backend. */
export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
}

/** ProblemDetails shape returned by the backend for 4xx errors (RFC 9457). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}
