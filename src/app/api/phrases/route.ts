import type { NextRequest } from "next/server";
import { getPhraseIndex, getPublicPhraseIndex } from "@/lib/content/loader";
import { currentUser, jsonResponse, rateLimit, serverErrorResponse } from "@/server/http";
import { findPaidLicenseForUser } from "@/server/orders";

export const dynamic = "force-dynamic";

/** Returns the full phrase bank only to a session with a paid entitlement. */
export async function GET(request: NextRequest) {
  const limited = rateLimit(request, "phrase-index", 60, 60_000);
  if (limited) return limited;

  try {
    const user = await currentUser(request);
    const entitlement = user ? await findPaidLicenseForUser(user.id) : null;
    return jsonResponse({
      ok: true,
      phrases: entitlement ? getPhraseIndex() : getPublicPhraseIndex(),
      access: entitlement ? "premium" : "public",
    });
  } catch (error) {
    return serverErrorResponse("phrase-index", error);
  }
}
