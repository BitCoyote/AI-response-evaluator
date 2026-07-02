import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Check, Sparkles, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { evaluationApi, promptApi } from '../lib/api';
import { AI_MODELS, PROMPT_CATEGORIES } from '../types';
import { Button } from '../components/ui/Button';
import { Textarea, Select } from '../components/ui/Input';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { cn } from '../lib/utils';
import type { PromptOptimizeResult } from '../types';

export function EvaluatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { prompt?: string; systemPrompt?: string; category?: string } | null;
  const [prompt, setPrompt] = useState(state?.prompt || '');
  const [systemPrompt, setSystemPrompt] = useState(state?.systemPrompt || '');
  const [category, setCategory] = useState(state?.category || 'Custom');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [selectedModels, setSelectedModels] = useState<string[]>(['gpt-4', 'claude-3-5-sonnet', 'gemini-1.5-pro']);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeResult, setOptimizeResult] = useState<PromptOptimizeResult | null>(null);
  const [showOptimizer, setShowOptimizer] = useState(false);

  const toggleModel = (id: string) => {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    );
  };

  const handleEvaluate = async () => {
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return; }
    if (selectedModels.length === 0) { toast.error('Select at least one model'); return; }

    setLoading(true);
    try {
      const { data } = await evaluationApi.create({
        prompt, system_prompt: systemPrompt || undefined, category,
        temperature, max_tokens: maxTokens, models: selectedModels,
      });
      toast.success('Evaluation complete!');
      navigate(`/evaluation/${data.id}`);
    } catch {
      toast.error('Evaluation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!prompt.trim()) { toast.error('Enter a prompt to optimize'); return; }
    setOptimizing(true);
    try {
      const { data } = await promptApi.optimize({ prompt, system_prompt: systemPrompt || undefined, category });
      setOptimizeResult(data);
      setShowOptimizer(true);
      toast.success('Prompts optimized!');
    } catch {
      toast.error('Optimization failed');
    } finally {
      setOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Run Evaluation</h1>
        <p className="text-gray-500 mt-1">Compare AI model responses with automated scoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Prompt</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <Textarea
                label="Your Prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={8}
                placeholder="Enter the prompt you want to evaluate across AI models..."
              />
              <Textarea
                label="System Prompt (optional)"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={3}
                placeholder="You are a helpful assistant..."
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleOptimize} loading={optimizing}>
                  <Wand2 className="w-4 h-4" />
                  Optimize Prompt
                </Button>
              </div>
            </CardBody>
          </Card>

          {showOptimizer && optimizeResult && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary-600" />Prompt Optimizer</CardTitle></CardHeader>
              <CardBody className="space-y-4">
                {Object.entries(optimizeResult).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium capitalize text-gray-700 dark:text-gray-300">
                        {key.replace(/_/g, ' ')}
                      </h4>
                      <Button size="sm" variant="ghost" onClick={() => { setPrompt(value); toast.success('Applied!'); }}>
                        Use This
                      </Button>
                    </div>
                    <pre className="text-xs p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-40">
                      {value}
                    </pre>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Model Selection</CardTitle></CardHeader>
            <CardBody className="space-y-3">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg border transition-all',
                    selectedModels.includes(model.id)
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300',
                  )}
                >
                  <div className={cn(
                    'w-5 h-5 rounded flex items-center justify-center border-2 transition-colors',
                    selectedModels.includes(model.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300',
                  )}>
                    {selectedModels.includes(model.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{model.name}</p>
                    <p className="text-xs text-gray-500">{model.provider}</p>
                  </div>
                </button>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader><CardTitle>Parameters</CardTitle></CardHeader>
            <CardBody className="space-y-4">
              <Select
                label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={PROMPT_CATEGORIES.map((c) => ({ value: c, label: c }))}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {temperature}
                </label>
                <input
                  type="range" min="0" max="2" step="0.1" value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-primary-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Tokens: {maxTokens}
                </label>
                <input
                  type="range" min="64" max="4096" step="64" value={maxTokens}
                  onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  className="w-full accent-primary-600"
                />
              </div>
            </CardBody>
          </Card>

          <Button onClick={handleEvaluate} loading={loading} size="lg" className="w-full">
            <Sparkles className="w-5 h-5" />
            Run Evaluation
          </Button>
        </div>
      </div>
    </div>
  );
}
