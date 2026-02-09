"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface BarChartComponentProps {
  data: { name: string; value: number }[] | any;
  title?: string;
  color?: string;
  height?: number;
}

export default function BarChartComponent({
  data,
  title,
  color = "#2C6975",
  height = 300,
}: BarChartComponentProps) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      {title && (
        <h3 className="font-semibold text-gray-900 mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
