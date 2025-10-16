import React from 'react';

interface ChartProps {
  type: 'pie' | 'line' | 'bar';
  data: {
    labels: string[];
    datasets: any[];
  };
}

const Chart: React.FC<ChartProps> = ({ type, data }) => {
  if (type === 'pie') {
    return (
      <div className="flex flex-col items-center">
        <div className="w-48 h-48 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-orange-500 flex items-center justify-center">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">Status Distribution</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.labels.map((label, index) => (
            <div key={label} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: data.datasets[0].backgroundColor[index] }}
              ></div>
              <span className="text-sm text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    return (
      <div className="h-64 flex items-end justify-between p-4 bg-gray-50 rounded-lg">
        {data.datasets[0].data.map((value: number, index: number) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className="bg-blue-500 rounded-t-sm"
              style={{
                height: `${(value / Math.max(...data.datasets[0].data)) * 200}px`,
                width: '20px'
              }}
            ></div>
            <span className="text-xs text-gray-600 mt-2">{data.labels[index]}</span>
          </div>
        ))}
      </div>
    );
  }

  return <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-500">Chart Placeholder</div>;
};

export default Chart;
