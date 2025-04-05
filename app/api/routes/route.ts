// File: app/api/routes/route.ts

export async function POST(req: Request) {
  try {
    const { personId, contentIds } = await req.json();

    const endpoint = "http://988f605f-748b-4ba8-a5c2-85e7c8f5f5e0.eastus2.azurecontainer.io/score";
    const apiKey = "QqR0SavTapqew8EcqI7Q0sbssmt97pIh";

    const requestBody = {
      Inputs: {
        input1: contentIds.map((contentId: string) => ({
          personId,
          contentId,
          rating: 1,
        })),
      },
      GlobalParameters: {},
    };

    const azureRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    const text = await azureRes.text();

    if (!azureRes.ok) {
      console.error("Azure call failed:", text);
      return new Response(JSON.stringify({ error: "Azure call failed", details: text }), {
        status: azureRes.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!text || text.trim() === "") {
      console.error("Azure returned empty body");
      return new Response(JSON.stringify({ error: "Azure returned empty response body" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(text);
    const predictions = result?.Results?.WebServiceOutput0 || [];

    return new Response(JSON.stringify(predictions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Route error:", err);
    return new Response(JSON.stringify({ error: "Internal server error", details: `${err}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
