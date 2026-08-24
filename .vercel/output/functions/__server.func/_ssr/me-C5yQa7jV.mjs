import { o as __toESM } from "../_runtime.mjs";
import { i as require_react, r as require_jsx_runtime } from "../_libs/react+tanstack__react-query.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/me-C5yQa7jV.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HeartMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		viewBox: "0 0 64 56",
		className,
		"aria-hidden": true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M32 50S6 34 6 18C6 8 16 2 24 8c4 3 8 8 8 8s4-5 8-8c8-6 18 0 18 10 0 16-26 32-26 32Z",
			fill: "currentColor"
		})
	});
}
function LipsMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 64 40",
		className,
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M8 22c6-10 14-14 24-14s18 4 24 14c-6 10-14 14-24 14S14 32 8 22Z",
			fill: "currentColor"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
			d: "M10 22c5-1 11 2 22 2s17-3 22-2",
			fill: "none",
			stroke: "var(--color-bg)",
			strokeWidth: "2",
			strokeLinecap: "round"
		})]
	});
}
var RECENTS_KEY = "kiss-contacts-v1";
function canPickContacts() {
	if (typeof window === "undefined") return false;
	return typeof navigator.contacts?.select === "function";
}
async function pickFromPhone() {
	const nav = navigator;
	if (!nav.contacts?.select) return [];
	let rows = [];
	try {
		rows = await nav.contacts.select([
			"name",
			"tel",
			"icon"
		], { multiple: true });
	} catch {
		try {
			rows = await nav.contacts.select(["name", "tel"], { multiple: true });
		} catch {
			return [];
		}
	}
	const out = [];
	for (const row of rows.slice(0, 40)) {
		const picked = {
			name: (row.name?.[0] ?? "").trim() || "Someone",
			tel: (row.tel?.[0] ?? "").trim(),
			photo: row.icon?.[0] ? await tinyPhoto(row.icon[0]) : null
		};
		rememberContact(picked);
		out.push(picked);
	}
	return out;
}
function faceTemplate(name) {
	const i = nameHue(name || "x") % 10 + 1;
	return `/faces/face-${String(i).padStart(2, "0")}.jpg`;
}
function nameHue(name) {
	let n = 0;
	for (let i = 0; i < name.length; i++) n = (n + name.charCodeAt(i) * (i + 3)) % 360;
	return n;
}
function tinyPhoto(blob) {
	return new Promise((resolve) => {
		const img = new Image();
		const url = URL.createObjectURL(blob);
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = 96;
			canvas.height = 96;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				URL.revokeObjectURL(url);
				resolve(null);
				return;
			}
			const s = Math.min(img.width, img.height);
			const sx = (img.width - s) / 2;
			const sy = (img.height - s) / 2;
			ctx.drawImage(img, sx, sy, s, s, 0, 0, 96, 96);
			URL.revokeObjectURL(url);
			resolve(canvas.toDataURL("image/jpeg", .72));
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			resolve(null);
		};
		img.src = url;
	});
}
function phoneDigits(raw) {
	const trimmed = raw.trim();
	const d = trimmed.replace(/\D/g, "");
	if (trimmed.startsWith("+")) return d;
	if (d.startsWith("00")) return d.slice(2);
	return d;
}
function isValidPhone(raw) {
	const d = phoneDigits(raw);
	return d.length >= 8 && d.length <= 15;
}
function waHref(tel, text) {
	const digits = phoneDigits(tel);
	const q = encodeURIComponent(text);
	if (digits.length >= 7) return `https://wa.me/${digits}?text=${q}`;
	return `https://wa.me/?text=${q}`;
}
function smsHref(tel, text) {
	const digits = phoneDigits(tel);
	const body = encodeURIComponent(text);
	if (typeof navigator !== "undefined" && /iPad|iPhone|iPod/i.test(navigator.userAgent)) return digits.length >= 7 ? `sms:${digits}&body=${body}` : `sms:&body=${body}`;
	return digits.length >= 7 ? `sms:${digits}?body=${body}` : `sms:?body=${body}`;
}
function loadRecents() {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(RECENTS_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed.slice(0, 12) : [];
	} catch {
		return [];
	}
}
function rememberContact(contact) {
	if (typeof window === "undefined") return;
	const name = contact.name.trim();
	const tel = contact.tel.trim();
	if (!name && !tel) return;
	const next = [{
		name: name || tel,
		tel,
		photo: contact.photo ?? null
	}, ...loadRecents().filter((c) => c.tel !== tel || c.name !== name)].slice(0, 12);
	try {
		window.localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
	} catch {}
}
var BITS = [
	{
		cls: "burst-1",
		Kind: LipsMark
	},
	{
		cls: "burst-2",
		Kind: HeartMark
	},
	{
		cls: "burst-3",
		Kind: LipsMark
	},
	{
		cls: "burst-4",
		Kind: HeartMark
	},
	{
		cls: "burst-5",
		Kind: LipsMark
	},
	{
		cls: "burst-6",
		Kind: HeartMark
	},
	{
		cls: "burst-7",
		Kind: LipsMark
	},
	{
		cls: "burst-8",
		Kind: HeartMark
	},
	{
		cls: "burst-9",
		Kind: LipsMark
	},
	{
		cls: "burst-10",
		Kind: HeartMark
	},
	{
		cls: "burst-11",
		Kind: LipsMark
	},
	{
		cls: "burst-12",
		Kind: HeartMark
	},
	{
		cls: "burst-13",
		Kind: LipsMark
	},
	{
		cls: "burst-14",
		Kind: HeartMark
	},
	{
		cls: "burst-15",
		Kind: LipsMark
	},
	{
		cls: "burst-16",
		Kind: HeartMark
	}
];
function ConfettiBurst({ show }) {
	if (!show) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "burst",
		"aria-hidden": true,
		children: BITS.map((b, i) => {
			const Kind = b.Kind;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kind, { className: `burst-bit ${b.cls}` }, i);
		})
	});
}
function KissSky({ children, quiet = false }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: quiet ? "storm is-quiet" : "storm",
		children: [
			quiet ? null : Array.from({ length: 6 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LipsMark, { className: `fly-kiss fly-kiss-${i + 1}` }, `k${i}`)),
			quiet ? null : Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeartMark, { className: `fly-heart fly-heart-${i + 1}` }, `h${i}`)),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "storm-body",
				children
			})
		]
	});
}
var KEY$1 = "kiss-sound-v1";
var DEFAULT = {
	kisses: true,
	hearts: true
};
var prefs = loadPrefs();
var ctx = null;
function loadPrefs() {
	if (typeof window === "undefined") return { ...DEFAULT };
	try {
		const raw = window.localStorage.getItem(KEY$1);
		if (!raw) return { ...DEFAULT };
		const parsed = JSON.parse(raw);
		return {
			kisses: parsed.kisses !== false,
			hearts: parsed.hearts !== false
		};
	} catch {
		return { ...DEFAULT };
	}
}
function getSoundPrefs() {
	return { ...prefs };
}
function setSoundPrefs(next) {
	prefs = {
		...prefs,
		...next
	};
	try {
		window.localStorage.setItem(KEY$1, JSON.stringify(prefs));
	} catch {}
	return getSoundPrefs();
}
function soundsOn() {
	return prefs.kisses || prefs.hearts;
}
function audio() {
	if (typeof window === "undefined") return null;
	const AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return null;
	if (!ctx) ctx = new AC();
	if (ctx.state === "suspended") ctx.resume();
	return ctx;
}
function unlockSound() {
	audio();
}
function noise(ac, duration) {
	const n = Math.max(1, Math.floor(ac.sampleRate * duration));
	const buffer = ac.createBuffer(1, n, ac.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < n; i += 1) data[i] = Math.random() * 2 - 1;
	const src = ac.createBufferSource();
	src.buffer = buffer;
	return src;
}
function playKiss() {
	if (!prefs.kisses) return;
	const ac = audio();
	if (!ac) return;
	const t = ac.currentTime;
	const src = noise(ac, .22);
	const filter = ac.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.setValueAtTime(900, t);
	filter.frequency.exponentialRampToValueAtTime(420, t + .18);
	filter.Q.value = 4;
	const gain = ac.createGain();
	gain.gain.setValueAtTime(1e-4, t);
	gain.gain.exponentialRampToValueAtTime(.28, t + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, t + .2);
	src.connect(filter);
	filter.connect(gain);
	gain.connect(ac.destination);
	src.start(t);
	src.stop(t + .22);
	const osc = ac.createOscillator();
	const og = ac.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(520, t);
	osc.frequency.exponentialRampToValueAtTime(180, t + .16);
	og.gain.setValueAtTime(1e-4, t);
	og.gain.exponentialRampToValueAtTime(.09, t + .015);
	og.gain.exponentialRampToValueAtTime(1e-4, t + .18);
	osc.connect(og);
	og.connect(ac.destination);
	osc.start(t);
	osc.stop(t + .2);
}
function playHeart() {
	if (!prefs.hearts) return;
	const ac = audio();
	if (!ac) return;
	const t = ac.currentTime;
	const osc = ac.createOscillator();
	const gain = ac.createGain();
	osc.type = "triangle";
	osc.frequency.setValueAtTime(880, t);
	osc.frequency.exponentialRampToValueAtTime(1320, t + .08);
	gain.gain.setValueAtTime(1e-4, t);
	gain.gain.exponentialRampToValueAtTime(.12, t + .01);
	gain.gain.exponentialRampToValueAtTime(1e-4, t + .22);
	osc.connect(gain);
	gain.connect(ac.destination);
	osc.start(t);
	osc.stop(t + .24);
	const osc2 = ac.createOscillator();
	const g2 = ac.createGain();
	osc2.type = "sine";
	osc2.frequency.value = 1760;
	g2.gain.setValueAtTime(1e-4, t);
	g2.gain.exponentialRampToValueAtTime(.05, t + .01);
	g2.gain.exponentialRampToValueAtTime(1e-4, t + .12);
	osc2.connect(g2);
	g2.connect(ac.destination);
	osc2.start(t);
	osc2.stop(t + .14);
}
function playCelebrate(count = 1) {
	const n = Math.min(12, Math.max(1, count));
	playKiss();
	window.setTimeout(() => playHeart(), 90);
	for (let i = 1; i < n; i += 1) window.setTimeout(() => {
		if (i % 2 === 0) playKiss();
		else playHeart();
	}, 70 * i);
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 text-sm font-medium transition-opacity duration-150 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", {
	variants: {
		variant: {
			primary: "bg-primary text-primary-fg hover:opacity-90",
			secondary: "bg-elevated text-fg border border-border hover:bg-surface",
			ghost: "text-fg hover:bg-surface",
			danger: "text-primary border border-border hover:bg-surface"
		},
		size: {
			md: "h-11 px-4 rounded-md",
			sm: "h-9 px-3 rounded-sm",
			lg: "h-12 px-5 rounded-lg",
			icon: "size-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function CatchScreen({ from, photo, first, onCaught }) {
	const [caught, setCaught] = (0, import_react.useState)(false);
	const who = from.trim() || "Someone";
	const src = photo || faceTemplate(who);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(KissSky, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfettiBurst, { show: caught || Boolean(first) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "stage",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "live-face",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src,
					alt: ""
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LipsMark, { className: "live-stamp" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "live-kicker mt-6",
				children: first ? "Your first kiss" : "Incoming"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "catch-name mt-2",
				children: who
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-lg text-muted",
				children: "kissed you"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				size: "lg",
				className: "mt-8 h-16 w-full max-w-xs rounded-xl font-display text-2xl",
				disabled: caught,
				onClick: () => {
					if (caught) return;
					setCaught(true);
					unlockSound();
					playCelebrate(first ? 8 : 3);
					window.setTimeout(onCaught, 1100);
				},
				children: caught ? "Caught" : "Catch it"
			})
		]
	})] });
}
var KEY = "kiss-me-v2";
var ID_KEY = "kiss-id-v1";
var EMPTY = {
	entered: false,
	name: "",
	phone: "",
	photo: null,
	sent: 0,
	received: 0,
	lastInboxId: 0,
	orbit: []
};
function readJson(key) {
	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}
function loadMe() {
	if (typeof window === "undefined") return EMPTY;
	try {
		const full = readJson(KEY) ?? readJson("kiss-me-v1") ?? {};
		const parsed = {
			...readJson(ID_KEY) ?? {},
			...full
		};
		return {
			entered: Boolean(parsed.entered || parsed.phone || parsed.name),
			name: typeof parsed.name === "string" ? parsed.name.slice(0, 32) : "",
			phone: typeof parsed.phone === "string" ? parsed.phone.replace(/\D/g, "").slice(0, 15) : "",
			photo: typeof parsed.photo === "string" ? parsed.photo : null,
			sent: Number(parsed.sent) || 0,
			received: Number(parsed.received) || 0,
			lastInboxId: Number(parsed.lastInboxId) || 0,
			orbit: Array.isArray(parsed.orbit) ? parsed.orbit.slice(0, 16) : []
		};
	} catch {
		return EMPTY;
	}
}
function saveMe(next) {
	if (typeof window === "undefined") return;
	const identity = {
		entered: next.entered,
		name: next.name,
		phone: next.phone,
		sent: next.sent,
		received: next.received,
		lastInboxId: next.lastInboxId
	};
	try {
		window.localStorage.setItem(ID_KEY, JSON.stringify(identity));
	} catch {}
	try {
		window.localStorage.setItem(KEY, JSON.stringify(next));
	} catch {
		try {
			const slim = {
				...next,
				orbit: next.orbit.map((o) => ({
					...o,
					photo: null
				}))
			};
			window.localStorage.setItem(KEY, JSON.stringify(slim));
		} catch {}
	}
}
function cropPhoto(file) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		const url = URL.createObjectURL(file);
		img.onload = () => {
			const canvas = document.createElement("canvas");
			const size = 480;
			canvas.width = size;
			canvas.height = size;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				URL.revokeObjectURL(url);
				reject(/* @__PURE__ */ new Error("no canvas"));
				return;
			}
			const s = Math.min(img.width, img.height);
			const sx = (img.width - s) / 2;
			const sy = (img.height - s) / 2;
			ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
			URL.revokeObjectURL(url);
			resolve(canvas.toDataURL("image/jpeg", .82));
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(/* @__PURE__ */ new Error("bad image"));
		};
		img.src = url;
	});
}
//#endregion
export { tinyPhoto as C, soundsOn as S, waHref as T, playCelebrate as _, KissSky as a, setSoundPrefs as b, cn as c, getSoundPrefs as d, isValidPhone as f, pickFromPhone as g, phoneDigits as h, HeartMark as i, cropPhoto as l, loadRecents as m, CatchScreen as n, LipsMark as o, loadMe as p, ConfettiBurst as r, canPickContacts as s, Button as t, faceTemplate as u, rememberContact as v, unlockSound as w, smsHref as x, saveMe as y };
