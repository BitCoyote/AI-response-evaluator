import { useEffect, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { evaluationApi } from '../lib/api';
import type { Analytics } from '../types';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Trophy, AlertTriangle, BarChart3, Layers } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#14b8a6'];

export function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluationApi.analytics()
      .then((res) => setAnalytics(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const modelScoreData = Object.entries(analytics.average_model_scores).map(([name, score]) => ({
    name: name.split(' ')[0], fullName: name, score,
  }));

  const categoryData = Object.entries(analytics.prompt_categories).map(([name, value]) => ({
    name, value,
  }));

  const modelUsageData = Object.entries(analytics.most_used_models).map(([name, count]) => ({
    name: name.split(' ')[0], fullName: name, count,
  }));

  const maxTrendLength = Math.max(
    0,
    ...Object.values(analytics.score_trends).map((scores) => scores.length),
  );
  const scoreTrendData = Array.from({ length: maxTrendLength }, (_, i) => {
    const point: Record<string, string | number> = { evaluation: i + 1 };
    for (const [model, scores] of Object.entries(analytics.score_trends)) {
      if (scores[i] !== undefined) {
        point[model.split(' ')[0]] = scores[i];
      }
    }
    return point;
  });
  const trendModels = Object.keys(analytics.score_trends);

  const statCards = [
    { label: 'Total Evaluations', value: analytics.total_evaluations, icon: BarChart3, color: 'text-primary-600' },
    { label: 'Most Accurate Model', value: analytics.most_accurate_model, icon: Trophy, color: 'text-amber-600' },
    { label: 'Avg Hallucination Rate', value: `${analytics.average_hallucination_rate}%`, icon: AlertTriangle, color: 'text-red-600' },
    { label: 'Categories Used', value: Object.keys(analytics.prompt_categories).length, icon: Layers, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-500 mt-1">Insights from your evaluation history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardBody className="flex items-center gap-3">
              <Icon className={`w-8 h-8 ${color}`} />
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Average Model Scores</CardTitle></CardHeader>
          <CardBody>
            {modelScoreData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={modelScoreData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No data yet</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Most Used Models</CardTitle></CardHeader>
          <CardBody>
            {modelUsageData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={modelUsageData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {modelUsageData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No data yet</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Prompt Categories</CardTitle></CardHeader>
          <CardBody>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No data yet</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader><CardTitle>Evaluations Over Time</CardTitle></CardHeader>
          <CardBody>
            {analytics.evaluations_over_time.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.evaluations_over_time}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No data yet</p>
            )}
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Score Trends by Model</CardTitle></CardHeader>
          <CardBody>
            {scoreTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                  <XAxis dataKey="evaluation" tick={{ fontSize: 12 }} label={{ value: 'Evaluation #', position: 'insideBottom', offset: -5 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  {trendModels.map((model, i) => (
                    <Line
                      key={model}
                      type="monotone"
                      dataKey={model.split(' ')[0]}
                      name={model}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 py-12">No score trends yet</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
