import React from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, Legend } from "recharts";

const COLORS = ["hsl(243 75% 59%)", "hsl(25 95% 53%)", "hsl(142 71% 45%)", "hsl(263 70% 50%)", "hsl(200 80% 50%)", "hsl(0 84% 60%)", "hsl(280 50% 50%)", "hsl(30 80% 50%)"];

export function GradeDistributionPie({ data }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={80} label={({ grade, count }) => `${grade}: ${count}`}>
          {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function PerformanceBarChart({ data, dataKey = "average_percentage", nameKey = "subject_name", label = "Average %" }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey={nameKey} tick={{ fontSize: 11 }} width={100} />
        <Tooltip />
        <Bar dataKey={dataKey} fill="hsl(243 75% 59%)" radius={[0, 4, 4, 0]} name={label} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AttendanceTrendChart({ data }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No attendance data</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ left: -20, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="rate" stroke="hsl(142 71% 45%)" strokeWidth={2} name="Attendance %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RevenueAreaChart({ data, dataKey = "amount", name = "Revenue" }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No revenue data</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ left: -10, right: 10 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey={dataKey} stroke="hsl(142 71% 45%)" fill="url(#revGrad)" name={name} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function GrowthTrendChart({ data, name = "Cumulative" }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No growth data</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ left: -10, right: 10 }}>
        <defs>
          <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(243 75% 59%)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(243 75% 59%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Area type="monotone" dataKey="cumulative" stroke="hsl(243 75% 59%)" fill="url(#growthGrad)" name={name} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBarChart({ data, dataKey, nameKey, label, color = "hsl(243 75% 59%)" }) {
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>;
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ left: -10, right: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={nameKey} tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} name={label} />
      </BarChart>
    </ResponsiveContainer>
  );
}