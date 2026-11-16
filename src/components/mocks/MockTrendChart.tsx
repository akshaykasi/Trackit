import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDate } from "../../lib/format";
import type { MockTest } from "../../types";

/** Score trend line: mock percentages over time, oldest first. */
export function MockTrendChart({ mocks, height = 220 }: { mocks: MockTest[]; height?: number }) {
  const data = [...mocks]
    .sort((a, b) => (a.taken_on < b.taken_on ? -1 : 1))
    .map((m) => ({
      taken_on: m.taken_on,
      pct: Math.round((m.score / m.max_score) * 100),
    }));

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <CartesianGrid stroke="#EDE7DA" vertical={false} />
          <XAxis
            dataKey="taken_on"
            tickFormatter={(v: string) => formatDate(v).replace(/ 20\d\d$/, "")}
            tick={{ fontSize: 11, fill: "#3C4A40" }}
            stroke="#EDE7DA"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tickFormatter={(v: number) => `${v}%`}
            tick={{ fontSize: 11, fill: "#3C4A40" }}
            stroke="#EDE7DA"
          />
          <Tooltip
            formatter={(value) => [`${value}%`, "Score"]}
            labelFormatter={(label) => formatDate(String(label))}
            contentStyle={{
              borderRadius: 16,
              border: "1px solid #EDE7DA",
              background: "#FFFFFF",
              fontSize: 12,
            }}
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#2F6B4F"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#2F6B4F" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
