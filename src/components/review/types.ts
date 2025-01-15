export interface ReviewForm {
  weather: "sunny" | "cloudy" | "stormy";
  progress: "better" | "stable" | "worse";
  completion: number;
  comment: string;
  actions: { description: string }[];
}