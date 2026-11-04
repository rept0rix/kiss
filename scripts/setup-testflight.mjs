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
  const appId = "6819137492";

  console.log("1. Checking internal beta groups...");
  let groups = await api(`/apps/${appId}/betaGroups`);
  let internalGroup = groups.data.find(g => g.attributes.isInternalGroup);

  if (!internalGroup) {
    console.log("Creating internal beta group...");
    try {
      const created = await api(`/betaGroups`, "POST", {
        data: {
          type: "betaGroups",
          attributes: {
            name: "Internal Testers",
            isInternalGroup: true
          },
          relationships: {
            app: {
              data: {
                type: "apps",
                id: appId
              }
            }
          }
        }
      });
      console.log("Created internal group:", created.data.id);
      internalGroup = created.data;
    } catch (e) {
      console.error("Create internal group error:", e.message);
    }
  } else {
    console.log("Found existing internal group:", internalGroup.id);
  }

  // Check beta testers
  console.log("\n2. Checking beta testers...");
  const testers = await api(`/betaTesters?filter[email]=na0ryank0@gmail.com`);
  let tester = testers.data?.[0];

  if (!tester) {
    console.log("Adding na0ryank0@gmail.com as beta tester...");
    try {
      const createdTester = await api(`/betaTesters`, "POST", {
        data: {
          type: "betaTesters",
          attributes: {
            email: "na0ryank0@gmail.com",
            firstName: "Naor",
            lastName: "Yanko"
          },
          relationships: {
            betaGroups: {
              data: internalGroup ? [{ type: "betaGroups", id: internalGroup.id }] : []
            }
          }
        }
      });
      console.log("Added tester:", createdTester.data.id);
      tester = createdTester.data;
    } catch (e) {
      console.error("Add tester error:", e.message);
    }
  } else {
    console.log("Found tester:", tester.id, tester.attributes.email);
    if (internalGroup) {
      console.log("Adding tester to internal group...");
      try {
        await api(`/betaGroups/${internalGroup.id}/relationships/betaTesters`, "POST", {
          data: [{ type: "betaTesters", id: tester.id }]
        });
        console.log("Successfully added tester to internal group!");
      } catch (e) {
        console.log("Tester already in group or error:", e.message);
      }
    }
  }

  // Link Build 2 to the beta group if needed
  if (internalGroup) {
    const buildId = "50b79d8c-facc-4cdb-96de-b6154e0f7dba"; // Build 2
    console.log("\n3. Adding Build 2 to internal group...");
    try {
      await api(`/betaGroups/${internalGroup.id}/relationships/builds`, "POST", {
        data: [{ type: "builds", id: buildId }]
      });
      console.log("Build 2 successfully linked to internal beta group!");
    } catch (e) {
      console.log("Link build note:", e.message);
    }
  }
}

run().catch(console.error);
