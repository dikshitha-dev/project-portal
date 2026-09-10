"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

export default function ProgressChart({ data, title }) {
  if (!data || data.length === 0) {
    return (
      <div className="card-static">
        <h3 className="font-bold text-gray-900 mb-4">{title || "Progress"}</h3>
        <div className="h-64 flex items-center justify-center text-gray-400">
          No data available yet
        </div>
      </div>
    );
  }

  return (
    <div className="card-static">
      <h3 className="font-bold text-gray-900 mb-5">{title || "Progress"}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "16px",
                border: "1px solid rgba(255,255,255,0.5)",
                boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
                backdropFilter: "blur(10px)",
                background: "rgba(255,255,255,0.9)",
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#7c3aed"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorTotal)"
              dot={{ fill: "#7c3aed", strokeWidth: 2, r: 5, stroke: "#fff" }}
              activeDot={{ r: 7, stroke: "#7c3aed", strokeWidth: 2, fill: "#fff" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
