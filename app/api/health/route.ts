import { NextResponse } from "next/server";

/**
 * Health check endpoint
 * GET /api/health
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Renoa.ai API",
    version: "1.0.0",
  });
}

