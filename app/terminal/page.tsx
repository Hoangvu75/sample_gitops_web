'use client';

import { useEffect, useRef, useState } from 'react';
import type { Terminal as TerminalType } from 'xterm';
import 'xterm/css/xterm.css';

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<TerminalType | null>(null);
  const [inputBuffer, setInputBuffer] = useState('');

  useEffect(() => {
    if (!terminalRef.current || termRef.current) return;

    const initTerminal = async () => {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');

      const term = new Terminal({
        cursorBlink: true,
        theme: {
          background: '#1a1a2e',
          foreground: '#eee',
          cursor: '#0f0',
          selectionBackground: '#444',
        },
        fontSize: 14,
        fontFamily: 'Consolas, Monaco, monospace',
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current!);
      fitAddon.fit();

      termRef.current = term;

      // Welcome message
      term.writeln('\x1b[1;36m╔════════════════════════════════════════╗\x1b[0m');
      term.writeln('\x1b[1;36m║   Kubernetes Web Terminal              ║\x1b[0m');
      term.writeln('\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m');
      term.writeln('');
      term.writeln('\x1b[33mAllowed commands: kubectl get, describe, logs, top, version, cluster-info\x1b[0m');
      term.writeln('');
      term.write('\x1b[32m$ \x1b[0m');

      let buffer = '';

      term.onKey(({ key, domEvent }: { key: string, domEvent: KeyboardEvent }) => {
        const code = domEvent.keyCode;

        if (code === 13) { // Enter
          term.writeln('');
          if (buffer.trim()) {
            executeCommand(buffer.trim(), term);
          } else {
            term.write('\x1b[32m$ \x1b[0m');
          }
          buffer = '';
        } else if (code === 8) { // Backspace
          if (buffer.length > 0) {
            buffer = buffer.slice(0, -1);
            term.write('\b \b');
          }
        } else if (domEvent.key.length === 1) {
          buffer += domEvent.key;
          term.write(domEvent.key);
        }
      });

      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        term.dispose();
      };
    };

    initTerminal();
  }, []);

  const executeCommand = async (command: string, term: TerminalType) => {
    // Auto-prepend kubectl if not present
    const fullCommand = command.startsWith('kubectl ') ? command : `kubectl ${command}`;

    try {
      const res = await fetch('/api/kubectl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: fullCommand }),
      });

      const data = await res.json();

      if (data.error) {
        term.writeln(`\x1b[31mError: ${data.error}\x1b[0m`);
      } else {
        if (data.stdout) {
          data.stdout.split('\n').forEach((line: string) => term.writeln(line));
        }
        if (data.stderr) {
          data.stderr.split('\n').forEach((line: string) => term.writeln(`\x1b[31m${line}\x1b[0m`));
        }
      }
    } catch (err: any) {
      term.writeln(`\x1b[31mFetch error: ${err.message}\x1b[0m`);
    }

    term.write('\x1b[32m$ \x1b[0m');
  };

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      backgroundColor: '#1a1a2e',
      padding: '10px',
      boxSizing: 'border-box'
    }}>
      <div style={{ marginBottom: '10px', color: '#888', fontSize: '12px' }}>
        <a href="/" style={{ color: '#6b8afd', textDecoration: 'none' }}>← Back to Home</a>
      </div>
      <div
        ref={terminalRef}
        style={{
          height: 'calc(100% - 30px)',
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
    </div>
  );
}
