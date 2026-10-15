export class ApiError extends Error {
  /** @param {{status:number, code?:string, message:string, fields?:Record<string,string>}} args */
  constructor(args) {
    super(args.message);
    this.name = 'ApiError';
    this.status = args.status;
    this.code = args.code;
    this.fields = args.fields;
  }
}

async function parseJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function httpJson(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    },
    ...options
  });

  const body = await parseJsonSafe(res);

  if (!res.ok) {
    const message = body?.message || `Request failed with status ${res.status}`;
    throw new ApiError({
      status: res.status,
      code: body?.code,
      message,
      fields: body?.fields
    });
  }

  return body;
}
