import { createHmac } from "crypto";
import jwt from "jsonwebtoken";

type Stage = "challenge" | "verified";
type Identity = { aadhaar: string; email: string; referenceId: string };

const signingKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required for client Aadhaar verification.");
  // Separate these proofs from login tokens, even where login middleware accepts any JWT.
  return createHmac("sha256", secret).update("client-aadhaar-proof-v1").digest("hex");
};

const identityDigest = (identity: Identity) => createHmac("sha256", signingKey())
  .update(JSON.stringify([identity.aadhaar, identity.email.trim().toLowerCase(), identity.referenceId]))
  .digest("hex");

export const issueClientAadhaarProof = (stage: Stage, identity: Identity): string =>
  jwt.sign({
    stage,
    identity: identityDigest(identity),
    environment: process.env.AADHAAR_API_URL || "https://api.sandbox.co.in",
  }, signingKey(), {
    algorithm: "HS256",
    audience: "client-registration",
    issuer: "fintree-aadhaar",
    expiresIn: stage === "challenge" ? "10m" : "30m",
  });

export const readClientAadhaarProof = (
  token: unknown, stage: Stage, identity: Identity,
): Date | null => {
  try {
    if (typeof token !== "string") return null;
    const claims = jwt.verify(token, signingKey(), {
      algorithms: ["HS256"], audience: "client-registration", issuer: "fintree-aadhaar",
    });
    if (typeof claims === "string" || claims.stage !== stage ||
        claims.identity !== identityDigest(identity) || typeof claims.iat !== "number" ||
        claims.environment !== (process.env.AADHAAR_API_URL || "https://api.sandbox.co.in")) return null;
    return new Date(claims.iat * 1000);
  } catch {
    return null;
  }
};
