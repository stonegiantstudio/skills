---
description: Data visualization for PDF reports - charts, graphs, and dashboards rendered to print-ready format. Triggers when creating reports with charts, generating data visualizations for PDF output, or building dashboard exports.
---

# PDF Charts & Visualization

Generate charts and graphs for PDF documents with consistent branding and print-quality output.

## Library Options

| Library | Approach | Best For |
|---------|----------|----------|
| **@react-pdf/renderer + SVG** | Native SVG in React PDF | Simple charts, full control |
| **Chart.js + canvas** | Render to image, embed | Complex charts, animations to static |
| **Recharts + SVG export** | React charts → SVG → PDF | React ecosystem |
| **D3.js + SVG** | Generate SVG, embed | Custom visualizations |
| **matplotlib** | Python → image/SVG | Data science, Python backend |

## React PDF with SVG Charts

Native SVG rendering in @react-pdf/renderer for simple, crisp charts.

```tsx
import { Document, Page, View, Text, Svg, Rect, Line, G } from "@react-pdf/renderer";

interface BarChartProps {
  data: Array<{ label: string; value: number }>;
  width: number;
  height: number;
  color?: string;
}

const BarChart = ({ data, width, height, color = "#2563eb" }: BarChartProps) => {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = (width - 40) / data.length - 10;
  const chartHeight = height - 40;

  return (
    <Svg width={width} height={height}>
      {/* Y-axis */}
      <Line x1={40} y1={10} x2={40} y2={chartHeight + 10} stroke="#e5e7eb" />

      {/* X-axis */}
      <Line
        x1={40}
        y1={chartHeight + 10}
        x2={width - 10}
        y2={chartHeight + 10}
        stroke="#e5e7eb"
      />

      {/* Bars */}
      {data.map((item, i) => {
        const barHeight = (item.value / maxValue) * chartHeight;
        const x = 50 + i * (barWidth + 10);
        const y = chartHeight + 10 - barHeight;

        return (
          <G key={i}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={color}
            />
            {/* Value label */}
            <Text
              x={x + barWidth / 2}
              y={y - 5}
              fontSize={8}
              textAnchor="middle"
            >
              {item.value}
            </Text>
            {/* X-axis label */}
            <Text
              x={x + barWidth / 2}
              y={chartHeight + 25}
              fontSize={7}
              textAnchor="middle"
            >
              {item.label}
            </Text>
          </G>
        );
      })}
    </Svg>
  );
};

// Line Chart
interface LineChartProps {
  data: Array<{ x: number; y: number }>;
  width: number;
  height: number;
  color?: string;
}

const LineChart = ({ data, width, height, color = "#2563eb" }: LineChartProps) => {
  const maxY = Math.max(...data.map((d) => d.y));
  const maxX = Math.max(...data.map((d) => d.x));
  const chartWidth = width - 50;
  const chartHeight = height - 40;

  const points = data
    .map((d) => {
      const x = 45 + (d.x / maxX) * chartWidth;
      const y = 10 + chartHeight - (d.y / maxY) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={width} height={height}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <Line
          key={i}
          x1={45}
          y1={10 + chartHeight * (1 - pct)}
          x2={width - 5}
          y2={10 + chartHeight * (1 - pct)}
          stroke="#f3f4f6"
        />
      ))}

      {/* Axes */}
      <Line x1={45} y1={10} x2={45} y2={chartHeight + 10} stroke="#e5e7eb" />
      <Line
        x1={45}
        y1={chartHeight + 10}
        x2={width - 5}
        y2={chartHeight + 10}
        stroke="#e5e7eb"
      />

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />

      {/* Data points */}
      {data.map((d, i) => {
        const x = 45 + (d.x / maxX) * chartWidth;
        const y = 10 + chartHeight - (d.y / maxY) * chartHeight;
        return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
      })}
    </Svg>
  );
};

// Pie Chart
interface PieChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size: number;
}

const PieChart = ({ data, size }: PieChartProps) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = size / 2 - 10;
  const center = size / 2;

  let currentAngle = -90; // Start at top

  const slices = data.map((item) => {
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc points
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...item, path };
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((slice, i) => (
        <path key={i} d={slice.path} fill={slice.color} />
      ))}
    </Svg>
  );
};
```

## Chart.js to Image for PDF

Render Chart.js charts server-side, then embed as images.

```typescript
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

const chartCanvas = new ChartJSNodeCanvas({
  width: 600,
  height: 400,
  backgroundColour: "white",
});

async function generateBarChartImage(
  labels: string[],
  values: number[]
): Promise<Buffer> {
  const config = {
    type: "bar" as const,
    data: {
      labels,
      datasets: [
        {
          label: "Revenue",
          data: values,
          backgroundColor: "#2563eb",
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: false,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Monthly Revenue",
          font: { size: 16, weight: "bold" },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#f3f4f6" },
        },
        x: {
          grid: { display: false },
        },
      },
    },
  };

  return chartCanvas.renderToBuffer(config);
}

// Use in React PDF
import { Image } from "@react-pdf/renderer";

const ReportWithChart = async ({ data }) => {
  const chartImage = await generateBarChartImage(
    data.map((d) => d.month),
    data.map((d) => d.revenue)
  );

  // Convert buffer to data URL
  const chartDataUrl = `data:image/png;base64,${chartImage.toString("base64")}`;

  return (
    <Document>
      <Page>
        <Image src={chartDataUrl} style={{ width: 400, height: 267 }} />
      </Page>
    </Document>
  );
};
```

## Matplotlib for Python Backend

Generate charts in Python, export as SVG or PNG for PDF embedding.

```python
import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
from io import BytesIO
import base64

def create_bar_chart(labels: list, values: list, title: str) -> str:
    """Generate bar chart, return as base64 PNG."""
    fig, ax = plt.subplots(figsize=(8, 5), dpi=150)

    # Style
    colors = ['#2563eb'] * len(values)
    ax.bar(labels, values, color=colors, width=0.6)

    # Typography
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    ax.set_xlabel('')
    ax.set_ylabel('Value', fontsize=10)

    # Clean up
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(axis='y', alpha=0.3)

    # Export
    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', facecolor='white')
    buffer.seek(0)
    plt.close()

    return base64.b64encode(buffer.read()).decode()

def create_line_chart(x: list, y: list, title: str) -> str:
    """Generate line chart, return as base64 PNG."""
    fig, ax = plt.subplots(figsize=(8, 5), dpi=150)

    ax.plot(x, y, color='#2563eb', linewidth=2, marker='o', markersize=6)
    ax.fill_between(x, y, alpha=0.1, color='#2563eb')

    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.grid(alpha=0.3)

    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', facecolor='white')
    buffer.seek(0)
    plt.close()

    return base64.b64encode(buffer.read()).decode()

def create_pie_chart(labels: list, values: list, title: str) -> str:
    """Generate pie chart, return as base64 PNG."""
    fig, ax = plt.subplots(figsize=(6, 6), dpi=150)

    colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe']
    ax.pie(
        values,
        labels=labels,
        colors=colors[:len(values)],
        autopct='%1.1f%%',
        startangle=90,
        wedgeprops={'linewidth': 2, 'edgecolor': 'white'}
    )
    ax.set_title(title, fontsize=14, fontweight='bold', pad=20)

    buffer = BytesIO()
    plt.savefig(buffer, format='png', bbox_inches='tight', facecolor='white')
    buffer.seek(0)
    plt.close()

    return base64.b64encode(buffer.read()).decode()
```

## Dashboard Layout

Combine multiple charts in a cohesive PDF dashboard.

```tsx
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const dashboardStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Inter",
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 20,
  },
  card: {
    width: "48%",
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    padding: 16,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: "#334155",
    marginBottom: 12,
  },
  metric: {
    fontSize: 32,
    fontWeight: 700,
    color: "#1e293b",
  },
  metricLabel: {
    fontSize: 10,
    color: "#64748b",
  },
  chartContainer: {
    marginTop: 20,
  },
});

interface DashboardProps {
  title: string;
  date: string;
  metrics: Array<{ label: string; value: string; change?: string }>;
  charts: Array<{ title: string; imageBase64: string }>;
}

const Dashboard = ({ title, date, metrics, charts }: DashboardProps) => (
  <Document>
    <Page size="LETTER" orientation="landscape" style={dashboardStyles.page}>
      {/* Header */}
      <View style={dashboardStyles.header}>
        <Text style={dashboardStyles.title}>{title}</Text>
        <Text style={dashboardStyles.subtitle}>Generated {date}</Text>
      </View>

      {/* Metrics Row */}
      <View style={dashboardStyles.grid}>
        {metrics.map((metric, i) => (
          <View key={i} style={dashboardStyles.card}>
            <Text style={dashboardStyles.metricLabel}>{metric.label}</Text>
            <Text style={dashboardStyles.metric}>{metric.value}</Text>
            {metric.change && (
              <Text
                style={{
                  fontSize: 10,
                  color: metric.change.startsWith("+") ? "#16a34a" : "#dc2626",
                }}
              >
                {metric.change} vs last period
              </Text>
            )}
          </View>
        ))}
      </View>

      {/* Charts */}
      <View style={dashboardStyles.chartContainer}>
        <View style={dashboardStyles.grid}>
          {charts.map((chart, i) => (
            <View key={i} style={{ ...dashboardStyles.card, width: "48%" }}>
              <Text style={dashboardStyles.cardTitle}>{chart.title}</Text>
              <Image
                src={`data:image/png;base64,${chart.imageBase64}`}
                style={{ width: "100%", height: 200 }}
              />
            </View>
          ))}
        </View>
      </View>
    </Page>
  </Document>
);
```

## Chart Design Best Practices

### Color Palette for Data

```typescript
const chartColors = {
  // Primary series
  primary: "#2563eb",

  // Sequential (for ordered data)
  sequential: ["#bfdbfe", "#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"],

  // Categorical (for distinct categories)
  categorical: ["#2563eb", "#16a34a", "#ea580c", "#9333ea", "#0891b2", "#be185d"],

  // Diverging (for positive/negative)
  diverging: {
    negative: "#dc2626",
    neutral: "#94a3b8",
    positive: "#16a34a",
  },
};
```

### Accessibility

```typescript
// Ensure sufficient contrast
const accessibleColors = {
  // These pass WCAG contrast on white background
  blue: "#1d4ed8",    // 4.5:1+
  green: "#15803d",   // 4.5:1+
  red: "#b91c1c",     // 4.5:1+
  orange: "#c2410c",  // 4.5:1+
  purple: "#7c3aed",  // 4.5:1+
};

// Use patterns in addition to color
// (for colorblind accessibility)
```

### Chart Type Selection

| Data Type | Recommended Chart |
|-----------|------------------|
| Comparison across categories | Bar chart |
| Trend over time | Line chart |
| Part-to-whole | Pie chart (≤5 slices) or stacked bar |
| Distribution | Histogram or box plot |
| Correlation | Scatter plot |
| Hierarchical | Treemap |

### Typography in Charts

```typescript
const chartTypography = {
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: "#1e293b",
  },
  axisLabel: {
    fontSize: 10,
    fontWeight: 500,
    color: "#64748b",
  },
  dataLabel: {
    fontSize: 9,
    fontWeight: 400,
    color: "#374151",
  },
  legend: {
    fontSize: 10,
    fontWeight: 400,
    color: "#4b5563",
  },
};
```

## Resolution for Print

```typescript
// Minimum resolutions for print
const printResolution = {
  standard: 150,  // DPI - acceptable for most uses
  quality: 300,   // DPI - professional print
  highQuality: 600, // DPI - fine detail, small text
};

// Chart.js canvas size for 300 DPI print at 4" x 3"
const canvasSize = {
  width: 4 * 300,  // 1200 pixels
  height: 3 * 300, // 900 pixels
};
```

## Resources

- [Chart.js Documentation](https://www.chartjs.org/docs/)
- [Matplotlib Gallery](https://matplotlib.org/stable/gallery/)
- [Data Visualization Best Practices](https://www.storytellingwithdata.com/)
- [Color Brewer](https://colorbrewer2.org/) - Color schemes for data
