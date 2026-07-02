import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Star, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { evaluationApi } from '../lib/api';
import { formatDate, downloadBlob } from '../lib/utils';
import type { Evaluation } from '../types';
import { SCORE_METRICS } from '../types';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { ScoreBar } from '../components/ui/ScoreBar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { HallucinationPanel } from '../components/evaluation/HallucinationPanel';

export function EvaluationPage() {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!id) return;
    evaluationApi.get(parseInt(id))
      .then((res) => setEvaluation(res.data))
      .catch(() => toast.error('Failed to load evaluation'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleExport = async (format: string) => {
    if (!evaluation) return;
    try {
      const { data } = await evaluationApi.export(evaluation.id, format);
      downloadBlob(data, `evaluation_${evaluation.id}.${format === 'markdown' ? 'md' : format}`);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!evaluation) {
    return <div className="text-center py-12 text-gray-500">Evaluation not found</div>;
  }

  const analysis = evaluation.analysis;
  const responses = evaluation.responses;
  const activeResponse = responses[activeTab];

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{evaluation.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="primary">{evaluation.category}</Badge>
            <span className="text-sm text-gray-500">{formatDate(evaluation.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {['json', 'markdown', 'csv', 'pdf'].map((fmt) => (
            <Button key={fmt} variant="secondary" size="sm" onClick={() => handleExport(fmt)}>
              <Download className="w-4 h-4" />
              {fmt.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Original Prompt</CardTitle></CardHeader>
        <CardBody>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{evaluation.prompt}</p>
          {evaluation.system_prompt && (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <p className="text-xs font-medium text-gray-500 mb-1">System Prompt</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{evaluation.system_prompt}</p>
            </div>
          )}
        </CardBody>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              AI Analysis
            </CardTitle>
          </CardHeader>
          <CardBody className="space-y-6">
            <p className="text-gray-700 dark:text-gray-300">{analysis.summary}</p>

            <div className="flex items-center gap-2 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                Best Response: {analysis.best_response}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Strengths</h4>
                <ul className="space-y-2">
                  {analysis.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5">+</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Weaknesses</h4>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">-</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold mb-3">Recommended Improvements</h4>
                <ul className="space-y-1">
                  {analysis.recommended_improvements.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-3">Prompt Optimization</h4>
                <ul className="space-y-1">
                  {analysis.prompt_optimization_suggestions.map((item, i) => (
                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {responses.map((resp, i) => (
          <button
            key={resp.id}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === i
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {resp.model_name}
            {resp.scores?.overall != null && (
              <span className="ml-2 opacity-75">({resp.scores.overall.toFixed(0)})</span>
            )}
          </button>
        ))}
      </div>

      {activeResponse && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{activeResponse.model_name}</CardTitle>
                <Badge>{activeResponse.latency_ms}ms</Badge>
              </div>
            </CardHeader>
            <CardBody>
              <div className="prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {activeResponse.content}
              </div>
            </CardBody>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Scores</CardTitle></CardHeader>
              <CardBody className="space-y-3">
                {SCORE_METRICS.map((metric) => (
                  activeResponse.scores && metric.key in activeResponse.scores && (
                    <ScoreBar
                      key={metric.key}
                      label={metric.label}
                      value={activeResponse.scores[metric.key as keyof typeof activeResponse.scores]}
                      invert={'invert' in metric ? metric.invert : false}
                    />
                  )
                ))}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><CardTitle>Hallucination Detection</CardTitle></CardHeader>
              <CardBody>
                <HallucinationPanel analysis={activeResponse.hallucination_analysis} />
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {responses.map((resp) => (
          <Card key={resp.id} hover>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{resp.model_name}</CardTitle>
                <span className="text-lg font-bold text-primary-600">
                  {resp.scores?.overall?.toFixed(1) ?? '—'}
                </span>
              </div>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4">{resp.content}</p>
              <div className="mt-3 space-y-1">
                {SCORE_METRICS.slice(0, 4).map(({ key, label }) => (
                  resp.scores && key in resp.scores && (
                    <ScoreBar
                      key={key}
                      label={label}
                      value={resp.scores[key as keyof typeof resp.scores]}
                    />
                  )
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
