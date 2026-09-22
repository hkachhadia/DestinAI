import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface Props {
  label: string; // "Career Score", "Resume Score", "GitHub Score", "Coding Score", "ATS Score"
  value: number; // 0-100
  color?: string;
  size?: number;
}

/** Single-metric progress ring, used five times on the Analytics/Dashboard
 * screens (Career/Resume/GitHub/Coding/ATS). Built on Recharts RadialBarChart
 * rather than the raw conic-gradient CSS trick in main_dashboard/code.html,
 * so the fill percentage always reflects real backend data. */
export function ScoreProgressRing({ label, value, color = 'var(--accent)', size = 160 }: Props) {
  const data = [{ name: label, value, fill: color }];

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="82%"
            outerRadius="100%"
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={12} background={{ fill: 'var(--bg-overlay)' }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black font-headline" style={{ color }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <span className="mt-2 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-headline text-center">
        {label}
      </span>
    </div>
  );
}
