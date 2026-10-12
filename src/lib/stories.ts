import rawStories from "@/content/stories.json";
export type Story = { slug:string; title:string; description:string; published:boolean; updatedAt:string; intro:string; paragraphs:string[]; phrases:{es:string;ru:string}[]; lessonHref:string };
const allStories = rawStories as Story[];
export const publishedStories = allStories.filter(story => story.published);
export function getPublishedStory(slug:string): Story | undefined { return publishedStories.find(story => story.slug === slug); }
