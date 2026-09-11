import Anthropic from "@anthropic-ai/sdk";
import type { FormData, Track } from "@/lib/database.types";

export interface AiReviewResult {
  score: number;
  summary: string;
}

const TRACK_LABEL: Record<Track, string> = {
  hacker: "hacker (event participant)",
  judge: "judge (evaluates project demos)",
};

export async function generateAiReview(track: Track, formData: FormData): Promise<AiReviewResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const anthropic = new Anthropic({ apiKey });

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    system:
      "You are an assistant helping hackathon organizers triage applications quickly. " +
      "You are not the decision-maker — organizers always review your output and make the final call. " +
      "Respond ONLY with compact JSON: {\"score\": <integer 1-10>, \"summary\": \"<2-3 sentence summary>\"}. " +
      "The score is a rough fit/strength signal, not a rejection. No markdown, no extra text.",
    messages: [
      {
        role: "user",
        content: `Applicant track: ${TRACK_LABEL[track]}\n\nApplication answers (JSON):\n${JSON.stringify(
          formData,
          null,
          2
        )}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") return null;

  try {
    const parsed = JSON.parse(textBlock.text);
    const score = Number(parsed.score);
    const summary = String(parsed.summary ?? "");
    if (!summary || Number.isNaN(score)) return null;
    return { score: Math.max(1, Math.min(10, Math.round(score))), summary };
  } catch {
    return null;
  }
}
