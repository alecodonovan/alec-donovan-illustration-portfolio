import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type AboutLink = {
  text: string;
  url: string;
};

export type AboutData = {
  bio: string;
  email: string;
  links: AboutLink[];
};

const DATA_PATH = join(process.cwd(), "src/data/about.json");

export function readAbout(): AboutData {
  const raw = readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

export function writeAbout(data: AboutData): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}
