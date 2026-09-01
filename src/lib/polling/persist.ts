import type { Device, DevicePoll } from "@/generated/prisma/client";
import { pollDevice } from "@/lib/data/device/poll";
import { decryptDevicePassword } from "@/lib/security/device-credential";
import { createDevicePoll } from "@/lib/data/device-poll";
import { syncChannelConfigReading, listChannelConfigsByDevice } from "@/lib/data/channel-config";
import { createManyChannelLogs } from "@/lib/data/channel-log";
import { createManyMessageLogs, getLatestMessageLogOccurredAt } from "@/lib/data/message-log";

// The device numbers DI channels from 0 (confirmed against the Advantech
// WISE-4000 series REST API reference: "0, 1, ...: Digital input channel
// number"), but our schema stores 1-4 to match the channel_configs/
// channel_logs check constraints and the "Channel 1-4" labeling in the UI.
// Convert once at this boundary so storage and the UI stay 1-based throughout.
function toChannelNumber(deviceChannel: number): number {
  return deviceChannel + 1;
}

// Matches the channel_configs/channel_logs "channel_number BETWEEN 1 AND 4"
// DB check constraints. Devices are only physically wired with 4 DI channels.
const MIN_CHANNEL_NUMBER = 1;
const MAX_CHANNEL_NUMBER = 4;

export async function pollAndPersistDevice(device: Device): Promise<DevicePoll> {
  const password = decryptDevicePassword(device.passwordEncrypted);
  const result = await pollDevice({ ipAddress: device.ipAddress, username: device.username, password });

  // isSuccessful reflects connectivity only (did we reach the device) — a
  // downstream persistence hiccup below must never change this, or the
  // scheduler's failure-streak/error-state tracking would misread a genuine
  // successful poll as a connectivity failure.
  const poll = await createDevicePoll({
    deviceId: device.id,
    fetchedAt: result.fetchedAt,
    isSuccessful: result.connected,
    error: result.error,
  });

  if (!result.connected) return poll;

  try {
    if (result.diValue && result.diValue.length > 0) {
      const numbered = result.diValue.map((ch) => ({ ...ch, channelNumber: toChannelNumber(ch.Ch) }));
      const inRange = numbered.filter((ch) => ch.channelNumber >= MIN_CHANNEL_NUMBER && ch.channelNumber <= MAX_CHANNEL_NUMBER);
      const outOfRange = numbered.filter((ch) => ch.channelNumber < MIN_CHANNEL_NUMBER || ch.channelNumber > MAX_CHANNEL_NUMBER);
      if (outOfRange.length > 0) {
        console.warn(`[polling] device ${device.id} reported unexpected channel(s), dropping:`, JSON.stringify(outOfRange));
      }

      await Promise.all(inRange.map((ch) => syncChannelConfigReading(device.id, ch.channelNumber, ch.Md, ch.Stat)));

      const configs = await listChannelConfigsByDevice(device.id);
      const pausedChannels = new Set(configs.filter((c) => c.isPaused).map((c) => c.channelNumber));

      const channelLogRows = inRange
        .filter((ch) => !pausedChannels.has(ch.channelNumber))
        .map((ch) => ({
          pollId: poll.id,
          channelNumber: ch.channelNumber,
          channelValue: ch.Val,
          isCounting: ch.Cnting !== 0,
          overflowOrLatchValue: ch.OvLch !== 0,
        }));

      if (channelLogRows.length > 0) {
        await createManyChannelLogs(channelLogRows);
      }
    }
  } catch (err) {
    console.error(`[polling] failed to persist channel data for device ${device.id}:`, err);
  }

  try {
    if (result.logMessages && result.logMessages.length > 0) {
      const watermark = await getLatestMessageLogOccurredAt(device.id);

      const messageLogRows = result.logMessages
        .filter((record) => !watermark || new Date(record.TIM) > watermark)
        .flatMap((record) =>
          record.Record.map(([slot, channel, ioType, value]) => ({
            pollId: poll.id,
            deviceId: device.id,
            occurredAt: new Date(record.TIM),
            slot,
            channel: toChannelNumber(channel),
            ioType,
            value,
          })),
        );

      if (messageLogRows.length > 0) {
        await createManyMessageLogs(messageLogRows);
      }
    }
  } catch (err) {
    console.error(`[polling] failed to persist message log data for device ${device.id}:`, err);
  }

  return poll;
}
