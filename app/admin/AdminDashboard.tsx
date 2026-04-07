"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { WaitlistSignup } from "@/lib/supabase";

function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function AdminDashboard({ signups }: { signups: WaitlistSignup[] }) {
  const {
    momentum,
    roleCounts,
    cumulativeSeries,
    last30Series,
    sortedDesc,
  } = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenAgo = new Date(startOfToday);
    sevenAgo.setDate(sevenAgo.getDate() - 6);
    const thirtyAgo = new Date(startOfToday);
    thirtyAgo.setDate(thirtyAgo.getDate() - 29);

    let today = 0;
    let last7 = 0;
    let last30 = 0;

    const roleCounts: Record<string, number> = {
      Buyer: 0,
      Seller: 0,
      Dealer: 0,
      Creator: 0,
      "Just interested": 0,
    };

    const byDay = new Map<string, number>();

    for (const s of signups) {
      const created = new Date(s.created_at);
      if (created >= startOfToday) today += 1;
      if (created >= sevenAgo) last7 += 1;
      if (created >= thirtyAgo) last30 += 1;
      if (s.user_type in roleCounts) roleCounts[s.user_type] += 1;
      const k = dayKey(created);
      byDay.set(k, (byDay.get(k) || 0) + 1);
    }

    // Cumulative series across full history
    const sortedAsc = [...signups].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const cumulativeMap = new Map<string, number>();
    for (const s of sortedAsc) {
      const k = dayKey(new Date(s.created_at));
      cumulativeMap.set(k, (cumulativeMap.get(k) || 0) + 1);
    }
    const cumulativeSeries: { date: string; total: number }[] = [];
    let running = 0;
    const cumKeys = Array.from(cumulativeMap.keys()).sort();
    for (const k of cumKeys) {
      running += cumulativeMap.get(k) || 0;
      cumulativeSeries.push({ date: k, total: running });
    }

    // Last 30 days series (fill empty days with 0)
    const last30Series: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(startOfToday);
      d.setDate(d.getDate() - i);
      const k = dayKey(d);
      last30Series.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        count: byDay.get(k) || 0,
      });
    }

    const sortedDesc = [...signups].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return {
      momentum: { total: signups.length, today, last7, last30 },
      roleCounts,
      cumulativeSeries,
      last30Series,
      sortedDesc,
    };
  }, [signups]);

  const momentumCards = [
    { label: "Total Signups", value: momentum.total },
    { label: "Today", value: momentum.today },
    { label: "Last 7 Days", value: momentum.last7 },
    { label: "Last 30 Days", value: momentum.last30 },
  ];

  const roleCards = [
    { label: "Buyers", value: roleCounts.Buyer },
    { label: "Sellers", value: roleCounts.Seller },
    { label: "Dealers", value: roleCounts.Dealer },
    { label: "Creators", value: roleCounts.Creator },
    { label: "Just Interested", value: roleCounts["Just interested"] },
  ];

  return (
    <>
      {/* Momentum */}
      <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">Momentum</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {momentumCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
            Cumulative Signups
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cumulativeSeries}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: "#000",
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#ffffff"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
          <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">
            Daily Signups (Last 30 Days)
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last30Series}>
                <CartesianGrid stroke="#1f2937" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "#000",
                    border: "1px solid #1f2937",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Role breakdown */}
      <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-3">By Role</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {roleCards.map((c) => (
          <div key={c.label} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <div className="text-xs uppercase tracking-wide text-gray-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Email</th>
              <th className="text-left px-4 py-3 font-medium">User Type</th>
              <th className="text-left px-4 py-3 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {sortedDesc.map((s) => (
              <tr key={s.id} className="border-t border-gray-800">
                <td className="px-4 py-3">{s.email}</td>
                <td className="px-4 py-3">{s.user_type}</td>
                <td className="px-4 py-3 text-gray-400">
                  {new Date(s.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
            {sortedDesc.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                  No signups yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}