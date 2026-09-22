import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CompetencyGap } from '@/types/api';

interface Props {
  data: CompetencyGap[];
}

/** Replaces the manually-coded percentage bars in advanced_career_analytics
 * with a real Recharts grouped bar chart bound to `competencyGaps`. */
export function CompetencyGapChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 24, right: 24 }}>
        <CartesianGrid horizontal={false} stroke="var(--border)" />
        <XAxis type="number" domain={[0, 100]} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="skill"
          width={200}
          tick={{ fill: 'var(--text-primary)', fontSize: 12, fontFamily: 'Inter' }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8 }}
          labelStyle={{ color: 'var(--text-primary)', fontFamily: 'Inter' }}
        />
        <Bar dataKey="target" fill="var(--bg-overlay)" radius={[4, 4, 4, 4]} barSize={14} name="Target" />
        <Bar dataKey="current" fill="var(--accent)" radius={[4, 4, 4, 4]} barSize={14} name="Current" />
      </BarChart>
    </ResponsiveContainer>
  );
}
