import { o as __toESM } from "../_runtime.mjs";
import { i as require_react, r as require_jsx_runtime, t as useQuery } from "../_libs/react+tanstack__react-query.mjs";
import { v as useNavigate, y as useSearch } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as createServerFn } from "./ssr.mjs";
import { t as GROK_PROVIDERS } from "./server-BjmXTM3N.mjs";
import { authClient, signIn, signOut } from "./client-Cm1077F-.mjs";
import { i as createSsrRpc, r as queryClient } from "./router-Bn0FQ7jt.mjs";
import { C as tinyPhoto, S as soundsOn, T as waHref, _ as playCelebrate, a as KissSky, b as setSoundPrefs, c as cn, d as getSoundPrefs, f as isValidPhone, g as pickFromPhone, h as phoneDigits, i as HeartMark, l as cropPhoto, m as loadRecents, n as CatchScreen, o as LipsMark, p as loadMe, r as ConfettiBurst, s as canPickContacts, t as Button, u as faceTemplate, v as rememberContact, w as unlockSound, x as smsHref, y as saveMe } from "./me-C5yQa7jV.mjs";
import { i as rankAt, n as isSkin, r as nextRank, t as authMiddleware } from "./ranks-CuwA0vI9.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BbRzRrWX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function BootSplash({ hold, onReady }) {
	const [dark, setDark] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const a = window.setTimeout(() => setDark(true), 850);
		const b = window.setTimeout(() => onReady(), 2200);
		return () => {
			window.clearTimeout(a);
			window.clearTimeout(b);
		};
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: dark ? "boot is-dark" : "boot",
		"aria-hidden": true,
		children: [dark ? Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartMark, { className: `boot-bit boot-heart boot-h-${i + 1}` }, i)) : Array.from({ length: 8 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LipsMark, { className: `boot-bit boot-kiss boot-k-${i + 1}` }, i)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "boot-word",
			children: "KISS"
		})]
	});
}
function KissSkin({ skin, className, style }) {
	const id = skin && isSkin(skin) ? skin : "classic";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 64 48",
		className: cn("kiss-skin", `skin-${id}`, className),
		style,
		"aria-hidden": true,
		children: shape(id)
	});
}
function shape(id) {
	const lips = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
		d: "M8 24c6-12 14-16 24-16s18 4 24 16c-6 12-14 16-24 16S14 36 8 24Z",
		fill: "currentColor"
	});
	const split = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
		d: "M10 24c5-1 11 2 22 2s17-3 22-2",
		fill: "none",
		stroke: "var(--color-bg)",
		strokeWidth: "2",
		strokeLinecap: "round"
	});
	if (id === "gold") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		lips,
		split,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "50",
			cy: "10",
			r: "3",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "14",
			cy: "12",
			r: "2",
			fill: "currentColor"
		})
	] });
	if (id === "pink") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
		d: "M6 24c7-14 16-18 26-18s19 4 26 18c-7 14-16 18-26 18S13 38 6 24Z",
		fill: "currentColor"
	}), split] });
	if (id === "fire") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M20 12c2-8 8-10 12-4 4-8 12-4 12 4 8 0 12 8 8 14-4-2-8-2-12 2-4-6-12-6-16-2-4-4-10-6-12-8 2-4 6-6 8-6Z",
			fill: "currentColor",
			opacity: "0.85"
		}),
		lips,
		split
	] });
	if (id === "ice") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		lips,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M32 4 36 12 32 10 28 12Z",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M8 16 14 18 10 20Z",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M56 16 50 18 54 20Z",
			fill: "currentColor"
		})
	] });
	if (id === "venom") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
		d: "M8 22c6-10 14-14 24-14s18 4 24 14c-4 6-10 12-16 16l-8-8-8 8c-6-4-12-10-16-16Z",
		fill: "currentColor"
	}), split] });
	if (id === "royal") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M16 12 22 4 32 10 42 4 48 12 32 14Z",
			fill: "currentColor"
		}),
		lips,
		split
	] });
	if (id === "void") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
		d: "M8 24c6-12 14-16 24-16s18 4 24 16c-6 12-14 16-24 16S14 36 8 24Z",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: "4"
	});
	if (id === "myth") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M12 20c5-10 12-13 20-13s15 3 20 13c-5 10-12 13-20 13S17 30 12 20Z",
			fill: "currentColor",
			opacity: "0.55"
		}),
		lips,
		split
	] });
	if (id === "god") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M32 2 34 10 32 8 30 10Z",
			fill: "currentColor"
		}),
		lips,
		split,
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "24",
			r: "3",
			fill: "var(--color-bg)"
		})
	] });
	if (id === "eternal") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "32",
			cy: "24",
			r: "22",
			fill: "none",
			stroke: "currentColor",
			strokeWidth: "2"
		}),
		lips,
		split
	] });
	if (id === "immortal") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M32 0 36 12 32 10 28 12Z",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M4 24 16 20 14 24 16 28Z",
			fill: "currentColor"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M60 24 48 20 50 24 48 28Z",
			fill: "currentColor"
		}),
		lips,
		split
	] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [lips, split] });
}
function KissOrbit({ photo, items, onAddPhoto, onCatch, onFace, onReply }) {
	const shown = items.slice(0, 6);
	const faceRef = (0, import_react.useRef)(null);
	const pending = (0, import_react.useRef)(null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "orbit",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: faceRef,
				type: "file",
				accept: "image/*",
				className: "hidden",
				onChange: (e) => {
					const file = e.target.files?.[0];
					const id = pending.current;
					e.target.value = "";
					pending.current = null;
					if (!file || !id) return;
					tinyPhoto(file).then((data) => {
						if (data) onFace(id, data);
					});
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "orbit-face",
				onClick: onAddPhoto,
				"aria-label": photo ? "Change photo" : "Add photo",
				children: photo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: photo,
					alt: "",
					className: "orbit-photo"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: faceTemplate("you"),
					alt: "",
					className: "orbit-photo"
				})
			}),
			shown.map((item, i) => {
				const canCatch = item.dir === "in" && item.status === "waiting";
				const face = item.photo || faceTemplate(item.name);
				const n = Math.max(item.toMe ?? 0, item.fromMe ?? 0, 1);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: `orbit-chip orbit-chip-${i + 1} is-${item.dir} is-${item.status}`,
					onClick: () => {
						if (item.dir === "in") onCatch(item);
						else onReply(item);
					},
					onContextMenu: (e) => {
						e.preventDefault();
						pending.current = item.id;
						faceRef.current?.click();
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "chip-face",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: face,
									alt: "",
									className: "chip-photo"
								}),
								Array.from({ length: Math.min(n, 5) }, (_, k) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KissSkin, {
									skin: item.skin,
									className: "chip-kiss",
									style: {
										transform: `translate(${k * 3}px, ${k * -2}px) rotate(${k * 12}deg)`,
										zIndex: 5 - k
									}
								}, k)),
								n > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "chip-count",
									children: ["×", n]
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "orbit-who",
							children: item.name
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "orbit-meta",
							children: canCatch ? "open" : n > 1 ? `${n} kisses` : "kiss"
						})
					]
				}, item.id);
			})
		]
	});
}
function LiveKiss({ from, photo, first, count, skin, canReply, more, onClose, onReply, onFlood }) {
	const src = photo || faceTemplate(from);
	const n = Math.max(1, Math.min(count, 16));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "live-kiss",
		role: "dialog",
		"aria-label": `${from} kissed you`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfettiBurst, { show: true }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "live-card",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "live-face",
					onClick: onReply,
					"aria-label": `Kiss ${from} back`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src,
							alt: ""
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KissSkin, {
							skin,
							className: "live-stamp"
						}),
						Array.from({ length: n }, (_, i) => {
							const a = i / n * Math.PI * 2 - Math.PI / 2;
							const rad = 88;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "count-bit",
								style: {
									left: `calc(50% + ${Math.cos(a) * rad}px)`,
									top: `calc(50% + ${Math.sin(a) * rad}px)`,
									animationDelay: `${i * 70}ms`
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(KissSkin, { skin })
							}, i);
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "live-kicker",
					children: first ? "Your first kiss" : "Opened"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "live-name",
					children: from
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "live-count",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "tabular-nums",
							children: count
						}),
						" ",
						count === 1 ? "kiss" : "kisses",
						" to you"
					]
				}),
				canReply !== false ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "live-go",
					onClick: onReply,
					children: "Kiss back"
				}) : null,
				canReply !== false && onFlood ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "live-flood",
					onClick: onFlood,
					children: "Flood ×21"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "live-skip",
					onClick: onClose,
					children: more ? "Next kiss" : "See who"
				})
			]
		})]
	});
}
/** Keeps --kb in sync with the iOS/Android keyboard so sheets sit above it. */
function useKeyboardInset(active) {
	(0, import_react.useEffect)(() => {
		if (!active || typeof window === "undefined") return;
		const vv = window.visualViewport;
		const sync = () => {
			const kb = vv ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0;
			document.documentElement.style.setProperty("--kb", `${Math.round(kb)}px`);
		};
		document.body.classList.add("sheet-open");
		vv?.addEventListener("resize", sync);
		vv?.addEventListener("scroll", sync);
		window.addEventListener("resize", sync);
		sync();
		return () => {
			document.body.classList.remove("sheet-open");
			vv?.removeEventListener("resize", sync);
			vv?.removeEventListener("scroll", sync);
			window.removeEventListener("resize", sync);
			document.documentElement.style.setProperty("--kb", "0px");
		};
	}, [active]);
}
function isLive(lastSeen) {
	if (!lastSeen) return false;
	const t = new Date(lastSeen).getTime();
	if (Number.isNaN(t)) return false;
	return Date.now() - t < 3e5;
}
var getHome = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(createSsrRpc("c28266f17f8477d6fb68a78c179a7b606959ce3d0ab9e2665015e002bc25179b"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("a7cfb66bfe22dc63b14f4fd08b1f0f36f6ae6a5470b9cc261fe57724b010a103"));
var searchPeople = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((q) => q).handler(createSsrRpc("f266e40787c19954abaef16bb4f1f66a93659ff8bfd4ed146372c984e16733a6"));
var browsePeople = createServerFn({ method: "GET" }).handler(createSsrRpc("f9896789eb12b16dc8fd72db0206a8ab69e71ba72c28c053a3c3f71e4ea3948e"));
var matchPhones = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((phones) => phones).handler(createSsrRpc("5cf015d7a6e57cff719e072a2097d2134b4daa1027aead5828bd0c3b1b24446e"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((handle) => handle).handler(createSsrRpc("f8ff61ecf89a668eea414148e2c147939689e1a63fb5feb1d0a12a75163684b4"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("353b8fc3ff348f1228ef211bc840f602b5aa336ab03fdeb4045c3465e2d3f1f7"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("01af8e25b1e70190450b8d0ea818c43b549f610d60c587d9cc9cdcc2d6b0daf7"));
var sendKiss = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("5de9c1aaeef2fd5a84d2402981967765b0946ad65ad9173bde349da26a6d8c99"));
var catchKiss = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((id) => id).handler(createSsrRpc("f847bc4f2e0841843c7d47dba394c9fc872ddf99ceda720bc2f5e04e0dfd7584"));
var setDisplayName = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((name) => name).handler(createSsrRpc("222b817d6834b3fddfbabaabc917c7295e5c197d750cdbb35b8c456d96002f26"));
var setPhone = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((phone) => phone).handler(createSsrRpc("e57dafb45ccef2030048ceafbc8f394050ab875e54550b1a95b1502315eb0696"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((phone) => phone).handler(createSsrRpc("c80f170e2393cc9b2ed559550945ff51d8273ac775a465b92d206151f44c40a1"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((kind) => kind).handler(createSsrRpc("daaefd1b96122bd9195cec25e6caba33ad7a04974331977c94e3c774993bfb65"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((userId) => userId).handler(createSsrRpc("8dbdceda2238388f8f6f6d1786c77c9d22dc9227b9569a573d88352d9b18fbf6"));
function kissLine(from, to) {
	const who = cleanName(from);
	const target = to?.trim() ?? "";
	if (target && !isPhone(target) && target.toLowerCase() !== "you") return `${who} kissed ${cleanName(target)}.`;
	return `${who} kissed you.`;
}
function sharePayload(from, to, toPhone) {
	const who = cleanName(from);
	const text = kissLine(from, to);
	const url = publicCatchUrl(who, toPhone);
	return {
		title: `A kiss from ${who}`,
		text,
		url
	};
}
function shareBody(from, to, toPhone) {
	const { text, url } = sharePayload(from, to, toPhone);
	return url ? `${text}\n${url}` : text;
}
function publicCatchUrl(from, toPhone) {
	const origin = publicOrigin();
	if (!origin) return void 0;
	const base = `${origin}/k/${encodeURIComponent(from)}`;
	const digits = (toPhone ?? "").replace(/\D/g, "");
	if (digits.length >= 8) return `${base}?p=${encodeURIComponent(digits)}`;
	return base;
}
function cleanName(raw) {
	const t = raw.trim().replace(/\s+/g, " ").slice(0, 32);
	if (!t || /^you$/i.test(t)) return "Someone";
	return t;
}
function isPhone(raw) {
	return /^\+?\d[\d\s-]{6,}$/.test(raw.trim());
}
function publicOrigin() {
	if (typeof window === "undefined") return null;
	const { hostname, origin } = window.location;
	if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".grok-sandbox.com") || hostname.endsWith(".localhost")) return null;
	return origin;
}
var Input = (0, import_react.forwardRef)(function Input({ className, ...props }, ref) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		className: cn("h-12 w-full rounded-md border border-border bg-elevated px-3 text-base text-fg placeholder:text-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
});
function SendSheet({ open, myName, signedIn, mySent, people, target, onClose, onSent }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [tel, setTel] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [hits, setHits] = (0, import_react.useState)([]);
	const picker = canPickContacts();
	useKeyboardInset(open);
	(0, import_react.useEffect)(() => {
		if (!open) {
			setQuery("");
			setTel("");
			setError(null);
			setHits([]);
			return;
		}
		setQuery(target?.name ?? "");
		setTel(target?.tel ?? "");
		setError(null);
		setHits(people);
		browsePeople().then((rows) => {
			const mine = myName.trim().toLowerCase();
			setHits(rows.filter((p) => p.displayName.trim().toLowerCase() !== mine));
		}).catch(() => setHits(people));
	}, [open, target]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const q = query.trim();
		const handle = window.setTimeout(() => {
			if (signedIn) {
				searchPeople({ data: q }).then(setHits).catch(() => void 0);
				return;
			}
			setHits((prev) => q ? prev.filter((p) => p.displayName.toLowerCase().includes(q.toLowerCase())) : prev);
		}, 160);
		return () => window.clearTimeout(handle);
	}, [
		query,
		signedIn,
		open
	]);
	if (!open) return null;
	const body = shareBody(myName, query, tel);
	const hasPhone = isValidPhone(tel);
	const shown = hits;
	function finishInApp(toName, userId, count = 1) {
		rememberContact({
			name: toName,
			tel
		});
		onSent({
			name: toName,
			status: "waiting",
			tel,
			userId,
			count
		});
		onClose();
	}
	function kissPerson(person, count = 1) {
		if (!signedIn) {
			setError("Sign in to send inside");
			return;
		}
		setBusy(true);
		sendKiss({ data: {
			toUserId: person.userId,
			kind: rankAt(mySent).skin,
			count
		} }).then(() => finishInApp(person.displayName || person.handle, person.userId, count)).catch((err) => setError(err instanceof Error ? err.message : "Missed")).finally(() => setBusy(false));
	}
	async function onPick() {
		setError(null);
		if (!picker) return;
		try {
			const picked = await pickFromPhone();
			if (picked.length === 0) return;
			if (signedIn) {
				const matched = await matchPhones({ data: picked.map((c) => c.tel) });
				if (matched.length > 0) {
					setHits(matched);
					return;
				}
			}
			const first = picked[0];
			if (first) {
				setQuery(first.name);
				setTel(first.tel);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not open contacts");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sheet-scrim",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet",
			role: "dialog",
			"aria-label": "Send a kiss",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: "Send inside"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "sheet-x",
						onClick: onClose,
						"aria-label": "Close",
						children: "Close"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "People already on KISS. Tap Kiss — no WhatsApp."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-3",
					value: query,
					onChange: (e) => {
						const v = e.target.value;
						setQuery(v);
						setError(null);
						if (isValidPhone(v)) setTel(v);
					},
					placeholder: "Search who's here",
					autoComplete: "off"
				}),
				!signedIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 space-y-2",
					children: GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						className: "w-full",
						onClick: () => void signIn(p.providerId, { callbackURL: "/" }),
						children: ["Sign in with ", p.label]
					}, p.providerId))
				}) : null,
				shown.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "hit-list mt-3",
					children: shown.map((hit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "hit-block",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "hit",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: faceTemplate(hit.displayName),
									alt: "",
									className: "hit-face"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "hit-copy",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "hit-name",
										children: [isLive(hit.lastSeen) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "live-dot" }) : null, hit.displayName]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "hit-meta",
										children: isLive(hit.lastSeen) ? "live now" : "on KISS"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "lg",
								className: "mt-1 h-12 w-full rounded-xl font-display text-lg",
								disabled: busy,
								onClick: () => kissPerson(hit, 1),
								children: busy ? "…" : `Kiss ${hit.displayName.split(" ")[0]}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flood-row",
								children: [
									7,
									21,
									69
								].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: "flood-n",
									disabled: busy,
									onClick: () => kissPerson(hit, n),
									children: ["×", n]
								}, n))
							})
						]
					}, hit.userId))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: query.trim() ? "Nobody here with that name." : "You're first. Invite someone below."
				}),
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-primary",
					children: error
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "invite-label",
					children: "Not on KISS yet?"
				}),
				picker ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "invite-toggle",
					onClick: () => void onPick(),
					children: "Match contacts"
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-2",
					value: tel,
					type: "tel",
					name: "phone",
					inputMode: "tel",
					autoComplete: "tel",
					onChange: (e) => setTel(e.target.value),
					placeholder: "Their phone to invite"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sheet-actions",
					children: hasPhone ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "send-wa",
						href: waHref(tel, body),
						onClick: (e) => {
							e.preventDefault();
							rememberContact({
								name: query.trim() || "them",
								tel
							});
							onSent({
								name: query.trim() || "them",
								status: "invited",
								tel
							});
							window.location.assign(waHref(tel, body));
						},
						children: "WhatsApp invite"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						className: "send-link",
						href: smsHref(tel, body),
						onClick: () => {
							rememberContact({
								name: query.trim() || "them",
								tel
							});
							onSent({
								name: query.trim() || "them",
								status: "invited",
								tel
							});
						},
						children: "Messages invite"
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "send-wa is-off",
						children: "WhatsApp invite"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "send-link is-off",
						children: "Messages invite"
					})] })
				})
			]
		})
	});
}
function SoundSettings({ open, onClose }) {
	const [prefs, setPrefs] = (0, import_react.useState)(getSoundPrefs);
	if (!open) return null;
	function toggle(key) {
		unlockSound();
		setPrefs(setSoundPrefs({ [key]: !prefs[key] }));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sheet-scrim",
		onClick: onClose,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet",
			role: "dialog",
			"aria-label": "Settings",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sheet-head",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-2xl",
						children: "Settings"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "sheet-x",
						onClick: onClose,
						"aria-label": "Close",
						children: "Close"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "sound-row mt-4",
					onClick: () => toggle("kisses"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Kiss sounds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: prefs.kisses ? "sound-on" : "sound-off",
						children: prefs.kisses ? "On" : "Off"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "sound-row",
					onClick: () => toggle("hearts"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Heart sounds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: prefs.hearts ? "sound-on" : "sound-off",
						children: prefs.hearts ? "On" : "Off"
					})]
				})
			]
		})
	});
}
var HOME_KEY = ["home"];
function useHome(enabled = true) {
	return useQuery({
		queryKey: HOME_KEY,
		queryFn: () => getHome(),
		enabled,
		refetchInterval: enabled ? 4e3 : false
	});
}
function invalidateHome() {
	return queryClient.invalidateQueries({ queryKey: HOME_KEY });
}
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
function askNotify() {
	if (typeof Notification === "undefined") return;
	if (Notification.permission === "default") Notification.requestPermission();
}
function notifyKiss(from) {
	if (typeof window === "undefined") return;
	const line = `${from} kissed you.`;
	if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([
		40,
		40,
		80
	]);
	if (typeof Notification !== "undefined" && Notification.permission === "granted") try {
		new Notification("KISS", {
			body: line,
			tag: "kiss-in",
			silent: false
		});
	} catch {}
}
function Home() {
	const { user, isPending } = useCurrentUserState();
	const search = useSearch({ from: "/" });
	const navigate = useNavigate();
	const [me, setMe] = (0, import_react.useState)(() => loadMe());
	const [burst, setBurst] = (0, import_react.useState)(false);
	const [sendOpen, setSendOpen] = (0, import_react.useState)(false);
	const [sendTarget, setSendTarget] = (0, import_react.useState)(null);
	const [queue, setQueue] = (0, import_react.useState)([]);
	const live = queue[0] ?? null;
	function nextLive() {
		setQueue((q) => q.slice(1));
	}
	const [gate, setGate] = (0, import_react.useState)(false);
	const [bootReady, setBootReady] = (0, import_react.useState)(false);
	const [forceGo, setForceGo] = (0, import_react.useState)(false);
	const [settings, setSettings] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = window.setTimeout(() => setForceGo(true), 3200);
		return () => window.clearTimeout(t);
	}, []);
	const [draftName, setDraftName] = (0, import_react.useState)("");
	const [draftPhone, setDraftPhone] = (0, import_react.useState)("");
	const photoRef = (0, import_react.useRef)(null);
	const liveUser = user && !user.isDevFallback ? user : null;
	const home = useHome(Boolean(liveUser));
	function patch(partial) {
		setMe((prev) => {
			const next = {
				...prev,
				...partial
			};
			saveMe(next);
			return next;
		});
	}
	function celebrate(count = 1) {
		unlockSound();
		playCelebrate(count);
		setBurst(true);
		window.setTimeout(() => setBurst(false), 1400);
	}
	(0, import_react.useEffect)(() => {
		if (!liveUser) return;
		setMe((prev) => {
			const nextName = prev.name || liveUser.displayName || "";
			const nextPhoto = prev.photo || liveUser.profileImageUrl || null;
			const nextPhone = prev.phone || "";
			if (prev.entered && nextName === prev.name && nextPhoto === prev.photo && nextPhone === prev.phone) return prev;
			const next = {
				...prev,
				entered: true,
				name: nextName,
				photo: nextPhoto,
				phone: nextPhone
			};
			saveMe(next);
			return next;
		});
	}, [liveUser]);
	(0, import_react.useEffect)(() => {
		const p = home.data?.profile;
		if (!p) return;
		setMe((prev) => {
			const nextName = prev.name || p.displayName || "";
			const nextPhone = prev.phone || p.phone || "";
			if (nextName === prev.name && nextPhone === prev.phone && prev.entered) return prev;
			const next = {
				...prev,
				entered: true,
				name: nextName,
				phone: nextPhone
			};
			saveMe(next);
			return next;
		});
	}, [home.data?.profile]);
	(0, import_react.useEffect)(() => {
		if (!search.p || !isValidPhone(search.p)) return;
		const digits = phoneDigits(search.p);
		if (me.phone === digits) return;
		patch({
			phone: digits,
			entered: true
		});
	}, [search.p]);
	(0, import_react.useEffect)(() => {
		const all = home.data?.sentAll;
		if (typeof all !== "number") return;
		if (all > me.sent) patch({ sent: all });
	}, [home.data?.sentAll]);
	(0, import_react.useEffect)(() => {
		const theirPhone = home.data?.profile?.phone;
		if (!theirPhone || me.phone) return;
		patch({ phone: theirPhone });
	}, [home.data?.profile?.phone]);
	(0, import_react.useEffect)(() => {
		const fresh = (home.data?.inbox ?? []).filter((k) => !k.caughtAt && k.id > me.lastInboxId);
		if (fresh.length === 0) return;
		const maxId = Math.max(...fresh.map((k) => k.id));
		const first = me.received === 0;
		patch({ lastInboxId: maxId });
		const grouped = /* @__PURE__ */ new Map();
		for (const k of fresh) {
			const list = grouped.get(k.fromName) ?? [];
			list.push(k);
			grouped.set(k.fromName, list);
		}
		const next = [...grouped.entries()].map(([fromName, list], i) => ({
			from: fromName,
			photo: me.orbit.find((o) => o.name === fromName)?.photo ?? null,
			first: first && i === 0,
			count: list.length,
			skin: list[0]?.kind,
			canReply: !(home.data?.sent ?? []).some((s) => s.toName.toLowerCase() === fromName.toLowerCase())
		}));
		celebrate(next[0]?.count ?? 1);
		notifyKiss(next[0]?.from ?? "Someone");
		setQueue((q) => {
			const names = new Set(q.map((x) => x.from));
			return [...q, ...next.filter((x) => !names.has(x.from))];
		});
		if (fresh[0]?.id) for (const k of fresh) catchKiss({ data: k.id }).then(() => invalidateHome());
	}, [home.data?.inbox]);
	(0, import_react.useEffect)(() => {
		if (!liveUser || !isValidPhone(me.phone)) return;
		setPhone({ data: me.phone }).catch(() => void 0);
	}, [liveUser, me.phone]);
	const orbit = (0, import_react.useMemo)(() => mergeOrbit(me.orbit, home.data), [me.orbit, home.data]);
	if (!forceGo && !bootReady) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BootSplash, { onReady: () => setBootReady(true) });
	if (search.k) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatchScreen, {
		from: search.k,
		first: me.received === 0,
		onCaught: () => {
			setMe((prev) => {
				const item = {
					id: `in-${Date.now()}`,
					dir: "in",
					name: search.k || "Someone",
					status: "caught"
				};
				const phone = search.p && isValidPhone(search.p) ? phoneDigits(search.p) : prev.phone;
				const next = {
					...prev,
					received: prev.received + 1,
					entered: true,
					phone,
					orbit: [item, ...prev.orbit].slice(0, 16)
				};
				saveMe(next);
				return next;
			});
			navigate({
				to: "/",
				search: {},
				replace: true
			});
		}
	});
	const displayName = me.name || liveUser?.displayName || "You";
	const photo = me.photo || liveUser?.profileImageUrl || null;
	const sent = Math.max(me.sent, home.data?.sent.length ?? 0);
	const received = Math.max(me.received, (home.data?.inbox ?? []).filter((k) => k.caughtAt).length);
	const phoneOk = isValidPhone(me.phone || home.data?.profile?.phone || search.p || "");
	const nameOk = (me.name || "").trim().length >= 2;
	if (!phoneOk) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KissSky, {
		quiet: gate,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "storm-hero items-center px-5 pb-8 text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "welcome-word",
				children: "Kiss"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				className: "relative z-10 h-14 w-full max-w-xs rounded-xl font-display text-xl",
				onClick: () => setGate(true),
				children: "Send kiss"
			})]
		})
	}), gate ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PhoneGate, {
		draftPhone: draftPhone || me.phone || search.p || "",
		onDraftPhone: setDraftPhone,
		onReady: (phone) => {
			patch({
				entered: true,
				phone
			});
			setGate(false);
		}
	}) : null] });
	if (!nameOk) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KissSky, {
		quiet: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stage" })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameGate, {
		draftName: draftName || me.name,
		onDraftName: setDraftName,
		onReady: (name) => {
			patch({
				entered: true,
				name
			});
			if (liveUser) setDisplayName({ data: name });
		}
	})] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(KissSky, {
			quiet: sendOpen,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfettiBurst, { show: burst }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: photoRef,
					type: "file",
					accept: "image/*",
					className: "hidden",
					onChange: (e) => {
						const file = e.target.files?.[0];
						e.target.value = "";
						if (!file) return;
						cropPhoto(file).then((data) => patch({ photo: data }));
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "stage",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KissOrbit, {
							photo,
							items: orbit,
							onAddPhoto: () => photoRef.current?.click(),
							onCatch: (item) => {
								const isWaiting = item.dir === "in" && item.status === "waiting";
								if (isWaiting) {
									celebrate();
									if (item.serverId) catchKiss({ data: item.serverId }).then(() => invalidateHome());
									setMe((prev) => {
										const nextOrbit = prev.orbit.map((k) => k.id === item.id ? {
											...k,
											status: "caught"
										} : k);
										const next = {
											...prev,
											received: prev.received + 1,
											orbit: nextOrbit
										};
										saveMe(next);
										return next;
									});
								}
								setQueue((q) => [{
									from: item.name,
									photo: item.photo ?? null,
									first: isWaiting && received === 0,
									count: Math.max(1, item.toMe ?? (item.dir === "in" ? 1 : 0)),
									skin: item.skin,
									canReply: item.fromMe === 0
								}, ...q.filter((x) => x.from !== item.name)]);
								setSendTarget({
									name: item.name,
									tel: item.tel || "",
									photo: item.photo ?? null
								});
							},
							onFace: (id, face) => {
								setMe((prev) => {
									const nextOrbit = prev.orbit.map((k) => k.id === id ? {
										...k,
										photo: face
									} : k);
									const next = {
										...prev,
										orbit: nextOrbit
									};
									saveMe(next);
									return next;
								});
							},
							onReply: (item) => {
								if (item.userId && liveUser) {
									sendKiss({ data: {
										toUserId: item.userId,
										kind: rankAt(sent).skin
									} }).then(() => {
										setMe((prev) => {
											const next = {
												...prev,
												sent: prev.sent + 1,
												orbit: [{
													...item,
													id: `out-${Date.now()}`,
													dir: "out",
													status: "waiting"
												}, ...prev.orbit].slice(0, 16)
											};
											saveMe(next);
											return next;
										});
										celebrate();
										invalidateHome();
									}).catch(() => {
										setSendTarget({
											name: item.name,
											tel: item.tel || "",
											photo: item.photo ?? null,
											userId: item.userId
										});
										setSendOpen(true);
									});
									return;
								}
								const rec = loadRecents().find((c) => c.name.toLowerCase() === item.name.toLowerCase());
								setSendTarget({
									name: item.name,
									tel: item.tel || rec?.tel || "",
									photo: item.photo || rec?.photo || null,
									userId: item.userId
								});
								askNotify();
								setSendOpen(true);
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NameLine, {
							value: displayName,
							onChange: (name) => {
								patch({ name });
								if (liveUser) setDisplayName({ data: name });
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "phone-line",
							children: me.phone
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "counts",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums text-fg",
									children: sent
								}),
								" sent",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mx-2 text-subtle",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "tabular-nums text-fg",
									children: received
								}),
								" caught"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RankBar, { kisses: sent }),
						(home.data?.people ?? []).length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "live-row",
							children: (home.data?.people ?? []).slice(0, 8).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: "live-pill",
								onClick: () => {
									if (!liveUser) return;
									sendKiss({ data: {
										toUserId: p.userId,
										kind: rankAt(sent).skin
									} }).then(() => {
										setMe((prev) => {
											const next = {
												...prev,
												sent: prev.sent + 1,
												orbit: [{
													id: `out-${Date.now()}`,
													dir: "out",
													name: p.displayName,
													status: "waiting",
													userId: p.userId,
													skin: rankAt(sent).skin
												}, ...prev.orbit].slice(0, 16)
											};
											saveMe(next);
											return next;
										});
										celebrate();
										invalidateHome();
									});
								},
								children: [isLive(p.lastSeen) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "live-dot" }) : null, p.displayName.split(" ")[0]]
							}) }, p.userId))
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "dock",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								size: "lg",
								className: "h-14 w-full rounded-xl font-display text-xl",
								onClick: () => {
									unlockSound();
									askNotify();
									setSendTarget(null);
									setSendOpen(true);
								},
								children: "Send kiss"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "underline-offset-4 hover:underline",
										onClick: () => setSettings(true),
										children: soundsOn() ? "Sound on" : "Sound off"
									}),
									!liveUser ? GROK_PROVIDERS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "underline-offset-4 hover:underline",
										onClick: () => signIn(p.providerId, { callbackURL: "/" }),
										children: p.label
									}, p.providerId)) : null,
									liveUser ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "underline-offset-4 hover:underline",
										onClick: () => void signOut(),
										children: "Out"
									}) : null
								]
							})]
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SendSheet, {
			open: sendOpen,
			myName: displayName,
			signedIn: Boolean(liveUser),
			mySent: sent,
			people: home.data?.people ?? [],
			target: sendTarget,
			onClose: () => {
				setSendOpen(false);
				setSendTarget(null);
			},
			onSent: (payload) => {
				const item = {
					id: `out-${Date.now()}`,
					dir: "out",
					name: payload.name,
					status: payload.status,
					photo: payload.photo ?? null,
					tel: payload.tel,
					userId: payload.userId,
					skin: rankAt(sent).skin
				};
				setMe((prev) => {
					const next = {
						...prev,
						sent: prev.sent + (payload.count ?? 1),
						orbit: [item, ...prev.orbit].slice(0, 16)
					};
					saveMe(next);
					return next;
				});
				celebrate(payload.count ?? 1);
				invalidateHome();
			}
		}),
		settings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SoundSettings, {
			open: true,
			onClose: () => setSettings(false)
		}) : null,
		live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LiveKiss, {
			from: live.from,
			photo: live.photo,
			first: live.first,
			count: live.count,
			skin: live.skin,
			canReply: live.canReply !== false,
			more: queue.length > 1,
			onClose: nextLive,
			onReply: () => {
				const from = live.from;
				const rec = loadRecents().find((c) => c.name.toLowerCase() === from.toLowerCase());
				const person = (home.data?.people ?? []).find((p) => p.displayName.toLowerCase() === from.toLowerCase());
				nextLive();
				if (person && liveUser) {
					sendKiss({ data: {
						toUserId: person.userId,
						kind: rankAt(sent).skin,
						count: 1
					} }).then(() => {
						celebrate();
						invalidateHome();
					});
					return;
				}
				setSendTarget({
					name: from,
					tel: sendTarget?.tel || rec?.tel || "",
					photo: live.photo || rec?.photo || null
				});
				askNotify();
				setSendOpen(true);
			},
			onFlood: () => {
				const from = live.from;
				const person = (home.data?.people ?? []).find((p) => p.displayName.toLowerCase() === from.toLowerCase());
				nextLive();
				if (person && liveUser) sendKiss({ data: {
					toUserId: person.userId,
					kind: rankAt(sent).skin,
					count: 21
				} }).then(() => {
					setMe((prev) => {
						const next = {
							...prev,
							sent: prev.sent + 21
						};
						saveMe(next);
						return next;
					});
					celebrate();
					invalidateHome();
				});
			}
		}) : null
	] });
}
function mergeOrbit(local, data) {
	const people = /* @__PURE__ */ new Map();
	function personKey(name, userId) {
		return (userId || name).trim().toLowerCase();
	}
	function bump(item) {
		const key = personKey(item.name, item.userId);
		if (!key) return;
		const cur = people.get(key);
		if (!cur) {
			people.set(key, {
				...item,
				id: `p-${key}`,
				toMe: item.toMe ?? (item.dir === "in" ? 1 : 0),
				fromMe: item.fromMe ?? (item.dir === "out" ? 1 : 0)
			});
			return;
		}
		cur.toMe = (cur.toMe ?? 0) + (item.toMe ?? (item.dir === "in" ? 1 : 0));
		cur.fromMe = (cur.fromMe ?? 0) + (item.fromMe ?? (item.dir === "out" ? 1 : 0));
		if (item.photo) cur.photo = item.photo;
		if (item.userId) cur.userId = item.userId;
		if (item.tel) cur.tel = item.tel;
		if (item.skin) cur.skin = item.skin;
		if (item.dir === "in") cur.dir = "in";
		if (item.status === "waiting") {
			cur.status = "waiting";
			if (item.serverId) cur.serverId = item.serverId;
		}
	}
	const photoOf = (name) => local.find((l) => l.name.toLowerCase() === name.toLowerCase() && l.photo)?.photo ?? null;
	const telOf = (name) => local.find((l) => l.name.toLowerCase() === name.toLowerCase() && l.tel)?.tel;
	const inboxBy = /* @__PURE__ */ new Map();
	for (const k of data?.inbox ?? []) {
		const key = personKey(k.fromName, k.fromUserId);
		const list = inboxBy.get(key) ?? [];
		list.push(k);
		inboxBy.set(key, list);
	}
	for (const [, list] of inboxBy) {
		const k = list[0];
		if (!k) continue;
		bump({
			id: `in-${k.fromUserId || k.fromName}`,
			dir: "in",
			name: k.fromName,
			status: list.some((x) => !x.caughtAt) ? "waiting" : "caught",
			serverId: list.find((x) => !x.caughtAt)?.id ?? k.id,
			photo: photoOf(k.fromName),
			hue: k.fromHue,
			tel: telOf(k.fromName),
			skin: k.kind,
			userId: k.fromUserId,
			toMe: list.length,
			fromMe: 0
		});
	}
	const sentBy = /* @__PURE__ */ new Map();
	for (const k of data?.sent ?? []) {
		const key = personKey(k.toName, k.toUserId);
		const list = sentBy.get(key) ?? [];
		list.push(k);
		sentBy.set(key, list);
	}
	for (const [, list] of sentBy) {
		const k = list[0];
		if (!k) continue;
		bump({
			id: `out-${k.toUserId || k.toName}`,
			dir: "out",
			name: k.toName,
			status: list.every((x) => x.caught) ? "caught" : "waiting",
			serverId: k.id,
			photo: photoOf(k.toName),
			tel: telOf(k.toName),
			userId: k.toUserId,
			toMe: 0,
			fromMe: list.length
		});
	}
	const localBy = /* @__PURE__ */ new Map();
	for (const l of local) {
		const key = personKey(l.name, l.userId);
		if (!key) continue;
		const list = localBy.get(key) ?? [];
		list.push(l);
		localBy.set(key, list);
	}
	for (const [key, list] of localBy) {
		const first = list[0];
		if (!first) continue;
		if (people.has(key)) {
			const cur = people.get(key);
			const photo = list.find((x) => x.photo)?.photo;
			const tel = list.find((x) => x.tel)?.tel;
			if (photo) cur.photo = photo;
			if (tel) cur.tel = tel;
			continue;
		}
		bump({
			...first,
			toMe: list.filter((x) => x.dir === "in").reduce((n, x) => n + (x.toMe ?? 1), 0),
			fromMe: list.filter((x) => x.dir === "out").reduce((n, x) => n + (x.fromMe ?? 1), 0)
		});
	}
	return [...people.values()].sort((a, b) => {
		const aw = a.dir === "in" && a.status === "waiting" ? 0 : 1;
		const bw = b.dir === "in" && b.status === "waiting" ? 0 : 1;
		if (aw !== bw) return aw - bw;
		return (b.toMe ?? 0) + (b.fromMe ?? 0) - ((a.toMe ?? 0) + (a.fromMe ?? 0));
	}).slice(0, 6);
}
function RankBar({ kisses }) {
	const rank = rankAt(kisses);
	const next = nextRank(kisses);
	const from = rank.min;
	const to = next?.min ?? from;
	const span = Math.max(1, to - from);
	const pct = next ? Math.min(100, Math.round((kisses - from) / span * 100)) : 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rank-bar",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "rank-name",
			children: [rank.name, next ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "rank-next",
				children: [
					kisses,
					"/",
					next.min,
					" · ",
					next.name
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rank-next",
				children: "max"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "rank-track",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "rank-fill",
				style: { width: `${pct}%` }
			})
		})]
	});
}
function NameLine({ value, onChange }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)(value);
	if (!editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		className: "name-line",
		onClick: () => {
			setDraft(value);
			setEditing(true);
		},
		children: value
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
		className: "mt-2 w-full max-w-xs",
		onSubmit: (e) => {
			e.preventDefault();
			onChange(draft.trim() || "You");
			setEditing(false);
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
			value: draft,
			onChange: (e) => setDraft(e.target.value),
			maxLength: 32,
			autoFocus: true,
			onBlur: () => {
				onChange(draft.trim() || "You");
				setEditing(false);
			}
		})
	});
}
function NameGate({ draftName, onDraftName, onReady }) {
	const ready = draftName.trim().length >= 2;
	useKeyboardInset(true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sheet-scrim",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "sheet",
			role: "dialog",
			"aria-label": "Your name",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: "Full name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "This is how kisses find you."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-4",
					value: draftName,
					onChange: (e) => onDraftName(e.target.value),
					placeholder: "Full name",
					autoComplete: "name"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					className: "mt-4 w-full",
					disabled: !ready,
					onClick: () => onReady(draftName.trim()),
					children: "Confirm"
				})
			]
		})
	});
}
function PhoneGate({ draftPhone, onDraftPhone, onReady }) {
	const [step, setStep] = (0, import_react.useState)("phone");
	const [code, setCode] = (0, import_react.useState)("");
	const digits = phoneDigits(draftPhone);
	const last4 = digits.slice(-4);
	const phoneReady = isValidPhone(draftPhone);
	const codeReady = code.replace(/\D/g, "").length === 4;
	useKeyboardInset(true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sheet-scrim",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "sheet",
			role: "dialog",
			"aria-label": "Your phone",
			children: step === "phone" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: "Your number"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Confirm the phone people already have."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-4",
					value: draftPhone,
					onChange: (e) => onDraftPhone(e.target.value),
					placeholder: "Phone number",
					type: "tel",
					name: "phone",
					inputMode: "tel",
					autoComplete: "tel"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					className: "mt-4 w-full",
					disabled: !phoneReady,
					onClick: () => setStep("code"),
					children: "Confirm"
				})
			] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl",
					children: "SMS code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-1 text-sm text-muted",
					children: [
						"Enter the last 4 digits of ",
						digits,
						"."
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
					className: "mt-4",
					value: code,
					onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4)),
					placeholder: "••••",
					type: "tel",
					inputMode: "numeric",
					autoComplete: "one-time-code"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					size: "lg",
					className: "mt-4 w-full",
					disabled: !codeReady,
					onClick: () => {
						if (code !== last4) return;
						onReady(digits);
					},
					children: "Confirm"
				}),
				codeReady && code !== last4 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-primary",
					children: "That code does not match."
				}) : null
			] })
		})
	});
}
//#endregion
export { Home as component };
