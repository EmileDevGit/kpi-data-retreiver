import "dotenv/config";
import { prisma } from "../src/lib/prisma";

// Seed data intentionally covers no DevicePoll/ChannelLog/MessageLog rows —
// persisting live poll results is a deferred feature, not part of this seed.

async function main() {
  // Wipe prior seed data (in FK-safe order) so re-running against a DB
  // seeded under the old Main Plant / Warehouse naming doesn't leave
  // stale sites and machines alongside the new ones.
  await prisma.channelConfig.deleteMany();
  await prisma.channelLog.deleteMany();
  await prisma.messageLog.deleteMany();
  await prisma.devicePoll.deleteMany();
  await prisma.device.deleteMany();
  await prisma.machine.deleteMany();
  await prisma.site.deleteMany();

  const mirabel = await prisma.site.upsert({
    where: { name: "Mirabel" },
    update: {},
    create: { name: "Mirabel" },
  });

  const sainteSophie = await prisma.site.upsert({
    where: { name: "Sainte-Sophie" },
    update: {},
    create: { name: "Sainte-Sophie" },
  });

  const roda = await prisma.machine.upsert({
    where: { name: "Roda" },
    update: {},
    create: { name: "Roda", siteId: mirabel.id },
  });

  const crawford = await prisma.machine.upsert({
    where: { name: "Crawford" },
    update: {},
    create: { name: "Crawford", siteId: sainteSophie.id },
  });

  const sinclair = await prisma.machine.upsert({
    where: { name: "Sinclair" },
    update: {},
    create: { name: "Sinclair", siteId: sainteSophie.id },
  });

  // Mirrors the WISE-4050 the debug page already talks to (192.168.1.1) —
  // its 4 DI channels are exactly why ChannelConfig caps channelNumber at 4.
  const wise4050 = await prisma.device.upsert({
    where: { macAddress: "00:0D:E0:AA:BB:01" },
    update: {},
    create: {
      machineId: roda.id,
      macAddress: "00:0D:E0:AA:BB:01",
      ipAddress: "192.168.1.1",
      username: "root",
      passwordHash: "$argon2id$seed-placeholder-hash-1",
      description: "WISE-4050 digital I/O module",
    },
  });

  const deviceA = await prisma.device.upsert({
    where: { macAddress: "00:0D:E0:AA:BB:02" },
    update: {},
    create: {
      machineId: crawford.id,
      macAddress: "00:0D:E0:AA:BB:02",
      ipAddress: "192.168.1.2",
      username: "root",
      passwordHash: "$argon2id$seed-placeholder-hash-2",
    },
  });

  const deviceB = await prisma.device.upsert({
    where: { macAddress: "00:0D:E0:AA:BB:03" },
    update: {},
    create: {
      machineId: sinclair.id,
      macAddress: "00:0D:E0:AA:BB:03",
      ipAddress: "192.168.1.3",
      username: "root",
      passwordHash: "$argon2id$seed-placeholder-hash-3",
    },
  });

  // wise4050: all 4 channels wired up.
  for (const channelNumber of [1, 2, 3, 4]) {
    await prisma.channelConfig.upsert({
      where: { deviceId_channelNumber: { deviceId: wise4050.id, channelNumber } },
      update: {},
      create: { deviceId: wise4050.id, channelNumber, mode: 0, signalLogicStatus: 0 },
    });
  }

  // deviceA: only channels 1-2 are actually in use.
  for (const channelNumber of [1, 2]) {
    await prisma.channelConfig.upsert({
      where: { deviceId_channelNumber: { deviceId: deviceA.id, channelNumber } },
      update: {},
      create: { deviceId: deviceA.id, channelNumber, mode: 0, signalLogicStatus: 0 },
    });
  }

  // deviceB: channel 1 exists but paused, exercising isPaused.
  await prisma.channelConfig.upsert({
    where: { deviceId_channelNumber: { deviceId: deviceB.id, channelNumber: 1 } },
    update: {},
    create: { deviceId: deviceB.id, channelNumber: 1, mode: 0, signalLogicStatus: 0, isPaused: true },
  });

  console.log("Seed complete:");
  console.log(`  Sites: ${mirabel.name}, ${sainteSophie.name}`);
  console.log(`  Machines: ${roda.name}, ${crawford.name}, ${sinclair.name}`);
  console.log(`  Devices: ${wise4050.macAddress}, ${deviceA.macAddress}, ${deviceB.macAddress}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
