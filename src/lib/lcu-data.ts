export const monitoringSections = [
  { id: "overview", label: "System overview", shortLabel: "Overview" },
  { id: "antenna", label: "Antenna status", shortLabel: "Antenna" },
  { id: "hardware", label: "Hardware monitoring", shortLabel: "Hardware" },
  { id: "communications", label: "Communication status", shortLabel: "Comms" },
  { id: "faults", label: "Fault monitoring", shortLabel: "Faults" },
  { id: "events", label: "Event logs", shortLabel: "Event log" },
] as const;

export type MonitoringSection = (typeof monitoringSections)[number]["id"];
export type Severity = "normal" | "warning" | "critical" | "info";

export const antennaSnapshot = {
  azimuth: 142.6,
  elevation: 36.2,
  polarization: "RHCP",
  mode: "Satellite tracking",
  target: "GEO-7 / 127.0° W",
};

export const hardwareSnapshot = {
  temperature: 43.8,
  voltage: 27.4,
  current: 1.62,
  power: "Nominal",
  uptime: "18d 06h 42m",
};

export const communicationDevices = [
  { name: "Antenna control unit", id: "ACU-01", link: "RS-422", latency: "4.8 ms", quality: 99.8, status: "Online" },
  { name: "GNSS receiver", id: "GNSS-02", link: "Ethernet", latency: "12 ms", quality: 98.4, status: "Online" },
  { name: "Remote I/O module", id: "RIO-01", link: "Modbus TCP", latency: "8.2 ms", quality: 96.2, status: "Online" },
  { name: "Maintenance console", id: "MNT-04", link: "Ethernet", latency: "—", quality: 0, status: "Standby" },
] as const;

export const activeFaults = [
  {
    code: "FLT-204",
    title: "Elevation servo response delay",
    detail: "Command acknowledgement arrived outside the preferred response window.",
    severity: "warning" as const,
    firstSeen: "18:41:08 UTC",
    source: "ACU-01",
  },
];

export const eventRecords = [
  { time: "18:45:32", source: "LCU-01", type: "Telemetry", severity: "normal" as const, message: "Health snapshot received" },
  { time: "18:44:17", source: "ACU-01", type: "Motion", severity: "info" as const, message: "Azimuth tracking update applied" },
  { time: "18:41:08", source: "ACU-01", type: "Fault", severity: "warning" as const, message: "Elevation servo response delay detected" },
  { time: "18:39:56", source: "GNSS-02", type: "Connection", severity: "normal" as const, message: "Receiver link quality stable at 98.4%" },
  { time: "18:36:21", source: "PSU-A", type: "Hardware", severity: "normal" as const, message: "Supply voltage within nominal range" },
  { time: "18:30:04", source: "LCU-01", type: "System", severity: "info" as const, message: "Operator session established" },
  { time: "18:22:49", source: "RIO-01", type: "Connection", severity: "normal" as const, message: "Remote I/O heartbeat received" },
  { time: "18:16:12", source: "LCU-01", type: "System", severity: "info" as const, message: "Configuration checksum verified" },
  { time: "18:09:43", source: "ACU-01", type: "Motion", severity: "normal" as const, message: "Elevation tracking within tolerance" },
  { time: "17:58:07", source: "PSU-B", type: "Hardware", severity: "normal" as const, message: "Redundant supply self-check passed" },
] as const;

export const telemetryTrend = [
  { time: "18:00", temperature: 42.1, voltage: 27.3, current: 1.4 },
  { time: "18:05", temperature: 42.4, voltage: 27.4, current: 1.5 },
  { time: "18:10", temperature: 42.2, voltage: 27.4, current: 1.45 },
  { time: "18:15", temperature: 42.6, voltage: 27.3, current: 1.52 },
  { time: "18:20", temperature: 42.8, voltage: 27.5, current: 1.58 },
  { time: "18:25", temperature: 43.0, voltage: 27.4, current: 1.55 },
  { time: "18:30", temperature: 43.1, voltage: 27.4, current: 1.57 },
  { time: "18:35", temperature: 43.3, voltage: 27.5, current: 1.61 },
  { time: "18:40", temperature: 43.6, voltage: 27.4, current: 1.64 },
  { time: "18:45", temperature: 43.8, voltage: 27.4, current: 1.62 },
];

export const severityLabels: Record<Severity, string> = {
  normal: "Normal",
  warning: "Warning",
  critical: "Critical",
  info: "Info",
};