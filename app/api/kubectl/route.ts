import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { command } = await request.json();

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Execute command
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      maxBuffer: 1024 * 1024 // 1MB
    });

    return NextResponse.json({
      stdout: stdout || '',
      stderr: stderr || ''
    });

  } catch (error: any) {
    // Handle exec errors (command failed)
    if (error.stdout || error.stderr) {
      return NextResponse.json({
        stdout: error.stdout || '',
        stderr: error.stderr || error.message
      });
    }

    return NextResponse.json({
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
}
