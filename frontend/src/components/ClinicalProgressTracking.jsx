import React, { useState, useEffect } from 'react';

/**
 * Clinical Progress Tracking Component
 * Visual tracking of patient outcomes over time
 * Tracks pain levels, functional scores, ROM, and treatment response
 */
const ClinicalProgressTracking = ({ patientId, encountersData = [] }) => {
  const [chartData, setChartData] = useState({
    painScores: [],
    functionalScores: [],
    visitDates: []
  });

  useEffect(() => {
    if (encountersData.length > 0) {
      processEncounterData(encountersData);
    }
  }, [encountersData]);

  const processEncounterData = (encounters) => {
    // Extract pain scores and dates from encounters
    const sortedEncounters = [...encounters].sort((a, b) =>
      new Date(a.encounter_date) - new Date(b.encounter_date)
    );

    const painScores = sortedEncounters.map(e => ({
      date: new Date(e.encounter_date).toLocaleDateString(),
      start: e.vas_pain_start || 0,
      end: e.vas_pain_end || 0
    }));

    const visitDates = sortedEncounters.map(e =>
      new Date(e.encounter_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    setChartData({
      painScores,
      visitDates,
      encounters: sortedEncounters
    });
  };

  // Simple SVG line chart component
  const LineChart = ({ data, title, yAxisLabel, maxValue = 10 }) => {
    const width = 600;
    const height = 300;
    const padding = 50;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    if (!data || data.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          No data available
        </div>
      );
    }

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - (value / maxValue) * chartHeight;
      return { x, y, value };
    });

    const pathStart = points.map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ');

    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <svg width={width} height={height} className="line-chart">
          {/* Grid lines */}
          {[0, 2.5, 5, 7.5, 10].map(val => {
            const y = height - padding - (val / maxValue) * chartHeight;
            return (
              <g key={val}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#e0e0e0"
                  strokeDasharray="4"
                />
                <text
                  x={padding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="12"
                  fill="#666"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* X-axis labels */}
          {chartData.visitDates.map((label, i) => {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            return (
              <text
                key={i}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                fontSize="11"
                fill="#666"
              >
                {label}
              </text>
            );
          })}

          {/* Line path */}
          <path
            d={pathStart}
            fill="none"
            stroke="#2196F3"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              <circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="white"
                stroke="#2196F3"
                strokeWidth="3"
              />
              <circle
                cx={point.x}
                cy={point.y}
                r="2"
                fill="#2196F3"
              />
              {/* Tooltip */}
              <title>{`Visit ${i + 1}: ${point.value}`}</title>
            </g>
          ))}

          {/* Y-axis label */}
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            fontSize="13"
            fill="#333"
            transform={`rotate(-90, 20, ${height / 2})`}
            fontWeight="600"
          >
            {yAxisLabel}
          </text>
        </svg>
      </div>
    );
  };

  // Progress summary cards
  const ProgressCard = ({ title, value, change, icon, color }) => (
    <div className="progress-card" style={{ borderLeftColor: color }}>
      <div className="card-icon" style={{ color: color }}>{icon}</div>
      <div className="card-content">
        <div className="card-title">{title}</div>
        <div className="card-value" style={{ color: color }}>{value}</div>
        {change !== undefined && (
          <div className={`card-change ${change < 0 ? 'positive' : 'negative'}`}>
            {change < 0 ? '↓' : '↑'} {Math.abs(change)}
            {title.includes('Pain') ? ' pain reduction' : ' improvement'}
          </div>
        )}
      </div>
    </div>
  );

  // Calculate progress metrics
  const getProgressMetrics = () => {
    if (chartData.painScores.length === 0) {
      return {
        currentPain: 0,
        painChange: 0,
        totalVisits: 0,
        averagePainReduction: 0
      };
    }

    const firstVisit = chartData.painScores[0];
    const lastVisit = chartData.painScores[chartData.painScores.length - 1];

    const currentPain = lastVisit.end || lastVisit.start;
    const painChange = firstVisit.start - currentPain;
    const percentImprovement = firstVisit.start > 0
      ? Math.round((painChange / firstVisit.start) * 100)
      : 0;

    return {
      currentPain: currentPain.toFixed(1),
      painChange: painChange.toFixed(1),
      percentImprovement,
      totalVisits: chartData.painScores.length,
      initialPain: firstVisit.start
    };
  };

  const metrics = getProgressMetrics();

  // Timeline view
  const TimelineView = () => {
    if (!chartData.encounters || chartData.encounters.length === 0) {
      return null;
    }

    return (
      <div className="timeline-container">
        <h3 className="section-title">Treatment Timeline</h3>
        <div className="timeline">
          {chartData.encounters.map((encounter, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <div className="timeline-date">
                  {new Date(encounter.encounter_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="timeline-details">
                  <div className="timeline-type">{encounter.encounter_type || 'Follow-up'}</div>
                  <div className="timeline-pain">
                    Pain: {encounter.vas_pain_start}/10 → {encounter.vas_pain_end}/10
                  </div>
                  {encounter.chief_complaint && (
                    <div className="timeline-complaint">
                      "{encounter.chief_complaint.substring(0, 100)}..."
                    </div>
                  )}
                  {encounter.treatments && encounter.treatments.length > 0 && (
                    <div className="timeline-treatments">
                      Treatments: {encounter.treatments.map(t => t.type || t).join(', ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="clinical-progress">
      <style>
        {`
          .clinical-progress {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 20px;
            background: white;
            border-radius: 8px;
          }

          .progress-cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .progress-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-left: 4px solid;
            border-radius: 6px;
            padding: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }

          .card-icon {
            font-size: 36px;
          }

          .card-content {
            flex: 1;
          }

          .card-title {
            font-size: 13px;
            color: #666;
            margin-bottom: 5px;
            font-weight: 500;
          }

          .card-value {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 5px;
          }

          .card-change {
            font-size: 13px;
            font-weight: 600;
          }

          .card-change.positive {
            color: #4CAF50;
          }

          .card-change.negative {
            color: #F44336;
          }

          .chart-container {
            background: #FAFAFA;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 30px;
          }

          .chart-title {
            margin: 0 0 20px 0;
            color: #1976D2;
            font-size: 18px;
            font-weight: 600;
          }

          .line-chart {
            display: block;
            margin: 0 auto;
          }

          .section-title {
            color: #1976D2;
            font-size: 22px;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e0e0e0;
          }

          .timeline-container {
            margin-top: 40px;
          }

          .timeline {
            position: relative;
            padding-left: 30px;
          }

          .timeline::before {
            content: '';
            position: absolute;
            left: 9px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: #2196F3;
          }

          .timeline-item {
            position: relative;
            margin-bottom: 30px;
          }

          .timeline-marker {
            position: absolute;
            left: -26px;
            top: 5px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: white;
            border: 3px solid #2196F3;
            box-shadow: 0 0 0 4px white;
          }

          .timeline-content {
            background: #FAFAFA;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            padding: 15px;
          }

          .timeline-date {
            color: #2196F3;
            font-weight: 600;
            margin-bottom: 10px;
            font-size: 14px;
          }

          .timeline-details {
            color: #666;
            font-size: 14px;
          }

          .timeline-type {
            background: #E3F2FD;
            color: #1976D2;
            display: inline-block;
            padding: 4px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .timeline-pain {
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
          }

          .timeline-complaint {
            color: #555;
            font-style: italic;
            margin-bottom: 8px;
            line-height: 1.5;
          }

          .timeline-treatments {
            color: #666;
            font-size: 13px;
          }

          .improvement-indicator {
            background: linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
          }

          .improvement-indicator h3 {
            margin: 0 0 10px 0;
            font-size: 16px;
            opacity: 0.9;
          }

          .improvement-indicator .percentage {
            font-size: 48px;
            font-weight: 700;
            margin: 10px 0;
          }

          .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #999;
          }

          .no-data-icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
        `}
      </style>

      <h2 style={{ marginTop: 0, color: '#1976D2' }}>Patient Progress Tracking</h2>

      {chartData.painScores.length === 0 ? (
        <div className="no-data">
          <div className="no-data-icon">📊</div>
          <h3>No Progress Data Available</h3>
          <p>Progress tracking will appear here once patient encounters are recorded.</p>
        </div>
      ) : (
        <>
          {metrics.percentImprovement > 0 && (
            <div className="improvement-indicator">
              <h3>Overall Improvement</h3>
              <div className="percentage">{metrics.percentImprovement}%</div>
              <div>Pain reduction from {metrics.initialPain}/10 to {metrics.currentPain}/10</div>
            </div>
          )}

          <div className="progress-cards-grid">
            <ProgressCard
              title="Current Pain Level"
              value={`${metrics.currentPain}/10`}
              change={-parseFloat(metrics.painChange)}
              icon="🎯"
              color="#2196F3"
            />
            <ProgressCard
              title="Total Visits"
              value={metrics.totalVisits}
              icon="📅"
              color="#9C27B0"
            />
            <ProgressCard
              title="Pain Reduction"
              value={`${metrics.painChange} points`}
              icon={metrics.painChange > 0 ? "📉" : "📊"}
              color={metrics.painChange > 0 ? "#4CAF50" : "#FF9800"}
            />
            <ProgressCard
              title="Improvement"
              value={`${metrics.percentImprovement}%`}
              icon="✓"
              color="#4CAF50"
            />
          </div>

          <LineChart
            data={chartData.painScores.map(p => p.start)}
            title="Pain Levels Over Time (VAS)"
            yAxisLabel="Pain Score (0-10)"
            maxValue={10}
          />

          <TimelineView />
        </>
      )}
    </div>
  );
};

export default ClinicalProgressTracking;
