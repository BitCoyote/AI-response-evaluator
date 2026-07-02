import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { evaluationApi } from '../lib/api';
import { formatDate } from '../lib/utils';
import type { EvaluationListItem } from '../types';
import { PROMPT_CATEGORIES } from '../types';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { TableSkeleton } from '../components/ui/Skeleton';

export function HistoryPage() {
  const [evaluations, setEvaluations] = useState<EvaluationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = () => {
    setLoading(true);
    evaluationApi.list({ search: search || undefined, category: category || undefined, sort_by: sortBy, sort_order: sortOrder })
      .then((res) => setEvaluations(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, category, sortBy, sortOrder]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this evaluation?')) return;
    try {
      await evaluationApi.delete(id);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluation History</h1>
        <p className="text-gray-500 mt-1">Browse, search, and manage past evaluations</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-10"
            placeholder="Search evaluations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[{ value: '', label: 'All Categories' }, ...PROMPT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          className="sm:w-48"
        />
        <Select
          value={`${sortBy}-${sortOrder}`}
          onChange={(e) => {
            const [by, order] = e.target.value.split('-');
            setSortBy(by);
            setSortOrder(order);
          }}
          options={[
            { value: 'created_at-desc', label: 'Newest First' },
            { value: 'created_at-asc', label: 'Oldest First' },
            { value: 'title-asc', label: 'Title A-Z' },
          ]}
          className="sm:w-48"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : evaluations.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">No evaluations found</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluations.map((ev) => (
            <Card key={ev.id} hover>
              <CardBody className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/evaluation/${ev.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate block">
                    {ev.title}
                  </Link>
                  <p className="text-sm text-gray-500 truncate mt-0.5">{ev.prompt}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="primary">{ev.category}</Badge>
                    {ev.models_used.map((m) => (
                      <Badge key={m}>{m}</Badge>
                    ))}
                    <span className="text-xs text-gray-400">{formatDate(ev.created_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(ev.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                  <Link to={`/evaluation/${ev.id}`}>
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
