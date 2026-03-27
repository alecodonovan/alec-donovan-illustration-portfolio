export const prerender = false;

import type { APIRoute } from "astro";
import { readProjects, writeProjects, type ProjectData } from "../../../lib/projects";

export const GET: APIRoute = () => {
  const projects = readProjects();
  return new Response(JSON.stringify(projects), {
    headers: { "Content-Type": "application/json" },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as ProjectData;
  if (!body.title || !Array.isArray(body.slides)) {
    return new Response(JSON.stringify({ error: "title and slides required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const projects = readProjects();
  projects.push(body);
  writeProjects(projects);

  return new Response(JSON.stringify({ ok: true, index: projects.length - 1 }), {
    headers: { "Content-Type": "application/json" },
  });
};
