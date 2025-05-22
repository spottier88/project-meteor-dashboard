
/**
 * @component InnovationRadarChart
 * @description Graphique radar visualisant le score d'innovation d'un projet.
 * Représente visuellement les 5 dimensions d'innovation: novateur, usager, 
 * ouverture, agilité et impact. Utilise la bibliothèque Recharts pour le rendu.
 */

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

interface InnovationData {
  novateur: number;
  usager: number;
  ouverture: number;
  agilite: number;
  impact: number;
}

interface InnovationRadarChartProps {
  data: InnovationData;
  size?: number;
}

export const InnovationRadarChart = ({ data, size = 300 }: InnovationRadarChartProps) => {
  const chartData = [
    { subject: 'Novateur', value: data.novateur, fullMark: 5 },
    { subject: 'Usager', value: data.usager, fullMark: 5 },
    { subject: 'Ouverture', value: data.ouverture, fullMark: 5 },
    { subject: 'Agilité', value: data.agilite, fullMark: 5 },
    { subject: 'Impact', value: data.impact, fullMark: 5 },
  ];

  return (
    <ResponsiveContainer width="100%" height={size}>
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" />
        <Radar
          name="Innovation"
          dataKey="value"
          stroke="#2563eb"
          fill="#3b82f6"
          fillOpacity={0.6}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
};
