import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';

const WIDTH = 700;
const HEIGHT = 450;

const chartCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: '#1e1e2e',
});

/** Modern color palette — vibrant on dark background */
const CATEGORY_COLORS: Record<string, string> = {
  'housing-rent': '#f38ba8',
  'utilities-electricity': '#fab387',
  'utilities-internet': '#f9e2af',
  'childcare-kita': '#a6e3a1',
  'transport': '#94e2d5',
  'investments-scalable capital': '#89b4fa',
  'groceries': '#74c7ec',
  'eating out': '#b4befe',
  'subscriptions': '#cba6f7',
  'health': '#f2cdcd',
  'shopping': '#eba0ac',
  'travel': '#89dceb',
  'misc': '#9399b2',
};

const DEFAULT_COLORS = [
  '#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#94e2d5',
  '#89b4fa', '#74c7ec', '#cba6f7', '#f2cdcd', '#eba0ac',
  '#b4befe', '#89dceb', '#9399b2',
];

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

function getColor(label: string, index: number): string {
  const key = label.toLowerCase().trim();
  return CATEGORY_COLORS[key] || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
}

/**
 * Generate a doughnut chart showing spending breakdown by category.
 * Returns a PNG buffer.
 */
export async function generatePieChart(
  categories: CategoryData[],
  periodLabel: string,
): Promise<Buffer> {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const labels = sorted.map(c => `${c.category}  €${c.total.toFixed(0)}`);
  const data = sorted.map(c => Math.round(c.total * 100) / 100);
  const colors = sorted.map((c, i) => getColor(c.category, i));
  const total = data.reduce((sum, v) => sum + v, 0);

  const config: ChartConfiguration<'doughnut'> = {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 3,
        borderColor: '#1e1e2e',
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: false,
      cutout: '55%',
      plugins: {
        title: {
          display: true,
          text: [`Spending Breakdown`, `${periodLabel}  •  €${total.toFixed(2)} total`],
          font: { size: 16, weight: 'bold' },
          color: '#cdd6f4',
          padding: { bottom: 16 },
        },
        legend: {
          position: 'right',
          labels: {
            font: { size: 12 },
            padding: 12,
            color: '#bac2de',
            usePointStyle: true,
            pointStyleWidth: 12,
          },
        },
      },
    },
  };

  return chartCanvas.renderToBuffer(config);
}

/**
 * Generate a horizontal bar chart showing spending by category.
 * Returns a PNG buffer.
 */
export async function generateBarChart(
  categories: CategoryData[],
  periodLabel: string,
): Promise<Buffer> {
  const sorted = [...categories].sort((a, b) => b.total - a.total);
  const labels = sorted.map(c => c.category);
  const data = sorted.map(c => Math.round(c.total * 100) / 100);
  const colors = sorted.map((c, i) => getColor(c.category, i));
  const total = data.reduce((sum, v) => sum + v, 0);

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending (€)',
        data,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: [`Spending by Category`, `${periodLabel}  •  €${total.toFixed(2)} total`],
          font: { size: 16, weight: 'bold' },
          color: '#cdd6f4',
          padding: { bottom: 16 },
        },
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: {
            callback: (val) => `€${val}`,
            color: '#a6adc8',
            font: { size: 11 },
          },
          grid: { color: '#313244' },
          border: { color: '#45475a' },
        },
        y: {
          ticks: {
            font: { size: 12 },
            color: '#cdd6f4',
          },
          grid: { display: false },
          border: { display: false },
        },
      },
    },
  };

  return chartCanvas.renderToBuffer(config);
}
