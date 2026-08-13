export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface GHLToolConfig {
  accessToken?: string;
  baseUrl?: string;
  version?: string;
  locationId: string;
  /** API generation toggle (v3 default, v2 legacy). */
  apiGeneration?: 'v3' | 'v2';
  /** Token/user type for access-level preflight. */
  userType?: 'Location' | 'Company';
}

export interface GHLToolRequestOptions {
  version?: string;
  /** App/module name (informational; used for logging/cache scoping). */
  app?: string;
  /** Restrictive request content type override for form-encoded GHL APIs. */
  contentType?: 'application/json' | 'application/x-www-form-urlencoded';
}

export interface GHLToolResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface GHLToolClient {
  getConfig(): Readonly<GHLToolConfig>;
  makeRequest<T = any>(
    method: HttpMethod,
    path: string,
    body?: Record<string, unknown> | string,
    options?: GHLToolRequestOptions
  ): Promise<GHLToolResponse<T>>;
}
