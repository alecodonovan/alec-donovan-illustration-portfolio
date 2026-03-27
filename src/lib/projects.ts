import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type SlideData =
  | { kind: "image"; src: string; width: number; height: number; hidden?: boolean }
  | { kind: "video"; src: string; poster: string; width: number; height: number; autoplay?: boolean; autoplayLightbox?: boolean; hidden?: boolean };

export type ProjectData = {
  title: string;
  description: string;
  thumbAlt: string;
  hidden?: boolean;
  slides: SlideData[];
};

const DATA_PATH = join(process.cwd(), "src/data/work.json");

export function readProjects(): ProjectData[] {
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export function writeProjects(projects: ProjectData[]): void {
  writeFileSync(DATA_PATH, JSON.stringify(projects, null, 2), "utf-8");
}
