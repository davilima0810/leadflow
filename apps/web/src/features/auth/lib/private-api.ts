import { clearAuthToken, getAuthToken } from "./auth-token";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
  }
}

type PrivateApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown | FormData;
};

export async function privateApi<T>(
  path: string,
  options: PrivateApiOptions = {}
): Promise<T> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = getAuthToken();

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  if (!token) {
    throw new UnauthorizedError();
  }

  const isFormData = options.body instanceof FormData;
  const body = isFormData
    ? options.body
    : options.body
      ? JSON.stringify(options.body)
      : undefined;
  const response = await fetch(`${apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isFormData ? {} : { "Content-Type": "application/json" })
    },
    body: body as BodyInit | undefined
  });

  if (response.status === 401) {
    clearAuthToken();
    throw new UnauthorizedError();
  }

  if (!response.ok) {
    throw new ApiRequestError(await getErrorMessage(response), response.status);
  }

  return response.json();
}

async function getErrorMessage(response: Response) {
  try {
    const body = await response.json();
    const message = body?.message;

    return Array.isArray(message)
      ? message.join(" ")
      : message || "Não foi possível concluir a operação.";
  } catch {
    return "Não foi possível concluir a operação.";
  }
}
