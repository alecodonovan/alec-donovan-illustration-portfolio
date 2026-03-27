export const prerender = false;

import type { APIRoute } from "astro";
import { readProjects, writeProjects } from "../../../lib/projects";

export const POST: APIRoute = async ({ request }) => {
  const { order } = (await request.json()) as { order: number[] };
  const projects = readProjects();

  if (
    !Array.isArray(order) ||
    order.length !== projects.length ||
    !order.every((i) => Number.isFinite(i) && i >= 0 && i < projects.length)
  ) {
    return new Response(JSON.stringify({ error: "invalid order array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reordered = order.map((i) => projects[i]);
  writeProjects(reordered);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
