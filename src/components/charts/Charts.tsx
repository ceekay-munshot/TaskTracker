/**
 * Munshot OS chart kit — premium Recharts wrappers.
 * Gradient fills, rounded geometry, refined tooltips/legends, smooth motion.
 * Each component renders just the chart — wrap it in a Panel in the view.
 */
import { useId } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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

/* ------------------------------------------------------------------ */
/* Shared                                                             */
/* ------------------------------------------------------------------ */

const AXIS_TICK = { fontSize: 11, fill: '#94a3b8', fontWeight: 600 } as const;
const GRID_STROKE = '#eef1f6';
const TRACK_FILL = '#f3f4f8';

interface TooltipEntry {
  name?: string;
  value?: number;
  dataKey?: string | number;
  payload?: Record<string, unknown>;
}

function PremiumTooltip({
  active,
  payload,
  label,
  formatValue,
  colorByKey,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  formatValue?: (v: number) => string;
  colorByKey?: Record<string, string>;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div
      className="rounded-xl border border-ink-200/80 bg-white/95 px-3 py-2.5 backdrop-blur"
      style={{ boxShadow: '0 12px 36px -10px rgba(15,23,42,0.28)' }}
    >
      {label !== undefined && label !== '' && (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-ink-400">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const key = String(entry.dataKey ?? entry.name ?? i);
          const color =
            colorByKey?.[key] ??
            (typeof entry.payload?.fill === 'string'
              ? (entry.payload.fill as string)
              : chartColor(i));
          return (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
                style={{ background: color }}
              />
              <span className="text-ink-500">{entry.name}</span>
              <span className="ml-auto pl-5 font-extrabold tabular-nums text-ink-800">
                {formatValue && typeof entry.value === 'number'
                  ? formatValue(entry.value)
                  : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyChart({ height = 240 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 text-ink-300"
      style={{ height }}
    >
      <BarChart3 className="h-8 w-8" />
      <p className="text-xs font-semibold">No data to chart yet</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar chart                                                          */
/* ------------------------------------------------------------------ */

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
  height = 280,
  formatValue,
}: BarChartViewProps) {
  const gid = useId().replace(/[:]/g, '');
  if (data.length === 0) return <EmptyChart height={height} />;

  const isBars = orientation === 'bars';
  const singleSeries = series.length === 1;
  const colorByKey: Record<string, string> = {};
  series.forEach((s, i) => {
    colorByKey[s.key] = s.color ?? chartColor(i);
  });

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isBars ? 'vertical' : 'horizontal'}
        margin={{ top: 10, right: isBars ? 28 : 12, bottom: 0, left: isBars ? 4 : -14 }}
        barCategoryGap={isBars ? '26%' : '32%'}
      >
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? chartColor(i);
            return (
              <linearGradient
                key={s.key}
                id={`bar-${gid}-${s.key}`}
                x1="0"
                y1="0"
                x2={isBars ? '1' : '0'}
                y2={isBars ? '0' : '1'}
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.98} />
                <stop
                  offset="100%"
                  stopColor={color}
                  stopOpacity={isBars ? 0.55 : 0.62}
                />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid
          strokeDasharray="4 6"
          stroke={GRID_STROKE}
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
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              width={120}
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
              angle={data.length > 6 ? -22 : 0}
              textAnchor={data.length > 6 ? 'end' : 'middle'}
              height={data.length > 6 ? 58 : 26}
            />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={36}
            />
          </>
        )}
        <Tooltip
          cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          content={
            <PremiumTooltip formatValue={formatValue} colorByKey={colorByKey} />
          }
        />
        {series.map((s) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.name}
            stackId={stacked ? 'stack' : undefined}
            fill={`url(#bar-${gid}-${s.key})`}
            radius={isBars ? [0, 8, 8, 0] : [8, 8, 0, 0]}
            maxBarSize={isBars ? 24 : 52}
            background={isBars ? { fill: TRACK_FILL, radius: 8 } : undefined}
            animationDuration={750}
            animationEasing="ease-out"
          >
            {singleSeries && !stacked && (
              <LabelList
                dataKey={s.key}
                position={isBars ? 'right' : 'top'}
                offset={8}
                style={{
                  fill: '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                }}
                formatter={(v: number) =>
                  formatValue ? formatValue(v) : v === 0 ? '' : String(v)
                }
              />
            )}
          </Bar>
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Donut chart                                                        */
/* ------------------------------------------------------------------ */

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
  const gid = useId().replace(/[:]/g, '');
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <EmptyChart height={height} />;

  const colored = data.map((d, i) => ({
    ...d,
    fill: d.color ?? chartColor(i),
  }));

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {colored.map((d) => (
                <linearGradient
                  key={d.label}
                  id={`pie-${gid}-${d.label}`}
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0%" stopColor={d.fill} stopOpacity={1} />
                  <stop offset="100%" stopColor={d.fill} stopOpacity={0.72} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={colored}
              dataKey="value"
              nameKey="label"
              innerRadius={donut ? '64%' : 0}
              outerRadius="96%"
              paddingAngle={data.length > 1 ? 2.5 : 0}
              cornerRadius={donut ? 5 : 0}
              stroke="#ffffff"
              strokeWidth={2}
              animationDuration={700}
              animationEasing="ease-out"
            >
              {colored.map((d) => (
                <Cell key={d.label} fill={`url(#pie-${gid}-${d.label})`} />
              ))}
            </Pie>
            <Tooltip content={<PremiumTooltip formatValue={formatValue} />} />
          </PieChart>
        </ResponsiveContainer>
        {donut && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-2xl font-extrabold leading-none text-ink-800">
              {formatValue ? formatValue(total) : total}
            </span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-400">
              Total
            </span>
          </div>
        )}
      </div>
      <ul className="grid w-full grid-cols-1 gap-1.5 sm:grid-cols-1">
        {colored.map((d) => (
          <li
            key={d.label}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs transition hover:bg-ink-50"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[4px]"
              style={{ background: d.fill }}
            />
            <span className="truncate font-medium text-ink-600">
              {d.label}
            </span>
            <span className="ml-auto pl-2 font-extrabold tabular-nums text-ink-800">
              {formatValue ? formatValue(d.value) : d.value}
            </span>
            <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-ink-400">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trend chart                                                        */
/* ------------------------------------------------------------------ */

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
  height = 250,
  area = true,
  formatValue,
}: TrendChartViewProps) {
  const gid = useId().replace(/[:]/g, '');
  if (data.length === 0) return <EmptyChart height={height} />;

  const colorByKey: Record<string, string> = {};
  series.forEach((s, i) => {
    colorByKey[s.key] = s.color ?? chartColor(i);
  });

  const Chart = area ? AreaChart : LineChart;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data} margin={{ top: 12, right: 16, bottom: 0, left: -14 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? chartColor(i);
            return (
              <linearGradient
                key={s.key}
                id={`trend-${gid}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.32} />
                <stop offset="55%" stopColor={color} stopOpacity={0.1} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid
          strokeDasharray="4 6"
          stroke={GRID_STROKE}
          vertical={false}
        />
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
          width={36}
        />
        <Tooltip
          content={
            <PremiumTooltip formatValue={formatValue} colorByKey={colorByKey} />
          }
        />
        {series.map((s, i) => {
          const color = s.color ?? chartColor(i);
          return area ? (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={color}
              strokeWidth={2.75}
              fill={`url(#trend-${gid}-${s.key})`}
              dot={false}
              activeDot={{
                r: 4.5,
                strokeWidth: 2,
                stroke: '#ffffff',
                fill: color,
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ) : (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={color}
              strokeWidth={2.75}
              dot={false}
              activeDot={{
                r: 4.5,
                strokeWidth: 2,
                stroke: '#ffffff',
                fill: color,
              }}
              animationDuration={800}
              animationEasing="ease-out"
            />
          );
        })}
      </Chart>
    </ResponsiveContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Gauge                                                              */
/* ------------------------------------------------------------------ */

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
  height = 168,
  label,
}: GaugeChartProps) {
  const gid = useId().replace(/[:]/g, '');
  const data = [{ name: label ?? 'Score', value, fill: `url(#gauge-${gid})` }];
  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <defs>
            <linearGradient id={`gauge-${gid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <PolarAngleAxis
            type="number"
            domain={[0, max]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={14}
            background={{ fill: '#eef1f6' }}
            angleAxisId={0}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-extrabold leading-none text-ink-800">
          {Math.round(value)}
        </span>
        {label && (
          <span className="mt-1 text-[10px] font-bold uppercase tracking-wide text-ink-400">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bar list — premium horizontal ranking / pipeline visual            */
/* ------------------------------------------------------------------ */

interface BarListProps {
  data: { label: string; value: number; color?: string }[];
  formatValue?: (v: number) => string;
  className?: string;
}

export function BarList({ data, formatValue, className }: BarListProps) {
  if (data.length === 0) return <EmptyChart height={160} />;
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className={cn('space-y-2.5', className)}>
      {data.map((d, i) => {
        const color = d.color ?? chartColor(i);
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label} className="group">
            <div className="mb-1 flex items-center justify-between gap-3 text-xs">
              <span className="truncate font-semibold text-ink-600">
                {d.label}
              </span>
              <span className="shrink-0 font-extrabold tabular-nums text-ink-800">
                {formatValue ? formatValue(d.value) : d.value}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.max(pct, d.value > 0 ? 4 : 0)}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}b3)`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
