export type ErrorResponse = {
  error: { message: string; stack?: string };
};

export function isErrorResponse(obj: unknown): obj is ErrorResponse {
  return typeof (obj as ErrorResponse)?.error?.message === 'string';
}

export function errorResponse(err: unknown, init?: ResponseInit | Response) {
  const error: ErrorResponse['error'] =
    err instanceof Error
      ? { message: err.message, stack: err.stack }
      : { message: String(err) };

  return Response.json({ error }, init);
}
