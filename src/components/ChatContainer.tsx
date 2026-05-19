import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { StreamMessage } from '@/types/StreamMessage.types';
import { ChatInput } from './ChatInput';
import { ChatMessage } from './ChatMessage';
import {
  Cpu,
  BarChart2,
  PlusCircle,
  TrendingUp,
  Target,
  Trash2,
  Zap,
  MessageSquarePlus,
  History,
  Download,
  ChevronLeft,
  X,
} from 'lucide-react';
import { streamChat, chatApi } from '@/api/chat.api';
import type { ThreadSummary } from '@/api/chat.api';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const SUGGESTIONS = [
  { icon: BarChart2, text: 'Show my spending this month as a chart', color: '#7c5cfc' },
  { icon: PlusCircle, text: 'Add expense: Coffee ₹180', color: '#00d4ff' },
  { icon: TrendingUp, text: 'What did I spend last week?', color: '#00ff87' },
  { icon: Target, text: 'How can I reduce dining costs?', color: '#ffb830' },
];

function generateThreadId() {
  return `t-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function deriveTitle(preview: string): string {
  if (!preview) return 'New Chat';
  return preview.length > 40 ? preview.slice(0, 40) + '…' : preview;
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

// ─── Export chat as Markdown ──────────────────────────────────────────────────
function exportAsMarkdown(messages: StreamMessage[]) {
  const lines: string[] = ['# Chat Export', '', `*Exported ${new Date().toLocaleString()}*`, ''];
  for (const msg of messages) {
    if (msg.type === 'user') {
      lines.push(`**You:** ${msg.payload.text}`, '');
    } else if (msg.type === 'ai') {
      lines.push(`**AI:** ${msg.payload.text}`, '');
    }
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spendly-chat-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Thread Sidebar ───────────────────────────────────────────────────────────
function ThreadSidebar({
  threads,
  activeThreadId,
  onSelect,
  onNew,
  onClose,
  visible,
}: {
  threads: ThreadSummary[];
  activeThreadId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
  visible: boolean;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {visible && (
        <div
          className='fixed inset-0 bg-black/60 z-40 md:hidden'
          onClick={onClose}
        />
      )}
      <div
        className={`
          fixed md:relative top-0 left-0 h-full z-50 md:z-auto
          flex flex-col shrink-0 transition-all duration-300 ease-in-out
          ${visible ? 'translate-x-0 w-[280px]' : '-translate-x-full md:translate-x-0 w-0 md:w-0'}
        `}
        style={{
          background: 'rgba(8,8,16,0.98)',
          borderRight: visible ? '1px solid rgba(124,92,252,0.12)' : 'none',
          overflow: 'hidden',
        }}
      >
        {/* Sidebar header */}
        <div className='flex items-center justify-between px-4 py-4 shrink-0'
          style={{ borderBottom: '1px solid rgba(124,92,252,0.1)' }}>
          <span className='font-display text-sm font-bold text-[#f0efff]'>Threads</span>
          <div className='flex items-center gap-1'>
            <Button variant='ghost' size='icon'
              onClick={onNew}
              className='w-8 h-8 text-[#9d7fff] hover:bg-[rgba(124,92,252,0.1)]'
              title='New thread'>
              <MessageSquarePlus className='w-4 h-4' />
            </Button>
            <Button variant='ghost' size='icon'
              onClick={onClose}
              className='w-8 h-8 text-[#4a4870] hover:bg-[rgba(124,92,252,0.1)] md:hidden'>
              <X className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Thread list */}
        <div className='flex-1 overflow-y-auto px-2 py-2 space-y-1'>
          {threads.length === 0 && (
            <div className='text-center py-10'>
              <History className='w-8 h-8 text-[#4a4870] mx-auto mb-3 opacity-50' />
              <p className='font-mono text-[10px] text-[#4a4870]'>No conversations yet</p>
            </div>
          )}
          {threads.map((t) => {
            const isActive = t.threadId === activeThreadId;
            return (
              <button
                key={t.threadId}
                onClick={() => { onSelect(t.threadId); onClose(); }}
                className='w-full text-left px-3 py-2.5 rounded-xl transition-all group'
                style={{
                  background: isActive ? 'rgba(124,92,252,0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(124,92,252,0.25)' : 'transparent'}`,
                }}
              >
                <p className={`font-sans text-[13px] truncate ${isActive ? 'text-[#f0efff] font-semibold' : 'text-[#8b89b0] group-hover:text-[#d4d2f0]'}`}>
                  {deriveTitle(t.preview)}
                </p>
                <div className='flex items-center gap-2 mt-1'>
                  <span className='font-mono text-[9px] text-[#4a4870]'>
                    {t.messageCount} msgs
                  </span>
                  <span className='font-mono text-[9px] text-[#4a4870]'>
                    {formatRelative(t.lastMessageAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ─── Main ChatContainer ───────────────────────────────────────────────────────
export function ChatContainer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deepLinkQuery = searchParams.get('q');

  const [threadId, setThreadId] = useState(() => generateThreadId());
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messageEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [reactions, setReactions] = useState<Record<string, 'up' | 'down'>>({});
  const cancelRef = useRef<(() => void) | null>(null);

  // Load threads on mount
  useEffect(() => {
    chatApi.listThreads().then((res) => {
      if (res.success && res.data) setThreads(res.data);
    }).catch(() => {});
  }, []);

  // Scroll on new messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => { cancelRef.current?.(); };
  }, []);

  // Handle deep-link query param
  useEffect(() => {
    if (deepLinkQuery) {
      setSearchParams({}, { replace: true });
      // Small delay to let the component mount
      setTimeout(() => handleSubmit(deepLinkQuery), 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshThreads = useCallback(() => {
    chatApi.listThreads().then((res) => {
      if (res.success && res.data) setThreads(res.data);
    }).catch(() => {});
  }, []);

  const addMessage = (msg: Omit<StreamMessage, 'id'>) => {
    const id = `${threadId}-${crypto.randomUUID()}`;
    setMessages((prev) => [...prev, { ...msg, id } as StreamMessage]);
  };

  const handleNewThread = () => {
    const newId = generateThreadId();
    setThreadId(newId);
    setMessages([]);
    setReactions({});
  };

  const handleSelectThread = async (id: string) => {
    setThreadId(id);
    setMessages([]);
    setReactions({});
    // Load history for this thread
    try {
      const res = await chatApi.getHistory(id, 100);
      if (res.success && Array.isArray(res.data)) {
        const loaded: StreamMessage[] = res.data.map((m: { id: number; role: string; content: string }) => ({
          id: `hist-${m.id}`,
          type: m.role === 'user' ? 'user' as const : 'ai' as const,
          payload: { text: m.content },
        }));
        setMessages(loaded);
      }
    } catch { /* ignore */ }
  };

  const handleClearHistory = async () => {
    await chatApi.deleteHistory(threadId);
    setMessages([]);
    setReactions({});
    setShowClearConfirm(false);
    refreshThreads();
  };

  const handleReaction = (msgId: string, type: 'up' | 'down') => {
    setReactions((prev) => {
      const current = prev[msgId];
      if (current === type) {
        const next = { ...prev };
        delete next[msgId];
        return next;
      }
      return { ...prev, [msgId]: type };
    });
  };

  const handleSubmit = (userInput: string) => {
    if (!userInput.trim() || isStreaming) return;
    addMessage({ type: 'user', payload: { text: userInput } });
    setIsStreaming(true);

    let currentAiId: string | null = null;

    cancelRef.current = streamChat(userInput, threadId, {
      onMessage: (msg) => {
        if (msg.type === 'ai') {
          if (currentAiId === null) {
            const id = `${Date.now()}-${Math.random()}`;
            currentAiId = id;
            setMessages((prev) => [
              ...prev,
              { id, type: 'ai', payload: { text: msg.payload.text } } as StreamMessage,
            ]);
          } else {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentAiId && m.type === 'ai'
                  ? { ...m, payload: { text: m.payload.text + msg.payload.text } }
                  : m,
              ),
            );
          }
        } else {
          currentAiId = null;
          addMessage(msg as Omit<StreamMessage, 'id'>);
        }
      },
      onError: (err) => {
        console.error('Stream error:', err);
        addMessage({
          type: 'ai',
          payload: { text: 'Sorry, something went wrong. Please try again.' },
        });
        setIsStreaming(false);
      },
      onDone: () => {
        setIsStreaming(false);
        refreshThreads();
      },
    });
  };

  return (
    <div className='flex h-full overflow-hidden' style={{ background: '#080810' }}>
      {/* Thread Sidebar */}
      <ThreadSidebar
        threads={threads}
        activeThreadId={threadId}
        onSelect={handleSelectThread}
        onNew={handleNewThread}
        onClose={() => setSidebarOpen(false)}
        visible={sidebarOpen}
      />

      {/* Main Chat Area */}
      <div className='flex flex-col flex-1 h-full overflow-hidden'>
        {/* Header */}
        <div
          className='shrink-0 px-3 sm:px-6 py-3 sm:py-4'
          style={{
            borderBottom: '1px solid rgba(124,92,252,0.1)',
            background: 'rgba(8,8,16,0.95)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div className='max-w-[760px] mx-auto flex items-center justify-between'>
            <div className='flex items-center gap-2 sm:gap-3.5'>
              {/* Thread sidebar toggle */}
              <Button variant='ghost' size='icon'
                onClick={() => setSidebarOpen((v) => !v)}
                className='w-8 h-8 sm:w-9 sm:h-9 rounded-lg text-[#4a4870] hover:text-[#9d7fff] hover:bg-[rgba(124,92,252,0.1)] border border-transparent hover:border-[rgba(124,92,252,0.2)]'
                title='Thread history'>
                {sidebarOpen ? <ChevronLeft className='w-4 h-4' /> : <History className='w-4 h-4' />}
              </Button>

              <div
                className='w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center'
                style={{
                  background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(0,212,255,0.2))',
                  border: '1px solid rgba(124,92,252,0.3)',
                  boxShadow: '0 0 20px rgba(124,92,252,0.2)',
                }}
              >
                <Cpu className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9d7fff]' />
              </div>
              <div>
                <div className='font-display text-sm sm:text-base font-bold text-[#f0efff]'>
                  Finance Assistant
                </div>
                <div className='font-mono text-[9px] text-[#4a4870] tracking-widest uppercase hidden sm:block'>
                  AI-Powered Insights
                </div>
              </div>
            </div>

            <div className='flex items-center gap-1.5 sm:gap-2'>
              {/* Export button */}
              {messages.length > 0 && !isStreaming && (
                <Button variant='ghost' size='icon'
                  onClick={() => exportAsMarkdown(messages)}
                  className='w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-lg hover:bg-[rgba(124,92,252,0.1)] hover:border-[rgba(124,92,252,0.2)] text-[#4a4870] hover:text-[#9d7fff] border border-transparent transition-all'
                  title='Export as Markdown'>
                  <Download className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                </Button>
              )}

              {/* New thread */}
              <Button variant='ghost' size='icon'
                onClick={handleNewThread}
                className='w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-lg hover:bg-[rgba(124,92,252,0.1)] hover:border-[rgba(124,92,252,0.2)] text-[#4a4870] hover:text-[#9d7fff] border border-transparent transition-all'
                title='New conversation'>
                <MessageSquarePlus className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
              </Button>

              {/* Clear thread */}
              {messages.length > 0 && !isStreaming && (
                <Button variant='ghost' size='icon'
                  onClick={() => setShowClearConfirm(true)}
                  className='w-8 h-8 sm:w-[34px] sm:h-[34px] rounded-lg hover:bg-[rgba(255,59,92,0.1)] hover:border-[rgba(255,59,92,0.2)] hover:text-[#ff3b5c] text-[#4a4870] border border-transparent transition-all'>
                  <Trash2 className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                </Button>
              )}

              {/* Status indicator */}
              {isStreaming ? (
                <div className='flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full'
                  style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.25)' }}>
                  {[0, 150, 300].map((delay) => (
                    <div key={delay} className='w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full'
                      style={{ background: '#9d7fff', animation: `bounce 1s ${delay}ms ease-in-out infinite` }} />
                  ))}
                  <span className='font-mono text-[9px] sm:text-[10px] text-[#9d7fff] ml-0.5'>Thinking</span>
                </div>
              ) : (
                <div className='flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full'
                  style={{ background: 'rgba(0,255,135,0.07)', border: '1px solid rgba(0,255,135,0.2)' }}>
                  <div className='w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full'
                    style={{ background: '#00ff87', boxShadow: '0 0 6px #00ff87' }} />
                  <span className='font-mono text-[9px] sm:text-[10px] text-[#00ff87]'>Ready</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clear confirm modal */}
        <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
          <AlertDialogContent className='border-[rgba(255,59,92,0.3)] max-w-[90vw] sm:max-w-md'
            style={{ background: '#0d0d1a', boxShadow: '0 0 60px rgba(255,59,92,0.1)' }}>
            <AlertDialogHeader>
              <AlertDialogTitle className='font-display text-[#f0efff]'>Clear conversation?</AlertDialogTitle>
              <AlertDialogDescription className='text-[#8b89b0]'>
                All messages in this thread will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className='border-[rgba(255,255,255,0.1)] text-[#8b89b0]'
                style={{ background: 'rgba(255,255,255,0.05)' }}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClearHistory}
                className='border-[rgba(255,59,92,0.3)] text-[#ff3b5c] font-display font-semibold'
                style={{ background: 'rgba(255,59,92,0.15)' }}>Delete All</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Messages */}
        <div className='flex-1 min-h-0 overflow-y-auto'>
          <div className='max-w-[760px] mx-auto'>
            {messages.length === 0 ? (
              <div className='flex flex-col items-center justify-center min-h-[60vh] px-4 py-8 text-center'>
                <div className='w-14 h-14 sm:w-[72px] sm:h-[72px] rounded-2xl flex items-center justify-center mb-5 sm:mb-6'
                  style={{ background: 'linear-gradient(135deg, #7c5cfc, #00d4ff)', boxShadow: '0 0 40px rgba(124,92,252,0.4)' }}>
                  <Zap className='w-7 h-7 sm:w-8 sm:h-8 text-white' strokeWidth={2} />
                </div>
                <h2 className='font-display text-2xl sm:text-3xl font-extrabold text-[#f0efff] tracking-tight mb-2 sm:mb-3'>
                  What can I help with?
                </h2>
                <p className='text-[#4a4870] text-sm sm:text-base max-w-sm leading-relaxed mb-8 sm:mb-10'>
                  Ask about spending, add expenses, get charts, or get personalized financial advice.
                </p>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 w-full max-w-[520px]'>
                  {SUGGESTIONS.map(({ icon: Icon, text, color }) => (
                    <button key={text} onClick={() => handleSubmit(text)}
                      className='flex items-start gap-3 p-3 sm:p-4 rounded-2xl text-left transition-all text-[#8b89b0] hover:text-[#f0efff] font-sans text-sm leading-relaxed'
                      style={{ background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(124,92,252,0.12)' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                        (e.currentTarget as HTMLElement).style.background = `${color}08`;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,92,252,0.12)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(13,13,26,0.8)';
                      }}>
                      <Icon className='w-4 h-4 shrink-0 mt-0.5' style={{ color }} />
                      <span>{text}</span>
                    </button>
                  ))}
                </div>

                {/* Show thread count hint */}
                {threads.length > 0 && (
                  <button onClick={() => setSidebarOpen(true)}
                    className='mt-8 flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[#4a4870] hover:text-[#9d7fff]'
                    style={{ background: 'rgba(124,92,252,0.06)', border: '1px solid rgba(124,92,252,0.12)' }}>
                    <History className='w-3.5 h-3.5' />
                    <span className='font-mono text-[11px]'>{threads.length} past conversation{threads.length !== 1 ? 's' : ''}</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg}
                    reaction={reactions[msg.id]}
                    onReaction={msg.type === 'ai' ? (type) => handleReaction(msg.id, type) : undefined}
                  />
                ))}
                {isStreaming && (
                  <div className='flex gap-3 sm:gap-3.5 px-3 sm:px-6 py-4 sm:py-5'>
                    <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0'
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,92,252,0.3), rgba(0,212,255,0.2))',
                        border: '1px solid rgba(124,92,252,0.3)',
                      }}>
                      <Cpu className='w-3.5 h-3.5 text-[#9d7fff]' />
                    </div>
                    <div className='flex items-center gap-1.5 pt-1.5'>
                      {[0, 150, 300].map((delay) => (
                        <div key={delay} className='w-1.5 h-1.5 rounded-full'
                          style={{ background: '#9d7fff', animation: `bounce 1s ${delay}ms ease-in-out infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messageEndRef} style={{ height: '16px' }} />
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className='shrink-0'
          style={{ borderTop: '1px solid rgba(124,92,252,0.1)', background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(20px)' }}>
          <ChatInput onSubmit={handleSubmit} disabled={isStreaming} />
        </div>

        <style>{`
          @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        `}</style>
      </div>
    </div>
  );
}
