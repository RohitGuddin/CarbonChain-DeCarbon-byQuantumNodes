import { config } from "../config";

export type EvidenceReview = {
  plantType: string;
  co2Removed: number;
  riskNotes: string;
  approved: boolean;
};

export async function reviewPlantation(imageBase64: string): Promise<EvidenceReview> {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openRouterApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Review this plantation photo. Return JSON with plantType, co2Removed, riskNotes, and approved. Approve only mangrove restoration.",
            },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } },
          ],
        },
      ],
    }),
  });

  const payload = await response.json();
  const text = payload.choices?.[0]?.message?.content || "{}";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
  return {
    plantType: parsed.plantType || "Unknown",
    co2Removed: Number(parsed.co2Removed || 0),
    riskNotes: parsed.riskNotes || "",
    approved: Boolean(parsed.approved),
  };
}
