import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { BootSplash } from "@/components/boot-splash";
import { CatchScreen } from "@/components/catch-screen";
import { ConfettiBurst } from "@/components/confetti-burst";
import { KissOrbit } from "@/components/kiss-orbit";
import { KissSky } from "@/components/kiss-sky";
import { LiveKiss } from "@/components/live-kiss";
import { SendSheet, type SendTarget } from "@/components/send-sheet";
import { SoundSettings } from "@/components/sound-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { invalidateHome, useHome } from "@/hooks/use-home";
import { useKeyboardInset } from "@/hooks/use-keyboard";
import { GROK_PROVIDERS, authEnabled, signIn, signOut } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { catchKiss, sendKiss, setDisplayName, setPhone } from "@/lib/kisses/server";
import { isLive } from "@/lib/kisses/online";
import { nextRank, rankAt } from "@/lib/kisses/ranks";
import type { HomePayload, OrbitItem } from "@/lib/kisses/types";
import { isValidPhone, loadRecents, phoneDigits } from "@/lib/contacts";
import { cropPhoto, loadMe, saveMe, type MeState } from "@/lib/me";
import { askNotify, notifyKiss } from "@/lib/notify";
import { playCelebrate, soundsOn, unlockSound } from "@/lib/sound";

type Search = { k?: string; p?: string };

export const Route = createFileRoute("/")({
  component: Home,
  validateSearch: (s: Record<string, unknown>): Search => ({
    k: typeof s.k === "string" ? s.k : undefined,
    p: typeof s.p === "string" ? s.p : undefined,
  }),
});

function Home() {
  const { user, isPending } = useCurrentUserState();
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
    }>
  >([]);
  const live = queue[0] ?? null;

  function nextLive() {
    setQueue((q) => q.slice(1));
  }
  const [gate, setGate] = useState(false);
  const [bootReady, setBootReady] = useState(false);
  const [forceGo, setForceGo] = useState(false);
  const [settings, setSettings] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setForceGo(true), 3200);
    return () => window.clearTimeout(t);
  }, []);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const liveUser = user && !user.isDevFallback ? user : null;
  const home = useHome(Boolean(liveUser));

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
      from: fromName,
      photo: me.orbit.find((o) => o.name === fromName)?.photo ?? null,
      first: first && i === 0,
      count: list.length,
      skin: list[0]?.kind,
      canReply: !(home.data?.sent ?? []).some((s) => s.toName.toLowerCase() === fromName.toLowerCase()),
    }));
    celebrate(next[0]?.count ?? 1);
    notifyKiss(next[0]?.from ?? "Someone");
    setQueue((q) => {
      const names = new Set(q.map((x) => x.from));
      return [...q, ...next.filter((x) => !names.has(x.from))];
    });
    const top = fresh[0];
    if (top?.id) {
      for (const k of fresh) {
        void catchKiss({ data: k.id }).then(() => invalidateHome());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [home.data?.inbox]);

  useEffect(() => {
    if (!liveUser || !isValidPhone(me.phone)) return;
    void setPhone({ data: me.phone }).catch(() => undefined);
  }, [liveUser, me.phone]);

  const orbit = useMemo(
    () => mergeOrbit(me.orbit, home.data),
    [me.orbit, home.data],
  );

  if (!forceGo && !bootReady) {
    return <BootSplash onReady={() => setBootReady(true)} />;
  }

  if (search.k) {
    return (
      <CatchScreen
        from={search.k}
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
              patch({ entered: true, phone });
              setGate(false);
            }}
          />
        ) : null}
      </>
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
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            void cropPhoto(file).then((data) => patch({ photo: data }));
          }}
        />
        <div className="stage">
        <KissOrbit
          photo={photo}
          items={orbit}
          onAddPhoto={() => photoRef.current?.click()}
          onCatch={(item) => {
            const isWaiting = item.dir === "in" && item.status === "waiting";
            if (isWaiting) {
              celebrate();
              if (item.serverId) {
                void catchKiss({ data: item.serverId }).then(() => invalidateHome());
              }
              setMe((prev) => {
                const nextOrbit = prev.orbit.map((k) =>
                  k.id === item.id ? { ...k, status: "caught" as const } : k,
                );
                const next = { ...prev, received: prev.received + 1, orbit: nextOrbit };
                saveMe(next);
                return next;
              });
            }
            setQueue((q) => [
              {
                from: item.name,
                photo: item.photo ?? null,
                first: isWaiting && received === 0,
                count: Math.max(1, item.toMe ?? (item.dir === "in" ? 1 : 0)),
                skin: item.skin,
                canReply: item.fromMe === 0,
              },
              ...q.filter((x) => x.from !== item.name),
            ]);
            setSendTarget({
              name: item.name,
              tel: item.tel || "",
              photo: item.photo ?? null,
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
        <p className="phone-line">{me.phone}</p>

        <p className="counts">
          <span className="tabular-nums text-fg">{sent}</span> sent
          <span className="mx-2 text-subtle">·</span>
          <span className="tabular-nums text-fg">{received}</span> caught
        </p>
        <RankBar kisses={sent} />

        {(home.data?.people ?? []).length > 0 ? (
          <ul className="live-row">
            {(home.data?.people ?? []).slice(0, 8).map((p) => (
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
          <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-sm text-muted">
            <button type="button" className="underline-offset-4 hover:underline" onClick={() => setSettings(true)}>
              {soundsOn() ? "Sound on" : "Sound off"}
            </button>
            {authEnabled && !liveUser
              ? GROK_PROVIDERS.map((p) => (
                  <button
                    key={p.providerId}
                    type="button"
                    className="underline-offset-4 hover:underline"
                    onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                  >
                    {p.label}
                  </button>
                ))
              : null}
            {liveUser ? (
              <button
                type="button"
                className="underline-offset-4 hover:underline"
                onClick={() => void signOut()}
              >
                Out
              </button>
            ) : null}
          </div>
        </div>
      </div>
      </KissSky>

      <SendSheet
        open={sendOpen}
        myName={displayName}
        signedIn={Boolean(liveUser)}
        mySent={sent}
        people={home.data?.people ?? []}
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
          void invalidateHome();
        }}
      />
      {settings ? <SoundSettings open onClose={() => setSettings(false)} /> : null}
      {live ? (
        <LiveKiss
          from={live.from}
          photo={live.photo}
          first={live.first}
          count={live.count}
          skin={live.skin}
          canReply={live.canReply !== false}
          more={queue.length > 1}
          onClose={nextLive}
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

  const photoOf = (name: string) =>
    local.find((l) => l.name.toLowerCase() === name.toLowerCase() && l.photo)?.photo ?? null;
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
    .slice(0, 6);
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
        {next ? (
          <span className="rank-next">
            {kisses}/{next.min} · {next.name}
          </span>
        ) : (
          <span className="rank-next">max</span>
        )}
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
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const digits = phoneDigits(draftPhone);
  const last4 = digits.slice(-4);
  const phoneReady = isValidPhone(draftPhone);
  const codeReady = code.replace(/\D/g, "").length === 4;
  useKeyboardInset(true);
  return (
    <div className="sheet-scrim">
      <div className="sheet" role="dialog" aria-label="Your phone">
        {step === "phone" ? (
          <>
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
              onClick={() => setStep("code")}
            >
              Confirm
            </Button>
          </>
        ) : (
          <>
            <p className="font-display text-2xl">SMS code</p>
            <p className="mt-1 text-sm text-muted">Enter the last 4 digits of {digits}.</p>
            <Input
              className="mt-4"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="••••"
              type="tel"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
            <Button
              size="lg"
              className="mt-4 w-full"
              disabled={!codeReady}
              onClick={() => {
                if (code !== last4) return;
                onReady(digits);
              }}
            >
              Confirm
            </Button>
            {codeReady && code !== last4 ? (
              <p className="mt-2 text-sm text-primary">That code does not match.</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
