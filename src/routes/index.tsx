import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BootSplash } from "@/components/boot-splash";
import { CatchScreen } from "@/components/catch-screen";
import { ConfettiBurst } from "@/components/confetti-burst";
import { KissOrbit } from "@/components/kiss-orbit";
import { KissSky } from "@/components/kiss-sky";
import { LiveKiss } from "@/components/live-kiss";
import { LoginRain } from "@/components/login-rain";
import { Confirm } from "@/components/confirm";
import { MyProfile, rememberPhoto } from "@/components/my-profile";
import { PersonSheet } from "@/components/person-sheet";
import { PhotoPick } from "@/components/photo-pick";
import { SendSheet, type SendTarget } from "@/components/send-sheet";
import { SoundSettings } from "@/components/sound-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invalidateHome, invalidatePhoneInbox, useHome, usePhoneInbox } from "@/hooks/use-home";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { blockPhone, catchKiss, catchPhoneKiss, lookupFace, registerPhone, searchDirectory, sendKiss, sendPhoneKiss, setDisplayName, setPhone, unblockPhone } from "@/lib/kisses/server";
import { isLive } from "@/lib/kisses/online";
import { nextRank, rankAt } from "@/lib/kisses/ranks";
import type { HomePayload, OrbitItem } from "@/lib/kisses/types";
import { formatPhone, isValidPhone, loadRecents, phoneDigits, prettyPersonName, shrinkDataUrl } from "@/lib/contacts";
import { blockLocal, isBlocked, unblockLocal } from "@/lib/block";
import { addPhoto, loadGallery, saveGallery } from "@/lib/gallery";
import { cropPhoto, loadMe, saveMe, type MeState } from "@/lib/me";
import { askNotify, notifyKiss } from "@/lib/notify";
import { playCelebrate, soundsOn, startMusic, unlockSound } from "@/lib/sound";
import { canSuper, consumeSuper, openSuperWindow, superState } from "@/lib/super";
import { Settings, Volume2, VolumeX } from "lucide-react";

type Search = { k?: string; p?: string };

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (s: Record<string, unknown>): Search => ({
    k: typeof s.k === "string" ? s.k : undefined,
    p: typeof s.p === "string" ? s.p : undefined,
  }),
});

function Home() {
  const { user } = useCurrentUserState();
  const search = useSearch({ from: "/" });
  const navigate = useNavigate();
  const [me, setMe] = useState<MeState>(() => loadMe());
  const [burst, setBurst] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendTarget, setSendTarget] = useState<SendTarget | null>(null);
  const [queue, setQueue] = useState<
    Array<{
      from: string;
      photo?: string | null;
      first: boolean;
      count: number;
      skin?: string | null;
      canReply?: boolean;
      inbound?: boolean;
      tel?: string;
      kissIds?: number[];
      phoneKissIds?: number[];
    }>
  >([]);
  const live = queue[0] ?? null;

  function nextLive() {
    setQueue((q) => q.slice(1));
  }
  const [person, setPerson] = useState<OrbitItem | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [finding, setFinding] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [gate, setGate] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [settings, setSettings] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [superTick, setSuperTick] = useState(0);
  const [liveOpened, setLiveOpened] = useState<number | null>(null);
  const liveUser = user && !user.isDevFallback ? user : null;
  const home = useHome(Boolean(liveUser));
  const phoneBox = usePhoneInbox(me.phone);

  function patch(partial: Partial<MeState>) {
    setMe((prev) => {
      const next = { ...prev, ...partial };
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

  useEffect(() => {
    if (!liveUser) return;
    setMe((prev) => {
      const nextName = prev.name || liveUser.displayName || "";
      const nextPhoto = prev.photo || liveUser.profileImageUrl || null;
      const nextPhone = prev.phone || "";
      if (
        prev.entered &&
        nextName === prev.name &&
        nextPhoto === prev.photo &&
        nextPhone === prev.phone
      ) {
        return prev;
      }
      const next = { ...prev, entered: true, name: nextName, photo: nextPhoto, phone: nextPhone };
      saveMe(next);
      return next;
    });
  }, [liveUser]);

  useEffect(() => {
    const p = home.data?.profile;
    if (!p) return;
    setMe((prev) => {
      const nextName = prev.name || p.displayName || "";
      const nextPhone = prev.phone || p.phone || "";
      if (nextName === prev.name && nextPhone === prev.phone && prev.entered) return prev;
      const next = { ...prev, entered: true, name: nextName, phone: nextPhone };
      saveMe(next);
      return next;
    });
  }, [home.data?.profile]);

  useEffect(() => {
    if (!search.p || !isValidPhone(search.p)) return;
    const digits = phoneDigits(search.p);
    if (me.phone === digits) return;
    patch({ phone: digits, entered: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.p]);

  useEffect(() => {
    const all = home.data?.sentAll;
    if (typeof all !== "number") return;
    if (all > me.sent) patch({ sent: all });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data?.sentAll]);

  useEffect(() => {
    const receivedAll = home.data?.receivedAll;
    if (typeof receivedAll !== "number") return;
    if (receivedAll > me.received) {
      patch({ received: receivedAll });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data?.receivedAll]);

  useEffect(() => {
    if (!home.data || !me.entered) return;
    if (me.orbit.length > 0) return;
    const hydratedOrbit = mergeOrbit([], home.data);
    if (hydratedOrbit.length > 0) {
      patch({ orbit: hydratedOrbit.slice(0, 12) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data?.inbox, home.data?.sent]);

  useEffect(() => {
    const theirPhone = home.data?.profile?.phone;
    if (!theirPhone || me.phone) return;
    patch({ phone: theirPhone });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data?.profile?.phone]);

  useEffect(() => {
    const inbox = home.data?.inbox ?? [];
    const fresh = inbox.filter((k) => !k.caughtAt && k.id > me.lastInboxId);
    if (fresh.length === 0) return;
    const maxId = Math.max(...fresh.map((k) => k.id));
    const first = me.received === 0;
    patch({ lastInboxId: maxId });
    const grouped = new Map<string, typeof fresh>();
    for (const k of fresh) {
      const list = grouped.get(k.fromName) ?? [];
      list.push(k);
      grouped.set(k.fromName, list);
    }
    const next = [...grouped.entries()].map(([fromName, list], i) => ({
      from: prettyPersonName(fromName),
      photo: me.orbit.find((o) => o.name === fromName)?.photo ?? null,
      first: first && i === 0,
      count: list.length,
      skin: list[0]?.kind,
      canReply: !(home.data?.sent ?? []).some((s) => s.toName.toLowerCase() === fromName.toLowerCase()),
      inbound: true,
      kissIds: list.map((k) => k.id),
    }));
    celebrate(1);
    notifyKiss(next[0]?.from ?? "Someone");
    askNotify();
    openSuperWindow();
    setQueue((q) => {
      const names = new Set(q.map((x) => x.from));
      return [...q, ...next.filter((x) => !names.has(x.from))];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data?.inbox]);

  useEffect(() => {
    if (!isValidPhone(me.phone)) return;
    void (async () => {
      const photo = me.photo ? await shrinkDataUrl(me.photo, 160) : null;
      await registerPhone({ data: { phone: me.phone, name: me.name, photo } }).catch(() => undefined);
    })();
  }, [me.phone, me.name, me.photo]);

  useEffect(() => {
    if (!liveUser || !isValidPhone(me.phone)) return;
    void setPhone({ data: me.phone }).catch(() => undefined);
  }, [liveUser, me.phone]);

  useEffect(() => {
    const inbox = phoneBox.data ?? [];
    const fresh = inbox.filter((k) => k.id > me.lastPhoneId && !isBlocked(k.fromName, k.fromPhone));
    if (fresh.length === 0) return;
    const maxId = Math.max(...fresh.map((k) => k.id));
    const first = me.received === 0;
    patch({ lastPhoneId: maxId });
    const grouped = new Map<string, typeof fresh>();
    for (const k of fresh) {
      const list = grouped.get(k.fromName) ?? [];
      list.push(k);
      grouped.set(k.fromName, list);
    }
    const recents = loadRecents();
    const next = [...grouped.entries()].map(([fromName, list], i) => ({
      from: prettyPersonName(fromName),
      photo:
        list[0]?.photo ??
        me.orbit.find((o) => o.name === fromName)?.photo ??
        recents.find((c) => c.name === fromName)?.photo ??
        null,
      first: first && i === 0,
      count: list.reduce((s, k) => s + k.count, 0),
      skin: list[0]?.kind,
      canReply: true,
      inbound: true,
      phoneKissIds: list.map((k) => k.id),
    }));
    celebrate(1);
    notifyKiss(next[0]?.from ?? "Someone");
    askNotify();
    openSuperWindow();
    setQueue((q) => {
      const names = new Set(q.map((x) => x.from));
      return [...q, ...next.filter((x) => !names.has(x.from))];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneBox.data]);

  const orbit = useMemo(() => mergeOrbit(me.orbit, home.data), [me.orbit, home.data]);

  useEffect(() => {
    if (live) {
      setLiveOpened(Date.now());
    } else {
      setLiveOpened(null);
    }
  }, [live]);

  useEffect(() => {
    const id = window.setInterval(() => setSuperTick((n) => n + 1), 500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!me.entered) return;
    let gone = false;
    void searchDirectory({ data: { q: "", myPhone: me.phone } }).then((rows) => {
      if (gone) return;
      const recents = loadRecents();
      setMe((prev) => {
        let changed = false;
        const orbit = prev.orbit.map((o) => {
          const rec = recents.find(
            (c) =>
              c.name.toLowerCase() === o.name.toLowerCase() ||
              (o.tel && c.tel && c.tel.replace(/\D/g, "").slice(-8) === o.tel.replace(/\D/g, "").slice(-8)),
          );
          const hit = rows.find(
            (r) =>
              r.displayName.toLowerCase() === o.name.toLowerCase() ||
              (o.tel && r.phone && r.phone.slice(-8) === o.tel.replace(/\D/g, "").slice(-8)),
          );
          const photo = o.photo || rec?.photo || hit?.photo || null;
          if (photo === o.photo) return o;
          changed = true;
          return { ...o, photo, tel: o.tel || rec?.tel || hit?.phone || o.tel, realName: o.realName || o.name };
        });
        if (!changed) return prev;
        const next = { ...prev, orbit };
        saveMe(next);
        return next;
      });
    });
    return () => {
      gone = true;
    };
  }, [me.entered, me.phone]);

  const [catchPhoto, setCatchPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!search.k) return;
    void lookupFace({ data: { name: search.k, phone: search.p } }).then((r) => setCatchPhoto(r.photo));
  }, [search.k, search.p]);

  useEffect(() => {
    if (!me.entered || !bootReady) return;
    unlockSound();
    startMusic();
  }, [me.entered, bootReady]);

  if (!bootReady) {
    if (me.entered) {
      setBootReady(true);
      return null;
    }
    return <BootSplash onReady={() => setBootReady(true)} />;
  }

  if (search.k) {
    return (
      <CatchScreen
        from={prettyPersonName(search.k || "Someone")}
        photo={catchPhoto}
        first={me.received === 0}
        onCaught={() => {
          setMe((prev) => {
            const item: OrbitItem = {
              id: `in-${Date.now()}`,
              dir: "in",
              name: search.k || "Someone",
              status: "caught",
            };
            const phone =
              search.p && isValidPhone(search.p) ? phoneDigits(search.p) : prev.phone;
            const next = {
              ...prev,
              received: prev.received + 1,
              entered: true,
              phone,
              orbit: [item, ...prev.orbit].slice(0, 16),
            };
            saveMe(next);
            return next;
          });
          void navigate({ to: "/", search: {}, replace: true });
        }}
      />
    );
  }

  const displayName = me.name || liveUser?.displayName || "You";
  const photo = me.photo || liveUser?.profileImageUrl || null;
  const sent = Math.max(me.sent, home.data?.sent.length ?? 0);
  const received = Math.max(
    me.received,
    (home.data?.inbox ?? []).filter((k) => k.caughtAt).length,
  );
  const phoneOk = isValidPhone(me.phone || home.data?.profile?.phone || search.p || "");
  const nameOk = (me.name || "").trim().length >= 2;

  if (!phoneOk) {
    return (
      <>
        <KissSky quiet={gate}>
          <div className="storm-hero items-center px-5 pb-8 text-center">
            <h1 className="welcome-word">Kiss</h1>
            <Button
              size="lg"
              className="relative z-10 h-14 w-full max-w-xs rounded-xl font-display text-xl"
              onClick={() => setGate(true)}
            >
              Send kiss
            </Button>
          </div>
        </KissSky>
        {gate ? (
          <PhoneGate
            draftPhone={draftPhone || me.phone || search.p || ""}
            onDraftPhone={setDraftPhone}
            onReady={(phone) => {
              setGate(false);
              setFinding(true);
              patch({ entered: true, phone });
              void lookupFace({ data: { phone } })
                .then((hit) => {
                  setMe((prev) => {
                    const next = {
                      ...prev,
                      entered: true,
                      phone,
                      name: hit.name || prev.name,
                      photo: hit.photo || prev.photo,
                    };
                    saveMe(next);
                    return next;
                  });
                  if (hit.photo) rememberPhoto(hit.photo);
                })
                .catch(() => {
                  setMe((prev) => {
                    const next = { ...prev, entered: true, phone };
                    saveMe(next);
                    return next;
                  });
                })
                .finally(() => setFinding(false));
            }}
          />
        ) : null}
      </>
    );
  }

  if (finding) {
    return (
      <KissSky storm={10}>
        <div className="stage">
          <p className="login-kicker">Looking you up</p>
        </div>
      </KissSky>
    );
  }

  if (!nameOk) {
    return (
      <>
        <KissSky quiet>
          <div className="stage" />
        </KissSky>
        <NameGate
          draftName={draftName || me.name}
          onDraftName={setDraftName}
          onReady={(name) => {
            patch({ entered: true, name });
            if (me.phone) void registerPhone({ data: { phone: me.phone, name } }).catch(() => undefined);
            if (liveUser) void setDisplayName({ data: name });
          }}
        />
      </>
    );
  }

  return (
    <>
      <KissSky quiet={sendOpen}>
        <ConfettiBurst show={burst} />
        <Link to="/live" className="hud-live">
          <i className="live-pulse" />
          LIVE
        </Link>
        <button
          type="button"
          className="hud-gear"
          onClick={() => setSettings(true)}
          aria-label="Settings"
        >
          <Settings size={18} />
        </button>
        <button
          type="button"
          className="hud-sound"
          onClick={() => {
            unlockSound();
            setSettings(true);
          }}
          aria-label={soundsOn() ? "Sound on" : "Sound off"}
        >
          {soundsOn() ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
        <div className="stage">
        <KissOrbit
          photo={photo}
          items={orbit}
          onAddPhoto={() => setProfileOpen(true)}
          onEmpty={() => {
            setSendTarget(null);
            setSendOpen(true);
          }}
          onCatch={(item) => {
            const rec = loadRecents().find((c) => c.name.toLowerCase() === item.name.toLowerCase());
            const tel = item.tel || rec?.tel || "";
            const photo = item.photo ?? rec?.photo ?? null;
            if (item.dir === "in" && item.status === "waiting") {
              celebrate(Math.max(1, item.toMe ?? 1));
              if (item.serverId) void catchKiss({ data: item.serverId }).then(() => invalidateHome());
              setMe((prev) => {
                const next = {
                  ...prev,
                  received: prev.received + 1,
                  orbit: prev.orbit.map((k) =>
                    k.id === item.id ? { ...k, status: "caught" as const, lastIn: Date.now() } : k,
                  ),
                };
                saveMe(next);
                return next;
              });
            }
            setPerson({
              ...item,
              tel,
              photo,
              realName: item.realName || item.name,
            });
          }}
          onFace={(id, face) => {
            setMe((prev) => {
              const nextOrbit = prev.orbit.map((k) => (k.id === id ? { ...k, photo: face } : k));
              const next = { ...prev, orbit: nextOrbit };
              saveMe(next);
              return next;
            });
          }}
          onReply={(item) => {
            if (item.userId && liveUser) {
              void sendKiss({ data: { toUserId: item.userId, kind: rankAt(sent).skin } })
                .then(() => {
                  setMe((prev) => {
                    const next = {
                      ...prev,
                      sent: prev.sent + 1,
                      orbit: [
                        {
                          ...item,
                          id: `out-${Date.now()}`,
                          dir: "out" as const,
                          status: "waiting" as const,
                        },
                        ...prev.orbit,
                      ].slice(0, 16),
                    };
                    saveMe(next);
                    return next;
                  });
                  celebrate();
                  void invalidateHome();
                })
                .catch(() => {
                  setSendTarget({
                    name: item.name,
                    tel: item.tel || "",
                    photo: item.photo ?? null,
                    userId: item.userId,
                  });
                  setSendOpen(true);
                });
              return;
            }
            const rec = loadRecents().find(
              (c) => c.name.toLowerCase() === item.name.toLowerCase(),
            );
            setSendTarget({
              name: item.name,
              tel: item.tel || rec?.tel || "",
              photo: item.photo || rec?.photo || null,
              userId: item.userId,
            });
            askNotify();
            setSendOpen(true);
          }}
        />

        <NameLine
          value={displayName}
          onChange={(name) => {
            patch({ name });
            if (liveUser) void setDisplayName({ data: name });
          }}
        />
        <p className="phone-line">
          {formatPhone(me.phone).display}
          {formatPhone(me.phone).country ? (
            <span className="phone-cc"> {formatPhone(me.phone).country}</span>
          ) : null}
        </p>

        <p className="counts">
          <span className="tabular-nums text-fg">{sent}</span> sent
          <span className="mx-2 text-subtle">·</span>
          <span className="tabular-nums text-fg">{received}</span> caught
        </p>
        <RankBar kisses={sent} />

        {(home.data?.people ?? []).filter((p) => {
          const n = p.displayName.trim().toLowerCase();
          return n.length > 1 && n !== "you" && n !== "someone" && n !== displayName.trim().toLowerCase();
        }).length > 0 ? (
          <ul className="live-row">
            {(home.data?.people ?? [])
              .filter((p) => {
                const n = p.displayName.trim().toLowerCase();
                return n.length > 1 && n !== "you" && n !== "someone" && n !== displayName.trim().toLowerCase();
              })
              .slice(0, 8)
              .map((p) => (
              <li key={p.userId}>
                <button
                  type="button"
                  className="live-pill"
                  onClick={() => {
                    if (!liveUser) return;
                    void sendKiss({ data: { toUserId: p.userId, kind: rankAt(sent).skin } }).then(
                      () => {
                        setMe((prev) => {
                          const next = {
                            ...prev,
                            sent: prev.sent + 1,
                            orbit: [
                              {
                                id: `out-${Date.now()}`,
                                dir: "out" as const,
                                name: p.displayName,
                                status: "waiting" as const,
                                userId: p.userId,
                                skin: rankAt(sent).skin,
                              },
                              ...prev.orbit,
                            ].slice(0, 16),
                          };
                          saveMe(next);
                          return next;
                        });
                        celebrate();
                        void invalidateHome();
                      },
                    );
                  }}
                >
                  {isLive(p.lastSeen) ? <i className="live-dot" /> : null}
                  {p.displayName.split(" ")[0]}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="dock">
          <Button
            size="lg"
            className="h-14 w-full rounded-xl font-display text-xl"
            onClick={() => {
              unlockSound();
              askNotify();
              setSendTarget(null);
              setSendOpen(true);
            }}
          >
            Send kiss
          </Button>
          {canSuper() ? (
            <button
              type="button"
              className="super-dock"
              onClick={() => {
                unlockSound();
                askNotify();
                setSendTarget(null);
                setSendOpen(true);
              }}
            >
              Super kiss
              {superState().windowMs > 0 ? ` · ${Math.ceil(superState().windowMs / 1000)}s` : " · 1 today"}
            </button>
          ) : null}
          <p className="connect-label">Connect friends</p>
          <div className="social-row">
            {GROK_PROVIDERS.map((p) => (
              <button
                key={p.providerId}
                type="button"
                className="social-ic"
                aria-label={p.label}
                onClick={() => {
                  if (authEnabled) signIn(p.providerId, { callbackURL: "/" });
                }}
              >
                {p.idp === "google" ? (
                  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                    <path fill="#ea4335" d="M12 10.2v3.6h5.1c-.2 1.2-1.3 3.6-5.1 3.6-3.1 0-5.6-2.5-5.6-5.6S8.9 6.2 12 6.2c1.8 0 3 .7 3.7 1.4l2.5-2.4C16.7 3.7 14.6 2.8 12 2.8 6.9 2.8 2.8 6.9 2.8 12S6.9 21.2 12 21.2c5.2 0 8.6-3.6 8.6-8.7 0-.6 0-1-.1-1.5H12z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden>
                    <path fill="currentColor" d="M14.5 10.6 22 2h-2.2l-6.5 7.4L8.1 2H2l7.9 11.3L2 22h2.2l7.1-8.1L15.9 22H22l-7.5-11.4Zm-2.5 2.9-.8-1.2-6.5-9.2h2.8l5.2 7.5.8 1.2 6.7 9.7h-2.8l-5.4-7.9Z" />
                  </svg>
                )}
              </button>
            ))}
            <button
              type="button"
              className="social-ic"
              aria-label="WhatsApp"
              onClick={() => {
                setSendTarget(null);
                setSendOpen(true);
              }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
                <path
                  fill="#25D366"
                  d="M12.04 2C6.58 2 2.15 6.4 2.15 11.86c0 1.74.46 3.44 1.34 4.94L2 22l5.35-1.4a9.86 9.86 0 0 0 4.69 1.2h.01c5.46 0 9.89-4.4 9.89-9.86C21.94 6.4 17.5 2 12.04 2Zm5.76 14.17c-.24.68-1.4 1.25-1.94 1.33-.5.07-1.13.1-1.82-.11-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.82-4.2-4.97-4.4-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.24-.27.64-.39 1.02-.39.12 0 .23 0 .33.01.3.01.44-.09.69.53.24.63.83 2.04.9 2.19.08.15.12.33.02.53-.1.2-.15.33-.3.5-.14.18-.3.4-.43.53-.14.14-.29.3-.12.58.16.29.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.45.12.61-.07.17-.2.7-.81.89-1.09.18-.27.37-.23.62-.14.26.09 1.63.77 1.91.91.28.14.46.21.53.33.07.12.07.68-.17 1.36Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </KissSky>

      <SendSheet
        open={sendOpen}
        myName={displayName}
        myPhone={me.phone}
        myPhoto={loadGallery().send || me.photo}
        signedIn={Boolean(liveUser)}
        mySent={sent}
        people={home.data?.people ?? []}
        known={me.orbit.map((o) => ({ name: o.name, tel: o.tel, photo: o.photo }))}
        target={sendTarget}
        onClose={() => {
          setSendOpen(false);
          setSendTarget(null);
        }}
        onSent={(payload) => {
          const item: OrbitItem = {
            id: `out-${Date.now()}`,
            dir: "out",
            name: payload.name,
            status: payload.status,
            photo: payload.photo ?? null,
            tel: payload.tel,
            userId: payload.userId,
            skin: rankAt(sent).skin,
          };
          setMe((prev) => {
            const next = {
              ...prev,
              sent: prev.sent + (payload.count ?? 1),
              orbit: [item, ...prev.orbit].slice(0, 16),
            };
            saveMe(next);
            return next;
          });
          celebrate(payload.count ?? 1);
          if (payload.status === "waiting") {
            /* in-app */
          }
          void invalidateHome();
        }}
      />
      <PhotoPick
        open={photoOpen}
        onClose={() => setPhotoOpen(false)}
        onFile={(file) => {
          void cropPhoto(file).then(async (data) => {
            rememberPhoto(data);
            const g = addPhoto(data);
            patch({ photo: g.main || data });
            if (me.phone) {
              const photo = await shrinkDataUrl(data, 160);
              void registerPhone({ data: { phone: me.phone, name: me.name, photo } }).catch(() => undefined);
            }
          });
        }}
      />
      {profileOpen ? (
        <MyProfile
          name={displayName}
          phone={me.phone}
          sent={sent}
          caught={received}
          photo={me.photo}
          onClose={() => setProfileOpen(false)}
          onAddPhoto={() => setPhotoOpen(true)}
          onMain={(p) => {
            const g = loadGallery();
            saveGallery({ ...g, main: p });
            patch({ photo: p });
            if (me.phone) void registerPhone({ data: { phone: me.phone, name: me.name, photo: p } }).catch(() => undefined);
          }}
          onSend={(p) => {
            const g = loadGallery();
            saveGallery({ ...g, send: p });
          }}
        />
      ) : null}
      {settings ? (
        <SoundSettings
          open
          myPhone={me.phone}
          onClose={() => setSettings(false)}
          onDelete={() => setAskDelete(true)}
        />
      ) : null}
      <Confirm
        open={askDelete}
        title="Delete me?"
        body="This phone is wiped on this device. You can join again."
        yes="Delete"
        onNo={() => setAskDelete(false)}
        onYes={() => {
          try {
            window.localStorage.clear();
          } catch {
            /* ignore */
          }
          window.location.reload();
        }}
      />
      {person ? (
        <PersonSheet
          item={person}
          busy={false}
          myPhone={me.phone}
          myName={me.name}
          onClose={() => setPerson(null)}
          onKiss={() => {
            const who = person;
            const tel = who.tel;
            celebrate(1);
            setMe((prev) => {
              const next = {
                ...prev,
                sent: prev.sent + 1,
                orbit: prev.orbit.map((o) =>
                  o.id === who.id || o.name === who.name
                    ? { ...o, fromMe: (o.fromMe ?? 0) + 1, lastOut: Date.now(), dir: "out" as const }
                    : o,
                ),
              };
              saveMe(next);
              return next;
            });
            setPerson((p) =>
              p ? { ...p, fromMe: (p.fromMe ?? 0) + 1, lastOut: Date.now() } : p,
            );
            if (tel && isValidPhone(me.phone) && isValidPhone(tel)) {
              void sendPhoneKiss({
                data: {
                  fromPhone: me.phone,
                  fromName: me.name,
                  toPhone: tel,
                  count: 1,
                  kind: rankAt(sent).skin,
                },
              }).catch(() => undefined);
            }
          }}
          onBlock={() => {
            const who = person;
            const tel = who.tel;
            if (isBlocked(who.name, tel)) {
              unblockLocal({ name: who.name, tel });
              if (me.phone && tel) void unblockPhone({ data: { myPhone: me.phone, theirPhone: tel } }).catch(() => undefined);
            } else {
              blockLocal({ name: who.realName || who.name, tel });
              if (me.phone && tel) {
                void blockPhone({
                  data: { myPhone: me.phone, theirPhone: tel, theirName: who.realName || who.name },
                }).catch(() => undefined);
              }
            }
          }}
        />
      ) : null}
      {live ? (
        <LiveKiss
          from={live.from}
          photo={live.photo}
          first={live.first}
          count={live.count}
          skin={live.skin}
          canReply={live.canReply !== false}
          inbound={live.inbound !== false}
          superMs={superState().windowMs}
          more={queue.length > 1}
          onClose={() => {
            const elapsed = liveOpened ? Date.now() - liveOpened : 0;
            if (elapsed < 300) {
              nextLive();
              return;
            }
            if (live.kissIds && live.kissIds.length > 0) {
              for (const id of live.kissIds) {
                void catchKiss({ data: id }).then(() => invalidateHome());
              }
            }
            if (live.phoneKissIds && live.phoneKissIds.length > 0) {
              for (const id of live.phoneKissIds) {
                void catchPhoneKiss({ data: id }).then(() => {
                  invalidatePhoneInbox();
                  invalidateHome();
                });
              }
            }
            nextLive();
          }}
          onReply={() => {
            const from = live.from;
            const rec = loadRecents().find((c) => c.name.toLowerCase() === from.toLowerCase());
            const person = (home.data?.people ?? []).find(
              (p) => p.displayName.toLowerCase() === from.toLowerCase(),
            );
            nextLive();
            if (person && liveUser) {
              void sendKiss({ data: { toUserId: person.userId, kind: rankAt(sent).skin, count: 1 } }).then(
                () => {
                  celebrate();
                  void invalidateHome();
                },
              );
              return;
            }
            setSendTarget({
              name: from,
              tel: sendTarget?.tel || rec?.tel || "",
              photo: live.photo || rec?.photo || null,
            });
            askNotify();
            setSendOpen(true);
          }}
          onBlock={() => {
            const from = live.from;
            const rec = loadRecents().find((c) => c.name.toLowerCase() === from.toLowerCase());
            const tel = sendTarget?.tel || rec?.tel || live.tel || "";
            blockLocal({ name: from, tel });
            if (isValidPhone(me.phone) && tel) {
              void blockPhone({ data: { myPhone: me.phone, theirPhone: tel, theirName: from } }).catch(() => undefined);
            }
            setMe((prev) => {
              const next = { ...prev, orbit: prev.orbit.filter((o) => o.name !== from) };
              saveMe(next);
              return next;
            });
            nextLive();
          }}
          onSuper={() => {
            const from = live.from;
            const rec = loadRecents().find((c) => c.name.toLowerCase() === from.toLowerCase());
            const person = (home.data?.people ?? []).find(
              (p) => p.displayName.toLowerCase() === from.toLowerCase(),
            );
            if (!canSuper()) return;
            consumeSuper();
            nextLive();
            if (person && liveUser) {
              void sendKiss({ data: { toUserId: person.userId, kind: "super", count: 1 } }).then(
                () => {
                  celebrate(8);
                  void invalidateHome();
                },
              );
              return;
            }
            setSendTarget({
              name: from,
              tel: sendTarget?.tel || rec?.tel || "",
              photo: live.photo || rec?.photo || null,
            });
            setSendOpen(true);
          }}
          onFlood={() => {
            const from = live.from;
            const person = (home.data?.people ?? []).find(
              (p) => p.displayName.toLowerCase() === from.toLowerCase(),
            );
            nextLive();
            if (person && liveUser) {
              void sendKiss({
                data: { toUserId: person.userId, kind: rankAt(sent).skin, count: 21 },
              }).then(() => {
                setMe((prev) => {
                  const next = { ...prev, sent: prev.sent + 21 };
                  saveMe(next);
                  return next;
                });
                celebrate();
                void invalidateHome();
              });
            }
          }}
        />
      ) : null}
    </>
  );
}

function mergeOrbit(local: OrbitItem[], data: HomePayload | undefined): OrbitItem[] {
  const people = new Map<string, OrbitItem>();

  function personKey(name: string, userId?: string) {
    return (userId || name).trim().toLowerCase();
  }

  function bump(item: OrbitItem) {
    const key = personKey(item.name, item.userId);
    if (!key) return;
    const cur = people.get(key);
    if (!cur) {
      people.set(key, {
        ...item,
        id: `p-${key}`,
        toMe: item.toMe ?? (item.dir === "in" ? 1 : 0),
        fromMe: item.fromMe ?? (item.dir === "out" ? 1 : 0),
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

  const photoOf = (name: string, tel?: string) => {
    const recents = loadRecents();
    return (
      local.find((l) => l.name.toLowerCase() === name.toLowerCase() && l.photo)?.photo ??
      recents.find((c) => c.name.toLowerCase() === name.toLowerCase())?.photo ??
      (tel
        ? recents.find((c) => c.tel.replace(/\D/g, "").slice(-8) === tel.replace(/\D/g, "").slice(-8))?.photo
        : null) ??
      null
    );
  };
  const telOf = (name: string) =>
    local.find((l) => l.name.toLowerCase() === name.toLowerCase() && l.tel)?.tel;

  const inboxBy = new Map<string, NonNullable<HomePayload["inbox"]>>();
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
      fromMe: 0,
    });
  }

  const sentBy = new Map<string, NonNullable<HomePayload["sent"]>>();
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
      fromMe: list.length,
    });
  }

  const localBy = new Map<string, OrbitItem[]>();
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
      const cur = people.get(key)!;
      const photo = list.find((x) => x.photo)?.photo;
      const tel = list.find((x) => x.tel)?.tel;
      if (photo) cur.photo = photo;
      if (tel) cur.tel = tel;
      continue;
    }
    bump({
      ...first,
      toMe: list.filter((x) => x.dir === "in").reduce((n, x) => n + (x.toMe ?? 1), 0),
      fromMe: list.filter((x) => x.dir === "out").reduce((n, x) => n + (x.fromMe ?? 1), 0),
    });
  }

  return [...people.values()]
    .sort((a, b) => {
      const aw = a.dir === "in" && a.status === "waiting" ? 0 : 1;
      const bw = b.dir === "in" && b.status === "waiting" ? 0 : 1;
      if (aw !== bw) return aw - bw;
      return (b.toMe ?? 0) + (b.fromMe ?? 0) - ((a.toMe ?? 0) + (a.fromMe ?? 0));
    })
    .slice(0, 12);
}

function RankBar({ kisses }: { kisses: number }) {
  const rank = rankAt(kisses);
  const next = nextRank(kisses);
  const from = rank.min;
  const to = next?.min ?? from;
  const span = Math.max(1, to - from);
  const pct = next ? Math.min(100, Math.round(((kisses - from) / span) * 100)) : 100;
  return (
    <div className="rank-bar">
      <p className="rank-name">
        {rank.name}
        {next ? <span className="rank-next">{kisses}/{next.min}</span> : null}
      </p>
      <span className="rank-track">
        <span className="rank-fill" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}

function NameLine({
  value,
  onChange,
}: {
  value: string;
  onChange: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button type="button" className="name-line" onClick={() => { setDraft(value); setEditing(true); }}>
        {value}
      </button>
    );
  }

  return (
    <form
      className="mt-2 w-full max-w-xs"
      onSubmit={(e) => {
        e.preventDefault();
        onChange(draft.trim() || "You");
        setEditing(false);
      }}
    >
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={32}
        autoFocus
        onBlur={() => {
          onChange(draft.trim() || "You");
          setEditing(false);
        }}
      />
    </form>
  );
}

function NameGate({
  draftName,
  onDraftName,
  onReady,
}: {
  draftName: string;
  onDraftName: (v: string) => void;
  onReady: (name: string) => void;
}) {
  const ready = draftName.trim().length >= 2;
  useKeyboardInset(true);
  return (
    <div className="sheet-scrim">
      <div className="sheet" role="dialog" aria-label="Your name">
        <p className="font-display text-2xl">Full name</p>
        <p className="mt-1 text-sm text-muted">This is how kisses find you.</p>
        <Input
          className="mt-4"
          value={draftName}
          onChange={(e) => onDraftName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
        />
        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={!ready}
          onClick={() => onReady(draftName.trim())}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}

function PhoneGate({
  draftPhone,
  onDraftPhone,
  onReady,
}: {
  draftPhone: string;
  onDraftPhone: (v: string) => void;
  onReady: (phone: string) => void;
}) {
  const digits = phoneDigits(draftPhone);
  const phoneReady = isValidPhone(draftPhone);
  useKeyboardInset(true);
  return (
    <div className="sheet-scrim">
      <div className="sheet" role="dialog" aria-label="Your phone">
        <p className="font-display text-2xl">Your number</p>
        <p className="mt-1 text-sm text-muted">Confirm the phone people already have.</p>
        <Input
          className="mt-4"
          value={draftPhone}
          onChange={(e) => onDraftPhone(e.target.value)}
          placeholder="Phone number"
          type="tel"
          name="phone"
          inputMode="tel"
          autoComplete="tel"
        />
        <Button
          size="lg"
          className="mt-4 w-full"
          disabled={!phoneReady}
          onClick={() => onReady(digits)}
        >
          Confirm
        </Button>
      </div>
    </div>
  );
}
