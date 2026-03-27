export const prerender = false;

import type { APIRoute } from "astro";
import { readAbout, writeAbout, type AboutData } from "../../lib/about";

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(readAbout()), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PUT: APIRoute = async ({ request }) => {
  const body = (await request.json()) as AboutData;

  if (!body.bio || !body.email) {
    return new Response(JSON.stringify({ error: "bio and email required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  writeAbout({
    bio: body.bio,
    email: body.email,
    links: Array.isArray(body.links) ? body.links : [],
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
