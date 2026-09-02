import type { ApiResponse } from "../types";

const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export class ApiClientError extends Error {
  public statusCode: number;
  public data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const getToken = (): string | null => {
  return localStorage.getItem("etms_token");
};

export const setToken = (token: string): void => {
  localStorage.setItem("etms_token", token);
};

export const removeToken = (): void => {
  localStorage.removeItem("etms_token");
};

interface RequestOptions extends Omit<RequestInit, "body"> {
  params?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { params, headers: customHeaders, body, ...customConfig } = options;

  let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const response = await fetch(url, {
    ...customConfig,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 Unauthorized globally
  if (response.status === 401) {
    removeToken();
    if (
      window.location.pathname !== "/login" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
  }

  let resBody: Record<string, unknown> | null = null;
  const contentType = response.headers.get("content-type");

  if (contentType && contentType.includes("application/json")) {
    resBody = (await response.json()) as Record<string, unknown>;
  } else {
    const text = await response.text();
    resBody = { message: text || response.statusText };
  }

  if (!response.ok) {
    const errorMessage =
      (typeof resBody?.message === "string" ? resBody.message : undefined) ||
      (typeof resBody?.error === "string" ? resBody.error : undefined) ||
      `Request failed with status ${response.status}`;
    throw new ApiClientError(errorMessage, response.status, resBody);
  }

  return (resBody as unknown as ApiResponse<T>).data;
}

/**
 * Uploads a multipart/form-data payload (e.g. ticket file).
 */
export async function apiUpload<T>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = "/login";
  }

  const resBody = await response.json();

  if (!response.ok) {
    throw new ApiClientError(
      resBody?.message || "Upload failed",
      response.status,
      resBody
    );
  }

  return (resBody as ApiResponse<T>).data;
}

/**
 * Downloads a binary file (e.g. ticket PDF or Excel report) and triggers browser save dialog.
 */
export async function apiDownload(
  endpoint: string,
  suggestedFilename: string,
  params?: Record<string, string | number | boolean | undefined | null>
): Promise<void> {
  let url = `${BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, String(val));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const token = getToken();
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    removeToken();
    window.location.href = "/login";
    throw new ApiClientError("Unauthorized", 401);
  }

  if (!response.ok) {
    let errorMsg = `Download failed with status ${response.status}`;
    try {
      const errJson = await response.json();
      errorMsg = errJson.message || errorMsg;
    } catch {
      // Ignored
    }
    throw new ApiClientError(errorMsg, response.status);
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = downloadUrl;
  a.download = suggestedFilename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(downloadUrl);
}
