import { ChartJSNodeCanvas } from 'chartjs-node-canvas';
import type { ChartConfiguration } from 'chart.js';

const WIDTH = 600;
const HEIGHT = 400;

const chartCanvas = new ChartJSNodeCanvas({
  width: WIDTH,
  height: HEIGHT,
  backgroundColour: '#ffffff',
});

/** Category → colour mapping for consistent visuals */
const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#FF6384',
  'Groceries': '#36A2EB',
  'Transport': '#FFCE56',
  'Travel': '#4BC0C0',
  'Shopping': '#9966FF',
  'Entertainment': '#FF9F40',
  'Housing': '#C9CBCF',
  'Utilities': '#7BC8A4',
  'Health': '#E7E9ED',
  'Education': '#8B5CF6',
  'Subscriptions': '#F97316',
  'Misc': '#94A3B8',
};

const DEFAULT_COLORS = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#C9CBCF', '#7BC8A4', '#E7E9ED', '#8B5CF6',
];

interface CategoryData {
  category: string;
  total: number;
  count: number;
}

/**
 * Generate a pie chart showing spending breakdown by category.
 * Returns a PNG buffer.
 */
export async function generatePieChart(
  categories: CategoryData[],
  periodLabel: string,
): Promise<Buffer> {
  const labels = categories.map(c => c.category);
  const data = categories.map(c => Math.round(c.total * 100) / 100);
  const colors = labels.map(
    (label, i) => CATEGORY_COLORS[label] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  );

  const config: ChartConfiguration = {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#ffffff',
      }],
    },
    options: {
      responsive: false,
      plugins: {
        title: {
          display: true,
          text: `Spending Breakdown — ${periodLabel}`,
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 10 },
        },
        legend: {
          position: 'right',
          labels: { font: { size: 12 }, padding: 8 },
        },
      },
    },
  };

  return chartCanvas.renderToBuffer(config);
}

/**
 * Generate a bar chart showing spending by category.
 * Returns a PNG buffer.
 */
export async function generateBarChart(
  categories: CategoryData[],
  periodLabel: string,
): Promise<Buffer> {
  const labels = categories.map(c => c.category);
  const data = categories.map(c => Math.round(c.total * 100) / 100);
  const colors = labels.map(
    (label, i) => CATEGORY_COLORS[label] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
  );

  const config: ChartConfiguration = {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending (€)',
        data,
        backgroundColor: colors,
        borderWidth: 1,
        borderColor: '#e2e8f0',
      }],
    },
    options: {
      responsive: false,
      indexAxis: 'y',
      plugins: {
        title: {
          display: true,
          text: `Spending by Category — ${periodLabel}`,
          font: { size: 16, weight: 'bold' },
          padding: { bottom: 10 },
        },
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { callback: (val) => `€${val}` },
          grid: { color: '#f1f5f9' },
        },
        y: {
          ticks: { font: { size: 12 } },
          grid: { display: false },
        },
      },
    },
  };

  return chartCanvas.renderToBuffer(config);
}
