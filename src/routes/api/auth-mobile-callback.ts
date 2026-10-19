import { createFileRoute } from "@tanstack/react-router";
import { SESSION_TOKEN_COOKIE, readSessionToken } from "@/lib/auth/server";

function parseCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export const Route = createFileRoute("/api/auth-mobile-callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const errorParam = url.searchParams.get("error");

        const cookieHeader = request.headers.get("cookie");
        const token =
          parseCookie(cookieHeader, SESSION_TOKEN_COOKIE) ||
          parseCookie(cookieHeader, "grok-auth.session_token") ||
          parseCookie(cookieHeader, "better-auth.session_token") ||
          parseCookie(cookieHeader, "__Secure-better-auth.session_token") ||
          readSessionToken();

        let deepLink: string;
        if (token) {
          deepLink = `online.sendkiss.app://auth-callback?token=${encodeURIComponent(token)}`;
        } else {
          deepLink = `online.sendkiss.app://auth-callback?error=${encodeURIComponent(errorParam || "auth_failed")}`;
        }

        const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KISS Login</title>
  <style>
    body {
      background-color: #070707;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #141414;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 36px 24px;
      max-width: 380px;
      width: 100%;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }
    .emoji { font-size: 54px; margin-bottom: 16px; }
    h1 { font-size: 22px; margin: 0 0 8px; font-weight: 700; }
    p { font-size: 15px; color: #a1a1aa; margin: 0 0 24px; line-height: 1.5; }
    .btn {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      padding: 14px;
      background: #ec4899;
      color: #ffffff;
      font-weight: 600;
      font-size: 16px;
      text-decoration: none;
      border-radius: 12px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #db2777;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="emoji">💋</div>
    <h1>${token ? "Connected Successfully!" : "Sign-in Error"}</h1>
    <p>${token ? "Redirecting back to KISS..." : "Could not authenticate account. Please try again from the app."}</p>
    <a id="btn" href="${deepLink}" class="btn">Back to KISS</a>
  </div>
  <script>
    const target = ${JSON.stringify(deepLink)};
    window.location.href = target;
    setTimeout(() => {
      window.location.replace(target);
    }, 500);
  </script>
</body>
</html>`;

        return new Response(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      },
    },
  },
});
