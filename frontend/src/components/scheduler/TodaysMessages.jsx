/**
 * Today's Messages Component
 * Shows SMS/email messages for today
 */

import React from 'react';

const TodaysMessages = () => {
  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-2">Dagens meldinger</h3>
      <p className="text-sm text-gray-600">
        Ingen meldinger i dag.
      </p>
    </div>
  );
};

export default TodaysMessages;
