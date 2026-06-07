/// <reference path="./plugin-runtime.d.ts" />
import { render } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';

async function shell(cmd: string): Promise<string> {
  const result = await $u.shell(cmd);
  return result.output.trim();
}

function parseCurrentFocus(output: string): { pkg: string; activity: string } | null {
  const match = output.match(/([a-zA-Z][\w.]*\/[.\w]+)/);
  if (!match) return null;
  const fullActivity = match[1];
  const slashIndex = fullActivity.indexOf('/');
  if (slashIndex <= 0) return null;
  const pkg = fullActivity.substring(0, slashIndex);
  const act = fullActivity.substring(slashIndex + 1);
  const activity = act.startsWith('.') ? pkg + act : act;
  return { pkg, activity };
}

/* ── Icons (Lucide-style, inline SVG) ── */

function CopyIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RefreshIcon({ class: cls }: { class?: string }) {
  return (
    <svg
      class={cls}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 2v6h-6" />
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M3 22v-6h6" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    </svg>
  );
}

/* ── shadcn/ui-style components ── */

function Card({ children }: { children: preact.ComponentChildren }) {
  return <div>{children}</div>;
}

function CardContent({
  children,
  class: cls,
}: {
  children: preact.ComponentChildren;
  class?: string;
}) {
  return <div class={`py-1 ${cls ?? ''}`}>{children}</div>;
}

function Separator() {
  return <div class="h-px bg-slate-100 mx-2" />;
}

function Button({
  children,
  variant,
  size,
  onClick,
  disabled,
}: {
  children: preact.ComponentChildren;
  variant?: 'ghost' | 'outline' | 'destructive' | 'default';
  size?: 'sm' | 'icon';
  onClick?: () => void;
  disabled?: boolean;
}) {
  const base =
    'inline-flex items-center justify-center gap-1 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 cursor-pointer';
  const variants = {
    ghost: 'hover:bg-slate-50 text-slate-600',
    outline: 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700',
    destructive: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
    default: 'bg-slate-900 text-white hover:bg-slate-800',
  };
  const sizes = {
    sm: 'h-7 px-2.5',
    icon: 'h-7 w-7',
  };
  return (
    <button
      class={`${base} ${variants[variant ?? 'default']} ${sizes[size ?? 'sm']}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div class="py-0.5 first:pt-0 last:pb-0">
      <div class="flex items-center gap-1.5 mb-0">
        <span class="text-[11px] text-slate-400">{label}</span>
      </div>
      <div class="flex items-center gap-1">
        <span class="text-xs font-mono text-slate-700 break-all flex-1 min-w-0">{value}</span>
        <Button variant="ghost" size="icon" onClick={onCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
    </div>
  );
}

/* ── App ── */

function App() {
  const [packageName, setPackageName] = useState('');
  const [activity, setActivity] = useState('');
  const [pid, setPid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedField, setCopiedField] = useState('');

  const refresh = useCallback(async () => {
    console.log('refresh');
    setLoading(true);
    setMessage('');
    try {
      const output = await shell(
        "dumpsys window windows | grep -E 'mCurrentFocus|mFocusedApp' || dumpsys activity activities | grep -E 'mResumedActivity|ResumedActivity'",
      );
      const parsed = parseCurrentFocus(output);
      if (parsed) {
        setPackageName(parsed.pkg);
        setActivity(parsed.activity);
        const pidOutput = await shell(`pidof ${parsed.pkg}`);
        setPid(pidOutput || 'N/A');
      }
    } catch (e: any) {
      setMessage('获取失败: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const copyText = useCallback(async (text: string, label: string) => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(label);
      setMessage(`${label}已复制`);
      setTimeout(() => {
        setMessage('');
        setCopiedField('');
      }, 1500);
    } catch {
      setMessage('复制失败');
    }
  }, []);

  const killApp = useCallback(async () => {
    if (!packageName) return;
    setLoading(true);
    try {
      await shell(`am force-stop ${packageName}`);
      setMessage('已停止');
      setTimeout(() => setMessage(''), 1500);
    } catch (e: any) {
      setMessage('停止失败: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }, [packageName, refresh]);

  const startApp = useCallback(async () => {
    if (!activity) return;
    setLoading(true);
    try {
      await shell(`am start ${activity.includes('/') ? activity : packageName + '/' + activity}`);
      setMessage('已启动');
      const pidOutput = await shell(`pidof ${packageName}`);
      setPid(pidOutput || 'N/A');
      setTimeout(() => setMessage(''), 1500);
    } catch (e: any) {
      setMessage('启动失败: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }, [activity, packageName, refresh]);

  return (
    <>
      {/* Info Card */}
      {packageName ? (
        <>
          <Card>
            <CardContent>
              <InfoRow
                label="Package"
                value={packageName}
                onCopy={() => copyText(packageName, '包名')}
                copied={copiedField === '包名'}
              />
            </CardContent>
            <Separator />
            <CardContent>
              <InfoRow
                label="Activity"
                value={activity}
                onCopy={() => copyText(activity, 'Activity')}
                copied={copiedField === 'Activity'}
              />
            </CardContent>
            <Separator />
            <CardContent>
              <InfoRow
                label="PID"
                value={pid}
                onCopy={() => copyText(pid, 'PID')}
                copied={copiedField === 'PID'}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div class="flex gap-2 mt-1">
            <Button variant="outline" onClick={refresh} disabled={loading}>
              <RefreshIcon class={loading ? 'animate-spin' : ''} />
              {loading ? '刷新中...' : '刷新'}
            </Button>
            <div class="flex-1" />
            <Button variant="destructive" onClick={killApp} disabled={loading}>
              强制停止
            </Button>
            <Button variant="default" onClick={startApp} disabled={loading}>
              启动应用
            </Button>
          </div>
        </>
      ) : !loading ? (
        <div class="text-center py-5 text-slate-300">
          <svg
            class="mx-auto mb-2 text-slate-200"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
          <p class="text-xs">未检测到运行中的应用</p>
        </div>
      ) : null}

      {/* Message */}
      {message && (
        <div
          class={`text-center text-xs mt-2 min-h-[18px] ${message.includes('失败') ? 'text-red-500' : 'text-emerald-600'}`}
        >
          {message}
        </div>
      )}
    </>
  );
}

render(<App />, document.getElementById('app')!);
