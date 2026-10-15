import { existsSync, readFileSync } from "node:fs";
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

function rawUrl(path: string) {
  return `https://raw.githubusercontent.com/${config.githubRepo}/${config.githubBranch}/${path}`;
}

export function localAudioPath(id: string) {
  return resolve(catalogRoot, "audio", `${id}.mp3`);
}

export function localCoverPath(id: string) {
  return resolve(catalogRoot, "covers", `${id}.svg`);
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

export function readLocalMedia(kind: "audio" | "covers", id: string) {
  const path = kind === "audio" ? localAudioPath(id) : localCoverPath(id);
  if (!existsSync(path)) return null;
  return readFileSync(path);
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
