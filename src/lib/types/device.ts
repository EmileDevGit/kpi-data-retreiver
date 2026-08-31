export type DiChannel = {
  Ch: number;
  Md: number;
  Stat: number;
  Val: number;
  Cnting: number;
  ClrCnt: number;
  OvLch: number;
};

export type LogRecord = {
  TIM: string; // ISO 8601, device RTC — source of truth for time
  Record: [number, number, number, number][]; // [slot, channel, ioType, value]
};

export type DevicePollResult = {
  connected: boolean;
  latencyMs: number | null;
  error: string | null;
  diValue: DiChannel[] | null;
  logMessages: LogRecord[] | null;
  fetchedAt: string;
};
