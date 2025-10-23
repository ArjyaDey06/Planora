import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
        font: {
          size: 13,
          family: '"Inter", sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleFont: {
        size: 14,
        weight: '500',
        family: '"Inter", sans-serif'
      },
      bodyFont: {
        size: 13,
        family: '"Inter", sans-serif'
      },
      padding: 12,
      displayColors: true,
      usePointStyle: true,
      callbacks: {
        label: function(context) {
          let label = context.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed !== null) {
            label += new Intl.NumberFormat('en-IN', { 
              style: 'currency', 
              currency: 'INR',
              maximumFractionDigits: 0 
            }).format(context.parsed);
          }
          return label;
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          family: '"Inter", sans-serif'
        },
        callback: function(value) {
          return new Intl.NumberFormat('en-IN', { 
            style: 'currency', 
            currency: 'INR',
            maximumFractionDigits: 0,
            notation: 'compact',
            compactDisplay: 'short'
          }).format(value);
        }
      }
    },
    x: {
      grid: {
        display: false
      },
      ticks: {
        font: {
          family: '"Inter", sans-serif'
        }
      }
    }
  }
};

export const pieChartOptions = {
  ...chartOptions,
  cutout: '65%',
  plugins: {
    ...chartOptions.plugins,
    legend: {
      ...chartOptions.plugins.legend,
      position: 'right'
    }
  }
};

export const barChartOptions = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    legend: {
      display: false
    }
  },
  scales: {
    ...chartOptions.scales,
    x: {
      ...chartOptions.scales.x,
      grid: {
        display: false
      }
    }
  }
};
