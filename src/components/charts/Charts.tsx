/**
 * Reusable Recharts wrappers with a consistent Munshot OS look.
 * Each component renders just the chart — wrap it in a Panel in the view.
 */
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/utils/cn';
import { chartColor } from '@/utils/palette';

/* ------------------------------- shared --------------------------------- */

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: { fill?: string; label?: string };
}

function CustomTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatValue?: (v: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl border border-ink-200 bg-white/95 px-3 py-2 shadow-card backdrop-blur">
      {label !== undefined && label !== '' && (
        <p className="mb-1 text-xs font-bold text-ink-700">{label}</p>
      )}
      {payload.map((entry, i) => (
        <div
          key={entry.dataKey ?? entry.name ?? i}
          className="flex items-center gap-2 text-xs"
        >
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color ?? entry.payload?.fill ?? '#6366f1' }}
          />
          <span className="text-ink-500">{entry.name}</span>
          <span className="ml-auto pl-3 font-bold text-ink-800">
            {formatValue && typeof entry.value === 'number'
              ? formatValue(entry.value)
              : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyChart({ height = 240 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-ink-300"
      style={{ height }}
    >
      <BarChart3 className="h-8 w-8" />
      <p className="text-xs font-medium">No data to chart yet</p>
    </div>
  );
}

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8' } as const;

/* ------------------------------ Bar chart ------------------------------- */

export interface BarDatum {
  label: string;
  [key: string]: string | number;
}

export interface BarSeries {
  key: string;
  name: string;
  color?: string;
}

interface BarChartViewProps {
  data: BarDatum[];
  series: BarSeries[];
  orientation?: 'columns' | 'bars';
  stacked?: boolean;
  height?: number;
  formatValue?: (v: number) => string;
  colorful?: boolean;
}

export function BarChartView({
  data,
  series,
  orientation = 'columns',
  stacked = false,
  height = 260,
  formatValue,
  colorful = true,
}: BarChartViewProps) {
  if (data.length === 0) return <EmptyChart height={height} />;
  const isBars = orientation === 'bars';
  const singleColorful = series.length === 1 && colorful && !series[0].color;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isBars ? 'vertical' : 'horizontal'}
        margin={{ top: 6, right: 12, bottom: 0, left: isBars ? 4 : -16 }}
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          horizontal={!isBars}
          vertical={isBars}
        />
        {isBars ? (
          <>
            <XAxis
              type="number"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={118}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={data.length > 6 ? -25 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 56 : 28}
            />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
          </>
        )}
        <Tooltip
          content={<CustomTooltip formatValue={formatValue} />}
          cursor={{ fill: 'rgba(99,102,241,0.06)' }}
        />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId={stacked ? 'stack' : undefined}
            fill={s.color ?? chartColor(i)}
            radius={isBars ? [0, 6, 6, 0] : [6, 6, 0, 0]}
            maxBarSize={isBars ? 26 : 54}
          >
            {singleColorful &&
              data.map((_, idx) => (
                <Cell key={idx} fill={chartColor(idx)} />
              ))}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------ Donut chart ----------------------------- */

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartViewProps {
  data: DonutDatum[];
  height?: number;
  donut?: boolean;
  formatValue?: (v: number) => string;
}

export function DonutChartView({
  data,
  height = 240,
  donut = true,
  formatValue,
}: DonutChartViewProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart height={height} />;

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row">
      <div style={{ width: height, height }} className="shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={donut ? '58%' : 0}
              outerRadius="86%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color ?? chartColor(i)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid w-full grid-cols-2 gap-1.5 sm:grid-cols-1">
        {data.map((d, i) => (
          <li
            key={d.label}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: d.color ?? chartColor(i) }}
            />
            <span className="truncate text-ink-500">{d.label}</span>
            <span className="ml-auto pl-2 font-bold tabular-nums text-ink-800">
              {d.value}
            </span>
            <span className="w-9 shrink-0 text-right tabular-nums text-ink-400">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------ Trend chart ----------------------------- */

export interface TrendDatum {
  label: string;
  [key: string]: string | number;
}

interface TrendChartViewProps {
  data: TrendDatum[];
  series: BarSeries[];
  height?: number;
  area?: boolean;
  formatValue?: (v: number) => string;
}

export function TrendChartView({
  data,
  series,
  height = 240,
  area = true,
  formatValue,
}: TrendChartViewProps) {
  if (data.length === 0) return <EmptyChart height={height} />;

  const Chart = area ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 8, right: 14, bottom: 0, left: -16 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient
              key={s.key}
              id={`grad-${s.key}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={s.color ?? chartColor(i)}
                stopOpacity={0.35}
              />
              <stop
                offset="100%"
                stopColor={s.color ?? chartColor(i)}
                stopOpacity={0.02}
              />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip formatValue={formatValue} />} />
        {series.map((s, i) =>
          area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? chartColor(i)}
              strokeWidth={2.5}
              fill={`url(#grad-${s.key})`}
              dot={{ r: 3, strokeWidth: 0, fill: s.color ?? chartColor(i) }}
              activeDot={{ r: 5 }}
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color ?? chartColor(i)}
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 0, fill: s.color ?? chartColor(i) }}
              activeDot={{ r: 5 }}
            />
          ),
        )}
      </Chart>
    </ResponsiveContainer>
  );
}

/* ------------------------------- Gauge ---------------------------------- */

interface GaugeChartProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  label?: string;
}

export function GaugeChart({
  value,
  max = 100,
  color = '#6366f1',
  height = 160,
  label,
}: GaugeChartProps) {
  const data = [{ name: label ?? 'Score', value, fill: color }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={12}
            background={{ fill: '#eef2f7' }}
            angleAxisId={0}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold text-ink-800">
          {Math.round(value)}
        </span>
        {label && (
          <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- Bar list ------------------------------- */

/** Lightweight horizontal "bar list" — good for compact rankings. */
export function BarList({
  data,
  formatValue,
  className,
}: {
  data: { label: string; value: number; color?: string }[];
  formatValue?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  if (data.length === 0) return <EmptyChart height={160} />;
  return (
    <div className={cn('space-y-2', className)}>
      {data.map((d, i) => (
        <div key={d.label} className="group">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate font-semibold text-ink-600">
              {d.label}
            </span>
            <span className="ml-2 shrink-0 font-bold tabular-nums text-ink-800">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-ink-100">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color ?? chartColor(i),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
