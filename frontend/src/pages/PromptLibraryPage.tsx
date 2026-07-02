import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Pencil, Plus, Search, Trash2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { promptApi } from '../lib/api';
import type { PromptLibraryItem } from '../types';
import { PROMPT_CATEGORIES } from '../types';
import { Card, CardBody } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { TableSkeleton } from '../components/ui/Skeleton';

export function PromptLibraryPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<PromptLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', prompt: '', system_prompt: '', category: 'Custom', tags: '' });

  const resetForm = () => {
    setForm({ title: '', prompt: '', system_prompt: '', category: 'Custom', tags: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (item: PromptLibraryItem) => {
    setForm({
      title: item.title,
      prompt: item.prompt,
      system_prompt: item.system_prompt || '',
      category: item.category,
      tags: item.tags.join(', '),
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const fetchPrompts = () => {
    setLoading(true);
    promptApi.list({ search: search || undefined, category: category || undefined })
      .then((res) => setPrompts(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPrompts(); }, [search, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      system_prompt: form.system_prompt || undefined,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()) : [],
    };
    try {
      if (editingId) {
        await promptApi.update(editingId, payload);
        toast.success('Prompt updated!');
      } else {
        await promptApi.create(payload);
        toast.success('Prompt saved!');
      }
      resetForm();
      fetchPrompts();
    } catch {
      toast.error(editingId ? 'Failed to update prompt' : 'Failed to save prompt');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this prompt?')) return;
    try {
      await promptApi.delete(id);
      toast.success('Deleted');
      fetchPrompts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const usePrompt = (item: PromptLibraryItem) => {
    navigate('/evaluate', { state: { prompt: item.prompt, systemPrompt: item.system_prompt, category: item.category } });
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prompt Library</h1>
          <p className="text-gray-500 mt-1">Save and reuse your best prompts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4" />
          New Prompt
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {editingId ? 'Edit Prompt' : 'New Prompt'}
              </p>
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Textarea label="Prompt" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} rows={4} required />
              <Textarea label="System Prompt" value={form.system_prompt} onChange={(e) => setForm({ ...form, system_prompt: e.target.value })} rows={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} options={PROMPT_CATEGORIES.map((c) => ({ value: c, label: c }))} />
                <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="ai, coding" />
              </div>
              <div className="flex gap-3">
                <Button type="submit">{editingId ? 'Update Prompt' : 'Save Prompt'}</Button>
                <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input className="pl-10" placeholder="Search prompts..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          options={[{ value: '', label: 'All Categories' }, ...PROMPT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          className="sm:w-48"
        />
      </div>

      {loading ? (
        <TableSkeleton />
      ) : prompts.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No prompts saved yet</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prompts.map((item) => (
            <Card key={item.id} hover>
              <CardBody>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    <Badge variant="primary" className="mt-2">{item.category}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(item)}>
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 line-clamp-3">{item.prompt}</p>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                  </div>
                )}
                <Button variant="secondary" size="sm" className="mt-4" onClick={() => usePrompt(item)}>
                  <Zap className="w-4 h-4" />
                  Use in Evaluation
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
