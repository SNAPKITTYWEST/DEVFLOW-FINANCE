import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * SOVEREIGN AUTH GUARD
 * Validates the Azure Entra ID session and returns the User profile.
 */
export async function getSovereignContext() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    throw new Error("UNAUTHORIZED_SOVEREIGN_ACCESS");
  }

  return {
    azureOid: session.user.id, // Maps to Entra Object ID
    email: session.user.email,
    name: session.user.name
  };
}
