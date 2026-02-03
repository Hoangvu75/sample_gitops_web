'use client';

import { useEffect, useRef } from 'react';
import type { Terminal as TerminalType } from 'xterm';
import 'xterm/css/xterm.css';

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<TerminalType | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!terminalRef.current || termRef.current) return;

    const initTerminal = async () => {
      const { Terminal } = await import('xterm');
      const { FitAddon } = await import('xterm-addon-fit');
      const { AttachAddon } = await import('xterm-addon-attach');

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
      term.writeln('\x1b[1;36m║   Interactive Kubernetes Terminal      ║\x1b[0m');
      term.writeln('\x1b[1;36m╚════════════════════════════════════════╝\x1b[0m');
      term.writeln('\x1b[33mConnecting to backend shell...\x1b[0m\r\n');

      // Connect to WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/socket`;
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        term.writeln('\x1b[32mConnected! Type commands (kubectl, ls, vi...)\x1b[0m\r\n');

        const attachAddon = new AttachAddon(socket);
        term.loadAddon(attachAddon);

        // Initial resize
        socket.send(`RESZ:${term.cols}:${term.rows}`);
        term.focus();
      };

      socket.onclose = () => {
        term.writeln('\r\n\x1b[31mConnection closed.\x1b[0m');
      };

      socket.onerror = (err) => {
        console.error('WebSocket error:', err);
        term.writeln('\r\n\x1b[31mConnection error.\x1b[0m');
      };

      // Handle resize
      const handleResize = () => {
        fitAddon.fit();
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(`RESZ:${term.cols}:${term.rows}`);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
        term.dispose();
      };
    };

    initTerminal();

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (termRef.current) {
        termRef.current.dispose();
      }
    };
  }, []);

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
