import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BookOpen, Zap } from 'lucide-react';
import { evaluationApi } from '../lib/api';
import { formatDate } from '../lib/utils';
import type { DashboardStats } from '../types';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CardSkeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluationApi.dashboard()
      .then((res) => setStats(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Evaluations', value: stats?.total_evaluations ?? 0, icon: Zap, color: 'text-primary-600' },
    { label: 'Saved Prompts', value: stats?.total_prompts ?? 0, icon: BookOpen, color: 'text-purple-600' },
    { label: 'Avg Overall Score', value: `${stats?.avg_overall_score ?? 0}%`, icon: BarChart3, color: 'text-emerald-600' },
  ];

  return (
    <div className="space-y-8 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of your AI evaluation activity</p>
        </div>
        <Link to="/evaluate">
          <Button size="lg">
            <Zap className="w-4 h-4" />
            New Evaluation
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} hover>
            <CardBody className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-gray-50 dark:bg-gray-800 ${color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Evaluations</CardTitle>
        </CardHeader>
        <CardBody>
          {stats?.recent_evaluations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No evaluations yet</p>
              <Link to="/evaluate"><Button>Run Your First Evaluation</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recent_evaluations.map((ev) => (
                <Link
                  key={ev.id}
                  to={`/evaluation/${ev.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{ev.title}</p>
                    <p className="text-sm text-gray-500 truncate">{ev.prompt}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <Badge variant="primary">{ev.category}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(ev.created_at)}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
