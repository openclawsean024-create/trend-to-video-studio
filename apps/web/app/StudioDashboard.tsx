'use client';

import { useState, useCallback, useTransition } from 'react';
import {
  createPromptAction,
  createTrendCandidateAction,
  createUploadJobAction,
  createVideoJobAction,
  runAnalysisAction,
} from './actions';

// ── Types ───────────────────────────────────────────────────────────────────
import type {
  TrendCandidate as CTrendCandidate,
  PromptDraft as CPromptDraft,
  VideoJob as CVideoJob,
  UploadJob as CUploadJob,
  PipelineEvent as CPipelineEvent,
  JobStatus,
} from '@trend-to-video-studio/core';

type TrendCandidate = CTrendCandidate;
type PromptDraft = CPromptDraft;
type VideoJob = CVideoJob;
type UploadJob = CUploadJob;
type PipelineEvent = CPipelineEvent;
type Status = JobStatus;

// ── Pipeline Stage ───────────────────────────────────────────────────────────
type Stage = 'discover' | 'analyze' | 'generate' | 'upload' | 'done';

function getStage(candidate: TrendCandidate, drafts: PromptDraft[], videos: VideoJob[], uploads: UploadJob[]): Stage {
  const draft = drafts.find(d => d.trendCandidateId === candidate.id);
  const video = videos.find(v => v.promptDraftId === draft?.id);
  const upload = uploads.find(u => u.videoJobId === video?.id);
  if (upload?.status === 'completed') return 'done';
  if (upload) return 'upload';
  if (video) return 'generate';
  if (draft) return 'analyze';
  return 'discover';
}

const STAGE_ORDER: Stage[] = ['discover', 'analyze', 'generate', 'upload', 'done'];

const STAGE_LABELS: Record<Stage, string> = {
  discover: '📡 發現',
  analyze: '🔍 分析',
  generate: '🎬 生成',
  upload: '📤 上傳',
  done: '✅ 已發布',
};

const STAGE_COLORS: Record<Stage, { bg: string; border: string; text: string; icon: string }> = {
  discover: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '📡' },
  analyze: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af', icon: '🔍' },
  generate: { bg: '#ede9fe', border: '#8b5cf6', text: '#5b21b6', icon: '🎬' },
  upload: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '📤' },
  done: { bg: '#ecfdf5', border: '#059669', text: '#064e3b', icon: '🎉' },
};

const STATUS_META: Record<Status, { bg: string; color: string; label: string }> = {
  pending: { bg: '#f1f5f9', color: '#475569', label: '⏳ 待處理' },
  running: { bg: '#dbeafe', color: '#1e40af', label: '⚡ 執行中' },
  completed: { bg: '#d1fae5', color: '#065f46', label: '🎉 完成' },
  failed: { bg: '#fee2e2', color: '#991b1b', label: '❌ 失敗' },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

function PipelineBar({ stage }: { stage: Stage }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
      {STAGE_ORDER.map((s, idx) => {
        const c = STAGE_COLORS[s];
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                padding: '6px 10px', borderRadius: 12, border: `2px solid ${isCurrent ? c.border : isDone ? c.border : '#e2e8f0'}`,
                background: isCurrent ? c.bg : isDone ? c.bg : '#f8fafc',
                opacity: isCurrent ? 1 : isDone ? 0.7 : 0.4,
                minWidth: 76,
              }}
            >
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? c.text : '#94a3b8' }}>
                {s === 'done' ? '已發布' : STAGE_LABELS[s]}
              </span>
            </div>
            {idx < STAGE_ORDER.length - 1 && (
              <div style={{ width: 20, height: 2, background: idx < currentIdx ? '#10b981' : '#e2e8f0', margin: '0 2px', flexShrink: 0 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function VideoPreview({ video }: { video: VideoJob }) {
  if (!video.outputUrl) {
    return (
      <div style={{ background: '#f1f5f9', borderRadius: 12, padding: 16, textAlign: 'center', color: '#64748b', fontSize: 13 }}>
        🎬 等待影片生成...
      </div>
    );
  }
  const isMp4 = video.outputUrl.endsWith('.mp4') || video.outputUrl.includes('mp4');
  if (isMp4) {
    return (
      <div style={{ background: '#0f172a', borderRadius: 12, overflow: 'hidden' }}>
        <video src={video.outputUrl} controls style={{ width: '100%', maxHeight: 200, display: 'block' }} />
      </div>
    );
  }
  return (
    <a href={video.outputUrl} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 12, background: '#0f172a', borderRadius: 12, color: '#60a5fa', fontSize: 13 }}>
      🎬 觀看影片 → {video.outputUrl.slice(0, 60)}...
    </a>
  );
}

function StageActions({ stage, candidateId, draftId, videoId }: {
  stage: Stage;
  candidateId: string;
  draftId?: string;
  videoId?: string;
}) {
  const [, startTransition] = useTransition();

  const actions = [
    { stage: 'discover' as Stage, formAction: runAnalysisAction, hiddenFields: { trendCandidateId: candidateId }, label: '🔍 開始分析', primary: false },
    { stage: 'analyze' as Stage, formAction: createPromptAction, hiddenFields: { trendCandidateId: candidateId }, label: '📝 生成提示詞', primary: false },
    { stage: 'generate' as Stage, formAction: createVideoJobAction, hiddenFields: { promptDraftId: draftId ?? '', provider: 'mock-sora-adapter' }, label: '🎬 生成影片', primary: false },
    { stage: 'upload' as Stage, formAction: createUploadJobAction, hiddenFields: { videoJobId: videoId ?? '' }, label: '📤 排程上傳', primary: true },
  ];

  const active = actions.find(a => a.stage === stage);
  if (!active) return null;

  return (
    <form action={(formData: globalThis.FormData) => startTransition(() => active.formAction(formData as unknown as Parameters<typeof createPromptAction>[0]))}>
      {Object.entries(active.hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <button
        type="submit"
        style={{
          padding: '8px 16px', borderRadius: 10, border: 'none',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          color: '#fff',
          background: active.primary ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #667eea, #764ba2)',
        }}
      >
        {active.label}
      </button>
    </form>
  );
}

// ── Trend Card ────────────────────────────────────────────────────────────────
function TrendCard({ candidate, drafts, videos, uploads }: {
  candidate: TrendCandidate;
  drafts: PromptDraft[];
  videos: VideoJob[];
  uploads: UploadJob[];
}) {
  const draft = drafts.find(d => d.trendCandidateId === candidate.id);
  const video = videos.find(v => v.promptDraftId === draft?.id);
  const upload = uploads.find(u => u.videoJobId === video?.id);
  const stage = getStage(candidate, drafts, videos, uploads);

  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #e5e7eb', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {candidate.topic}
          </h3>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
            {candidate.sourcePlatform !== 'manual' ? candidate.sourceUrl : '手動輸入'}
          </div>
        </div>
        <div style={{ marginLeft: 12, flexShrink: 0 }}>
          <StatusBadge status={candidate.status} />
        </div>
      </div>

      <PipelineBar stage={stage} />

      {draft && (
        <div style={{ background: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>📝 影片提示詞</div>
          <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
            {draft.videoPrompt}
          </div>
          {draft.thumbnailPrompt && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>🖼️ 縮圖提示</div>
              <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{draft.thumbnailPrompt}</div>
            </div>
          )}
        </div>
      )}

      {video && (stage === 'generate' || stage === 'upload' || stage === 'done') && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>🎬 生成的影片</div>
          <VideoPreview video={video} />
        </div>
      )}

      {upload && (
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: '#16a34a', marginBottom: 2 }}>📤 上傳狀態</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#15803d' }}>
            {upload.status === 'completed' ? '✅ 已發布至 YouTube' : upload.scheduledFor ? `排程：${new Date(upload.scheduledFor).toLocaleString('zh-TW')}` : '等待上傳中...'}
          </div>
        </div>
      )}

      <StageActions stage={stage} candidateId={candidate.id} draftId={draft?.id} videoId={video?.id} />
    </div>
  );
}

// ── New Candidate Form ────────────────────────────────────────────────────────
function NewCandidateForm() {
  const [topic, setTopic] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic.trim()) return;
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      createPromptAction(fd);
      setTopic('');
      setSourceUrl('');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    });
  }, []);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>主題</label>
        <input
          name="topic"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="例如：AI 說故事短影片"
          style={inputStyle}
          required
        />
      </div>
      <div>
        <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>來源 URL（選填）</label>
        <input
          name="sourceUrl"
          value={sourceUrl}
          onChange={e => setSourceUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          style={inputStyle}
        />
      </div>
      <input type="hidden" name="sourcePlatform" value="manual" />
      <button
        type="submit"
        style={{
          ...submitBtn,
          opacity: !topic.trim() ? 0.5 : 1,
        }}
      >
        ➕ 添加趨勢候選
      </button>
      {done && <div style={{ color: '#059669', fontSize: 12, fontWeight: 600, textAlign: 'center' }}>✅ 已添加！</div>}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 10,
  border: '1.5px solid #d1d5db', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

const submitBtn: React.CSSProperties = {
  padding: '9px 16px', borderRadius: 10, border: 'none',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
};

// ── Pipeline Summary ─────────────────────────────────────────────────────────
function PipelineSummary({ candidates, drafts, videos, uploads }: {
  candidates: TrendCandidate[];
  drafts: PromptDraft[];
  videos: VideoJob[];
  uploads: UploadJob[];
}) {
  const counts: Record<Stage, number> = { discover: 0, analyze: 0, generate: 0, upload: 0, done: 0 };
  candidates.forEach(c => counts[getStage(c, drafts, videos, uploads)]++);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
      {(['discover', 'analyze', 'generate', 'upload'] as Stage[]).map(stage => {
        const c = STAGE_COLORS[stage];
        return (
          <div key={stage} style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 16, padding: '12px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 20 }}>{c.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c.text }}>{counts[stage]}</div>
            <div style={{ fontSize: 12, color: c.text, fontWeight: 600 }}>{STAGE_LABELS[stage]}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Stats Cards ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 16, padding: '12px 10px', textAlign: 'center', border: '1.5px solid #e5e7eb', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function StudioDashboard({
  initialCandidates,
  initialDrafts,
  initialVideos,
  initialUploads,
  initialEvents,
  storeLabel,
  dataPath,
}: {
  initialCandidates: TrendCandidate[];
  initialDrafts: PromptDraft[];
  initialVideos: VideoJob[];
  initialUploads: UploadJob[];
  initialEvents: PipelineEvent[];
  storeLabel: string;
  dataPath: string;
}) {
  const [candidates] = useState(initialCandidates);
  const [drafts] = useState(initialDrafts);
  const [videos] = useState(initialVideos);
  const [uploads] = useState(initialUploads);
  const totalCompleted = uploads.filter(u => u.status === 'completed').length;

  return (
    <main style={{ fontFamily: "'Noto Sans TC', Arial, sans-serif", background: '#f8fafc', minHeight: '100vh', padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg, #667eea, #764ba2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              🎬 趨勢轉影片工作室
            </h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 13 }}>
              將趨勢轉化為原創短影片 → 自動排程發布至 YouTube
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a' }}>{videos.length}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>影片任務</div>
            </div>
            <div style={{ width: 1, height: 36, background: '#e2e8f0' }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{totalCompleted}</div>
              <div style={{ fontSize: 11, color: '#64748b' }}>已發布</div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
          <StatCard label="🔥 趨勢" value={candidates.length} icon="🔥" />
          <StatCard label="📝 提示詞" value={drafts.length} icon="📝" />
          <StatCard label="🎬 影片" value={videos.length} icon="🎬" />
          <StatCard label="📤 上傳" value={uploads.length} icon="📤" />
          <StatCard label="✅ 已發布" value={totalCompleted} icon="✅" />
        </div>

        {/* Pipeline summary */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: 24 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>📊 工作管線</h2>
          <PipelineSummary candidates={candidates} drafts={drafts} videos={videos} uploads={uploads} />
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24 }}>
          {/* Left sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>➕ 新增趨勢</h2>
              <NewCandidateForm />
            </div>

            <div style={{ background: '#fff', borderRadius: 20, padding: 20, border: '1.5px solid #e5e7eb', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>📋 最近活動</h2>
              {initialEvents.length === 0 ? (
                <div style={{ color: '#94a3b8', fontSize: 12 }}>尚無活動記錄</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {initialEvents.slice(0, 8).map(event => (
                    <div key={event.id} style={{ padding: '8px 10px', background: '#f8fafc', borderRadius: 10, fontSize: 12 }}>
                      <span style={{ fontWeight: 600, color: '#374151' }}>{event.type}</span>
                      <div style={{ color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.message}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Trend cards */}
          <div>
            <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
              🔥 趨勢候選 ({candidates.length})
            </h2>
            {candidates.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 20, padding: 48, textAlign: 'center', border: '1.5px solid #e5e7eb', color: '#94a3b8', fontSize: 14 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
                還沒有趨勢候選。<br />從左側新增一個開始吧！
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {candidates.map(c => (
                  <TrendCard
                    key={c.id}
                    candidate={c as TrendCandidate}
                    drafts={drafts as PromptDraft[]}
                    videos={videos as VideoJob[]}
                    uploads={uploads as UploadJob[]}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 1200, margin: '0 auto', marginTop: 48, textAlign: 'center', color: '#94a3b8', fontSize: 12, borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
        Trend to Video Studio · 資料儲存：{storeLabel} · {dataPath}
      </div>
    </main>
  );
}
