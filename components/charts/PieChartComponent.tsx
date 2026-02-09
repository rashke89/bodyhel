"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const COLORS = [
  "#2C6975",
  "#6BB2A0",
  "#CDE0C9",
  "#1a4a54",
  "#8fc4b5",
  "#E0ECDE",
];

interface PieChartComponentProps {
  data: { name: string; value: number }[];
  title?: string;
  height?: number;
}

export default function PieChartComponent({
  data,
  title,
  height = 300,
}: PieChartComponentProps) {
  const filtered = data?.filter((d) => d.value > 0) || [];
  if (filtered.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {filtered.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
