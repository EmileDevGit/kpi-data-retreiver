import type { Device, DevicePoll } from "@/generated/prisma/client";
import { pollDevice } from "@/lib/data/device/poll";
import { decryptDevicePassword } from "@/lib/security/device-credential";
import { createDevicePoll } from "@/lib/data/device-poll";
import { syncChannelConfigReading, listChannelConfigsByDevice } from "@/lib/data/channel-config";
import { createManyChannelLogs } from "@/lib/data/channel-log";
import { createManyMessageLogs, getLatestMessageLogOccurredAt } from "@/lib/data/message-log";

export async function pollAndPersistDevice(device: Device): Promise<DevicePoll> {
  const password = decryptDevicePassword(device.passwordEncrypted);
  const result = await pollDevice({ ipAddress: device.ipAddress, username: device.username, password });

  const poll = await createDevicePoll({
    deviceId: device.id,
    fetchedAt: result.fetchedAt,
    isSuccessful: result.connected,
    error: result.error,
  });

  if (!result.connected) return poll;

  if (result.diValue && result.diValue.length > 0) {
    await Promise.all(
      result.diValue.map((ch) => syncChannelConfigReading(device.id, ch.Ch, ch.Md, ch.Stat)),
    );

    const configs = await listChannelConfigsByDevice(device.id);
    const pausedChannels = new Set(configs.filter((c) => c.isPaused).map((c) => c.channelNumber));

    const channelLogRows = result.diValue
      .filter((ch) => !pausedChannels.has(ch.Ch))
      .map((ch) => ({
        pollId: poll.id,
        channelNumber: ch.Ch,
        channelValue: ch.Val,
        isCounting: ch.Cnting !== 0,
        overflowOrLatchValue: ch.OvLch !== 0,
      }));

    if (channelLogRows.length > 0) {
      await createManyChannelLogs(channelLogRows);
    }
  }

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
          channel,
          ioType,
          value,
        })),
      );

    if (messageLogRows.length > 0) {
      await createManyMessageLogs(messageLogRows);
    }
  }

  return poll;
}
