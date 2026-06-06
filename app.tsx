/// <reference path="./plugin-runtime.d.ts" />
import { render } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';

async function shell(cmd: string): Promise<string> {
  const result = await $u.shell(cmd);
  return result.output.trim();
}

function parseCurrentFocus(output: string): { pkg: string; activity: string } | null {
  const match = output.match(/mCurrentFocus=Window\{[\da-f]+ \w+ (\S+?)(?:\})/);
  if (!match) return null;
  const fullActivity = match[1];
  const slashIndex = fullActivity.indexOf('/');
  if (slashIndex <= 0) return null;
  const pkg = fullActivity.substring(0, slashIndex);
  const act = fullActivity.substring(slashIndex + 1);
  const activity = act.startsWith('.')
    ? pkg + act.replace(/^\./, '.' + pkg.substring(pkg.lastIndexOf('.') + 1) + '.')
    : act;
  return { pkg, activity };
}

function InfoRow({
  label,
  value,
  onCopy,
  border,
}: {
  label: string;
  value: string;
  onCopy: () => void;
  border?: boolean;
}) {
  return (
    <div
      class={`flex items-center justify-between py-1.5${border ? ' border-t border-neutral-100' : ''}`}
    >
      <span class="text-[11px] text-neutral-400 min-w-[80px]">{label}</span>
      <span class="flex-1 text-xs font-mono text-neutral-800 break-all mx-2">{value}</span>
      <button
        class="border border-neutral-300 rounded px-2 py-0.5 text-[11px] text-neutral-500 cursor-pointer hover:bg-neutral-100 whitespace-nowrap"
        onClick={onCopy}
      >
        复制
      </button>
    </div>
  );
}

function ActionBtn({
  label,
  color,
  onClick,
  disabled,
}: {
  label: string;
  color: 'red' | 'green';
  onClick: () => void;
  disabled: boolean;
}) {
  const colors = { red: 'bg-red-500 hover:bg-red-400', green: 'bg-green-500 hover:bg-green-400' };
  return (
    <button
      class={`flex-1 py-2 border-none rounded-md text-[13px] cursor-pointer font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]}`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

function App() {
  const [packageName, setPackageName] = useState('');
  const [activity, setActivity] = useState('');
  const [pid, setPid] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const output = await shell("dumpsys window windows | grep -E 'mCurrentFocus'");
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
      await navigator.clipboard.writeText(text);
      setMessage(`${label}已复制`);
      setTimeout(() => setMessage(''), 1500);
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
      setTimeout(() => {
        setMessage('');
        refresh();
      }, 1000);
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
      setTimeout(() => {
        setMessage('');
        refresh();
      }, 1000);
    } catch (e: any) {
      setMessage('启动失败: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }, [activity, packageName, refresh]);

  return (
    <>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-[15px] font-semibold">当前应用</h2>
        <button
          class="border border-neutral-300 rounded-md px-2.5 py-1 text-xs text-neutral-500 cursor-pointer hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {packageName ? (
        <>
          <div class="bg-white rounded-lg px-3 py-2.5 mb-2 border border-neutral-200">
            <InfoRow
              label="Package"
              value={packageName}
              onCopy={() => copyText(packageName, '包名')}
            />
            <InfoRow
              label="Activity"
              value={activity}
              onCopy={() => copyText(activity, 'Activity')}
              border
            />
            <InfoRow label="PID" value={pid} onCopy={() => copyText(pid, 'PID')} border />
          </div>
          <div class="flex gap-2 mt-3">
            <ActionBtn label="强制停止" color="red" onClick={killApp} disabled={loading} />
            <ActionBtn label="启动应用" color="green" onClick={startApp} disabled={loading} />
          </div>
        </>
      ) : !loading ? (
        <div class="text-center text-neutral-300 py-5 text-[13px]">未检测到运行中的应用</div>
      ) : null}

      <div class="text-center text-xs text-blue-500 mt-2 min-h-[18px]">{message}</div>
    </>
  );
}

render(<App />, document.getElementById('app')!);
