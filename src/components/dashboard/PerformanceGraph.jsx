import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';
import './PerformanceGraph.css';

export default function PerformanceGraph({
    currentScore = 0,
    improvement = 0,
    weeklyData = []
}) {
    // Transform weekly data for the chart - use labels from API
    const chartData = weeklyData && weeklyData.length > 0
        ? weeklyData.map(w => ({
            name: w.week,
            score: w.score,
            interviews: w.interviews || 0
        }))
        : [
            { name: '3w ago', score: 0 },
            { name: '2w ago', score: 0 },
            { name: 'Last Week', score: 0 },
            { name: 'This Week', score: 0 },
        ];

    const isPositive = improvement >= 0;

    return (
        <div className="performance-graph glass-card">
            <div className="performance-graph__header">
                <div className="performance-graph__info">
                    <span className="performance-graph__label">Performance Score</span>
                    <div className="performance-graph__value-row">
                        <span className="performance-graph__value">{currentScore}</span>
                        <span className="performance-graph__unit">/100</span>
                    </div>
                </div>
                {improvement !== 0 && (
                    <div className={`performance-graph__badge ${!isPositive ? 'performance-graph__badge--negative' : ''}`}>
                        {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        <span>{isPositive ? '+' : ''}{improvement}%</span>
                    </div>
                )}
            </div>

            <div className="performance-graph__subtitle">
                <span>Score Trend (Last 4 Weeks)</span>
            </div>

            <div className="performance-graph__chart">
                <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#52c6c9" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#52c6c9" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 11 }}
                            interval={0}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12 }}
                            domain={[0, 100]}
                        />
                        <Tooltip
                            contentStyle={{
                                background: '#1a2129',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            formatter={(value, name, props) => {
                                const interviews = props.payload?.interviews || 0;
                                return [`${value}% (${interviews} interviews)`, 'Score'];
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#52c6c9"
                            strokeWidth={2}
                            fill="url(#scoreGradient)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {currentScore === 0 && (
                <p className="performance-graph__empty">
                    Complete interviews to see your progress!
                </p>
            )}
        </div>
    );
}
