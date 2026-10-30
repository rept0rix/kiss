import fs from "fs";
import crypto from "crypto";
import path from "path";

const keyId = "Q2Q7AWQ232";
const issuerId = "70c9685e-8bd7-4050-9947-46e8d30e0a3f";
const privateKey = fs.readFileSync(process.env.HOME + "/.private_keys/AuthKey_Q2Q7AWQ232.p8", "utf8");

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

async function main() {
  const locId = "02d12de3-1e56-480f-a748-3f7b8fedea6a";

  console.log("1. Finding or creating APP_IPHONE_67 screenshot set...");
  const existingSets = await api(`/appStoreVersionLocalizations/${locId}/appScreenshotSets`);
  let set = existingSets.data.find(s => s.attributes.screenshotDisplayType === "APP_IPHONE_67");

  if (!set) {
    console.log("Creating new APP_IPHONE_67 set...");
    const created = await api("/appScreenshotSets", "POST", {
      data: {
        type: "appScreenshotSets",
        attributes: {
          screenshotDisplayType: "APP_IPHONE_67"
        },
        relationships: {
          appStoreVersionLocalization: {
            data: {
              type: "appStoreVersionLocalizations",
              id: locId
            }
          }
        }
      }
    });
    set = created.data;
  }
  console.log("Using screenshot set ID:", set.id);

  const screenshotFiles = [
    "store_assets/appstore_screenshot_1_1290x2796.png",
    "store_assets/appstore_screenshot_2_1290x2796.png",
    "store_assets/appstore_screenshot_3_1290x2796.png",
    "store_assets/appstore_screenshot_4_1290x2796.png",
    "store_assets/appstore_screenshot_5_1290x2796.png"
  ];

  for (let i = 0; i < screenshotFiles.length; i++) {
    const filePath = path.resolve(screenshotFiles[i]);
    const fileName = path.basename(filePath);
    const fileBuf = fs.readFileSync(filePath);
    const fileSize = fileBuf.length;

    console.log(`\n📤 Uploading ${fileName} (${fileSize} bytes)...`);

    // Reserve screenshot
    const reserveRes = await api("/appScreenshots", "POST", {
      data: {
        type: "appScreenshots",
        attributes: {
          fileName,
          fileSize
        },
        relationships: {
          appScreenshotSet: {
            data: {
              type: "appScreenshotSets",
              id: set.id
            }
          }
        }
      }
    });

    const screenshotId = reserveRes.data.id;
    const uploadOps = reserveRes.data.attributes.uploadOperations;
    console.log(`Reserved screenshot ID: ${screenshotId}, chunks: ${uploadOps.length}`);

    // Upload chunks
    for (const op of uploadOps) {
      const chunk = fileBuf.subarray(op.offset, op.offset + op.length);
      const headers = {};
      for (const h of op.requestHeaders) {
        headers[h.name] = h.value;
      }

      console.log(`Uploading chunk: offset ${op.offset}, length ${op.length}...`);
      const uploadRes = await fetch(op.url, {
        method: op.method,
        headers,
        body: chunk
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed with status ${uploadRes.status}: ${await uploadRes.text()}`);
      }
    }

    // Commit upload
    console.log("Committing screenshot to App Store Connect...");
    await api(`/appScreenshots/${screenshotId}`, "PATCH", {
      data: {
        type: "appScreenshots",
        id: screenshotId,
        attributes: {
          uploaded: true,
          sourceFileChecksum: crypto.createHash("md5").update(fileBuf).digest("hex")
        }
      }
    });

    console.log(`✅ ${fileName} uploaded and committed successfully!`);
  }

  console.log("\n🎉 ALL SCREENSHOTS UPLOADED TO APP STORE CONNECT SUCCESSFULLY!");
}

main().catch(console.error);
