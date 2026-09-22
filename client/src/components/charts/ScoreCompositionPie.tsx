import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  weightsUsed: Record<string, number>;
}

const COLORS: Record<string, string> = {
  resume: 'var(--accent)',
  github: 'var(--cyan)',
  coding: 'var(--purple)',
  skillMatch: 'var(--accent)',
};

const LABELS: Record<string, string> = {
  resume: 'Resume',
  github: 'GitHub',
  coding: 'Coding',
  skillMatch: 'Skill Match',
};

/** Shows how each signal (resume/github/coding/skill-match) was weighted to
 * produce the Career Score — makes the scoring engine's `weightsUsed` field
 * (see backend scoring-engine design) visible and explainable to the user. */
export function ScoreCompositionPie({ weightsUsed }: Props) {
  if (!weightsUsed || Object.keys(weightsUsed).length === 0) {
    return (
      <div className="flex items-center justify-center h-60 text-[var(--text-secondary)] text-sm">
        Run an analysis to see score composition.
      </div>
    );
  }
  const data = Object.entries(weightsUsed).map(([key, value]) => ({
    key,
    name: LABELS[key] ?? key,
    value: Math.round(value * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key] ?? 'var(--text-muted)'} stroke="none" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Weight']}
          contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', borderRadius: 8 }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          formatter={(value) => <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
