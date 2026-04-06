export async function POST(req: Request) {
  try {
    const { url, method = "GET", headers = {}, body } = await req.json();

    const res = await fetch(url, {
      method,
      headers,
      body,
    });

    const text = await res.text();
    return new Response(text, { status: res.status });
  } catch (err: any) {
    return new Response(err?.message || "Proxy error", { status: 500 });
  }
}
