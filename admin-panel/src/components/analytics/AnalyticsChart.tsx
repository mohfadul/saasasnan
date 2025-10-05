import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
    fill?: boolean;
    tension?: number;
  }[];
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie' | 'doughnut';
  data: ChartData;
  title?: string;
  height?: number;
  options?: any;
  className?: string;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  type,
  data,
  title,
  height = 300,
  options,
  className = '',
}) => {
  const chartRef = useRef<ChartJS>(null);

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        intersect: false,
        mode: 'index' as const,
      },
    },
    scales: type !== 'pie' && type !== 'doughnut' ? {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
    } : undefined,
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 4,
        hoverRadius: 6,
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const mergedOptions = {
    ...defaultOptions,
    ...options,
  };

  const renderChart = () => {
    const chartProps = {
      ref: chartRef,
      data,
      options: mergedOptions,
    };

    switch (type) {
      case 'line':
        return <Line {...chartProps} />;
      case 'bar':
        return <Bar {...chartProps} />;
      case 'pie':
        return <Pie {...chartProps} />;
      case 'doughnut':
        return <Doughnut {...chartProps} />;
      default:
        return <Line {...chartProps} />;
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {title}
          </h3>
        )}
        <div style={{ height: `${height}px` }}>
          {renderChart()}
        </div>
      </div>
    </div>
  );
};

// Predefined color palettes
export const chartColors = {
  primary: [
    '#3B82F6', // blue-500
    '#10B981', // emerald-500
    '#F59E0B', // amber-500
    '#EF4444', // red-500
    '#8B5CF6', // violet-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F97316', // orange-500
  ],
  pastel: [
    '#DBEAFE', // blue-100
    '#D1FAE5', // emerald-100
    '#FEF3C7', // amber-100
    '#FEE2E2', // red-100
    '#EDE9FE', // violet-100
    '#CFFAFE', // cyan-100
    '#ECFCCB', // lime-100
    '#FED7AA', // orange-100
  ],
  gradient: [
    'rgba(59, 130, 246, 0.8)', // blue-500 with opacity
    'rgba(16, 185, 129, 0.8)', // emerald-500 with opacity
    'rgba(245, 158, 11, 0.8)', // amber-500 with opacity
    'rgba(239, 68, 68, 0.8)', // red-500 with opacity
    'rgba(139, 92, 246, 0.8)', // violet-500 with opacity
    'rgba(6, 182, 212, 0.8)', // cyan-500 with opacity
    'rgba(132, 204, 22, 0.8)', // lime-500 with opacity
    'rgba(249, 115, 22, 0.8)', // orange-500 with opacity
  ],
};

// Helper functions for common chart data transformations
export const transformTimeSeriesData = (
  data: Array<{ period: string; total: number; completed?: number }>,
  colors: string[] = chartColors.primary
): ChartData => {
  return {
    labels: data.map(item => {
      const date = new Date(item.period);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Total',
        data: data.map(item => item.total),
        borderColor: colors[0],
        backgroundColor: colors[0] + '20',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
      ...(data[0]?.completed !== undefined ? [{
        label: 'Completed',
        data: data.map(item => item.completed || 0),
        borderColor: colors[1],
        backgroundColor: colors[1] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
      }] : []),
    ],
  };
};

export const transformRevenueData = (
  data: Array<{ period: string; total_revenue: number }>,
  colors: string[] = chartColors.primary
): ChartData => {
  return {
    labels: data.map(item => {
      const date = new Date(item.period);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.total_revenue),
        backgroundColor: colors[0],
        borderColor: colors[0],
        borderWidth: 1,
      },
    ],
  };
};

export const transformPieData = (
  data: Array<{ label: string; value: number }>,
  colors: string[] = chartColors.primary
): ChartData => {
  return {
    labels: data.map(item => item.label),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: colors.slice(0, data.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };
};

export default AnalyticsChart;
