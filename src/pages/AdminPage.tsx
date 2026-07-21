import { useState } from 'react';
import { useAdminUsers, useAdminUserDetails, useGlobalSettings, useUpdateGlobalSettings, useUpdateUserSettings } from '@/services/admin.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, User, MessageSquare, PieChart, Activity, Settings2, Save, Eye, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AVAILABLE_PROVIDERS = ['gemini', 'openai', 'groq', 'vertex', 'custom'];

// ── LLM model list grouped by provider ──────────────────────────────────────
const LLM_MODEL_GROUPS = [
  {
    group: 'OpenAI',
    models: [
      { value: 'gpt-4.1-nano',        label: 'GPT-4.1 Nano' },
      { value: 'gpt-4.1-mini',        label: 'GPT-4.1 Mini' },
      { value: 'openai/gpt-oss-20b',  label: 'GPT-OSS 20B' },
      { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B' },
      { value: 'gpt-4o',              label: 'GPT-4o' },
      { value: 'gpt-4o-mini',         label: 'GPT-4o Mini' },
      { value: 'gpt-4',               label: 'GPT-4' },
    ],
  },
  {
    group: 'OpenAI Embeddings',
    models: [
      { value: 'text-embedding-3-small', label: 'Text Embedding 3 Small' },
      { value: 'text-embedding-3-large', label: 'Text Embedding 3 Large' },
      { value: 'text-embedding-ada-002', label: 'Text Embedding Ada 002' },
    ],
  },
  {
    group: 'Google Gemini',
    models: [
      { value: 'gemini-2.5-pro',             label: 'Gemini 2.5 Pro' },
      { value: 'gemini-2.5-flash',           label: 'Gemini 2.5 Flash' },
      { value: 'gemini-3.5-flash',           label: 'Gemini 3.5 Flash' },
      { value: 'gemini-embedding-001',       label: 'Gemini Embedding 001' },
      { value: 'gemini-3-pro-image-preview', label: 'Gemini 3 Pro Image Preview' },
    ],
  },
  {
    group: 'Meta Llama',
    models: [
      { value: 'llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B' },
      { value: 'llama-3.3-70b-versatile',        label: 'Llama 3.3 70B Versatile' },
      { value: 'llama-3.1-8b-instant',           label: 'Llama 3.1 8B Instant' },
      { value: 'llama-guard-4-12b',              label: 'Llama Guard 4 12B' },
    ],
  },
  {
    group: 'Other',
    models: [
      { value: 'sarvam-m',           label: 'Sarvam M' },
      { value: 'groq/compound',      label: 'Groq Compound' },
      { value: 'groq/compound-mini', label: 'Groq Compound Mini' },
      { value: 'qwen/qwen3-32b',     label: 'Qwen3 32B' },
    ],
  },
];

// Shared model Select dropdown
function LlmModelSelect({ value, onChange, placeholder = 'Select a model', size = 'default' }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  size?: 'default' | 'sm';
}) {
  return (
    <Select value={value || ''} onValueChange={onChange}>
      <SelectTrigger
        className={`w-full bg-[#0d0d1a] border-[rgba(124,92,252,0.2)] text-[#f0efff] focus:ring-[#7c5cfc] ${
          size === 'sm' ? 'h-7 text-xs px-2' : 'h-9 text-sm px-3'
        }`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[#0d0d1a] border-[rgba(124,92,252,0.2)] text-[#f0efff] max-h-72 z-[9999]">
        {LLM_MODEL_GROUPS.map(({ group, models }) => (
          <SelectGroup key={group}>
            <SelectLabel className="text-[#4a4870] text-[10px] uppercase tracking-widest">{group}</SelectLabel>
            {models.map((m) => (
              <SelectItem
                key={m.value}
                value={m.value}
                className="text-[#f0efff] focus:bg-[rgba(124,92,252,0.2)] focus:text-[#f0efff] text-xs"
              >
                {m.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

function UserDetailsPanel({ userId, onBack }: { userId: number; onBack: () => void }) {
  const { data: details, isLoading } = useAdminUserDetails(userId);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-[#8b89b0] hover:text-[#f0efff]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div>
          <h2 className="text-xl font-bold text-[#f0efff]">User Details</h2>
          <p className="text-sm text-[#8b89b0]">
            {details ? `Viewing details for ${details.name} (${details.email})` : 'Loading...'}
          </p>
        </div>
      </div>

      {isLoading || !details ? (
        <div className="flex flex-1 items-center justify-center p-8 bg-[rgba(13,13,26,0.7)] border border-[rgba(124,92,252,0.15)] rounded-xl">
          <Activity className="w-8 h-8 text-[--violet-bright] animate-spin" />
        </div>
      ) : (
        <Card style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(124,92,252,0.15)' }} className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="expenses" className="flex flex-col flex-1 h-full min-h-[500px]">
            <div className="px-4 sm:px-6 pt-6 shrink-0">
              <TabsList className="flex w-full justify-start overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-3 bg-[rgba(124,92,252,0.1)] text-[#8b89b0]">
                <TabsTrigger value="expenses" className="data-[state=active]:bg-[#7c5cfc] data-[state=active]:text-white">Expenses</TabsTrigger>
                <TabsTrigger value="chats" className="data-[state=active]:bg-[#7c5cfc] data-[state=active]:text-white">Chat History</TabsTrigger>
                <TabsTrigger value="ai" className="data-[state=active]:bg-[#7c5cfc] data-[state=active]:text-white">AI / Tool Usage</TabsTrigger>
              </TabsList>
            </div>
            
            <div className="flex-1 overflow-hidden relative">
              <TabsContent value="expenses" className="absolute inset-0 overflow-y-auto px-4 sm:px-6 pb-6 pt-4 data-[state=inactive]:hidden">
                {details.expenses.length === 0 ? (
                  <div className="text-center text-[#8b89b0] py-8 text-sm">No expenses found</div>
                ) : (
                  <div className="space-y-3">
                    {details.expenses.map(exp => (
                      <div key={exp.id} className="bg-[rgba(124,92,252,0.05)] border border-[rgba(124,92,252,0.1)] rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-[#f0efff]">{exp.title}</div>
                          <div className="text-xs text-[#8b89b0]">{exp.category} • {exp.date}</div>
                        </div>
                        <div className="font-mono text-sm text-[#00ff87]">
                          {exp.currency} {exp.amount.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="chats" className="absolute inset-0 overflow-y-auto px-4 sm:px-6 pb-6 pt-4 data-[state=inactive]:hidden">
                {details.chatMessages.length === 0 ? (
                  <div className="text-center text-[#8b89b0] py-8 text-sm">No chats found</div>
                ) : (
                  <div className="space-y-4">
                    {details.chatMessages.map(chat => (
                      <div key={chat.id} className={`flex flex-col gap-1 max-w-[85%] ${chat.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`px-4 py-2 rounded-2xl text-sm ${chat.role === 'user' ? 'bg-[#7c5cfc] text-white rounded-tr-sm' : 'bg-[rgba(124,92,252,0.1)] border border-[rgba(124,92,252,0.2)] rounded-tl-sm text-[#f0efff]'}`}>
                          {chat.content}
                        </div>
                        <div className="text-[10px] text-[#4a4870] px-1">
                          {new Date(chat.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="ai" className="absolute inset-0 overflow-y-auto px-4 sm:px-6 pb-6 pt-4 data-[state=inactive]:hidden">
                {details.toolCallLogs.length === 0 ? (
                  <div className="text-center text-[#8b89b0] py-8 text-sm">No AI tool usage found</div>
                ) : (
                  <div className="space-y-3">
                    {details.toolCallLogs.map(log => (
                      <div key={log.id} className="bg-[rgba(124,92,252,0.05)] border border-[rgba(124,92,252,0.1)] rounded-xl p-3 flex flex-col gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-mono text-[#00d4ff] flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5" />
                            {log.toolName}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full ${log.success ? 'bg-[#00ff87]/20 text-[#00ff87]' : 'bg-[#ff3b5c]/20 text-[#ff3b5c]'}`}>
                              {log.success ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-[10px] text-[#4a4870]">
                              {log.durationMs ? `${log.durationMs}ms` : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-[#8b89b0]">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: globalSettings, isLoading: settingsLoading } = useGlobalSettings();
  const updateGlobal = useUpdateGlobalSettings();
  const updateUser = useUpdateUserSettings();

  const [globalProvider, setGlobalProvider] = useState<string>('');
  const [globalModel, setGlobalModel] = useState<string>('');
  const [userEdits, setUserEdits] = useState<Record<number, { llmProvider: string, llmModel: string }>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const [activeTab, setActiveTab] = useState<string>('users');

  // Sync state when data loads
  if (globalSettings && !globalProvider && !settingsLoading) {
    setGlobalProvider(globalSettings.llmProvider);
    setGlobalModel(globalSettings.llmModel || '');
  }

  const handleGlobalSave = () => {
    updateGlobal.mutate({ llmProvider: globalProvider, llmModel: globalModel });
  };

  const handleUserSave = (userId: number) => {
    const edit = userEdits[userId];
    if (!edit) return;
    
    updateUser.mutate({
      userId,
      data: {
        llmProvider: edit.llmProvider === 'default' ? null : edit.llmProvider,
        llmModel: edit.llmModel || null,
      }
    });
  };

  const handleViewDetails = (userId: number) => {
    setSelectedUserId(userId);
    setActiveTab('details');
  };

  if (usersLoading || settingsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Activity className="w-8 h-8 text-[--violet-bright] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#080810', overflow: 'hidden' }}>
      <div className="shrink-0 px-4 sm:px-8 py-5 border-b border-[rgba(124,92,252,0.1)] bg-[rgba(8,8,16,0.95)] backdrop-blur-xl z-10">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-[#ff3b5c]" />
          <h1 className="font-display text-2xl font-extrabold text-[#f0efff] tracking-tight">
            Admin Panel
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
          <TabsList className="flex w-full max-w-2xl justify-start overflow-x-auto scrollbar-hide sm:grid sm:grid-cols-3 bg-[rgba(124,92,252,0.1)] text-[#8b89b0] mb-6 shrink-0">
            <TabsTrigger value="users" className="data-[state=active]:bg-[#7c5cfc] data-[state=active]:text-white">Users & Usage</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#7c5cfc] data-[state=active]:text-white">Global Settings</TabsTrigger>
            <TabsTrigger value="details" disabled={!selectedUserId} className="data-[state=active]:bg-[#7c5cfc] data-[state=active]:text-white">User Details</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="mt-0">
            <Card style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(124,92,252,0.15)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#f0efff]">
                  <Settings2 className="w-5 h-5 text-[#00d4ff]" />
                  Global LLM Settings
                </CardTitle>
                <CardDescription className="text-[#8b89b0]">
                  These settings apply to all users unless they have a specific override.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#4a4870] uppercase mb-1">Provider</label>
                    <select
                      value={globalProvider}
                      onChange={(e) => setGlobalProvider(e.target.value)}
                      className="w-full bg-[#0d0d1a] border border-[rgba(124,92,252,0.2)] rounded-lg px-3 py-2 text-sm text-[#f0efff]"
                    >
                      {AVAILABLE_PROVIDERS.map(p => (
                        <option key={p} value={p}>{p.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  {globalProvider === 'custom' && (
                    <div>
                      <label className="block text-xs font-mono text-[#4a4870] uppercase mb-1">Model</label>
                      <LlmModelSelect
                        value={globalModel}
                        onChange={setGlobalModel}
                        placeholder="Select a model…"
                      />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleGlobalSave}
                  disabled={updateGlobal.isPending}
                  className="bg-[#7c5cfc] hover:bg-[#9d7fff] text-white"
                >
                  <Save className="w-4 h-4 mr-2" /> Save Global Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-0">
            <Card style={{ background: 'rgba(13,13,26,0.7)', border: '1px solid rgba(124,92,252,0.15)' }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#f0efff]">
                  <User className="w-5 h-5 text-[#ffb830]" />
                  Users & Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#f0efff]">
                    <thead className="bg-[rgba(124,92,252,0.08)] text-[#8b89b0] font-mono text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Joined</th>
                        <th className="px-4 py-3 text-center">Usage</th>
                        <th className="px-4 py-3 w-64">LLM Override</th>
                        <th className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(124,92,252,0.1)]">
                      {users?.map(user => {
                        const edit = userEdits[user.id] || { 
                          llmProvider: user.settings?.llmProvider || 'default', 
                          llmModel: user.settings?.llmModel || '' 
                        };
                        const hasChanges = userEdits[user.id] !== undefined;

                        return (
                          <tr key={user.id} className="hover:bg-[rgba(124,92,252,0.03)] transition-colors">
                            <td className="px-4 py-3">
                              <div className="font-semibold">{user.name}</div>
                              <div className="text-xs text-[#8b89b0]">{user.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${user.role === 'ADMIN' ? 'bg-[#ff3b5c]/20 text-[#ff3b5c]' : 'bg-[#00d4ff]/20 text-[#00d4ff]'}`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#8b89b0] text-xs">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-3 text-xs font-mono text-[#8b89b0]">
                                <div className="flex items-center gap-1" title="Expenses">
                                  <PieChart className="w-3.5 h-3.5 text-[#00ff87]" /> {user._count.expenses}
                                </div>
                                <div className="flex items-center gap-1" title="AI Messages">
                                  <MessageSquare className="w-3.5 h-3.5 text-[#7c5cfc]" /> {user._count.chatMessages}
                                </div>
                                <div className="flex items-center gap-1" title="Tool Calls">
                                  <Activity className="w-3.5 h-3.5 text-[#ffb830]" /> {user._count.toolCallLogs}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-2">
                                <select
                                  value={edit.llmProvider}
                                  onChange={(e) => setUserEdits(prev => ({ ...prev, [user.id]: { ...edit, llmProvider: e.target.value } }))}
                                  className="w-full bg-[#0d0d1a] border border-[rgba(124,92,252,0.2)] rounded px-2 py-1 text-xs"
                                >
                                  <option value="default">Global Default</option>
                                  {AVAILABLE_PROVIDERS.map(p => (
                                    <option key={p} value={p}>{p.toUpperCase()}</option>
                                  ))}
                                </select>
                                {edit.llmProvider !== 'default' && (
                                  <LlmModelSelect
                                    value={edit.llmModel}
                                    onChange={(v) => setUserEdits(prev => ({ ...prev, [user.id]: { ...edit, llmModel: v } }))}
                                    placeholder="Model override…"
                                    size="sm"
                                  />
                                )}
                                {hasChanges && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleUserSave(user.id)}
                                    disabled={updateUser.isPending}
                                    className="h-6 text-[10px] w-full"
                                  >
                                    Save User
                                  </Button>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(user.id)}
                                className="text-[#00d4ff] hover:text-[#00ff87] hover:bg-[rgba(0,212,255,0.1)]"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Details
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-0 flex-1 h-full">
            {selectedUserId ? (
              <UserDetailsPanel userId={selectedUserId} onBack={() => { setSelectedUserId(null); setActiveTab('users'); }} />
            ) : (
              <div className="flex h-full items-center justify-center text-[#8b89b0]">
                Select a user from the Users & Usage tab to view details.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}