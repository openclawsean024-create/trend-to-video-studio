'use client';

import { useState, useCallback, useTransition } from 'react';
import {
  createPromptAction,
  createTrendCandidateAction,
  createUploadJobAction,
  createVideoJobAction,
  runAnalysisAction,
} from './actions';
import type {
  TrendCandidate as CTrendCandidate,
  PromptDraft as CPromptDraft,
  VideoJob as CVideoJob,
  UploadJob as CUploadJob,
  PipelineEvent as CPipelineEvent,
  SourceAsset as CSourceAsset,
  JobStatus,
} from '@trend-to-video-studio/core';

type TrendCandidate = CTrendCandidate;
type PromptDraft = CPromptDraft;
type VideoJob = CVideoJob;
type UploadJob = CUploadJob;
type PipelineEvent = CPipelineEvent;
type SourceAsset = CSourceAsset;
type Status = JobStatus;
type Stage = 'discover' | 'analyze' | 'generate' | 'upload' | 'done';

const STAGE_ORDER: Stage[] = ['discover', 'analyze', 'generate', 'upload', 'done'];
const STAGE_LABELS: Record<Stage, string> = {
  discover: '發現',
  analyze: '分析',
  generate: '生成',
  upload: '上傳',
  done: '已發布',
};
const STAGE_COLORS: Record<Stage, { bg: string; border: string; text: string; icon: string }> = {
  discover: { bg: '#312a12', border: '#9a6a0d', text: '#fbbf24', icon: '📡' },
  analyze: { bg: '#14233b', border: '#1d4ed8', text: '#60a5fa', icon: '🔍' },
  generate: { bg: '#241736', border: '#7c3aed', text: '#a78bfa', icon: '🎬' },
  upload: { bg: '#112a23', border: '#047857', text: '#34d399', icon: '📤' },
  done: { bg: '#0f2f21', border: '#059669', text: '#6ee7b7', icon: '✅' },
};
const STATUS_META: Record<Status, { bg: string; color: string; label: string }> = {
  draft: { bg: '#1f2937', color: '#cbd5e1', label: '草稿' },
  queued: { bg: '#3b2f0f', color: '#fbbf24', label: '排隊中' },
  processing: { bg: '#13233c', color: '#60a5fa', label: '處理中' },
  completed: { bg: '#0f2f21', color: '#6ee7b7', label: '完成' },
  failed: { bg: '#3a1717', color: '#fca5a5', label: '失敗' },
};

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

function StatusBadge({ status }: { status: Status }) {
  const m = STATUS_META[status];
  return <span className="badge" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
}

function PipelineBar({ stage }: { stage: Stage }) {
  const currentIdx = STAGE_ORDER.indexOf(stage);
  return (
    <div className="pipeline">
      {STAGE_ORDER.map((s, idx) => {
        const c = STAGE_COLORS[s];
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              className={`stage-step ${isCurrent ? 'active' : ''} ${isDone ? 'done' : ''}`}
              style={{
                borderColor: isCurrent || isDone ? c.border : undefined,
                background: isCurrent || isDone ? c.bg : undefined,
              }}
            >
              <div style={{ fontSize: 14 }}>{c.icon}</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent || isDone ? c.text : '#7c8aa8' }}>{STAGE_LABELS[s]}</div>
            </div>
            {idx < STAGE_ORDER.length - 1 && <div className={`connector ${idx < currentIdx ? 'done' : ''}`} />}
          </div>
        );
      })}
    </div>
  );
}

function StageActions({ stage, candidateId, draftId, videoId }: { stage: Stage; candidateId: string; draftId?: string; videoId?: string; }) {
  const [, startTransition] = useTransition();
  const actions = [
    { stage: 'discover' as Stage, formAction: runAnalysisAction, hiddenFields: { trendCandidateId: candidateId }, label: '開始分析' },
    { stage: 'analyze' as Stage, formAction: createPromptAction, hiddenFields: { trendCandidateId: candidateId }, label: '生成提示詞' },
    { stage: 'generate' as Stage, formAction: createVideoJobAction, hiddenFields: { promptDraftId: draftId ?? '', provider: 'mock-sora-adapter' }, label: '生成影片' },
    { stage: 'upload' as Stage, formAction: createUploadJobAction, hiddenFields: { videoJobId: videoId ?? '' }, label: '排程上傳' },
  ];
  const active = actions.find(a => a.stage === stage);
  if (!active) return null;

  return (
    <form action={(fd: globalThis.FormData) => startTransition(() => active.formAction(fd as unknown as Parameters<typeof createPromptAction>[0]))}>
      {Object.entries(active.hiddenFields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      <button type="submit" className="btn">{active.label}</button>
    </form>
  );
}

function VideoPreview({ video }: { video: VideoJob }) {
  if (!video.outputUrl) return <div className="block" style={{ textAlign: 'center', color: '#8ea1c6' }}>等待影片生成...</div>;
  const isMp4 = video.outputUrl.endsWith('.mp4') || video.outputUrl.includes('mp4');
  if (isMp4) return <div className="block" style={{ padding: 0, overflow: 'hidden' }}><video src={video.outputUrl} controls style={{ width: '100%', maxHeight: 220, display: 'block' }} /></div>;
  return <a href={video.outputUrl} target="_blank" rel="noreferrer" className="block" style={{ color: '#7cb3ff' }}>觀看影片 → {video.outputUrl.slice(0, 60)}...</a>;
}

function TrendCard({ candidate, drafts, videos, uploads }: { candidate: TrendCandidate; drafts: PromptDraft[]; videos: VideoJob[]; uploads: UploadJob[]; }) {
  const draft = drafts.find(d => d.trendCandidateId === candidate.id);
  const video = videos.find(v => v.promptDraftId === draft?.id);
  const upload = uploads.find(u => u.videoJobId === video?.id);
  const stage = getStage(candidate, drafts, videos, uploads);

  return (
    <div className="card trend-card">
      <div className="trend-header">
        <div style={{ minWidth: 0 }}>
          <h3 className="trend-title">{candidate.topic}</h3>
          <div className="muted">{candidate.sourcePlatform !== 'manual' ? candidate.sourceUrl : '手動輸入'}</div>
        </div>
        <StatusBadge status={candidate.status} />
      </div>

      <PipelineBar stage={stage} />

      {draft && (
        <div className="block">
          <div className="block-title">📝 影片提示詞</div>
          <div style={{ fontSize: 13, lineHeight: 1.5 }}>{draft.videoPrompt}</div>
          {draft.thumbnailPrompt && <div className="muted" style={{ marginTop: 6 }}>🖼️ {draft.thumbnailPrompt}</div>}
        </div>
      )}

      {video && (stage === 'generate' || stage === 'upload' || stage === 'done') && (
        <div>
          <div className="block-title">🎬 生成影片</div>
          <VideoPreview video={video} />
        </div>
      )}

      {upload && (
        <div className="block" style={{ background: '#112a23', borderColor: '#1f5a47' }}>
          <div className="block-title" style={{ color: '#6ee7b7' }}>📤 上傳狀態</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a7f3d0' }}>
            {upload.status === 'completed' ? '已發布至 YouTube' : upload.scheduledFor ? `排程：${new Date(upload.scheduledFor).toLocaleString('zh-TW')}` : '等待上傳中'}
          </div>
        </div>
      )}

      <StageActions stage={stage} candidateId={candidate.id} draftId={draft?.id} videoId={video?.id} />
    </div>
  );
}

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
      createTrendCandidateAction(fd);
      setTopic('');
      setSourceUrl('');
      setDone(true);
      setTimeout(() => setDone(false), 2500);
    });
  }, [topic]);

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
      <div>
        <label className="label">主題</label>
        <input name="topic" className="input" value={topic} onChange={e => setTopic(e.target.value)} placeholder="例如：AI 說故事短影片" required />
      </div>
      <div>
        <label className="label">來源 URL（選填）</label>
        <input name="sourceUrl" className="input" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
      </div>
      <input type="hidden" name="sourcePlatform" value="manual" />
      <button type="submit" className="btn" disabled={!topic.trim()}>添加趨勢候選</button>
      {done && <div style={{ color: '#34d399', fontSize: 12, textAlign: 'center', fontWeight: 600 }}>已新增</div>}
    </form>
  );
}

function PipelineSummary({ candidates, drafts, videos, uploads }: { candidates: TrendCandidate[]; drafts: PromptDraft[]; videos: VideoJob[]; uploads: UploadJob[]; }) {
  const counts: Record<Stage, number> = { discover: 0, analyze: 0, generate: 0, upload: 0, done: 0 };
  candidates.forEach(c => counts[getStage(c, drafts, videos, uploads)]++);

  return (
    <div className="summary-grid">
      {(['discover', 'analyze', 'generate', 'upload'] as Stage[]).map((stage) => {
        const c = STAGE_COLORS[stage];
        return (
          <div key={stage} className="summary-item" style={{ background: c.bg, borderColor: c.border }}>
            <div style={{ fontSize: 18 }}>{c.icon}</div>
            <div className="summary-num" style={{ color: c.text }}>{counts[stage]}</div>
            <div className="summary-label" style={{ color: c.text }}>{STAGE_LABELS[stage]}</div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="card stat-card">
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div className="stat-v">{value}</div>
      <div className="stat-l">{label}</div>
    </div>
  );
}

export default function StudioDashboard({
  initialCandidates,
  initialDrafts,
  initialVideos,
  initialUploads,
  initialEvents,
  storeLabel,
  dataPath,
  sourceAssets,
}: {
  initialCandidates: TrendCandidate[];
  initialDrafts: PromptDraft[];
  initialVideos: VideoJob[];
  initialUploads: UploadJob[];
  initialEvents: PipelineEvent[];
  storeLabel: string;
  dataPath: string;
  sourceAssets: SourceAsset[];
}) {
  const [candidates] = useState(initialCandidates);
  const [drafts] = useState(initialDrafts);
  const [videos] = useState(initialVideos);
  const [uploads] = useState(initialUploads);
  const totalCompleted = uploads.filter(u => u.status === 'completed').length;

  return (
    <main className="container">
      <div className="header">
        <div>
          <h1 className="title">🎬 趨勢轉影片工作室</h1>
          <p className="subtitle">CapCut / Canva 風格產品化介面：趨勢 → 分析 → 生成 → 上傳</p>
        </div>
        <div className="kpis">
          <div>
            <div className="kpi-value">{videos.length}</div>
            <div className="kpi-label">影片任務</div>
          </div>
          <div className="divider-v" />
          <div>
            <div className="kpi-value" style={{ color: '#34d399' }}>{totalCompleted}</div>
            <div className="kpi-label">已發布</div>
          </div>
        </div>
      </div>

      <div className="grid-stats">
        <StatCard label="趨勢" value={candidates.length} icon="🔥" />
        <StatCard label="提示詞" value={drafts.length} icon="📝" />
        <StatCard label="影片" value={videos.length} icon="🎬" />
        <StatCard label="上傳" value={uploads.length} icon="📤" />
        <StatCard label="已發布" value={totalCompleted} icon="✅" />
      </div>

      <div className="card panel">
        <h2>📊 工作管線總覽</h2>
        <PipelineSummary candidates={candidates} drafts={drafts} videos={videos} uploads={uploads} />
      </div>

      <div className="main-grid">
        <aside className="sidebar">
          <div className="card panel">
            <h2>➕ 新增趨勢</h2>
            <NewCandidateForm />
          </div>

          <div className="card panel">
            <h2>📋 最近活動</h2>
            {initialEvents.length === 0 ? (
              <div className="muted">尚無活動記錄</div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {initialEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="block" style={{ marginBottom: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{event.type}</div>
                    <div className="muted" style={{ marginTop: 2 }}>{event.message}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section>
          <h2 style={{ margin: '0 0 12px', fontSize: 14 }}>🔥 趨勢候選 ({candidates.length})</h2>
          {candidates.length === 0 ? (
            <div className="card empty">
              <div style={{ fontSize: 38, marginBottom: 10 }}>📡</div>
              還沒有趨勢候選，從左側建立第一筆。
            </div>
          ) : (
            <div className="list-col">
              {candidates.map((c) => (
                <TrendCard key={c.id} candidate={c} drafts={drafts} videos={videos} uploads={uploads} />
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="footer">
        Trend to Video Studio · 資料儲存：{storeLabel} · {dataPath} · Assets: {sourceAssets.length}
      </div>
    </main>
  );
}
