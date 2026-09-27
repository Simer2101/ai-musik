import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "../config.js";
import type { TrackDto } from "./tracks.js";

const here = dirname(fileURLToPath(import.meta.url));
export const catalogRoot = resolve(here, "../../../../catalog");
const tracksFile = resolve(catalogRoot, "tracks.json");

export type CatalogTrack = TrackDto & {
  title?: string;
  playCount?: number;
};

type CatalogFile = { tracks: CatalogTrack[] };

function githubToken() {
  if (config.githubToken) return config.githubToken;
  try {
    return execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      windowsHide: true,
    }).trim();
  } catch {
    return "";
  }
}

function rawUrl(path: string) {
  return `https://raw.githubusercontent.com/${config.githubRepo}/${config.githubBranch}/${path}`;
}

export function publicAudioUrl(id: string) {
  return rawUrl(`catalog/audio/${id}.mp3`);
}

export function publicCoverUrl(id: string) {
  return rawUrl(`catalog/covers/${id}.svg`);
}

export function localAudioPath(id: string) {
  return resolve(catalogRoot, "audio", `${id}.mp3`);
}

export function localCoverPath(id: string) {
  return resolve(catalogRoot, "covers", `${id}.svg`);
}

function ensureDirs() {
  mkdirSync(resolve(catalogRoot, "audio"), { recursive: true });
  mkdirSync(resolve(catalogRoot, "covers"), { recursive: true });
}

export function readLocalCatalog(): CatalogTrack[] {
  if (!existsSync(tracksFile)) return [];
  try {
    const parsed = JSON.parse(readFileSync(tracksFile, "utf8")) as CatalogFile;
    return parsed.tracks ?? [];
  } catch {
    return [];
  }
}

export function writeLocalCatalog(tracks: CatalogTrack[]) {
  ensureDirs();
  writeFileSync(tracksFile, `${JSON.stringify({ tracks }, null, 2)}\n`, "utf8");
}

export function saveLocalMedia(id: string, audio: Buffer, cover: Buffer) {
  ensureDirs();
  writeFileSync(localAudioPath(id), audio);
  writeFileSync(localCoverPath(id), cover);
}

export function readLocalMedia(kind: "audio" | "covers", id: string) {
  const path = kind === "audio" ? localAudioPath(id) : localCoverPath(id);
  if (!existsSync(path)) return null;
  return readFileSync(path);
}

async function githubRequest(path: string, init: RequestInit = {}) {
  const token = githubToken();
  if (!token) {
    throw new Error("GitHub is not configured. Sign in with gh or set GITHUB_TOKEN.");
  }
  const response = await fetch(`https://api.github.com/repos/${config.githubRepo}/contents/${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      ...init.headers,
    },
  });
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`GitHub error ${response.status}: ${body.slice(0, 240)}`);
  }
  return body ? (JSON.parse(body) as { sha?: string; content?: string }) : {};
}

async function putGithubFile(path: string, content: Buffer | string, message: string) {
  let sha: string | undefined;
  try {
    const existing = await githubRequest(`${path}?ref=${encodeURIComponent(config.githubBranch)}`);
    sha = existing.sha;
  } catch {
    sha = undefined;
  }
  const bytes = typeof content === "string" ? Buffer.from(content, "utf8") : content;
  await githubRequest(path, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: bytes.toString("base64"),
      branch: config.githubBranch,
      ...(sha ? { sha } : {}),
    }),
  });
}

export async function fetchRemoteCatalog(): Promise<CatalogTrack[]> {
  try {
    const response = await fetch(`${rawUrl("catalog/tracks.json")}?t=${Date.now()}`);
    if (!response.ok) return [];
    const parsed = (await response.json()) as CatalogFile;
    return parsed.tracks ?? [];
  } catch {
    return [];
  }
}

export async function listCatalogTracks(): Promise<CatalogTrack[]> {
  const local = readLocalCatalog();
  if (local.length) return local;
  return fetchRemoteCatalog();
}

export async function publishTrackToGithub(track: CatalogTrack, audio: Buffer, cover: Buffer) {
  saveLocalMedia(track.id, audio, cover);
  const tracks = [track, ...readLocalCatalog().filter((item) => item.id !== track.id)];
  writeLocalCatalog(tracks);

  if (!config.githubRepo) {
    throw new Error("GITHUB_REPO is not set.");
  }

  await putGithubFile(
    `catalog/audio/${track.id}.mp3`,
    audio,
    `Add track audio: ${track.title || track.id}`
  );
  await putGithubFile(
    `catalog/covers/${track.id}.svg`,
    cover,
    `Add track cover: ${track.title || track.id}`
  );
  await putGithubFile(
    "catalog/tracks.json",
    `${JSON.stringify({ tracks }, null, 2)}\n`,
    `Add track: ${track.title || track.prompt.slice(0, 40)}`
  );
  return tracks;
}
