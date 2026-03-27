export const prerender = false;

import type { APIRoute } from "astro";
import { readProjects, writeProjects, type ProjectData } from "../../../lib/projects";

export const PUT: APIRoute = async ({ params, request }) => {
  const idx = parseInt(params.index ?? "", 10);
  const projects = readProjects();

  if (!Number.isFinite(idx) || idx < 0 || idx >= projects.length) {
    return new Response(JSON.stringify({ error: "invalid index" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = (await request.json()) as ProjectData;
  if (!body.title || !Array.isArray(body.slides)) {
    return new Response(JSON.stringify({ error: "title and slides required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  projects[idx] = body;
  writeProjects(projects);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = ({ params }) => {
  const idx = parseInt(params.index ?? "", 10);
  const projects = readProjects();

  if (!Number.isFinite(idx) || idx < 0 || idx >= projects.length) {
    return new Response(JSON.stringify({ error: "invalid index" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  projects.splice(idx, 1);
  writeProjects(projects);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
