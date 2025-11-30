import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getSecurityHeaders,
  logSecurityEvent,
  sanitizeError,
} from "@/lib/security-utils";
import { moderateRateLimit } from "@/lib/rate-limit";
import { validateCSRFToken } from "@/lib/csrf-middleware";
import { logger } from "@/lib/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
  // CSRF Protection
  const csrfValid = validateCSRFToken(request);
  if (!csrfValid) {
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/validate-session',
      details: { reason: 'CSRF validation failed' }
    });
    return NextResponse.json(
      { error: 'CSRF validation failed', message: 'Security check failed. Please refresh and try again.' },
      { status: 403, headers: getSecurityHeaders() }
    );
  }

  // Apply rate limiting
  const rateLimitResult = moderateRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Add timeout protection for the entire request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    // Authenticate the request
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      logSecurityEvent({
        type: "auth_failure",
        ip: request.ip || "unknown",
        endpoint: "/api/validate-session",
        details: { reason: "Missing or invalid authorization header" },
      });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(" ")[1];

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logSecurityEvent({
        type: "auth_failure",
        ip: request.ip || "unknown",
        endpoint: "/api/validate-session",
        details: { reason: "Invalid token", error: authError?.message },
      });
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const { sessionId, userId } = await request.json();
    logger.debug('Validating session', { sessionId, userId });

    if (!sessionId || !userId) {
      logger.warn('Missing sessionId or userId');
      return NextResponse.json(
        { error: "Session ID and User ID are required" },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate that the authenticated user matches the userId in the request
    if (user.id !== userId) {
      logger.security('User ID mismatch', { authenticated: user.id, requested: userId });
      logSecurityEvent({
        type: "suspicious_activity",
        userId: user.id,
        ip: request.ip || "unknown",
        endpoint: "/api/validate-session",
        details: { reason: "User ID mismatch", requestedUserId: userId },
      });
      return NextResponse.json(
        { error: "Forbidden: User ID mismatch" },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Validate the session exists and user has access with timeout
    const queryPromise = supabase
      .from("topics")
      .select("*")
      .eq("id", sessionId)
      .single();

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Database query timeout")), 10000)
    );

    const { data: session, error } = (await Promise.race([
      queryPromise,
      timeoutPromise,
    ])) as any;

    clearTimeout(timeoutId);

    if (error || !session) {
      console.log(`[API] Session not found: ${sessionId}`, error);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is the author or a participant
    const isAuthor = session.author_id === userId;
    const isParticipant = session.participants?.includes(userId);

    console.log(`[API] Access check for session ${sessionId}:`, {
      userId,
      authorId: session.author_id,
      participants: session.participants,
      isAuthor,
      isParticipant,
    });

    if (!isAuthor && !isParticipant) {
      console.log(
        `[API] Access denied for user ${userId} to session ${sessionId}`
      );
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log(
      `[API] Access granted for user ${userId} to session ${sessionId}`
    );
    const role = isAuthor ? "author" : "participant";

    return NextResponse.json(
      {
        valid: true,
        role,
        session: {
          id: session.id,
          title: session.title,
          description: session.description,
          start_time: session.start_time,
          end_time: session.end_time,
          author_id: session.author_id,
          participants: session.participants,
        },
      },
      {
        headers: getSecurityHeaders(),
      }
    );
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout" },
        { status: 408, headers: getSecurityHeaders() }
      );
    }

    const sanitized = sanitizeError(error);

    logSecurityEvent({
      type: "suspicious_activity",
      ip: request.ip || "unknown",
      endpoint: "/api/validate-session",
      details: {
        error: sanitized.message,
        reason: "Session validation failed",
      },
    });

    console.error("Session validation error:", error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}
