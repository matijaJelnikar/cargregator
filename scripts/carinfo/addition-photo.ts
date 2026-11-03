import { z } from "zod";

// Only a reviewed, published photo may be embedded in an import. Binary data remains in R2.
const https = z.string().url().refine((s) => s.startsWith("https://"), "HTTPS required");
export const AdditionPhoto = z.object({
  model_id: z.string().min(1), slug: z.string().min(1),
  status: z.literal("ok"), visually_checked: z.literal(true), uploaded: z.literal(true),
  public_url: https, source_url: https, credit: z.string().trim().min(1),
  license: z.string().regex(/^(?:CC BY(?:-SA)? \d(?:\.\d)?|CC0(?: \d(?:\.\d)?)?|Public domain)$/i),
});
export function additionPhoto(raw: unknown, target: { model_id: string; slug: string }) {
  const photo = AdditionPhoto.parse(raw);
  if (photo.model_id !== target.model_id || photo.slug !== target.slug) throw new Error("Photo target does not match generation");
  return photo;
}
