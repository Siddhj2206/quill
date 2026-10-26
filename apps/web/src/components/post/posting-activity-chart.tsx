"use client";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@quill/ui/components/chart";
import { Skeleton } from "@quill/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

import { useTRPC } from "@/utils/trpc";

const chartConfig = {
  count: {
    label: "Posts",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PostingActivityChart({ handle }: { handle: string }) {
  const trpc = useTRPC();
  const query = useQuery(trpc.users.activity.queryOptions(handle));

  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError || !query.data) {
    return <p className="text-muted-foreground">Could not load activity.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-40 w-full">
      <BarChart data={query.data}>
        <XAxis
          dataKey="hour"
          tickLine={false}
          axisLine={false}
          tickFormatter={(hour: number) => `${hour}`}
        />
        <YAxis hide />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(hour) => `${hour}:00`} />} />
        <Bar dataKey="count" fill="var(--color-count)" />
      </BarChart>
    </ChartContainer>
  );
}
