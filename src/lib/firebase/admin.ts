import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

// The private key is stored as a base64-encoded string in .env to avoid
// newline/quoting/whitespace issues that plain multi-line PEM keys run into
// when parsed by dotenv. Decode it back to the original PEM string here.
const privateKeyBase64 = process.env.FIREBASE_PRIVATE_KEY_BASE64;
const privateKey = privateKeyBase64
  ? Buffer.from(privateKeyBase64, "base64").toString("utf8")
  : undefined;

if (!projectId || !clientEmail || !privateKey) {
  throw new Error(
    `[firebase-admin] Missing env vars → ` +
      `FIREBASE_PROJECT_ID:${!!projectId} ` +
      `FIREBASE_CLIENT_EMAIL:${!!clientEmail} ` +
      `FIREBASE_PRIVATE_KEY_BASE64:${!!privateKey}. ` +
      `Check .env and restart the dev server.`
  );
}

// Sanity check: a valid PEM key must start and end with these markers.
// If this fails, the base64 string was cut off/corrupted while copying into .env.
if (
  !privateKey.startsWith("-----BEGIN PRIVATE KEY-----") ||
  !privateKey.trim().endsWith("-----END PRIVATE KEY-----")
) {
  throw new Error(
    "[firebase-admin] Decoded FIREBASE_PRIVATE_KEY_BASE64 is malformed — " +
      "make sure the full base64 string was copied into .env with no line breaks."
  );
}

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

export const firebaseAdminAuth = getAuth(adminApp);