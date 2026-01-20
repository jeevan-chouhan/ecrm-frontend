import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import type { PieLabelRenderProps } from "recharts";

export interface PieChartDataItem {
  name: string;
  value: number;
  color: string;
}

interface PieChartComponentProps {
  data: PieChartDataItem[];
  height?: number;
  outerRadius?: number;
  showLabels?: boolean;
  showLegend?: boolean;
}

const PieChartComponent = ({
  data,
  height = 200,
  outerRadius = 80,
  showLabels = true,
  showLegend = true,
}: PieChartComponentProps) => {
  // Custom label for pie chart
  const renderCustomizedLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;

    if (
      typeof cx !== "number" ||
      typeof cy !== "number" ||
      typeof midAngle !== "number" ||
      typeof innerRadius !== "number" ||
      typeof outerRadius !== "number" ||
      typeof percent !== "number"
    ) {
      return null;
    }

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-4">
      <div className="w-full md:w-1/2">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={showLabels ? renderCustomizedLabel : false}
              outerRadius={outerRadius}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {showLegend && (
        <div className="flex flex-wrap gap-3 justify-center md:justify-start">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-gray-500">
                {item.name} {item.value}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PieChartComponent;
