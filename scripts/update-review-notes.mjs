import fs from "fs";
import crypto from "crypto";

const keyId = "Q2Q7AWQ232";
const issuerId = "70c9685e-8bd7-4050-9947-46e8d30e0a3f";
const privateKey = fs.readFileSync("/Users/naoryanko/.private_keys/AuthKey_Q2Q7AWQ232.p8", "utf8");

function base64Url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function getJwt() {
  const header = { alg: "ES256", kid: keyId, typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuerId, iat: now - 30, exp: now + 900, aud: "appstoreconnect-v1" };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = crypto.sign("sha256", Buffer.from(unsigned), { key: privateKey, dsaEncoding: "ieee-p1363" });
  return `${unsigned}.${base64Url(signature)}`;
}

async function api(path, method = "GET", body = null) {
  const token = getJwt();
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    body: body ? JSON.stringify(body) : null
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`API Error ${res.status}: ${JSON.stringify(json, null, 2)}`);
  }
  return json;
}

const notesContent = `Dear Apple App Review Team,

Thank you for your review and guidance. Below is the requested detailed information regarding SendKiss to complete the review:

1. DEMONSTRATION & SCREEN RECORDING:
A physical device screen recording demonstrating the complete user flow is attached / provided:
- App launch, phone onboarding & instant profile login.
- Real-time and asynchronous kiss sending, receiving, haptics, and lip mark customization.
- Safety & Moderation: User blocking mechanism (available on any person profile sheet via the "Block" button).
- Full Account Deletion Flow: Located in More Menu -> Settings -> "Delete account / reset data" -> confirm "Delete", which instantly erases user data locally and resets server associations.

2. APP PURPOSE & TARGET AUDIENCE:
SendKiss is a lightweight, playful social interaction app designed for close friends, couples, and family members.
- Problem Solved: Traditional messaging often feels heavy or demanding of formal text replies. SendKiss allows loved ones to exchange spontaneous, zero-friction affectionate micro-moments ("kisses") accompanied by tactile vibrations, sound effects, and customizable visual lips/skins.
- Target Audience: Friends, young adults, and couples seeking a spontaneous, fun, and lightweight way to stay connected.

3. INSTRUCTIONS FOR SETTING UP & ACCESSING MAIN FEATURES:
- No complex setup or passwords required.
- Demo Login:
  * Select Country: Thailand (+66) or Israel (+972) or United States (+1)
  * Phone Number: +66981519523 (or any valid mobile number; phone entry is direct and friction-free).
  * Display Name: Naor (or Demo Reviewer).
- Core Flows:
  * Sending a Kiss: Tap the center kiss button or select a contact/friend from the list to deliver an animated kiss.
  * Customization: Open More -> Skins to select free rank-based visual kiss themes.
  * User Moderation: Tap any contact's face to view their sheet where you can tap "Block" to prevent any unwanted interactions.
  * Account Deletion: Open More -> Settings -> scroll down to "Delete account / reset data" to immediately erase the profile.

4. EXTERNAL SERVICES & BACKEND PLATFORMS:
- Backend: Hosted on Vercel (https://app.sendkiss.online) running high-performance serverless endpoints.
- Database: Neon / Supabase PostgreSQL database for persisting friendship relations, kiss counters, and blocking tables.
- Push Notifications: Apple Push Notification service (APNs) and local haptic/sound notifications via Capacitor plugins.
- No third-party AI generation services and no external payment gateways are used.

5. REGIONAL DIFFERENCES:
- The app operates identically and consistently across all geographic regions worldwide without any geo-fencing, regional restrictions, or region-specific features.

6. REGULATORY COMPLIANCE & INTELLECTUAL PROPERTY:
- SendKiss does not operate in any regulated industry (no financial, medical, gambling, or cryptocurrency services).
- All visual designs (lips marks, animations, sound effects, and UI components) are original proprietary assets created and owned by the developer. No protected third-party material is used.

We remain available should you need any further information or additional testing accounts.`;

async function main() {
  const detailId = "ffc606f9-9e19-4c80-be5c-6e1974075207";
  const patchRes = await api(`/appStoreReviewDetails/${detailId}`, "PATCH", {
    data: {
      type: "appStoreReviewDetails",
      id: detailId,
      attributes: {
        notes: notesContent
      }
    }
  });
  console.log("✅ Successfully updated App Review Notes in App Store Connect!");
  console.log("Current Notes length:", patchRes.data.attributes.notes.length);
}

main().catch(console.error);
