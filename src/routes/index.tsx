import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  LayoutDashboard,
  Menu,
  Plus,
  QrCode,
  ScanLine,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QPayslip Dashboard | Payroll control center" },
      { name: "description", content: "Run payroll, track attendance, manage employees, and issue verified payslips." },
      { property: "og:title", content: "QPayslip Dashboard" },
      { property: "og:description", content: "A calm payroll control center for small businesses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Section = "Home" | "Payslips" | "Attendance" | "Employees" | "Reports";

type Employee = {
  id: string;
  full_name: string;
  employee_code: string;
  designation: string | null;
  department: string | null;
  monthly_salary: number;
  status: string;
};

const demoEmployees: Employee[] = [
  { id: "maya", full_name: "Maya Reyes", employee_code: "QP-001", designation: "Store lead", department: "Operations", monthly_salary: 1840, status: "ACTIVE" },
  { id: "diego", full_name: "Diego Ortiz", employee_code: "QP-002", designation: "Barista", department: "Front of house", monthly_salary: 1520, status: "ACTIVE" },
  { id: "priya", full_name: "Priya Lal", employee_code: "QP-003", designation: "Bookkeeper", department: "Finance", monthly_salary: 2240, status: "ACTIVE" },
  { id: "tomas", full_name: "Tomas Novak", employee_code: "QP-004", designation: "Workshop lead", department: "Operations", monthly_salary: 1980, status: "ACTIVE" },
  { id: "lena", full_name: "Lena Fischer", employee_code: "QP-005", designation: "Sales associate", department: "Retail", monthly_salary: 1680, status: "ACTIVE" },
];

const activity = [
  { initials: "MR", name: "Maya Reyes", detail: "Biweekly payslip · QR verified", amount: "$1,840.00", status: "Paid" },
  { initials: "DO", name: "Diego Ortiz", detail: "Overtime approval · 6 hrs", amount: "$312.00", status: "Pending" },
  { initials: "PL", name: "Priya Lal", detail: "Deduction update · QR verified", amount: "−$220.00", status: "Applied" },
  { initials: "TN", name: "Tomas Novak", detail: "Shift swap logged · QR verified", amount: "$96.00", status: "Logged" },
];

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function Index() {
  const [section, setSection] = useState<Section>("Home");
  const [employees, setEmployees] = useState<Employee[]>(demoEmployees);
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null);
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (mounted && data.user) setUser({ email: data.user.email, name: data.user.user_metadata?.full_name });
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser({ email: session.user.email, name: session.user.user_metadata?.full_name });
      else setUser(null);
    });
    return () => { mounted = false; data.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 3600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const totalPayroll = useMemo(() => employees.reduce((sum, employee) => sum + Number(employee.monthly_salary), 0), [employees]);
  const displayName = user?.name?.split(" ")[0] ?? "Ava";

  async function signIn() {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setNotice("Sign in was not completed. Please try again.");
  }

  async function saveEmployee(values: { name: string; code: string; role: string; salary: string }) {
    if (!user) {
      setShowEmployeeForm(false);
      setNotice("Sign in to save employee records to your workspace.");
      return;
    }
    setSaving(true);
    const { data: authData } = await supabase.auth.getUser();
    const ownerId = authData.user?.id;
    if (!ownerId) { setSaving(false); setNotice("Your session has expired. Please sign in again."); return; }
    const { data: organization } = await supabase.from("organizations").select("id").eq("owner_id", ownerId).maybeSingle();
    let organizationId = organization?.id;
    if (!organizationId) {
      const created = await supabase.from("organizations").insert({ owner_id: ownerId, name: "Auren Counter", business_type: "Local business" }).select("id").single();
      organizationId = created.data?.id;
    }
    if (!organizationId) { setSaving(false); setNotice("We could not prepare your business workspace."); return; }
    const created = await supabase.from("employees").insert({ organization_id: organizationId, employee_code: values.code, full_name: values.name, designation: values.role, monthly_salary: Number(values.salary) || 0, avatar_seed: values.name }).select("id, full_name, employee_code, designation, department, monthly_salary, status").single();
    setSaving(false);
    if (created.error || !created.data) { setNotice(created.error?.message ?? "Employee could not be saved."); return; }
    setEmployees((current) => [created.data as Employee, ...current]);
    setShowEmployeeForm(false);
    setNotice("Employee added to your workspace.");
  }

  async function runPayroll() {
    if (!user) { setShowPayroll(false); setNotice("Sign in to create a payroll run."); return; }
    const { data: authData } = await supabase.auth.getUser();
    const ownerId = authData.user?.id;
    if (!ownerId) { setNotice("Your session has expired. Please sign in again."); return; }
    const { data: organization } = await supabase.from("organizations").select("id").eq("owner_id", ownerId).maybeSingle();
    if (!organization?.id) { setNotice("Add an employee first to create your business workspace."); return; }
    const total = employees.reduce((sum, employee) => sum + Number(employee.monthly_salary), 0);
    const result = await supabase.from("payroll_runs").insert({ organization_id: organization.id, period_label: "June 2026", status: "CALCULATED", total_gross: total, total_net: total, employee_count: employees.length }).select("id").single();
    setShowPayroll(false);
    setNotice(result.error ? "Payroll could not be created." : "June payroll calculated and ready for review.");
  }

  const navItems: { label: Section; icon: typeof LayoutDashboard }[] = [
    { label: "Home", icon: LayoutDashboard },
    { label: "Payslips", icon: WalletCards },
    { label: "Attendance", icon: CalendarDays },
    { label: "Employees", icon: UsersRound },
    { label: "Reports", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-surface text-ink antialiased">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-4 px-4 py-4 sm:px-6 md:gap-8 md:px-8 md:py-8">
        <aside className="hidden w-56 shrink-0 flex-col md:flex">
          <Brand />
          <nav className="mt-7 flex flex-col gap-1">
            {navItems.map(({ label, icon: Icon }) => <NavItem key={label} label={label} icon={Icon} active={section === label} onClick={() => setSection(label)} />)}
          </nav>
          <div className="mt-auto rounded-lg border border-line bg-white/60 px-3 py-3">
            <div className="flex items-center gap-2.5">
              <Avatar label={user?.name ?? "AK"} />
              <div className="min-w-0 leading-tight"><p className="truncate text-xs font-semibold">{user?.name ?? "Ava Kwan"}</p><p className="font-mono text-[10px] text-ink-soft">{user ? "Owner · signed in" : "Owner · demo mode"}</p></div>
            </div>
            {!user && <button onClick={() => void signIn()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-primary-foreground transition hover:bg-ink/90">Continue with Google <ArrowRight className="size-3.5" /></button>}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-4 flex items-center justify-between gap-3 md:mb-6">
            <div className="flex items-center gap-3">
              <button className="grid size-9 place-items-center rounded-lg border border-line bg-white/70 text-ink-soft md:hidden" onClick={() => setShowMobileMenu((open) => !open)} aria-label="Open navigation"><Menu className="size-4" /></button>
              <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">Fri, 6 Jun · Payroll week</p><h1 className="font-display text-xl font-bold tracking-tight md:text-2xl">Good morning, {displayName}</h1></div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-full border border-line bg-white/70 px-3 py-1.5 text-xs font-semibold text-accent sm:inline-flex"><span className="size-1.5 rounded-full bg-accent" />24 of 24 verified</span>
              <button className="grid size-9 place-items-center rounded-lg border border-line bg-white/70 text-ink-soft transition hover:-translate-y-0.5 hover:text-ink" aria-label="Notifications"><Bell className="size-4" /></button>
            </div>
          </header>

          {showMobileMenu && <div className="glass-panel mb-4 grid grid-cols-2 gap-1 rounded-xl p-2 md:hidden">{navItems.map(({ label, icon: Icon }) => <NavItem key={label} label={label} icon={Icon} active={section === label} onClick={() => { setSection(label); setShowMobileMenu(false); }} mobile />)}</div>}

          {section === "Home" && <Dashboard totalPayroll={totalPayroll} employeeCount={employees.length} onRunPayroll={() => setShowPayroll(true)} onAddEmployee={() => setShowEmployeeForm(true)} onNavigate={setSection} />}
          {section === "Employees" && <Employees employees={employees} onAdd={() => setShowEmployeeForm(true)} />}
          {section === "Payslips" && <Payslips totalPayroll={totalPayroll} employeeCount={employees.length} />}
          {section === "Attendance" && <Attendance employees={employees} />}
          {section === "Reports" && <Reports totalPayroll={totalPayroll} employeeCount={employees.length} />}

          <div className="mt-4 grid grid-cols-4 gap-1 rounded-[18px] border border-line bg-white/70 p-1.5 backdrop-blur-md md:hidden">
            {navItems.slice(0, 4).map(({ label, icon: Icon }) => <button key={label} onClick={() => setSection(label)} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-medium", section === label ? "bg-ink text-primary-foreground" : "text-ink-soft")}><Icon className="size-4" /><span className="truncate">{label === "Attendance" ? "Today" : label}</span></button>)}
          </div>
        </main>
      </div>

      {notice && <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl bg-ink px-4 py-3 text-xs font-medium text-primary-foreground shadow-xl"><Check className="size-4 text-accent-soft" />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X className="size-3.5 text-primary-foreground/60" /></button></div>}
      {showEmployeeForm && <EmployeeDialog onClose={() => setShowEmployeeForm(false)} onSave={saveEmployee} saving={saving} />}
      {showPayroll && <PayrollDialog onClose={() => setShowPayroll(false)} onRun={runPayroll} totalPayroll={totalPayroll} employeeCount={employees.length} />}
    </div>
  );
}

function Dashboard({ totalPayroll, employeeCount, onRunPayroll, onAddEmployee, onNavigate }: { totalPayroll: number; employeeCount: number; onRunPayroll: () => void; onAddEmployee: () => void; onNavigate: (section: Section) => void }) {
  return <>
    <section className="ledger-animate relative mb-4 overflow-hidden rounded-[22px] bg-ink p-5 text-primary-foreground ring-1 ring-foreground/10 md:mb-5 md:p-7">
      <div className="pointer-events-none absolute -right-10 -top-16 size-56 rotate-12 rounded-[28px] bg-accent/25 backdrop-blur-xl ring-1 ring-primary-foreground/10" /><div className="pointer-events-none absolute -right-6 top-24 size-40 rotate-12 rounded-[24px] bg-primary-foreground/10 backdrop-blur-xl ring-1 ring-primary-foreground/10" />
      <div className="relative flex flex-wrap items-end justify-between gap-6"><div><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-primary-foreground/50">Net payroll · June week</p><p className="font-display text-4xl font-bold tracking-tight tabular-nums md:text-5xl">{money(totalPayroll)}</p><p className="mt-2 text-sm text-primary-foreground/60">{employeeCount * 2 + 38} payslips generated · <span className="text-accent-soft">all QR-verified</span></p></div><div className="flex items-center gap-4"><div className="grid size-16 place-items-center rounded-[18px] bg-primary-foreground/10 backdrop-blur-xl ring-1 ring-primary-foreground/15"><QrMark /></div><div className="leading-tight"><p className="font-display text-sm font-semibold">Counter clear</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-primary-foreground/50">Seal 9C2 · 08:42</p></div></div></div>
    </section>
    <div className="mb-4 grid grid-cols-2 gap-3 md:mb-5 md:grid-cols-4">
      <Stat label="Attendance" value="94%" detail={`47 of ${employeeCount * 10} present`} delay="ledger-delay-1" />
      <Stat label="Verified" value="24" detail="of 24 payslips" delay="ledger-delay-2" />
      <Stat label="Outstanding" value="$12,480" detail="3 approvals pending" delay="ledger-delay-3" />
      <Stat label="Run due" value="14d" detail="Next cycle 20 Jun" delay="ledger-delay-4" />
    </div>
    <div className="mb-4 grid grid-cols-1 gap-3 md:mb-5 md:gap-4 lg:grid-cols-3">
      <section className="ledger-animate ledger-delay-2 overflow-hidden rounded-[18px] border border-line bg-white/70 backdrop-blur-md transition hover:bg-white lg:col-span-2"><div className="flex items-center justify-between px-4 pt-4 md:px-5"><h2 className="font-display text-base font-semibold tracking-tight">Recent payroll activity</h2><button onClick={() => onNavigate("Payslips")} className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft hover:text-accent">Last 7 days</button></div><div className="divide-y divide-line">{activity.map((item, index) => <ActivityRow key={item.name} item={item} index={index} />)}</div></section>
      <div className="flex flex-col gap-3 md:gap-4"><section className="ledger-animate ledger-delay-3 relative overflow-hidden rounded-[18px] border border-line bg-white/70 p-4 backdrop-blur-md transition hover:bg-white"><div className="pointer-events-none absolute -right-8 -top-8 size-24 rotate-12 rounded-[16px] bg-accent/15 backdrop-blur-xl ring-1 ring-primary-foreground/20" /><div className="relative flex items-center justify-between"><h2 className="font-display text-sm font-semibold tracking-tight">Open a payslip</h2><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent">Quick action</span></div><p className="relative mt-1 text-xs text-ink-soft">Scan employee QR to pull a verified statement.</p><button onClick={() => onNavigate("Payslips")} className="relative mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:-translate-y-0.5"><ScanLine className="size-4" /> Generate payslip</button><button onClick={() => onNavigate("Payslips")} className="relative mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:-translate-y-0.5 hover:bg-accent-soft/40"><ShieldCheck className="size-4 text-accent" /> Verify QR badge</button></section><section className="ledger-animate ledger-delay-4 rounded-[18px] border border-line bg-white/70 p-4 backdrop-blur-md transition hover:bg-white"><h2 className="mb-3 font-display text-sm font-semibold tracking-tight">Today at the counter</h2><div className="space-y-2 text-sm"><LineStat label="Present" value="47" /><LineStat label="Late arrivals" value="2" /><LineStat label="On leave" value="1" /></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full w-[94%] rounded-full bg-accent" /></div><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">94% coverage</p></section></div>
    </div>
    <section className="glass-panel ledger-rise flex flex-wrap items-center justify-between gap-4 rounded-[18px] p-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-xl bg-accent-soft text-accent"><UsersRound className="size-5" /></div><div><p className="text-sm font-semibold">Keep the counter current</p><p className="text-xs text-ink-soft">Add an employee or start the next payroll run.</p></div></div><div className="flex w-full gap-2 sm:w-auto"><button onClick={onAddEmployee} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink sm:flex-none"><Plus className="size-3.5" /> Add employee</button><button onClick={onRunPayroll} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-primary-foreground sm:flex-none"><CircleDollarSign className="size-3.5" /> Run payroll</button></div></section>
  </>;
}

function Employees({ employees, onAdd }: { employees: Employee[]; onAdd: () => void }) { return <section className="ledger-animate"><PageHeader eyebrow="People ledger" title="Employees" action={<button onClick={onAdd} className="flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-primary-foreground"><Plus className="size-3.5" /> Add employee</button>} /><div className="glass-panel overflow-hidden rounded-[18px]"><div className="hidden grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-4 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft sm:grid"><span>Employee</span><span>Role</span><span>Department</span><span>Monthly</span><span>Status</span></div>{employees.map((employee) => <div key={employee.id} className="grid gap-3 border-b border-line px-4 py-4 last:border-0 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto] sm:items-center sm:gap-4 sm:px-5"><div className="flex items-center gap-3"><Avatar label={employee.full_name} /><div><p className="text-sm font-semibold">{employee.full_name}</p><p className="font-mono text-[10px] text-ink-soft">{employee.employee_code}</p></div></div><div><p className="font-mono text-[10px] uppercase text-ink-soft sm:hidden">Role</p><p className="text-xs">{employee.designation ?? "—"}</p></div><div><p className="font-mono text-[10px] uppercase text-ink-soft sm:hidden">Department</p><p className="text-xs text-ink-soft">{employee.department ?? "Operations"}</p></div><div><p className="font-mono text-[10px] uppercase text-ink-soft sm:hidden">Monthly</p><p className="font-mono text-xs">{money(employee.monthly_salary)}</p></div><span className="w-fit rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent">{employee.status === "ACTIVE" ? "Active" : employee.status}</span></div>)}</div></section>; }

function Payslips({ totalPayroll, employeeCount }: { totalPayroll: number; employeeCount: number }) { return <section className="ledger-animate"><PageHeader eyebrow="Verified statements" title="Payslips" action={<button className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"><Download className="size-3.5" /> Export</button>} /><div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="June net" value={money(totalPayroll)} detail="Calculated" /><Stat label="Issued" value={String(employeeCount)} detail="employees" /><Stat label="Verified" value="100%" detail="QR sealed" /><Stat label="Status" value="Ready" detail="Review needed" /></div><div className="glass-panel rounded-[18px] p-4 md:p-5"><div className="flex items-center justify-between border-b border-line pb-3"><div><p className="font-display font-semibold">June 2026 · Payroll run</p><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Calculated · Seal 9C2</p></div><span className="flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-1 text-[10px] font-semibold text-accent"><ShieldCheck className="size-3" /> QR verified</span></div>{demoEmployees.slice(0, Math.min(employeeCount, 4)).map((employee) => <div key={employee.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0"><div className="grid size-9 place-items-center rounded-lg bg-paper font-display text-xs font-semibold text-ink">{employee.full_name.split(" ").map((part) => part[0]).join("")}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{employee.full_name}</p><p className="font-mono text-[10px] text-ink-soft">{employee.employee_code} · issued 6 Jun</p></div><span className="font-mono text-xs">{money(employee.monthly_salary)}</span><button className="grid size-8 place-items-center rounded-lg border border-line bg-white text-ink-soft" aria-label={`View ${employee.full_name} payslip`}><ChevronRight className="size-4" /></button></div>)}</div></section>; }

function Attendance({ employees }: { employees: Employee[] }) { return <section className="ledger-animate"><PageHeader eyebrow="Daily coverage" title="Attendance" action={<button className="flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-primary-foreground"><Clock3 className="size-3.5" /> Record check-in</button>} /><div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4"><Stat label="Present" value="47" detail="94% coverage" /><Stat label="Late" value="2" detail="Needs review" /><Stat label="On leave" value="1" detail="Approved" /><Stat label="Missing" value={String(Math.max(0, employees.length * 10 - 48))} detail="Not recorded" /></div><div className="glass-panel rounded-[18px] p-4 md:p-5"><div className="mb-3 flex items-center justify-between"><p className="font-display font-semibold">Today · 6 June 2026</p><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">Live register</span></div>{employees.map((employee, index) => <div key={employee.id} className="flex items-center gap-3 border-b border-line py-3 last:border-0"><Avatar label={employee.full_name} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{employee.full_name}</p><p className="font-mono text-[10px] text-ink-soft">{index === 1 ? "08:12 · late" : "07:58 · checked in"}</p></div><span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", index === 1 ? "bg-paper text-ink-soft" : "bg-accent-soft text-accent")}>{index === 1 ? "Late" : "Present"}</span></div>)}</div></section>; }

function Reports({ totalPayroll, employeeCount }: { totalPayroll: number; employeeCount: number }) { return <section className="ledger-animate"><PageHeader eyebrow="Small business overview" title="Reports" action={<button className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-xs font-semibold text-ink"><Download className="size-3.5" /> Export report</button>} /><div className="grid gap-4 md:grid-cols-2"><section className="glass-panel rounded-[18px] p-5"><div className="flex items-center justify-between"><div><p className="font-display text-lg font-semibold">Payroll movement</p><p className="text-xs text-ink-soft">Last 6 payroll cycles</p></div><BarChart3 className="size-5 text-accent" /></div><div className="mt-7 flex h-36 items-end gap-2">{[48, 66, 54, 76, 72, 92].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-accent/80" style={{ height: `${height}%` }} /><span className="font-mono text-[9px] text-ink-soft">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}</span></div>)}</div></section><section className="glass-panel rounded-[18px] p-5"><div className="flex items-center justify-between"><div><p className="font-display text-lg font-semibold">Verification health</p><p className="text-xs text-ink-soft">Trust signals for June</p></div><ShieldCheck className="size-5 text-accent" /></div><div className="mt-6 space-y-4"><LineStat label="Payslips QR sealed" value="100%" /><LineStat label="Payroll total" value={money(totalPayroll)} /><LineStat label="Employees covered" value={String(employeeCount)} /></div><div className="mt-5 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2 text-xs font-medium text-accent"><Check className="size-4" /> No verification exceptions</div></section></div></section>; }

function PageHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action: React.ReactNode }) { return <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">{eyebrow}</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h2></div>{action}</div>; }
function Stat({ label, value, detail, delay = "" }: { label: string; value: string; detail: string; delay?: string }) { return <div className={cn("ledger-animate ledger-rise rounded-[16px] border border-line bg-white/70 p-4 backdrop-blur-md", delay)}><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</p><p className="mt-2 font-display text-2xl font-bold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs text-ink-soft">{detail}</p></div>; }
function ActivityRow({ item, index }: { item: typeof activity[number]; index: number }) { return <div className="flex items-center gap-3 px-4 py-3 md:px-5"><div className={cn("grid size-9 shrink-0 place-items-center rounded-lg font-display text-xs font-semibold", index % 2 === 0 ? "bg-accent-soft text-accent" : "bg-paper text-ink")}>{item.initials}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="truncate font-mono text-[10px] text-ink-soft">{item.detail}</p></div><span className="font-mono text-xs tabular-nums">{item.amount}</span><span className={cn("hidden rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex", index === 1 ? "bg-paper text-ink-soft" : "bg-accent/10 text-accent")}>{item.status}</span></div>; }
function LineStat({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between text-sm"><span className="text-ink-soft">{label}</span><span className="font-mono font-medium tabular-nums">{value}</span></div>; }
function Brand() { return <div className="flex items-center gap-2.5 px-3"><div className="grid size-9 place-items-center rounded-[10px] bg-ink font-display text-sm font-bold tracking-tight text-primary-foreground">QP</div><div className="leading-tight"><p className="font-display text-sm font-bold tracking-tight">QPayslip</p><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-soft">Payroll OS</p></div></div>; }
function NavItem({ label, icon: Icon, active, onClick, mobile = false }: { label: string; icon: typeof LayoutDashboard; active: boolean; onClick: () => void; mobile?: boolean }) { return <button onClick={onClick} className={cn("flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors", mobile && "justify-center text-xs", active ? "bg-ink font-semibold text-primary-foreground" : "font-medium text-ink-soft hover:bg-white/70 hover:text-ink")}><Icon className="size-4 shrink-0" />{label}</button>; }
function Avatar({ label }: { label: string }) { const initials = label.split(" ").filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); return <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft font-display text-xs font-semibold text-accent">{initials}</div>; }
function QrMark() { return <div className="grid size-8 grid-cols-3 gap-1 rounded-md border-2 border-primary-foreground/80 p-1"><span className="rounded-sm bg-primary-foreground/80" /><span className="rounded-sm bg-accent-soft" /><span className="rounded-sm bg-primary-foreground/80" /><span className="rounded-sm bg-accent-soft" /><span className="rounded-sm bg-primary-foreground/80" /><span className="rounded-sm bg-primary-foreground/80" /><span className="rounded-sm bg-primary-foreground/80" /><span className="rounded-sm bg-primary-foreground/80" /><span className="rounded-sm bg-accent-soft" /></div>; }

function EmployeeDialog({ onClose, onSave, saving }: { onClose: () => void; onSave: (values: { name: string; code: string; role: string; salary: string }) => void; saving: boolean }) { const [values, setValues] = useState({ name: "", code: "", role: "", salary: "" }); const update = (key: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement>) => setValues((current) => ({ ...current, [key]: event.target.value })); return <DialogShell title="Add employee" description="Keep the record simple. You can complete details later." onClose={onClose}><div className="grid gap-3 sm:grid-cols-2"><Field label="Full name" value={values.name} onChange={update("name")} placeholder="Maya Reyes" /><Field label="Employee ID" value={values.code} onChange={update("code")} placeholder="QP-006" /><Field label="Role" value={values.role} onChange={update("role")} placeholder="Store associate" /><Field label="Monthly salary" value={values.salary} onChange={update("salary")} placeholder="1800" type="number" /></div><button disabled={saving || !values.name || !values.code} onClick={() => onSave(values)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Add to workspace"}<ArrowRight className="size-4" /></button></DialogShell>; }
function PayrollDialog({ onClose, onRun, totalPayroll, employeeCount }: { onClose: () => void; onRun: () => void; totalPayroll: number; employeeCount: number }) { return <DialogShell title="Run June payroll" description="Review the deterministic totals before creating this run." onClose={onClose}><div className="space-y-3 rounded-xl bg-paper p-4"><LineStat label="Employees included" value={String(employeeCount)} /><LineStat label="Gross payroll" value={money(totalPayroll)} /><LineStat label="Deductions" value="$0.00" /><div className="border-t border-line pt-3"><LineStat label="Net payroll" value={money(totalPayroll)} /></div></div><button onClick={onRun} className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-primary-foreground">Calculate and review <CircleDollarSign className="size-4" /></button></DialogShell>; }
function DialogShell({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: React.ReactNode }) { return <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 px-4 py-6 backdrop-blur-sm"><div className="glass-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-display text-xl font-bold tracking-tight">{title}</h2><p className="mt-1 text-xs text-ink-soft">{description}</p></div><button onClick={onClose} className="grid size-8 place-items-center rounded-lg border border-line bg-white text-ink-soft" aria-label="Close"><X className="size-4" /></button></div>{children}</div></div>; }
function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; type?: string }) { return <label className="grid gap-1.5"><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-soft">{label}</span><input type={type} value={value} onChange={onChange} placeholder={placeholder} className="h-10 rounded-lg border border-line bg-white/80 px-3 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-accent focus:ring-2 focus:ring-accent/15" /></label>; }
