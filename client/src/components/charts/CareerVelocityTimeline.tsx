import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CareerVelocityPoint } from '@/types/api';

interface Props {
  data: CareerVelocityPoint[];
}

/** Replaces the hand-coded SVG path in advanced_career_analytics/code.html
 * with a real Recharts Area/Timeline chart bound to `careerVelocity`. */
export function CareerVelocityTimeline({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="velocity-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--purple)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--purple)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="month"
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter', textTransform: 'uppercase' } as never}
          axisLine={false}
          tickLine={false}
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text-primary)', fontFamily: 'Inter' }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--accent)"
          strokeWidth={4}
          fill="url(#velocity-gradient)"
          dot={{ r: 4, fill: 'var(--accent)' }}
          activeDot={{ r: 6 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
