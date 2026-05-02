import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runPipeline } from './pipeline';
import { validateEvent } from '../contracts/validate';
import { ingestEvent } from './ingest';
import { scoreWithML } from './ml-client';
import { markProcessed } from './audit';
import { sendNotification } from './notify';

// Mocks
vi.mock('../contracts/validate');
vi.mock('./ingest');
vi.mock('./ml-client');
vi.mock('./audit');
vi.mock('./notify');
vi.mock('../observability/logger');

describe('Bifrost Pipeline', () => {
  const mockEvent: any = {
    event_type: 'test.event',
    source: 'test',
    payload: { foo: 'bar' },
    timestamp: new Date().toISOString(),
    trace_id: 'tr_123',
    version: '2.2.0'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should complete all 7 stages for a valid low-risk event', async () => {
    vi.mocked(validateEvent).mockReturnValue({ valid: true });
    vi.mocked(ingestEvent).mockResolvedValue('ev_123');
    vi.mocked(scoreWithML).mockResolvedValue({
      score: 10,
      level: 'LOW',
      flags: [],
      confidence: 0.95
    });

    const result = await runPipeline(mockEvent);

    expect(result.eventId).toBe('ev_123');
    expect(result.level).toBe('LOW');
    expect(result.trace).toHaveLength(7);
    expect(result.trace[0].stage).toBe('validate');
    expect(result.trace[6].stage).toBe('audit');
    expect(sendNotification).not.toHaveBeenCalled();
    expect(markProcessed).toHaveBeenCalledWith('ev_123', 10, []);
  });

  it('should trigger notification for high-risk events', async () => {
    vi.mocked(validateEvent).mockReturnValue({ valid: true });
    vi.mocked(ingestEvent).mockResolvedValue('ev_456');
    vi.mocked(scoreWithML).mockResolvedValue({
      score: 85,
      level: 'HIGH',
      flags: ['risk_detected'],
      confidence: 0.88
    });

    const result = await runPipeline(mockEvent);

    expect(result.level).toBe('HIGH');
    expect(sendNotification).toHaveBeenCalled();
    expect(result.trace.find(t => t.stage === 'notify')?.status).toBe('flagged');
  });

  it('should fail if validation fails', async () => {
    vi.mocked(validateEvent).mockReturnValue({
      valid: false,
      errors: ['Invalid version']
    });

    await expect(runPipeline(mockEvent)).rejects.toThrow('Validation failed: Invalid version');
  });
});
