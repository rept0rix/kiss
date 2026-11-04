import fs from "fs";
import crypto from "crypto";

const keyId = "Q2Q7AWQ232";
const issuerId = "70c9685e-8bd7-4050-9947-46e8d30e0a3f";
const privateKey = fs.readFileSync("/Users/naoryanko/.private_keys/AuthKey_Q2Q7AWQ232.p8", "utf8");

function base64Url(buf) { return Buffer.from(buf).toString("base64url"); }
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
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : null
  });
  if (res.status === 204) return null;
  const json = await res.json();
  if (!res.ok) throw new Error(`API Error ${res.status}: ${JSON.stringify(json, null, 2)}`);
  return json;
}

async function run() {
  const res = await api(`/reviewSubmissions/13f00acb-31e4-4f5d-85f3-956e53e3790e`);
  console.log("Old sub state:", res.data.attributes.state);
  const v = await api(`/appStoreVersions/947cf551-2583-4d96-a4fa-fcd6747acc4d`);
  console.log("Version 1.0 state:", v.data.attributes.appStoreState);

  // If old sub is CANCELING or CANCELED, let's see if we can add Version 1.0 to new submission
  console.log("\nAttempting to add Version 1.0 to new submission 65f493df-4372-4ab7-8516-5c3043f5561e...");
  try {
    const itemRes = await api(`/reviewSubmissionItems`, "POST", {
      data: {
        type: "reviewSubmissionItems",
        relationships: {
          reviewSubmission: {
            data: {
              type: "reviewSubmissions",
              id: "65f493df-4372-4ab7-8516-5c3043f5561e"
            }
          },
          appStoreVersion: {
            data: {
              type: "appStoreVersions",
              id: "947cf551-2583-4d96-a4fa-fcd6747acc4d"
            }
          }
        }
      }
    });
    console.log("Added item successfully:", itemRes.data.id);

    // Now submit the new submission!
    console.log("\nSubmitting reviewSubmission 65f493df-4372-4ab7-8516-5c3043f5561e...");
    const submitRes = await api(`/reviewSubmissions/65f493df-4372-4ab7-8516-5c3043f5561e`, "PATCH", {
      data: {
        type: "reviewSubmissions",
        id: "65f493df-4372-4ab7-8516-5c3043f5561e",
        attributes: {
          submitted: true
        }
      }
    });
    console.log("🎉 Successfully submitted to App Store Review!", submitRes.data.attributes.state);
  } catch (e) {
    console.error("Operation result/error:", e.message);
  }
}

run().catch(console.error);
