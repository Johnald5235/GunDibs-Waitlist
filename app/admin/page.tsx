import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type WaitlistSignup = {
  id: string | number;
  email: string;
  user_type: string | null;
  created_at: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
}

function getLastNDaysLabels(days: number) {
  const labels: string[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    labels.push(d.toISOString().slice(0, 10));
  }

  return labels;
}

function buildTrendData(signups: WaitlistSignup[], days = 14) {
  const labels = getLastNDaysLabels(days);
  const counts = new Map<string, number>();

  for (const label of labels) {
    counts.set(label, 0);
  }

  for (const signup of signups) {
    if (!signup.created_at) continue;
    const key = new Date(signup.created_at).toISOString().slice(0, 10);
    if (counts.has(key)) {
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }

  return labels.map((label) => ({
    label,
    count: counts.get(label) || 0,
  }));
}

function buildPolylinePoints(values: number[], width: number, height: number, padding: number) {
  const max = Math.max(...values, 1);
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index / (values.length - 1)) * innerWidth;

      const y = padding + innerHeight - (value / max) * innerHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export default async function AdminPage() {
  const { data, error } = await supabaseAdmin
    .from("waitlist_signups")
    .select("id, email, user_type, created_at")
    .order("created_at", { ascending: false });

  const signups: WaitlistSignup[] = data ?? [];

  const totalSignups = signups.length;
  const buyers = signups.filter((row) => row.user_type === "Buyer").length;
  const sellers = signups.filter((row) => row.user_type === "Seller").length;
  const dealers = signups.filter((row) => row.user_type === "Dealer").length;

  const trend = buildTrendData(signups, 14);
  const trendValues = trend.map((item) => item.count);
  const svgWidth = 900;
  const svgHeight = 280;
  const svgPadding = 28;
  const polylinePoints = buildPolylinePoints(trendValues, svgWidth, svgHeight, svgPadding);
  const maxTrendValue = Math.max(...trendValues, 1);

  return (
    <main className="min-h-screen bg-[#11150f] px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-white/60">
            Waitlist signups pulled directly from Supabase.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">
            Failed to load waitlist signups: {error.message}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Total Signups</div>
                <div className="mt-2 text-3xl font-bold">{totalSignups}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Buyers</div>
                <div className="mt-2 text-3xl font-bold">{buyers}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Sellers</div>
                <div className="mt-2 text-3xl font-bold">{sellers}</div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Dealers</div>
                <div className="mt-2 text-3xl font-bold">{dealers}</div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">Signup Trend</h2>
                  <p className="text-sm text-white/50">Last 14 days</p>
                </div>
                <div className="text-sm text-white/50">Peak daily signups: {maxTrendValue}</div>
              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="h-72 w-full">
                    {[0, 1, 2, 3, 4].map((step) => {
                      const y =
                        svgPadding +
                        ((svgHeight - svgPadding * 2) / 4) * step;

                      return (
                        <line
                          key={step}
                          x1={svgPadding}
                          y1={y}
                          x2={svgWidth - svgPadding}
                          y2={y}
                          stroke="rgba(255,255,255,0.08)"
                          strokeWidth="1"
                        />
                      );
                    })}

                    <polyline
                      fill="none"
                      stroke="#b08a52"
                      strokeWidth="4"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      points={polylinePoints}
                    />

                    {trend.map((item, index) => {
                      const x =
                        trend.length === 1
                          ? svgWidth / 2
                          : svgPadding +
                            (index / (trend.length - 1)) * (svgWidth - svgPadding * 2);

                      const y =
                        svgPadding +
                        (svgHeight - svgPadding * 2) -
                        (item.count / Math.max(maxTrendValue, 1)) * (svgHeight - svgPadding * 2);

                      return (
                        <g key={item.label}>
                          <circle cx={x} cy={y} r="5" fill="#d4a76a" />
                          <text
                            x={x}
                            y={svgHeight - 6}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.55)"
                            fontSize="12"
                          >
                            {item.label.slice(5)}
                          </text>
                          <text
                            x={x}
                            y={Math.max(y - 12, 14)}
                            textAnchor="middle"
                            fill="rgba(255,255,255,0.7)"
                            fontSize="12"
                          >
                            {item.count}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <div className="border-b border-white/10 px-5 py-4">
                <h2 className="text-lg font-semibold">Waitlist Signups</h2>
              </div>

              {signups.length === 0 ? (
                <div className="px-5 py-6 text-white/60">No signups found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-black/20 text-white/60">
                      <tr>
                        <th className="px-5 py-3 font-medium">Email</th>
                        <th className="px-5 py-3 font-medium">User Type</th>
                        <th className="px-5 py-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signups.map((row) => (
                        <tr key={row.id} className="border-t border-white/10">
                          <td className="px-5 py-3">{row.email}</td>
                          <td className="px-5 py-3">{row.user_type || "Unknown"}</td>
                          <td className="px-5 py-3">{formatDate(row.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}