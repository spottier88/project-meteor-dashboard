import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis } from "recharts";

interface Review {
  created_at: string;
  completion: number;
}

interface ProjectProgressChartProps {
  reviews: Review[];
}

export const ProjectProgressChart = ({ reviews }: ProjectProgressChartProps) => {
  const data = reviews
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((review) => ({
      date: new Date(review.created_at).toLocaleDateString("fr-FR"),
      completion: review.completion,
    }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution de la progression</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ChartContainer
            className="w-full"
            config={{
              completion: {
                theme: {
                  light: "#0ea5e9",
                  dark: "#0ea5e9",
                },
              },
            }}
          >
            <LineChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Line
                type="monotone"
                dataKey="completion"
                strokeWidth={2}
                dot={{ strokeWidth: 2 }}
              />
              <ChartTooltip>
                <ChartTooltipContent />
              </ChartTooltip>
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};