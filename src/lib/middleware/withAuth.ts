// src/lib/middleware/withAuth.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, AccessTokenPayload } from "@/lib/utils/jwt";
import { errorResponse } from "@/lib/utils/apiResponse";

export type AuthenticatedHandler = (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> },
  auth: AccessTokenPayload
) => Promise<NextResponse>;

function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim();
}

export function withAuth(handler: AuthenticatedHandler) {
  return async (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> }
  ): Promise<NextResponse> => {
    const token = extractBearerToken(request);

    if (!token) {
      return errorResponse("Authorization token missing", 401);
    }

    let payload: AccessTokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return errorResponse("Invalid or expired access token", 401);
    }

    return handler(request, context, payload);
  };
}