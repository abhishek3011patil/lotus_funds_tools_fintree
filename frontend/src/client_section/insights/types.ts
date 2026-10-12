export type InsightType = "BLOG" | "VIDEO";

export type InsightItem = {
  id: string;
  type: InsightType;
  title: string;
  summary: string;
  category: string;
  author: string;
  publishedAt: string;
  body: string | null;
  youtubeUrl: string | null;
  youtubeVideoId: string | null;
  youtubeChannelUrl: string | null;
  visibility: "SUBSCRIBERS" | "PUBLIC";
  authorRole: string;
  authorOrganization: string | null;
};
