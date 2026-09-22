import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { SkillMixAxis } from '@/types/api';

interface Props {
  data: SkillMixAxis[];
}

/** Replaces the hand-drawn SVG pentagon mock in advanced_career_analytics/code.html
 * with a real Recharts Radar bound to backend `skillMix` data, kept inside the
 * same "Skill Mix" rounded-2xl" style={{ background: "rgba(26,26,53,0.8)", backdropFilter: "blur(12px)", border: "1px solid var(--border)" }} className=" frame with the professional blue accent. */
export function SkillRadarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data} outerRadius="75%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis
          dataKey="axis"
          tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'Inter' }}
        />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Current"
          dataKey="current"
          stroke="var(--accent)"
          fill="var(--accent)"
          fillOpacity={0.2}
          strokeWidth={2.5}
          dot={{ r: 3.5, fill: 'var(--accent)' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
