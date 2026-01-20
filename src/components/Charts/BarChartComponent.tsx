import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { COLORS } from "../../constants";

export interface BarChartDataItem {
  name: string;
  value: number;
}

interface BarChartComponentProps {
  data: BarChartDataItem[];
  height?: number;
  barColor?: string;
  showGrid?: boolean;
  rotateLabels?: boolean;
  labelAngle?: number;
  maxBarSize?: number;
}

const BarChartComponent = ({
  data,
  height = 350,
  barColor = COLORS.primary,
  showGrid = true,
  rotateLabels = true,
  labelAngle = -45,
  maxBarSize = 50,
}: BarChartComponentProps) => {
  return (
    <div className="w-full overflow-x-auto">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: rotateLabels ? 80 : 20,
          }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} />
          )}
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: COLORS.textMuted }}
            interval={0}
            angle={rotateLabels ? labelAngle : 0}
            textAnchor={rotateLabels ? "end" : "middle"}
            height={rotateLabels ? 100 : 30}
          />
          <YAxis
            tick={{ fontSize: 12, fill: COLORS.textMuted }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderLight}`,
              borderRadius: "8px",
            }}
            labelStyle={{ color: COLORS.textDark, fontWeight: 600 }}
          />
          <Bar
            dataKey="value"
            fill={barColor}
            radius={[4, 4, 0, 0]}
            maxBarSize={maxBarSize}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BarChartComponent;
