import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity,
  Antenna,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bolt,
  Check,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock3,
  Cpu,
  Eye,
  EyeOff,
  Gauge,
  LayoutDashboard,
  ListTree,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Radio,
  RadioTower,
  Search,
  ShieldCheck,
  Signal,
  Thermometer,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import {
  activeFaults,
  antennaSnapshot,
  communicationDevices,
  eventRecords,
  hardwareSnapshot,
  monitoringSections,
  severityLabels,
  telemetryTrend,
  type MonitoringSection,
  type Severity,
} from "@/lib/lcu-data";

type AuthState = "checking" | "signed-out" | "signed-in";

const sectionIcons: Record<MonitoringSection, LucideIcon> = {
  overview: LayoutDashboard,
  antenna: Antenna,
  hardware: Cpu,
  communications: Radio,
  faults: TriangleAlert,
  events: ListTree,
};

const statusClasses: Record<Severity, string> = {
  normal: "border-status-normal/20 bg-status-normal/10 text-status-normal",
  warning: "border-status-warning/20 bg-status-warning/10 text-status-warning",
  critical: "border-status-critical/20 bg-status-critical/10 text-status-critical",
  info: "border-status-info/20 bg-status-info/10 text-status-info",
};

const chartColors: Record<"temperature" | "voltage" | "current", string> = {
  temperature: "var(--color-chart-3)",
  voltage: "var(--color-chart-1)",
  current: "var(--color-chart-2)",
};

const chartUnits = { temperature: "°C", voltage: "V", current: "A" } as const;
const chartNames = { temperature: "Enclosure temperature", voltage: "Supply voltage", current: "Load current" } as const;

export function LcuConsole() {
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [operatorEmail, setOperatorEmail] = useState("");

  useEffect(() => {
    let isMounted = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      setOperatorEmail(session?.user.email ?? "");
      setAuthState(session?.user ? "signed-in" : "signed-out");
    });

    void supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!isMounted) return;
        const user = error ? null : data.user;
        setOperatorEmail(user?.email ?? "");
        setAuthState(user ? "signed-in" : "signed-out");
      })
      .catch(() => {
        if (!isMounted) return;
        setOperatorEmail("");
        setAuthState("signed-out");
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (authState === "checking") return <LoadingScreen />;
  if (authState === "signed-out") {
    return (
      <SignInScreen
        onSignedIn={(email) => {
          setOperatorEmail(email);
          setAuthState("signed-in");
        }}
      />
    );
  }

  return (
    <MonitoringDashboard
      operatorEmail={operatorEmail}
      onSignOut={async () => {
        await supabase.auth.signOut();
        setOperatorEmail("");
        setAuthState("signed-out");
      }}
    />
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin text-primary" />
        Verifying operator session
      </div>
    </main>
  );
}

function SignInScreen({ onSignedIn }: { onSignedIn: (email: string) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (signInError || !data.user) {
      setError("Those details couldn’t be verified. Check your email and password, then try again.");
      return;
    }
    onSignedIn(data.user.email ?? email.trim());
  }

  return (
    <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div className="telemetry-grid pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/40" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="grid size-11 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
            <RadioTower className="size-5" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-primary">LCU // CONTROL</p>
            <p className="mt-0.5 text-sm text-muted-foreground">Antenna systems monitor</p>
          </div>
        </div>

        <Card className="rounded-md border-border/80 bg-card/95 shadow-2xl shadow-background/50 backdrop-blur">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2">
                <LockKeyhole className="size-4 text-primary" />
                <p className="font-mono text-[11px] uppercase text-muted-foreground">Operator access</p>
              </div>
              <h1 className="text-2xl font-semibold text-foreground">Sign in to LCU-01</h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Enter your assigned operator email and password to open the monitoring console.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSignIn}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="operator-email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="operator-email"
                    className="h-11 rounded-md border-border bg-background pl-10"
                    type="email"
                    autoComplete="username"
                    placeholder="operator@station.example"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="operator-password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="operator-password"
                    className="h-11 rounded-md border-border bg-background pr-12"
                    type={passwordVisible ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 size-9 -translate-y-1/2 text-muted-foreground"
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    title={passwordVisible ? "Hide password" : "Show password"}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? <EyeOff /> : <Eye />}
                  </Button>
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-2 rounded-md border border-status-critical/25 bg-status-critical/10 px-3 py-2.5 text-sm text-status-critical" role="alert">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              <Button type="submit" className="h-11 w-full rounded-md font-semibold" disabled={submitting}>
                {submitting ? <LoaderCircle className="animate-spin" /> : <span>Continue to console</span>}
                {!submitting ? <ArrowRight /> : null}
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-5">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="size-4 shrink-0 text-status-normal" />
                <span>Protected operator access · Lovable Cloud</span>
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Operator accounts are provisioned by your system administrator.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
          <span className="size-1.5 rounded-full bg-status-warning" />
          Demo environment · no hardware connection
        </div>
      </div>
    </main>
  );
}

function MonitoringDashboard({
  operatorEmail,
  onSignOut,
}: {
  operatorEmail: string;
  onSignOut: () => Promise<void>;
}) {
  const [activeSection, setActiveSection] = useState<MonitoringSection>("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateSample = () => {
      setTick((previous) => previous + 1);
      setNow(new Date());
    };
    setNow(new Date());
    const intervalId = window.setInterval(updateSample, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  const simulatedReadings = {
    temperature: Number((hardwareSnapshot.temperature + Math.sin(tick * 0.6) * 0.12).toFixed(1)),
    voltage: Number((hardwareSnapshot.voltage + Math.cos(tick * 0.5) * 0.03).toFixed(2)),
    current: Number((hardwareSnapshot.current + Math.sin(tick * 0.8) * 0.04).toFixed(2)),
  };
  const chartData = useMemo(
    () =>
      telemetryTrend.map((point, index) =>
        index === telemetryTrend.length - 1 ? { ...point, ...simulatedReadings } : point,
      ),
    // The simulated series intentionally refreshes in-place on a five-second timer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  );
  const section = monitoringSections.find((item) => item.id === activeSection) ?? monitoringSections[0];
  const displayTime = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "UTC" })
    : "--:--:--";

  function navigateTo(nextSection: MonitoringSection) {
    setActiveSection(nextSection);
    setMobileNavOpen(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {mobileNavOpen ? (
        <Button
          variant="ghost"
          className="fixed inset-0 z-30 h-full w-full cursor-default rounded-none bg-background/65 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[17rem] flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:translate-x-0 ${mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        aria-label="Main navigation"
      >
        <div className="flex h-20 items-center justify-between border-b border-sidebar-border px-5">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md border border-primary/25 bg-primary/10 text-primary">
              <RadioTower className="size-5" />
            </div>
            <div>
              <p className="font-mono text-xs font-semibold uppercase text-sidebar-foreground">LCU / CONTROL</p>
              <p className="mt-1 text-xs text-muted-foreground">Antenna systems</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X />
          </Button>
        </div>

        <div className="px-4 pb-3 pt-5">
          <div className="flex items-center justify-between rounded-md border border-sidebar-border bg-background/50 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <span className="status-pulse size-2 rounded-full bg-status-normal" />
              <span className="text-xs font-medium text-sidebar-foreground">LCU-01</span>
            </div>
            <span className="font-mono text-[10px] uppercase text-status-info">DEMO</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          <p className="mb-3 px-3 font-mono text-[10px] uppercase text-muted-foreground">Monitoring</p>
          {monitoringSections.map((item) => {
            const Icon = sectionIcons[item.id];
            const isActive = activeSection === item.id;
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                className={`h-10 w-full justify-start gap-3 rounded-md px-3 text-left ${isActive ? "bg-sidebar-accent text-sidebar-primary hover:bg-sidebar-accent hover:text-sidebar-primary" : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground"}`}
                aria-current={isActive ? "page" : undefined}
                onClick={() => navigateTo(item.id)}
              >
                <Icon className="size-4" />
                <span className="text-sm">{item.label}</span>
                {isActive ? <ChevronRight className="ml-auto size-3.5" /> : null}
              </Button>
            );
          })}
        </nav>

        <div className="m-4 rounded-md border border-sidebar-border bg-background/45 p-3">
          <div className="mb-2 flex items-center gap-2">
            <Activity className="size-3.5 text-status-info" />
            <span className="font-mono text-[10px] uppercase text-sidebar-foreground">Simulation feed</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">Sample telemetry only. No antenna hardware is connected.</p>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[17rem]">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:px-6 xl:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">LCU-01 · Local control unit</p>
              <p className="hidden font-mono text-[10px] uppercase text-muted-foreground sm:block">Antenna system / control room</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="status-pulse size-1.5 rounded-full bg-status-normal" />
              <span className="font-mono text-[10px] uppercase text-status-normal">Simulated link stable</span>
            </div>
            <div className="hidden text-right md:block">
              <p className="font-mono text-xs tabular-nums text-foreground">{displayTime} UTC</p>
              <p className="text-[10px] text-muted-foreground">Sample clock</p>
            </div>
            <div className="flex items-center gap-2 border-l border-border pl-3 sm:pl-5">
              <div className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-secondary font-mono text-xs font-medium text-secondary-foreground">
                {operatorEmail.slice(0, 2).toUpperCase() || "OP"}
              </div>
              <span className="hidden max-w-40 truncate text-xs text-muted-foreground xl:block">{operatorEmail}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title="Sign out"
                aria-label="Sign out"
                onClick={() => void onSignOut()}
              >
                <LogOut />
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase text-primary">Control unit / LCU-01</p>
              <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">{section.label}</h1>
              <p className="mt-2 text-sm text-muted-foreground">Sample system telemetry · demonstration environment only</p>
            </div>
            <Badge variant="outline" className="rounded-sm border-status-info/25 bg-status-info/10 px-2.5 py-1 font-mono text-[10px] uppercase text-status-info">
              <Activity className="mr-1.5 size-3" />
              Refreshes every 5 seconds
            </Badge>
          </div>

          {activeSection === "overview" ? (
            <OverviewView readings={simulatedReadings} chartData={chartData} onNavigate={navigateTo} acknowledged={acknowledged} onAcknowledge={() => setAcknowledged(true)} />
          ) : null}
          {activeSection === "antenna" ? <AntennaView onNavigate={navigateTo} /> : null}
          {activeSection === "hardware" ? <HardwareView readings={simulatedReadings} chartData={chartData} /> : null}
          {activeSection === "communications" ? <CommunicationsView /> : null}
          {activeSection === "faults" ? <FaultsView acknowledged={acknowledged} onAcknowledge={() => setAcknowledged(true)} /> : null}
          {activeSection === "events" ? <EventLogView /> : null}

          <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4 font-mono text-[10px] uppercase text-muted-foreground">
            <span>LCU-01 / telemetry demonstration</span>
            <span>Last sample refresh {displayTime} UTC</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function OverviewView({
  readings,
  chartData,
  onNavigate,
  acknowledged,
  onAcknowledge,
}: {
  readings: { temperature: number; voltage: number; current: number };
  chartData: typeof telemetryTrend;
  onNavigate: (section: MonitoringSection) => void;
  acknowledged: boolean;
  onAcknowledge: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
        <Card className="overflow-hidden rounded-md border-border bg-card shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-md border border-status-warning/25 bg-status-warning/10 text-status-warning">
                  <Gauge className="size-5" />
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">Overall health</p>
                  <h2 className="mt-1 text-xl font-semibold text-foreground">Operational</h2>
                  <p className="mt-1 text-xs text-muted-foreground">One advisory is being monitored</p>
                </div>
              </div>
              <StatusPill severity="warning" label="Attention" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricTile label="Antenna azimuth" value={antennaSnapshot.azimuth.toFixed(1)} unit="°" icon={Antenna} note="Tracking" severity="normal" onOpen={() => onNavigate("antenna")} />
              <MetricTile label="Elevation" value={antennaSnapshot.elevation.toFixed(1)} unit="°" icon={ArrowUpRight} note="Tracking" severity="normal" onOpen={() => onNavigate("antenna")} />
              <MetricTile label="Enclosure temp" value={readings.temperature.toFixed(1)} unit="°C" icon={Thermometer} note="Stable sample" severity="normal" onOpen={() => onNavigate("hardware")} />
              <MetricTile label="Supply voltage" value={readings.voltage.toFixed(2)} unit="V" icon={Bolt} note="PSU-A sample" severity="normal" onOpen={() => onNavigate("hardware")} />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border bg-card shadow-none">
          <CardContent className="flex h-full flex-col p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Antenna pointing</p>
                <h2 className="mt-1 text-sm font-semibold text-foreground">Current orientation</h2>
              </div>
              <Button variant="ghost" size="icon" className="size-8" aria-label="Open antenna status" title="Open antenna status" onClick={() => onNavigate("antenna")}>
                <ArrowUpRight />
              </Button>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-3 sm:flex-row sm:justify-around">
              <CompassGraphic size="small" />
              <div className="grid w-full grid-cols-2 gap-x-5 gap-y-4 sm:w-auto sm:grid-cols-1">
                <ValuePair label="Azimuth" value={`${antennaSnapshot.azimuth.toFixed(1)}°`} />
                <ValuePair label="Elevation" value={`${antennaSnapshot.elevation.toFixed(1)}°`} />
                <ValuePair label="Polarization" value={antennaSnapshot.polarization} />
                <ValuePair label="Mode" value="Tracking" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <TelemetryChart metric="temperature" data={chartData} />
        <CommunicationsSummary onNavigate={() => onNavigate("communications")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.75fr)]">
        <FaultPreview acknowledged={acknowledged} onAcknowledge={onAcknowledge} onNavigate={() => onNavigate("faults")} />
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Position target</p>
                <h2 className="mt-1 text-sm font-semibold text-foreground">{antennaSnapshot.target}</h2>
              </div>
              <Signal className="size-4 text-status-normal" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md border border-border bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Polarization</p>
                <p className="mt-2 font-mono text-sm text-foreground">{antennaSnapshot.polarization}</p>
              </div>
              <div className="rounded-md border border-border bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Tracking mode</p>
                <p className="mt-2 font-mono text-sm text-foreground">AUTO / LOCK</p>
              </div>
            </div>
            <Button variant="ghost" className="mt-4 h-8 px-0 text-xs text-primary hover:bg-transparent" onClick={() => onNavigate("antenna")}>
              Antenna details <ArrowRight />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  unit,
  icon: Icon,
  note,
  severity,
  onOpen,
}: {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  note: string;
  severity: Severity;
  onOpen: () => void;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background/45 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Icon className={`size-4 ${severity === "warning" ? "text-status-warning" : "text-status-info"}`} />
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label={`Open ${label} details`} title={`Open ${label} details`} onClick={onOpen}>
          <ArrowUpRight />
        </Button>
      </div>
      <p className="truncate text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-mono text-xl font-medium tabular-nums text-foreground">
        {value}<span className="ml-1 text-xs text-muted-foreground">{unit}</span>
      </p>
      <p className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <span className={`size-1.5 rounded-full ${severity === "warning" ? "bg-status-warning" : "bg-status-normal"}`} />
        {note}
      </p>
    </div>
  );
}

function StatusPill({ severity, label }: { severity: Severity; label?: string }) {
  return (
    <Badge variant="outline" className={`rounded-sm px-2 py-1 text-[10px] uppercase ${statusClasses[severity]}`}>
      <span className={`mr-1.5 size-1.5 rounded-full ${severity === "normal" ? "bg-status-normal" : severity === "warning" ? "bg-status-warning" : severity === "critical" ? "bg-status-critical" : "bg-status-info"}`} />
      {label ?? severityLabels[severity]}
    </Badge>
  );
}

function ValuePair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-mono text-sm tabular-nums text-foreground">{value}</p>
    </div>
  );
}

function TelemetryChart({
  metric,
  data,
  compact = false,
}: {
  metric: keyof typeof chartUnits;
  data: typeof telemetryTrend;
  compact?: boolean;
}) {
  const color = chartColors[metric];
  const unit = chartUnits[metric];
  const latest = data[data.length - 1]?.[metric] ?? 0;
  const gradientId = `fill-${metric}`;
  return (
    <Card className="rounded-md border-border bg-card shadow-none">
      <CardContent className={compact ? "p-4" : "p-5 sm:p-6"}>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Hardware telemetry / sample</p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">{chartNames[metric]}</h2>
          </div>
          <div className="text-right">
            <p className="font-mono text-xl tabular-nums text-foreground">{Number(latest).toFixed(metric === "temperature" ? 1 : 2)} <span className="text-xs text-muted-foreground">{unit}</span></p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">Rolling 45 min</p>
          </div>
        </div>
        <div className={compact ? "h-40" : "h-56 sm:h-64"}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} minTickGap={28} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} domain={[(min: number) => Number((min - (metric === "temperature" ? 1.5 : 0.4)).toFixed(1)), (max: number) => Number((max + (metric === "temperature" ? 1.5 : 0.4)).toFixed(1))]} />
              <Tooltip
                contentStyle={{ backgroundColor: "var(--popover)", borderColor: "var(--border)", color: "var(--foreground)", borderRadius: "var(--radius)" }}
                itemStyle={{ color }}
                labelStyle={{ color: "var(--muted-foreground)" }}
                formatter={(value) => [`${Number(value).toFixed(2)} ${unit}`, chartNames[metric]]}
              />
              <Area type="monotone" dataKey={metric} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} activeDot={{ r: 4, fill: color, stroke: "var(--card)" }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase text-muted-foreground">
          <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} />
          Simulated sample stream
        </div>
      </CardContent>
    </Card>
  );
}

function CommunicationsSummary({ onNavigate }: { onNavigate: () => void }) {
  const visibleDevices = communicationDevices.filter((device) => device.status === "Online").slice(0, 3);
  return (
    <Card className="rounded-md border-border bg-card shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Device links / simulation</p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">Communications</h2>
          </div>
          <StatusPill severity="normal" label="Stable" />
        </div>
        <div className="space-y-1">
          {visibleDevices.map((device) => (
            <div key={device.id} className="flex items-center justify-between gap-3 border-b border-border/70 py-3 last:border-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid size-8 shrink-0 place-items-center rounded-md bg-status-normal/10 text-status-normal">
                  <Radio className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-foreground">{device.name}</p>
                  <p className="mt-1 font-mono text-[10px] text-muted-foreground">{device.id} / {device.link}</p>
                </div>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">{device.latency}</span>
            </div>
          ))}
        </div>
        <Button variant="ghost" className="mt-2 h-8 px-0 text-xs text-primary hover:bg-transparent" onClick={onNavigate}>
          View all simulated links <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}

function FaultPreview({
  acknowledged,
  onAcknowledge,
  onNavigate,
}: {
  acknowledged: boolean;
  onAcknowledge: () => void;
  onNavigate: () => void;
}) {
  const fault = activeFaults[0];
  if (!fault) return null;
  return (
    <Card className="rounded-md border-status-warning/20 bg-card shadow-none">
      <CardContent className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-4 text-status-warning" />
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Active advisory</p>
          </div>
          <StatusPill severity="warning" label={acknowledged ? "Acknowledged" : "Warning"} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-sm font-semibold text-foreground">{fault.title}</h2>
            <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{fault.detail}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] text-muted-foreground">
              <span>{fault.code}</span><span>{fault.source}</span><span>First seen {fault.firstSeen}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {!acknowledged ? (
              <Button variant="outline" size="sm" className="h-8 rounded-md text-xs" onClick={onAcknowledge}>
                <Check /> Acknowledge
              </Button>
            ) : null}
            <Button variant="ghost" size="icon" className="size-8" title="Open fault monitor" aria-label="Open fault monitor" onClick={onNavigate}>
              <ArrowUpRight />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AntennaView({ onNavigate }: { onNavigate: (section: MonitoringSection) => void }) {
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)]">
      <Card className="rounded-md border-border bg-card shadow-none">
        <CardContent className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Position reference / sample</p>
              <h2 className="mt-1 text-base font-semibold text-foreground">Azimuth and elevation</h2>
            </div>
            <StatusPill severity="normal" label="Tracking" />
          </div>
          <div className="grid items-center gap-6 md:grid-cols-[minmax(240px,0.9fr)_minmax(240px,1fr)]">
            <div className="flex justify-center rounded-md border border-border bg-background/45 p-3 sm:p-5">
              <CompassGraphic size="large" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <ReadingBlock label="Azimuth" value={antennaSnapshot.azimuth.toFixed(1)} unit="°" icon={Antenna} />
              <ReadingBlock label="Elevation" value={antennaSnapshot.elevation.toFixed(1)} unit="°" icon={ArrowUpRight} />
              <ReadingBlock label="Polarization" value={antennaSnapshot.polarization} unit="" icon={Signal} />
              <ReadingBlock label="Tracking mode" value="AUTO" unit="" icon={Activity} />
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="space-y-4">
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardContent className="p-5">
            <p className="font-mono text-[10px] uppercase text-muted-foreground">Target configuration</p>
            <h2 className="mt-2 text-base font-semibold text-foreground">{antennaSnapshot.target}</h2>
            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <ValuePair label="Polarization" value={antennaSnapshot.polarization} />
              <ValuePair label="Pointing mode" value={antennaSnapshot.mode} />
              <ValuePair label="Position source" value="Simulated encoder" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-md border-status-info/20 bg-status-info/5 shadow-none">
          <CardContent className="flex gap-3 p-4">
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-status-info" />
            <p className="text-xs leading-5 text-muted-foreground">Position values are sample readings for demonstration. This view does not command or control antenna hardware.</p>
          </CardContent>
        </Card>
        <Button variant="outline" className="w-full justify-between rounded-md" onClick={() => onNavigate("events")}>
          View position history <ArrowRight />
        </Button>
      </div>
    </div>
  );
}

function CompassGraphic({ size }: { size: "small" | "large" }) {
  const dimension = size === "small" ? "size-36 sm:size-40" : "size-full max-w-[340px]";
  return (
    <svg className={`${dimension} text-muted-foreground`} viewBox="0 0 260 260" role="img" aria-label={`Sample antenna direction, azimuth ${antennaSnapshot.azimuth.toFixed(1)} degrees`}>
      <circle cx="130" cy="130" r="110" fill="none" stroke="var(--color-border)" strokeDasharray="2 6" />
      <circle cx="130" cy="130" r="82" fill="none" stroke="var(--color-border)" />
      <circle cx="130" cy="130" r="52" fill="none" stroke="var(--color-border)" strokeDasharray="3 5" />
      <line x1="130" y1="20" x2="130" y2="240" stroke="var(--color-border)" />
      <line x1="20" y1="130" x2="240" y2="130" stroke="var(--color-border)" />
      <text x="130" y="13" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="var(--font-mono)">N</text>
      <text x="250" y="134" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="var(--font-mono)">E</text>
      <text x="130" y="257" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="var(--font-mono)">S</text>
      <text x="10" y="134" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="var(--font-mono)">W</text>
      <g transform={`rotate(${antennaSnapshot.azimuth} 130 130)`}>
        <line x1="130" y1="130" x2="130" y2="33" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
        <path d="M130 23 L123 39 L130 35 L137 39 Z" fill="var(--color-primary)" />
      </g>
      <circle cx="130" cy="130" r="5" fill="var(--color-foreground)" />
    </svg>
  );
}

function ReadingBlock({ label, value, unit, icon: Icon }: { label: string; value: string; unit: string; icon: LucideIcon }) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background/50 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <Icon className="size-4 shrink-0 text-status-info" />
      </div>
      <p className="truncate font-mono text-xl tabular-nums text-foreground sm:text-2xl">{value}<span className="ml-1 text-xs text-muted-foreground">{unit}</span></p>
    </div>
  );
}

function HardwareView({
  readings,
  chartData,
}: {
  readings: { temperature: number; voltage: number; current: number };
  chartData: typeof telemetryTrend;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ReadingBlock label="Power supply" value={hardwareSnapshot.power} unit="" icon={Bolt} />
        <ReadingBlock label="Enclosure temperature" value={readings.temperature.toFixed(1)} unit="°C" icon={Thermometer} />
        <ReadingBlock label="Supply voltage" value={readings.voltage.toFixed(2)} unit="V" icon={Activity} />
        <ReadingBlock label="Load current" value={readings.current.toFixed(2)} unit="A" icon={Gauge} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TelemetryChart metric="temperature" data={chartData} />
        <TelemetryChart metric="voltage" data={chartData} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TelemetryChart metric="current" data={chartData} />
        <Card className="rounded-md border-border bg-card shadow-none">
          <CardContent className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">Power subsystem</p>
                <h2 className="mt-1 text-sm font-semibold text-foreground">Supply health</h2>
              </div>
              <Bolt className="size-4 text-status-normal" />
            </div>
            <div className="space-y-3">
              {[{ name: "Primary supply · PSU-A", load: "63%", state: "Normal" }, { name: "Redundant supply · PSU-B", load: "Standby", state: "Ready" }].map((supply) => (
                <div key={supply.name} className="flex items-center justify-between gap-3 rounded-md border border-border bg-background/45 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-foreground">{supply.name}</p>
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">Load / {supply.load}</p>
                  </div>
                  <StatusPill severity="normal" label={supply.state} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-muted-foreground">Power and sensor values are simulated for this demonstration.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CommunicationsView() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ReadingBlock label="Sample links online" value="3 / 4" unit="" icon={Radio} />
        <ReadingBlock label="Mean round-trip" value="8.3" unit="ms" icon={Clock3} />
        <ReadingBlock label="Average link quality" value="98.1" unit="%" icon={Signal} />
      </div>
      <Card className="rounded-md border-border bg-card shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Interface status / simulated</p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">Connected device links</h2>
            </div>
            <StatusPill severity="info" label="Demo network" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {communicationDevices.map((device) => (
              <div key={device.id} className="rounded-md border border-border bg-background/45 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`grid size-9 shrink-0 place-items-center rounded-md ${device.status === "Online" ? "bg-status-normal/10 text-status-normal" : "bg-muted text-muted-foreground"}`}>
                      {device.status === "Online" ? <Radio className="size-4" /> : <RadioTower className="size-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{device.name}</p>
                      <p className="mt-1 font-mono text-[10px] text-muted-foreground">{device.id}</p>
                    </div>
                  </div>
                  <StatusPill severity={device.status === "Online" ? "normal" : "info"} label={device.status} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3">
                  <ValuePair label="Interface" value={device.link} />
                  <ValuePair label="Latency" value={device.latency} />
                  <ValuePair label="Quality" value={device.status === "Online" ? `${device.quality}%` : "—"} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">These connection states are examples only; no devices are being polled.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function FaultsView({ acknowledged, onAcknowledge }: { acknowledged: boolean; onAcknowledge: () => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <ReadingBlock label="Active advisories" value="1" unit="" icon={TriangleAlert} />
        <ReadingBlock label="Critical alarms" value="0" unit="" icon={CircleCheck} />
        <ReadingBlock label="Acknowledged" value={acknowledged ? "1" : "0"} unit="" icon={Check} />
      </div>
      <Card className="rounded-md border-border bg-card shadow-none">
        <CardContent className="p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase text-muted-foreground">Alarm queue / sample</p>
              <h2 className="mt-1 text-sm font-semibold text-foreground">Active fault monitor</h2>
            </div>
            <StatusPill severity="warning" label="1 advisory" />
          </div>
          {activeFaults.map((fault) => (
            <div key={fault.code} className="rounded-md border border-status-warning/25 bg-status-warning/5 p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-md bg-status-warning/10 text-status-warning">
                    <TriangleAlert className="size-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{fault.title}</h3>
                      <StatusPill severity="warning" label={acknowledged ? "Acknowledged" : "Warning"} />
                    </div>
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{fault.detail}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[10px] uppercase text-muted-foreground">
                      <span>{fault.code}</span><span>Source / {fault.source}</span><span>First seen / {fault.firstSeen}</span>
                    </div>
                  </div>
                </div>
                {!acknowledged ? (
                  <Button variant="outline" size="sm" className="rounded-md" onClick={onAcknowledge}>
                    <Check /> Acknowledge
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <div className="mt-5 rounded-md border border-border bg-background/45 p-4">
            <p className="mb-3 font-mono text-[10px] uppercase text-muted-foreground">Recent resolved events</p>
            <div className="space-y-3">
              {eventRecords.filter((event) => event.severity === "normal" && event.type === "Hardware").map((event) => (
                <div key={event.time} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 text-foreground"><CircleCheck className="size-3.5 text-status-normal" />{event.message}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{event.time} / {event.source}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Acknowledgement changes only this local demonstration state.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function EventLogView() {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState("all");
  const filteredEvents = eventRecords.filter((event) => {
    const matchesSearch = `${event.source} ${event.type} ${event.message}`.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === "all" || event.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <Card className="rounded-md border-border bg-card shadow-none">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            <p className="font-mono text-[10px] uppercase text-muted-foreground">System activity / sample</p>
            <h2 className="mt-1 text-sm font-semibold text-foreground">Event history</h2>
            <p className="mt-1 text-xs text-muted-foreground">{filteredEvents.length} of {eventRecords.length} sample entries</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <div className="relative min-w-0 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-9 rounded-md border-border bg-background pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search events"
                aria-label="Search event log"
              />
            </div>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="h-9 w-full rounded-md border-border bg-background sm:w-40" aria-label="Filter event severity">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severities</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="whitespace-nowrap pl-5 font-mono text-[10px] uppercase sm:pl-6">Time · UTC</TableHead>
              <TableHead className="font-mono text-[10px] uppercase">Source</TableHead>
              <TableHead className="font-mono text-[10px] uppercase">Type</TableHead>
              <TableHead className="font-mono text-[10px] uppercase">Severity</TableHead>
              <TableHead className="min-w-56 pr-5 font-mono text-[10px] uppercase sm:pr-6">Message</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={`${event.time}-${event.source}`} className="border-border/70">
                <TableCell className="whitespace-nowrap pl-5 font-mono text-[11px] tabular-nums text-muted-foreground sm:pl-6">{event.time}</TableCell>
                <TableCell className="whitespace-nowrap font-mono text-xs text-foreground">{event.source}</TableCell>
                <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{event.type}</TableCell>
                <TableCell><StatusPill severity={event.severity} /></TableCell>
                <TableCell className="pr-5 text-xs leading-5 text-foreground sm:pr-6">{event.message}</TableCell>
              </TableRow>
            ))}
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-28 text-center text-sm text-muted-foreground">No matching events.</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}