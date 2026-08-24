import type { KissKindId } from "./kinds";

export type Profile = {
  userId: string;
  handle: string;
  displayName: string;
  bio: string;
  avatarHue: number;
  openToRandom: boolean;
  phone: string | null;
};

export type PublicPerson = {
  userId: string;
  handle: string;
  displayName: string;
  avatarHue: number;
  lastSeen?: string | null;
};

export type Friend = PublicPerson & {
  streak: number;
  pendingIncoming: boolean;
  friendshipId?: number;
};

export type KissRow = {
  id: number;
  fromUserId: string;
  toUserId: string;
  kind: KissKindId | string;
  note: string;
  createdAt: string;
  caughtAt: string | null;
  fromHandle: string;
  fromName: string;
  fromHue: number;
};

export type SentKiss = {
  id: number;
  toUserId: string;
  toName: string;
  toHandle: string;
  caught: boolean;
  createdAt: string;
};

export type LeaderRow = {
  userId: string;
  handle: string;
  displayName: string;
  avatarHue: number;
  received: number;
};

export type HomePayload = {
  profile: Profile | null;
  friends: Friend[];
  incoming: Friend[];
  inbox: KissRow[];
  sent: SentKiss[];
  sentToday: number;
  receivedToday: number;
  sentAll: number;
  receivedAll: number;
  randomRemaining: number;
  leaderboard: LeaderRow[];
  people: PublicPerson[];
};

export type OrbitItem = {
  id: string;
  dir: "in" | "out";
  name: string;
  status: "waiting" | "caught" | "invited";
  serverId?: number;
  photo?: string | null;
  hue?: number;
  tel?: string;
  toMe?: number;
  fromMe?: number;
  skin?: string;
  userId?: string;
};
