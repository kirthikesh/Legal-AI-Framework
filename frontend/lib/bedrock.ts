import "server-only";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { MODELS, departmentName, modelLabel, type DepartmentId, type ModelId } from "./data.ts";

let client: BedrockRuntimeClient | null = null;

export function bedrockEnabled(): boolean {
  return process.env.BEDROCK_ENABLED === "true";
}

/**
 * Sends one prompt to AWS Bedrock with the Converse API.
 * Credentials come from the default AWS chain (ECS task role in production, your AWS profile locally).
 */
export async function askModel(model: ModelId, dept: DepartmentId, prompt: string): Promise<string> {
  if (!bedrockEnabled()) {
    return `Prototype reply from ${modelLabel(model)}. Set BEDROCK_ENABLED=true to get real answers from AWS Bedrock, limited to ${departmentName(dept)} documents.`;
  }

  const spec = MODELS.find((m) => m.id === model);
  const modelId = spec ? process.env[spec.envVar] : undefined;
  if (!modelId) throw new Error(`No Bedrock model ID configured for ${model}`);

  client ??= new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "eu-west-1" });
  const res = await client.send(
    new ConverseCommand({
      modelId,
      system: [
        {
          text:
            `You are the internal AI assistant for the ${departmentName(dept)} department. ` +
            "Answer only from information the user provides or from this department's documents. " +
            "If you do not know, say so.",
        },
      ],
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 1024, temperature: 0.2 },
    }),
  );

  const text = res.output?.message?.content?.map((c) => ("text" in c ? c.text : "")).join("") ?? "";
  return text || "(The model returned no text.)";
}
