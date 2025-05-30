import React from 'react';
import { CapturedData } from '../types/userProgress';

interface CapturedDataDisplayProps {
  data: CapturedData[];
  stepTitle: string;
}

export const CapturedDataDisplay: React.FC<CapturedDataDisplayProps> = ({ data, stepTitle }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 !mt-2">
      {/* <h4 className="text-sm font-medium text-green-800 mb-2">
        {stepTitle} - Captured Data
      </h4> */}
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-green-700 font-medium">
              {item.label}:
            </span>
            <span className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
