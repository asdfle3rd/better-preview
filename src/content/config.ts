import { defineCollection, z } from "astro:content";

const featuresCollection = defineCollection({
  type: "content",
  schema: z.object({
    id: z.number(),
    title: z.string(),
    image: z.string(),
  }),
});

export const collections = {
  features: featuresCollection,
};
