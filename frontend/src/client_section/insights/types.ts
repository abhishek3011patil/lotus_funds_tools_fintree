export type InsightType = "Article" | "Video";

export type InsightItem = {
  id: number;
  type: InsightType;
  title: string;
  summary: string;
  category: string;
  author: string;
  publishedAt: string;
  duration: string;
  accent: string;
};
