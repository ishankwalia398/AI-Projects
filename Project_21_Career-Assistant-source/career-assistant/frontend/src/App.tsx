import { Fragment, useState, useEffect, useCallback, useRef, ReactNode, FormEvent } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe2,
  Info,
  LayoutGrid,
  LogOut,
  MessageSquareText,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import StructuredData, { EmploymentEditor } from "./StructuredData";
import {
  ContentEditor,
  RequirementEditor,
  SubmissionReview,
} from "./DocumentEditors";
import { api, downloadContent, setCsrf, statuses } from "./api";
import { date, discoveryTask, pageNumbers, profileSnapshot, taskCompletion, tasksChanged, titleRegions, togglePageSelection } from "./viewLogic";

type Data = Record<string, any>;
type Runner = (operation: () => Promise<any>, message?: string) => Promise<any>;
const nav = [
  { id: "domestic", title: "Domestic Jobs", icon: BriefcaseBusiness },
  { id: "visa", title: "Visa Sponsored Jobs", icon: Globe2 },
  { id: "interview", title: "Interview Questions", icon: MessageSquareText },
  { id: "documents", title: "Generate Documents", icon: FileText },
];
const tabs = [
  ...nav,
  { id: "resume", title: "Resume Library", icon: Upload },
  { id: "profile", title: "Candidate Profile", icon: UserRound },
];

function UserMenu({
  username,
  open,
  setOpen,
  onSettings,
  onLogout,
}: {
  username: string;
  open: boolean;
  setOpen: (value: boolean) => void;
  onSettings: () => void;
  onLogout: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open, setOpen]);
  return (
    <div className="account" ref={ref}>
      <button
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="avatar">{username.slice(0, 2).toUpperCase()}</span>
        <span>{username}</span>
        <ChevronDown size={13} className={open ? "chevron open" : "chevron"} />
      </button>
      {open && (
        <div className="account-menu" role="menu">
          <button role="menuitem" onClick={() => { setOpen(false); onSettings(); }}>
            <Settings2 size={15} />
            Settings
          </button>
          <button role="menuitem" onClick={() => { setOpen(false); onLogout(); }}>
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark">
        <BriefcaseBusiness size={19} />
      </span>
      Career Assistant
    </div>
  );
}
function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={"notice " + (error ? "error" : "")}
      role={error ? "alert" : "status"}
    >
      <Info />
      {children}
    </div>
  );
}
function Modal({
  title,
  children,
  close,
}: {
  title: string;
  children: ReactNode;
  close: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".modal button,.modal input,.modal textarea,.modal select,.modal a[href]",
          ),
        ).filter(
          (el) =>
            el.getAttribute("disabled") === null && el.offsetParent !== null,
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    const prev = document.activeElement as HTMLElement;
    setTimeout(
      () => document.querySelector<HTMLButtonElement>(".modal button")?.focus(),
      0,
    );
    return () => {
      document.removeEventListener("keydown", handler);
      prev?.focus();
    };
  }, []);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button onClick={close} className="ghost" aria-label="Close dialog">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Empty({
  title,
  children,
  icon = "jobs",
}: {
  title: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        {icon === "resume" ? (
          <FileText />
        ) : icon === "interview" ? (
          <MessageSquareText />
        ) : (
          <BriefcaseBusiness />
        )}
      </div>
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Auth({ onLogin }: { onLogin: (u: Data) => void }) {
  const resetToken = new URLSearchParams(location.search).get("reset");
  const [mode, setMode] = useState(resetToken ? "reset" : "login"),
    [show, setShow] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(""),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState("");
  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      if (mode === "login") {
        const u = await api("/auth/login", "POST", { username, password });
        setCsrf(u.csrf_token);
        onLogin(await api("/auth/me"));
      } else if (mode === "register") {
        const r = await api("/auth/register", "POST", {
          email,
          username,
          password,
        });
        setSuccess(r.message);
        setMode("login");
        setPassword("");
      } else if (mode === "forgot") {
        setSuccess(
          (await api("/auth/forgot-password", "POST", { email })).message,
        );
      } else {
        const r = await api("/auth/reset-password", "POST", {
          token: resetToken,
          password,
        });
        setSuccess(r.message);
        setPassword("");
        setMode("login");
        history.replaceState(null, "", "/");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth">
      <section className="auth-story">
        <Brand />
        <div>
          <span className="eyebrow">YOUR CAREER, IN MOTION</span>
          <h1>
            Good things come
            <br />
            from a little
            <br />
            forward motion.
          </h1>
          <p>
            Find opportunities that fit. Put your best work forward. Walk into
            your next interview prepared.
          </p>
        </div>
        <footer>Your experience. Your ambition. Your next chapter.</footer>
      </section>
      <section className="auth-form">
        <span className="eyebrow">LET’S BUILD WHAT’S NEXT</span>
        <h2>
          {mode === "register"
            ? "Start your next chapter."
            : mode === "forgot"
              ? "Forgot your password?"
              : mode === "reset"
                ? "Set a new password."
                : "Welcome back."}
        </h2>
        <p>
          {mode === "register"
            ? "A few details now. Your next opportunity awaits."
            : mode === "login"
              ? "Your career workspace is right where you left it."
              : "We’ll help you get back to your workspace."}
        </p>
        {["login", "register"].includes(mode) && (
          <div className="auth-tabs">
            <button
              className={mode === "login" ? "active" : ""}
              onClick={() => {
                setMode("login");
                setError("");
              }}
            >
              Login
            </button>
            <button
              className={mode === "register" ? "active" : ""}
              onClick={() => {
                setMode("register");
                setError("");
              }}
            >
              Register
            </button>
          </div>
        )}
        {error && <Notice error>{error}</Notice>}
        {success && <Notice>{success}</Notice>}
        <form onSubmit={submit} className="form-stack">
          {["register", "forgot"].includes(mode) && (
            <label>
              Email address
              <input
                type="email"
                required
                maxLength={254}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          )}
          {["login", "register"].includes(mode) && (
            <label>
              Username
              <input
                required
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_.]+"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
              />
            </label>
          )}
          {mode !== "forgot" && (
            <label>
              Password
              <span className="password-wrap">
                <input
                  type={show ? "text" : "password"}
                  required
                  minLength={mode === "login" ? undefined : 8}
                  maxLength={1024}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "register"
                      ? "At least 8 characters"
                      : "Your password"
                  }
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <EyeOff /> : <Eye />}
                </button>
              </span>
            </label>
          )}
          {mode === "login" && (
            <button
              type="button"
              className="ghost"
              style={{
                justifySelf: "end",
                padding: 0,
                fontSize: 11,
                color: "var(--accent)",
              }}
              onClick={() => setMode("forgot")}
            >
              Forgot Password?
            </button>
          )}
          <button className="primary" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "register"
                ? "Create account"
                : mode === "forgot"
                  ? "Send reset link"
                  : mode === "reset"
                    ? "Update password"
                    : "Login to your workspace"}
            <ArrowRight size={16} />
          </button>
        </form>
        {!["login", "register"].includes(mode) && (
          <button
            className="ghost"
            onClick={() => {
              setMode("login");
              history.replaceState(null, "", "/");
            }}
          >
            Back to login
          </button>
        )}
        <p className="footer-note">
          <ShieldCheck size={12} /> Secure sessions · Your information stays in
          your account
        </p>
      </section>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [page, setPage] = useState("domestic"),
    [message, setMessage] = useState(""),
    [error, setError] = useState(false),
    [version, setVersion] = useState(0),
    [menu, setMenu] = useState(false),
    [stats, setStats] = useState<Data>({}),
    [tasks, setTasks] = useState<Data[]>([]),
    [integrations, setIntegrations] = useState<Data>({}),
    [busy, setBusy] = useState(false);
  const reload = () => setVersion((v) => v + 1);
  const [trackedTaskId, setTrackedTaskId] = useState("");
  const taskSnapshot = useRef<Data[]>([]);
  const run: Runner = async (fn, msg) => {
    setBusy(true);
    try {
      const r = await fn();
      setTrackedTaskId(r?.task_id || "");
      setMessage(msg || "");
      setError(false);
      reload();
      return r;
    } catch (e) {
      setMessage((e as Error).message);
      setError(true);
      return null;
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    api("/auth/me")
      .then((u) => {
        setCsrf(u.csrf_token);
        setUser(u);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    if (!user) return;
    Promise.all([
      api("/dashboard"),
      api("/integrations"),
      api("/tasks"),
      api("/preferences"),
    ])
      .then(([s, i, t, p]) => {
        setStats(s);
        setIntegrations(i);
        setTasks(t);
        taskSnapshot.current = t;
      })
      .catch((e) => {
        setMessage(e.message);
        setError(true);
      });
  }, [user, version]);
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      api("/tasks")
        .then((t) => {
          const changed = tasksChanged(taskSnapshot.current, t);
          taskSnapshot.current = t;
          setTasks(t);
          if (changed) reload();
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [user]);
  useEffect(() => {
    const task = tasks.find((item) => item.id === trackedTaskId);
    if (task && ["completed", "failed"].includes(task.status)) {
      setMessage(taskCompletion(task));
      setError(task.status === "failed");
      setTrackedTaskId("");
    }
  }, [tasks, trackedTaskId]);
  useEffect(() => {
    if (!["Title suggestions are ready.", "Country suggestions are ready.", "Generating country suggestions...", "Generating title suggestions..."].includes(message)) return;
    const timer = setTimeout(() => setMessage(""), 10_000);
    return () => clearTimeout(timer);
  }, [message]);
  if (loading)
    return (
      <div className="empty loading">
        <Brand />
        <p>Opening your workspace…</p>
      </div>
    );
  if (!user) return <Auth onLogin={setUser} />;
  const pending = tasks.filter((t) => ["queued", "running"].includes(t.status));
  const go = (id: string) => {
    setPage(id);
    setMenu(false);
    setMessage("");
  };
  const logout = () =>
    run(async () => {
      await api("/auth/logout", "POST");
      setUser(null);
      setCsrf("");
    });
  return (
    <div className="shell">
      <div className="workspace">
        <header className="topbar">
          <Brand />
          <UserMenu
            username={user.username}
            open={menu}
            setOpen={setMenu}
            onSettings={() => go("settings")}
            onLogout={logout}
          />
        </header>
        <nav className="page-tabs" role="tablist" aria-label="Workspace sections">
          {tabs.map((n) => (
            <button
              key={n.id}
              role="tab"
              aria-selected={page === n.id}
              className={"page-tab " + (page === n.id ? "active" : "")}
              onClick={() => go(n.id)}
            >
              <n.icon size={16} />
              <span>{n.title}</span>
            </button>
          ))}
        </nav>
        <main className="content">
          {message && (
            <div
              className={"notice " + (error ? "error" : "success")}
              role={error ? "alert" : "status"}
            >
              <Info />
              {message}
              <button
                aria-label="Dismiss message"
                onClick={() => setMessage("")}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {pending.length > 0 && (
            <Notice>
              <span className="loading">
                <Clock3 size={14} />
              </span>
              {pending.length} task{pending.length > 1 ? "s" : ""}{" "}
              {pending.some((t) => t.status === "running")
                ? "processing"
                : "queued"}
              . Approximate total time remaining: {pending.some((t) => t.total_eta_seconds != null) ? `${Math.max(1, Math.ceil(Math.max(...pending.map((t) => t.total_eta_seconds || 0)) / 60))} min` : "estimating..."}. You can keep working; progress is saved.
            </Notice>
          )}
          {pending.filter((t) => page === "resume" ? t.kind === "ingest" : page === "profile" ? ["ingest", "reparse"].includes(t.kind) : page === "interview" ? t.kind === "interview" : page === "documents" ? t.kind === "document" : t.module === page && t.kind !== "interview").map((t) => (
            <div className="notice" role="status" key={t.id}>
              <Clock3 size={14} />
              {{ingest: "Resume upload", reparse: "Profile extraction", research: "Title suggestions", countries: "Country suggestions", discover: "Finding jobs", interview: t.interview_kind === "hr" ? "Non-technical interview" : "Technical interview", generate: "Document generation", document: "Document generation"}[t.kind as string] || t.kind}
              {" — "}{t.status}. Approximate time remaining: {t.eta_seconds != null ? `${Math.max(1, Math.ceil(t.eta_seconds / 60))} min` : "estimating..."}
            </div>
          ))}
          <div className="tab-panel" key={page}>
          {page === "domestic" || page === "visa" ? (
            <Jobs
              module={page}
              stats={stats}
              run={run}
              version={version}
              busy={busy}
              go={go}
              tasks={tasks}
            />
          ) : page === "resume" ? (
            <Resumes run={run} version={version} go={go} />
          ) : page === "profile" ? (
            <ProfileEditor run={run} version={version} />
          ) : page === "interview" ? (
            <InterviewPage run={run} version={version} tasks={tasks} />
          ) : page === "documents" ? (
            <DocumentsPage run={run} version={version} tasks={tasks} />
          ) : (
            <SettingsPage
              integrations={integrations}
              tasks={tasks}
              run={run}
              onDelete={() => {
                setUser(null);
                setCsrf("");
              }}
            />
          )}
          </div>
          <footer className="footer-note">
            Career Assistant · A thoughtful step toward what’s next.
          </footer>
        </main>
      </div>
    </div>
  );
}

function Jobs({
  module,
  stats,
  run,
  version,
  busy,
  go,
  tasks = [],
}: {
  module: string;
  stats: Data;
  run: Runner;
  version: number;
  busy: boolean;
  go: (s: string) => void;
  tasks?: Data[];
}) {
  const [jobs, setJobs] = useState<Data[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("default"),
    [view, setView] = useState<"latest" | "previous">("latest"),
    [selected, setSelected] = useState<string[]>([]),
    [add, setAdd] = useState(false),
    [detail, setDetail] = useState<Data | null>(null),
    [outcomes, setOutcomes] = useState<Data[] | null>(null),
    [research, setResearch] = useState<Data | null>(null),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(false),
    [dismissDiscoveryNotice, setDismissDiscoveryNotice] = useState(false);

  const [openedAt] = useState(() => Date.now());
  const latestDiscoverTask = discoveryTask(tasks, module, openedAt);
  const [researchTaskId, setResearchTaskId] = useState("");
  const [researchKind, setResearchKind] = useState("research");
  const [researchNoticeVisible, setResearchNoticeVisible] = useState(false);
  useEffect(() => {
    if (!researchTaskId) return;
    setResearchNoticeVisible(true);
    const timer = setTimeout(() => setResearchNoticeVisible(false), 10_000);
    return () => clearTimeout(timer);
  }, [researchTaskId]);
  const researchTask = tasks.find((task) => task.id === researchTaskId && task.module === module);
  const researching = !!researchTaskId && (!researchTask || ["queued","running"].includes(researchTask.status));
  useEffect(() => { setResearchTaskId(""); setResearch(null); }, [module]);
  useEffect(() => {
    if (researchTask?.status !== "completed") return;
    let alive = true;
    api("/research/" + (researchTask?.kind === "countries" ? "visa-countries" : module)).then((value) => { if (alive) setResearch(value); }).catch(() => {});
    const timer = setTimeout(() => setResearchTaskId(""), 10_000);
    return () => { alive = false; clearTimeout(timer); };
  }, [researchTask?.status, researchTask?.id, module]);

  const isDiscovering =
    latestDiscoverTask && ["queued", "running"].includes(latestDiscoverTask.status);
  useEffect(() => {
    setPage(1);
    setSelected([]);
    setErrors({});
  }, [module, query, status, sort, view]);
  useEffect(() => { setView("latest"); }, [module]);
  useEffect(() => {
    setDismissDiscoveryNotice(false);
  }, [module]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({
      module,
      page: String(page),
      q: query,
      status,
      sort,
      view,
    });
    api("/jobs?" + params)
      .then((r) => {
        if (alive) {
          setJobs(r.items);
          setTotal(r.total);
        }
      })
      .catch((e) => {
        if (alive) setErrors({ load: e.message });
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [module, page, query, status, sort, view, version]);
  const pages = Math.max(1, Math.ceil(total / 30));
  const prepare = async () => {
    const r = await run(() =>
      api("/applications/prepare", "POST", { job_ids: selected }),
    );
    if (r) {
      setOutcomes(r.outcomes);
      setErrors(
        Object.fromEntries(
          r.outcomes
            .filter((x: Data) => !x.valid)
            .map((x: Data) => [x.job_id, x.errors.join(" ")]),
        ),
      );
    }
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">
            {module === "visa"
              ? "A WORLD OF POSSIBILITIES"
              : "YOUR NEXT CHAPTER"}
          </span>
          <h1>
            {module === "visa"
              ? "Your ambition. Without borders."
              : "Find where you belong."}
          </h1>
          <p>
            {module === "visa"
              ? "International opportunities with explicit sponsorship or relocation evidence."
              : "Discover opportunities, make your move, and keep your search in one place."}
          </p>
        </div>
        <button
          className="primary"
          disabled={busy || isDiscovering}
          onClick={() => {
            setDismissDiscoveryNotice(false);
            run(
              () => api("/jobs/discover", "POST", { module }),
              "Job discovery started. Preparing titles" + (module === "visa" ? " and countries" : "") + " if needed, then finding your top 10 jobs...",
            );
          }}
        >
          {isDiscovering ? (
            <>
              <RefreshCw size={16} className="loading" />
              Finding Jobs…
            </>
          ) : (
            <>
              <Search size={16} />
              Find Jobs
            </>
          )}
        </button>
      </div>
      {isDiscovering && (
        <Notice>
          <span className="loading">
            <RefreshCw size={14} />
          </span>
          <strong>Searching job opportunities…</strong> Scanning job boards and matching listings against your candidate skills and preferences. Results will appear automatically below. {latestDiscoverTask?.result?.stage} {latestDiscoverTask?.result?.sources_complete ?? 0}/{latestDiscoverTask?.result?.source_count || ""} sources; {latestDiscoverTask?.result?.scanned || 0} listings read.
        </Notice>
      )}
      {!isDiscovering && !dismissDiscoveryNotice && latestDiscoverTask && (
        latestDiscoverTask.status === "failed" ? (
          <div className="notice error" role="alert">
            <Info />
            <div style={{ flex: 1 }}>
              <strong>Job discovery failed:</strong> {latestDiscoverTask.error || "Unable to fetch job listings."}
            </div>
            <button aria-label="Dismiss notice" onClick={() => setDismissDiscoveryNotice(true)}>
              <X size={15} />
            </button>
          </div>
        ) : latestDiscoverTask.status === "completed" && latestDiscoverTask.result ? (
          <div className="notice success" role="status">
            <CheckCircle2 size={16} color="var(--primary, #047857)" />
            <div style={{ flex: 1 }}>
              {latestDiscoverTask.result.fallback_used ? (
                <>
                  <strong>No live matches found:</strong> Saved {latestDiscoverTask.result.saved || 0} sample role example{latestDiscoverTask.result.saved === 1 ? "" : "s"}.
                </>
              ) : (
                <>
                  <strong>Discovery complete:</strong> Found {latestDiscoverTask.result.saved || 0} matching job{latestDiscoverTask.result.saved === 1 ? "" : "s"} for your profile from {latestDiscoverTask.result.scanned || 0} live listings. Use Previous Jobs to see every job found so far.
                </>
              )}
              {latestDiscoverTask.result.note && (
                <div>{latestDiscoverTask.result.note}</div>
              )}
            </div>
            <button aria-label="Dismiss notice" onClick={() => setDismissDiscoveryNotice(true)}>
              <X size={15} />
            </button>
          </div>
        ) : null
      )}
      {researchTaskId && researchNoticeVisible && <div className={"notice " + (researchTask?.status === "failed" ? "error" : "")} role="status">
        {researchTask?.status === "failed" ? researchTask.error : researching ? researchTask?.result?.stage || (researchKind === "countries" ? "Generating country suggestions..." : "Generating title suggestions...") : researchTask?.kind === "countries" ? "Country suggestions are ready." : "Title suggestions are ready."}
      </div>}
      {!stats.profile?.approved ? (
        <div className="welcome">
          <div>
            <span className="eyebrow">LET’S MAKE THIS PERSONAL</span>
            <h2>
              {stats.profile
                ? "Your experience deserves a second look."
                : "Your experience is the starting point."}
            </h2>
            <p>
              {stats.profile
                ? "Review the extracted profile and approve your facts to unlock personalized job discovery."
                : "Upload your resume, review your profile, and start finding roles that fit what you bring."}
            </p>
            <button
              style={{ marginTop: 15 }}
              className="primary"
              onClick={() => go(stats.profile ? "profile" : "resume")}
            >
              {stats.profile ? "Review your profile" : "Upload your resume"}
              <ArrowRight size={14} />
            </button>
          </div>
          <div className="circle-art">
            <FileText />
          </div>
        </div>
      ) : (
        <div className="welcome">
          <div>
            <span className="eyebrow">BUILT AROUND YOUR EXPERIENCE</span>
            <h2>Make your next move a meaningful one.</h2>
            <p>
              Your approved profile powers relevant matches. Explore new roles,
              prepare tailored documents, and track every conversation.
            </p>
          </div>
          <div className="circle-art">
            <Target />
          </div>
        </div>
      )}
      <div className="panel">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2>
              {view === "previous"
                ? "Previous jobs"
                : module === "visa"
                  ? "International opportunities"
                  : "Your opportunities"}{" "}
              <span className="tag">{total} {view === "previous" ? "found to date" : "jobs"}</span>
            </h2>
            <p style={{ margin: 0 }}>
              {view === "previous"
                ? "Every job found for you so far, with its current status."
                : "Your latest Find Jobs results. Matching Probability is an estimated fit score, not a hiring probability."}
            </p>
          </div>
          <div className="toolbar-group">
            <button
              disabled={researching || busy}
              onClick={async () => {
                const queued = await run(() => api("/research", "POST", { module }), "Generating title suggestions...");
                if (queued) { setResearchKind("research"); setResearchTaskId(queued.task_id); }
              }}
            >
              <Sparkles size={14} />
              {researching && researchKind === "research" ? "Suggesting titles…" : "Suggest Titles"}
            </button>
            {module === "visa" && <button disabled={researching || busy} onClick={async () => {
              const queued = await run(() => api("/research/countries", "POST", {}), "Generating country suggestions...");
              if (queued) { setResearchKind("countries"); setResearchTaskId(queued.task_id); }
            }}><Globe2 size={14} />Suggest Countries</button>}

            <button onClick={() => setAdd(true)}>
              <Plus size={15} />
              Save a job
            </button>
          </div>
        </div>
        <div className="toolbar">
          <div className="toolbar-group">
            <div className="search-input">
              <Search />
              <input
                aria-label="Search jobs"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search company, role or location"
              />
            </div>
            <select
              aria-label="Filter by status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select
              aria-label="Sort jobs"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">Default ranking</option>
              <option value="score">Matching score</option>
              <option value="date">Most recent</option>
              <option value="status">Status</option>
            </select>
            <button
              className="ghost"
              onClick={() => {
                setQuery("");
                setStatus("");
                setSort("default");
              }}
              aria-label="Reset to default"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="toolbar-group">
            <button
              className={view === "previous" ? "primary" : ""}
              aria-pressed={view === "previous"}
              onClick={() => setView(view === "previous" ? "latest" : "previous")}
            >
              <Clock3 size={13} />
              {view === "previous" ? "Show latest jobs" : "Previous Jobs"}
            </button>
            <button
              disabled={!selected.length}
              className="primary"
              onClick={prepare}
            >
              Apply selected {selected.length > 0 && `(${selected.length})`}
              <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
        {errors.load && <Notice error>{errors.load}</Notice>}
        {loading ? (
          <div className="empty loading">Loading your opportunities…</div>
        ) : !jobs.length ? (
          <Empty
            title={
              query || status
                ? "No opportunities match these filters."
                : "Your next opportunity starts here."
            }
          >
            <p>
              {query || status
                ? "Try another search or reset your filters."
                : "Find jobs from configured employer boards, or save a listing you’ve found. Your saved opportunities will appear here."}
            </p>
            <button onClick={() => setAdd(true)}>
              <Plus size={15} />
              Save your first job
            </button>
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="job-table">
              <thead>
                <tr>
                  {[
                    "S.No.",
                    "Checkbox",
                    "Company Name",
                    "Location",
                    "Role / Designation / Title",
                    "Link or URL to Apply",
                    "Matching Probability",
                    "Mandatory Documents",
                    "Status",
                    "Date",
                    "Attachments",
                    "Comment",
                    "Delete",
                  ].map((h) => (
                    <th key={h}>
                      {h === "Checkbox" ? (
                        <input
                          aria-label="Select all jobs on this page"
                          type="checkbox"
                          checked={
                            jobs.length > 0 &&
                            jobs.every((j) => selected.includes(j.id))
                          }
                          onChange={(e) =>
                            setSelected(
                              togglePageSelection(
                                selected,
                                jobs.map((j) => j.id),
                                e.target.checked,
                              ),
                            )
                          }
                        />
                      ) : (
                        h
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {jobs.map((j, i) => (
                  <tr key={j.id} className={errors[j.id] ? "invalid" : ""}>
                    <td>{(page - 1) * 30 + i + 1}</td>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={"Select " + j.title}
                        checked={selected.includes(j.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, j.id]
                              : selected.filter((id) => id !== j.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <div className="company-cell">
                        <span>{j.company.slice(0, 1).toUpperCase()}</span>
                        {j.company}
                      </div>
                    </td>
                    <td>{j.location}</td>
                    <td>
                      <button className="ghost" onClick={() => setDetail(j)}>
                        {j.title}
                      </button>
                    </td>
                    <td>
                      <a href={j.url} target="_blank" rel="noreferrer">
                        Apply on employer site <ExternalLink size={11} />
                      </a>
                    </td>
                    <td>
                      <button className="ghost" onClick={() => setDetail(j)}>
                        <span
                          className={
                            "tag " + (j.match.score >= 70 ? "green" : "amber")
                          }
                        >
                          {j.match.score}% fit
                        </span>
                      </button>
                    </td>
                    <td>
                      <div className="doc-chips">
                        {(j.mandatory_documents?.length ? j.mandatory_documents : ["Resume/CV", "Cover Letter", ...(module === "visa" ? ["Motivational Letter"] : [])]).map((d: string) => (
                          <span className="tag" key={d}>{d}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <select
                        aria-label={"Status for " + j.title}
                        value={j.status}
                        onChange={(e) =>
                          run(
                            () =>
                              api("/jobs/" + j.id, "PATCH", {
                                status: e.target.value,
                              }),
                            "Status saved as a manual update.",
                          )
                        }
                      >
                        {statuses.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td>{date(j.applied_at || j.discovered_at)}</td>
                    <td>
                      <AttachmentControl
                        job={j}
                        run={run}
                        onChange={() =>
                          setErrors((v) => {
                            const n = { ...v };
                            delete n[j.id];
                            return n;
                          })
                        }
                      />
                    </td>
                    <td>
                      <textarea
                        className="job-comment"
                        aria-label={"Comment for " + j.title}
                        key={j.id + version}
                        defaultValue={j.comment}
                        onBlur={(e) => {
                          if (e.target.value !== j.comment)
                            run(
                              () =>
                                api("/jobs/" + j.id, "PATCH", {
                                  comment: e.target.value,
                                }),
                              "Comment saved.",
                            );
                        }}
                      />
                      {errors[j.id] && (
                        <p className="row-error">{errors[j.id]}</p>
                      )}
                    </td>
                    <td><button className="ghost" aria-label={"Delete " + j.title} onClick={async () => {
                      if (!window.confirm("Delete this job and its attachments? It will not reappear in discovery.")) return;
                      const result = await run(() => api("/jobs/" + j.id, "DELETE"), "Job deleted.");
                      if (result) setSelected((ids) => ids.filter((id) => id !== j.id));
                    }}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="pagination">
          <span>
            {total
              ? `${(page - 1) * 30 + 1}–${Math.min(page * 30, total)} of ${total}`
              : "0 opportunities"}{" "}
            · 30 per page
          </span>
          <div className="toolbar-group">
            <button
              aria-label="First page"
              disabled={page === 1}
              onClick={() => setPage(1)}
            >
              <ChevronsLeft size={13} />
            </button>
            <button
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft size={13} />
            </button>
            {pageNumbers(pages, page).map((n) => (
              <button
                key={n}
                className={n === page ? "primary" : ""}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
            <button
              aria-label="Next page"
              disabled={page >= pages}
              onClick={() => setPage(page + 1)}
            >
              <ChevronRight size={13} />
            </button>
            <button
              aria-label="Last page"
              disabled={page >= pages}
              onClick={() => setPage(pages)}
            >
              <ChevronsRight size={13} />
            </button>
          </div>
        </div>
      </div>
      {add && (
        <Modal title="Save an opportunity" close={() => setAdd(false)}>
          <JobForm run={run} close={() => setAdd(false)} />
        </Modal>
      )}
      {detail && (
        <Modal title={detail.title} close={() => setDetail(null)}>
          <span className="tag">
            {detail.company} · {detail.location}
          </span>
          <Notice>
            {detail.verification.status}
            {detail.verification.checked_at &&
              " · " + date(detail.verification.checked_at)}
          </Notice>
          {detail.verification.evidence_url && (
            <a
              href={detail.verification.evidence_url}
              target="_blank"
              rel="noreferrer"
            >
              View verification source
            </a>
          )}
          <h3>Matching Probability: {detail.match.score}%</h3>
          <p>{detail.match.label}</p>
          <StructuredData value={detail.match} />
          {detail.sponsorship && (
            <>
              <h3>Sponsorship evidence</h3>
              <span className="tag">{detail.sponsorship.category}</span>
              <p>
                {detail.sponsorship.evidence.join("\n") ||
                  "Insufficient information to determine."}
              </p>
            </>
          )}
          <h3>Job description</h3>
          <pre>{detail.description}</pre>
          <RequirementEditor
            job={detail}
            run={run}
            done={() => setDetail(null)}
          />
          <h3>Application history</h3>
          <StructuredData value={detail.history} />
          {detail.status === "NOT APPLIED" && (
            <ConfirmReceipt
              id={detail.id}
              run={run}
              done={() => setDetail(null)}
            />
          )}
        </Modal>
      )}
      {outcomes && (
        <Modal
          title="Review your selected applications"
          close={() => setOutcomes(null)}
        >
          <Notice>
            No application has been submitted. Review each channel below.
            External applications require your employer receipt.
          </Notice>
          <SubmissionReview
            outcomes={outcomes}
            jobs={jobs}
            run={run}
            done={() => setOutcomes(null)}
          />
          {outcomes.map((o) => (
            <div className="panel" key={o.job_id}>
              <strong>
                {jobs.find((j) => j.id === o.job_id)?.title || o.job_id}
              </strong>
              {o.errors.map((e: string) => (
                <Notice key={e} error>
                  {e}
                </Notice>
              ))}
              {o.valid && (
                <a href={o.url} target="_blank" rel="noreferrer">
                  Open application <ExternalLink size={12} />
                </a>
              )}
            </div>
          ))}
        </Modal>
      )}
      {research && (
        <Modal
          title="Saved title & country suggestions"
          close={() => setResearch(null)}
        >
          {titleRegions(research, module).map((group) => (
            <section key={group.region}><h3>{group.region}</h3>
              <ul>{group.titles.map((title) => <li key={title}>{title}</li>)}</ul>
            </section>
          ))}
          {research.live_evidence?.available && <section className="research-sources">
            <h3>Research sources</h3>
            <ul>{(research.live_evidence.sources || []).filter((source: Data) => /^https:\/\//.test(source.uri)).map((source: Data, index: number) => <li key={index}><a href={source.uri} target="_blank" rel="noopener noreferrer">{source.title || "Source"}</a></li>)}</ul>
            {research.live_evidence.search_suggestions && <iframe title="Google Search suggestions" sandbox="allow-popups allow-popups-to-escape-sandbox" srcDoc={research.live_evidence.search_suggestions} style={{width:"100%",height:150,border:0}} />}
          </section>}
        </Modal>
      )}
    </>
  );
}

function JobForm({ run, close }: { run: Runner; close: () => void }) {
  const [form, setForm] = useState<Data>({
    company: "",
    title: "",
    location: "",
    country: "India",
    url: "",
    description: "",
    requisition_id: "",
    mandatory_documents: "",
    mandatory_documents_known: false,
  });
  const field = (key: string) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await run(
          () =>
            api("/jobs", "POST", {
              ...form,
              mandatory_documents: form.mandatory_documents
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean),
            }),
          "Opportunity saved. Visa listings without explicit evidence are excluded from visa results.",
        );
        if (r) close();
      }}
    >
      <div className="form-grid">
        {[
          ["company", "Company name"],
          ["title", "Role / title"],
          ["location", "Location"],
          ["country", "Country"],
          ["url", "Application URL"],
          ["requisition_id", "Requisition ID (optional)"],
        ].map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              {...field(key)}
              required={key !== "requisition_id"}
              type={key === "url" ? "url" : "text"}
            />
          </label>
        ))}
        <label className="full">
          Job description
          <textarea
            rows={8}
            minLength={30}
            maxLength={60000}
            required
            {...field("description")}
          />
        </label>
        <label className="full">
          Mandatory documents (comma separated)
          <input
            {...field("mandatory_documents")}
            placeholder="Only requirements stated by the employer"
          />
        </label>
        <label
          className="full"
          style={{ display: "flex", alignItems: "center" }}
        >
          <input
            type="checkbox"
            checked={form.mandatory_documents_known}
            onChange={(e) =>
              setForm({ ...form, mandatory_documents_known: e.target.checked })
            }
          />
          I checked the employer form and confirmed its document requirements.
        </label>
      </div>
      <div className="form-actions">
        <button className="primary">Save opportunity</button>
        <button type="button" onClick={close}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function AttachmentControl({
  job,
  run,
  onChange,
}: {
  job: Data;
  run: Runner;
  onChange: () => void;
}) {
  const [open, setOpen] = useState(false),
    [type, setType] = useState("Resume");
  return (
    <>
      <button onClick={() => setOpen(true)}>
        <Paperclip size={12} />
        {job.attachment_ids.length || "Attach"}
      </button>
      {open && (
        <Modal title="Application attachments" close={() => setOpen(false)}>
          <p>
            Original supporting documents are preserved. Generated-file cleanup
            does not delete these uploads.
          </p>
          <label>
            Document type
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="Resume, cover letter, certificate…"
            />
          </label>
          <label style={{ marginTop: 15 }}>
            PDF or DOCX files
            <input
              type="file"
              accept=".pdf,.docx"
              multiple
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                for (const f of files) {
                  const body = new FormData();
                  body.append("file", f);
                  await run(
                    () =>
                      api(
                        "/jobs/" +
                          job.id +
                          "/attachments?document_type=" +
                          encodeURIComponent(type),
                        "POST",
                        body,
                      ),
                    "Attachment saved.",
                  );
                }
                onChange();
                setOpen(false);
              }}
            />
          </label>
          {job.attachment_ids.map((f: Data) => (
            <p key={f.id}>
              <a href={"/api/files/" + f.id}>{f.name}</a> · {f.document_type}
            </p>
          ))}
        </Modal>
      )}
    </>
  );
}
function ConfirmReceipt({
  id,
  run,
  done,
}: {
  id: string;
  run: Runner;
  done: () => void;
}) {
  const [reference, setReference] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await run(
            () =>
              api("/applications/" + id + "/confirm", "POST", {
                confirmation_reference: reference,
                confirmed,
              }),
            "Application recorded with your confirmation.",
          )
        )
          done();
      }}
    >
      <h3>Record a completed application</h3>
      <label>
        Employer confirmation number or receipt details
        <input
          minLength={5}
          required
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />
      </label>
      <label
        style={{ display: "flex", alignItems: "center", margin: "15px 0" }}
      >
        <input
          type="checkbox"
          required
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I completed the employer application and received confirmation.
      </label>
      <button className="primary">Record application</button>
    </form>
  );
}

const documentKinds = [
  { kind: "resume", label: "Resume", button: "Generate Resume", icon: FileText },
  { kind: "cover_letter", label: "Cover Letter", button: "Generate Cover Letter", icon: MessageSquareText },
  { kind: "motivational_letter", label: "Motivational Letter", button: "Generate Motivational Letter", icon: Sparkles },
];

function DocumentPreview({ doc }: { doc: Data }) {
  const content = doc.structured_content || {};
  const letter = doc.content_type !== "resume";
  const lines = (text: string) => text.split("\n").filter((line) => line.trim());
  const bullet = /^\s*(?:[-*•–]\s+|\d+[.)]\s+)/;
  return (
    <article className={"doc-preview " + (letter ? "letter" : "resume")} aria-label={"Preview of the " + doc.content_type.replace("_", " ")}>
      <header>
        <h3>{content.name}</h3>
        {content.contact?.length > 0 && <p>{content.contact.join("  |  ")}</p>}
      </header>
      {(content.sections || []).map((section: Data, index: number) => {
        // Keep reading order: each run of bullets stays under the line that precedes it.
        const blocks: { kind: "p" | "ul"; rows: string[] }[] = [];
        for (const row of lines(section.text)) {
          const kind = bullet.test(row) ? "ul" : "p";
          const last = blocks[blocks.length - 1];
          if (kind === "ul" && last?.kind === "ul") last.rows.push(row.replace(bullet, ""));
          else blocks.push({ kind, rows: [kind === "ul" ? row.replace(bullet, "") : row] });
        }
        return (
          <section key={index}>
            {!letter && <h4>{section.heading}</h4>}
            {blocks.map((block, i) =>
              block.kind === "ul" ? (
                <ul key={i}>{block.rows.map((row, j) => <li key={j}>{row}</li>)}</ul>
              ) : (
                <p key={i} className={!letter && block.rows[0].includes(" | ") ? "role" : ""}>{block.rows[0]}</p>
              ),
            )}
          </section>
        );
      })}
    </article>
  );
}

function LatexSource({ label, latex, run }: { label: string; latex: string; run: Runner }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="latex-source">
      <div className="latex-head">
        <button className="ghost" aria-expanded={open} onClick={() => setOpen(!open)}>
          <ChevronDown size={14} className={open ? "chevron open" : "chevron"} />
          LaTeX code
        </button>
        <button onClick={() => run(async () => { await navigator.clipboard.writeText(latex); }, label + " LaTeX copied. Paste it into any LaTeX editor, such as Overleaf.")}>
          <FileText size={13} />
          Copy LaTeX
        </button>
      </div>
      {open && <pre className="latex-code">{latex}</pre>}
    </div>
  );
}

function DocumentsPage({ run, version, tasks }: { run: Runner; version: number; tasks: Data[] }) {
  const [resumes, setResumes] = useState<Data[]>([]),
    [resume, setResume] = useState(""),
    [company, setCompany] = useState(""),
    [url, setUrl] = useState(""),
    [jd, setJD] = useState(""),
    [country, setCountry] = useState(""),
    [items, setItems] = useState<Data[]>([]),
    [taskIds, setTaskIds] = useState<Record<string, string>>({}),
    [uploadTaskId, setUploadTaskId] = useState(""),
    [touched, setTouched] = useState(false);
  const uploadTask = tasks.find((task) => task.id === uploadTaskId);
  const uploading = !!uploadTaskId && (!uploadTask || ["queued", "running"].includes(uploadTask.status));
  const taskFor = (kind: string) => tasks.find((task) => task.id === taskIds[kind]);
  const busyKind = (kind: string) => !!taskIds[kind] && (!taskFor(kind) || ["queued", "running"].includes(taskFor(kind)!.status));
  const finished = documentKinds.map(({ kind }) => taskFor(kind)?.status || "").join(",");
  useEffect(() => {
    if (uploadTask?.status === "completed" && uploadTask.result?.resume_id) setResume(uploadTask.result.resume_id);
  }, [uploadTask?.status, uploadTask?.result?.resume_id]);
  useEffect(() => {
    api("/resumes").then((r) => {
      setResumes(r);
      setResume((selected) => r.some((item: Data) => item.id === selected) ? selected : r.find((x: Data) => x.active)?.id || r[0]?.id || "");
    }).catch(() => {});
    api("/content?source=documents_tab").then(setItems).catch(() => {});
  }, [version, finished]);
  const countryMissing = !country.trim();
  const ready = !!resume && jd.trim().length >= 30 && !countryMissing && !uploading;
  const latest = (kind: string) => {
    const done = taskFor(kind)?.result?.content_id;
    // Older saves contained the prompt's analysis reports; only finished documents are shown.
    const finished = items.filter((item) => item.content_type === kind && item.latex);
    return finished.find((item) => item.id === done) || finished[0];
  };
  const generate = async (kind: string) => {
    setTouched(true);
    if (!ready) return;
    const queued = await run(
      () => api("/documents", "POST", { kind, country: country.trim(), jd, company, url, resume_id: resume }),
      "Generating your " + documentKinds.find((d) => d.kind === kind)!.label.toLowerCase() + "…",
    );
    if (queued) setTaskIds((ids) => ({ ...ids, [kind]: queued.task_id }));
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">TAILORED FOR EVERY APPLICATION</span>
          <h1>Documents that speak for you.</h1>
          <p>Create a resume, cover letter and motivational letter for a specific job description.</p>
        </div>
        <span className="tag"><FileText size={12} />Document studio</span>
      </div>
      <div className="panel">
        <h2>Which job are you applying for?</h2>
        <div className="form-grid">
          <label>
            Company (optional)
            <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company name" />
          </label>
          <label>
            Country *
            <input
              required
              aria-invalid={touched && countryMissing}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India, Germany, Canada"
            />
            {touched && countryMissing && <small className="row-error">Country is required.</small>}
          </label>
          <label>
            Resume version
            <select value={resume} onChange={(e) => setResume(e.target.value)}>
              <option value="">Select a processed resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}{r.active ? " · active" : ""}</option>
              ))}
            </select>
          </label>
          <label className="full">
            Job description URL
            <div className="toolbar-group">
              <input style={{ flex: 1 }} type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/careers/job-listing" />
              <button
                type="button"
                disabled={!url.trim()}
                onClick={async () => {
                  const r = await run(() => api("/jd/extract", "POST", { url }), "Job description extracted successfully.");
                  if (r) setJD(r.text);
                }}
              >
                Extract JD
                <ArrowUpRight size={13} />
              </button>
            </div>
          </label>
          <label className="full">
            Job description
            <textarea
              value={jd}
              rows={8}
              maxLength={60000}
              onChange={(e) => setJD(e.target.value)}
              placeholder="Paste the full job description here. Review extracted text before generating documents."
            />
          </label>
          <label className="full">
            Or add an alternate resume
            <input
              type="file"
              accept=".pdf,.docx"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const b = new FormData();
                b.append("file", f);
                const queued = await run(() => api("/resumes", "POST", b), "Processing alternate resume. It will be selected automatically when ready.");
                if (queued) setUploadTaskId(queued.task_id);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {uploadTaskId && (
          <div className={"notice " + (uploadTask?.status === "failed" ? "error" : "")} role="status">
            {uploadTask?.status === "failed" ? uploadTask.error : uploadTask?.status === "completed" ? "Resume ready and selected for these documents." : "Processing your resume…"}
          </div>
        )}
        <div className="form-actions">
          {documentKinds.map(({ kind, button, icon: Icon }, index) => (
            <button key={kind} className={index === 0 ? "primary" : ""} disabled={busyKind(kind) || uploading} onClick={() => generate(kind)}>
              {busyKind(kind) ? <RefreshCw size={15} className="loading" /> : <Icon size={15} />}
              {busyKind(kind) ? "Generating…" : button}
            </button>
          ))}
        </div>
        {touched && !ready && !countryMissing && (
          <Notice error>Select a resume and add a job description of at least 30 characters.</Notice>
        )}
      </div>
      {documentKinds.map(({ kind, label }) => {
        const task = taskFor(kind);
        const doc = latest(kind);
        if (task?.status === "failed")
          return <Notice key={kind} error>{label}: {task.error}</Notice>;
        if (!doc) return null;
        return (
          <div className="panel" key={kind}>
            <div className="page-title">
              <div>
                <span className="eyebrow">{doc.company ? doc.company.toUpperCase() + " · " : ""}{(doc.country || "").toUpperCase()}</span>
                <h2>{label}</h2>
                <p style={{ margin: 0 }}>{date(doc.created_at)}</p>
              </div>
              <div className="toolbar-group">
                <button onClick={() => run(() => downloadContent(doc.id, "docx", label))}>
                  <ArrowDownToLine size={13} />
                  Word
                </button>
                <button onClick={() => run(() => downloadContent(doc.id, "pdf", label))}>
                  <ArrowDownToLine size={13} />
                  PDF
                </button>
              </div>
            </div>
            <Notice>Check every name, employer, date and achievement against your real experience before sending.</Notice>
            <DocumentPreview doc={doc} />
            <LatexSource label={label} latex={doc.latex} run={run} />
            <ContentEditor content={doc} run={run} />
          </div>
        );
      })}
    </>
  );
}

function Resumes({
  run,
  version,
  go,
}: {
  run: Runner;
  version: number;
  go: (s: string) => void;
}) {
  const [resumes, setResumes] = useState<Data[]>([]),
    [file, setFile] = useState<File | null>(null),
    [sending, setSending] = useState(false),
    [preview, setPreview] = useState<Data | null>(null);
  useEffect(() => {
    api("/resumes")
      .then(setResumes)
      .catch(() => {});
  }, [version]);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">THE STORY SO FAR</span>
          <h1>Your experience, in one place.</h1>
          <p>
            Keep your resume history. Choose the version that tells your story
            best.
          </p>
        </div>
        <span className="tag">
          <ShieldCheck size={12} />
          Private to you
        </span>
      </div>
      <div className="panel">
        <h2>Add a resume</h2>
        <p>
          We extract readable text and skills. Review your profile before using
          it for personalized content.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!file) return;
            setSending(true);
            const body = new FormData();
            body.append("file", file);
            await run(
              () => api("/resumes", "POST", body),
              "Resume uploaded and queued for processing. Keep this page open or return later.",
            );
            setSending(false);
            setFile(null);
          }}
        >
          <div className="upload-zone">
            <Upload size={27} />
            <h3>A good next step starts with your resume.</h3>
            <p>PDF or DOCX · Up to 10 MB · Text-based documents</p>
            <input
              type="file"
              aria-label="Choose resume"
              accept=".pdf,.docx"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="form-actions">
            <button className="primary" disabled={!file || sending}>
              {sending ? "Uploading…" : "Submit resume"}
              <ArrowRight size={14} />
            </button>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Your original is preserved.
            </span>
          </div>
        </form>
      </div>
      <div className="panel">
        <h2>Resume library</h2>
        {!resumes.length ? (
          <Empty title="Your story belongs here." icon="resume">
            <p>
              Processed resumes will appear here. Select an active version and
              review its candidate profile.
            </p>
          </Empty>
        ) : (
          resumes.map((r) => (
            <div className="resume-card" key={r.id}>
              <FileText size={29} />
              <div>
                <strong>{r.name}</strong>{" "}
                {r.active && <span className="tag green">Active</span>}
                <p>
                  {date(r.created_at)} ·{" "}
                  {r.rag?.status === "indexed"
                    ? "Semantic index ready"
                    : "Text stored · semantic services not connected"}
                </p>
              </div>
              <button onClick={() => setPreview(r)}>
                <Eye size={13} />
                Preview
              </button>
                <button
                  aria-label={"Delete resume " + r.name}
                  disabled={r.active}
                  title={r.active ? "Choose another active resume before deleting this one." : "Delete the original resume; keep indexed knowledge and saved guides."}
                  onClick={() => run(
                    () => api("/resumes/" + r.id, "DELETE"),
                    "Resume deleted from the library. RAG knowledge and saved guides are preserved.",
                  )}
                >
                  <Trash2 size={14} /> Delete
                </button>
              <a
                href={"/api/files/" + r.file_id}
                aria-label={"Download original " + r.name}
              >
                <ArrowDownToLine size={15} />
              </a>
              {!r.active ? (
                <button
                  onClick={async () => {
                    if (
                      await run(
                        () => api("/resumes/" + r.id + "/activate", "POST"),
                        "Active resume updated. Review your profile.",
                      )
                    )
                      go("profile");
                  }}
                >
                  Set active
                </button>
              ) : (
                <button onClick={() => go("profile")}>Review profile</button>
              )}
            </div>
          ))
        )}
      </div>
      {preview && (
        <Modal title={preview.name} close={() => setPreview(null)}>
          <pre>{preview.markdown}</pre>
          <button
            onClick={() =>
              run(
                () => api("/resumes/" + preview.id + "/reindex", "POST"),
                "Semantic indexing queued.",
              )
            }
          >
            <RefreshCw size={14} />
            Reindex knowledge
          </button>
        </Modal>
      )}
    </>
  );
}

function ProfileEditor({ run, version }: { run: Runner; version: number }) {
  const [profile, setProfile] = useState<Data | null>(null),
    [employmentText, setEmploymentText] = useState("[]"),
    [sources, setSources] = useState<Data | null>(null),
    [query, setQuery] = useState("");
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [saving, setSaving] = useState(false);
  const [showExtracted, setShowExtracted] = useState(true);
  const dirty = !!profile && profileSnapshot(profile, employmentText) !== savedSnapshot;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;
  useEffect(() => {
    api("/profile")
      .then((p) => {
        if (dirtyRef.current) return;
        const text = JSON.stringify(p?.employments || [], null, 2);
        setProfile(p);
        setEmploymentText(text);
        setSavedSnapshot(profileSnapshot(p, text));
      })
      .catch(() => {});
  }, [version]);
  const update = (k: string, v: any) => setProfile((p) => ({ ...p, [k]: v }));

  // Mandatory fields check
  const mandatoryFields = [
    { key: "name", label: "Name" },
    { key: "email", label: "Contact email" },
    { key: "location", label: "Location" },
    { key: "designation", label: "Current designation" },
  ];
  const missingMandatoryKeys = profile
    ? [
        ...mandatoryFields
          .filter((f) => !profile[f.key] || !String(profile[f.key]).trim())
          .map((f) => f.label),
        ...(!profile.skills || profile.skills.length === 0 ? ["Skills"] : []),
      ]
    : [];

  useEffect(() => {
    if (!profile || missingMandatoryKeys.length) return;
    setShowExtracted(true);
    const timer = setTimeout(() => setShowExtracted(false), 20_000);
    return () => clearTimeout(timer);
  }, [!!profile, missingMandatoryKeys.length === 0]);

  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">THE FACTS THAT MAKE YOU, YOU</span>
          <h1>Your candidate profile.</h1>
          <p>
            One authoritative profile across your job search and interview
            preparation.
          </p>
        </div>
        {profile?.approved && (
          <span className="tag green">
            <CheckCircle2 size={12} />
            Approved by you
          </span>
        )}
      </div>
      {!profile ? (
        <div className="panel">
          <Empty title="Start with your resume." icon="resume">
            <p>
              Upload and activate a resume from the Resume library to create
              your profile.
            </p>
          </Empty>
        </div>
      ) : (
        <>
          {missingMandatoryKeys.length > 0 ? (
            <div className="notice error" role="alert">
              <Info />
              <div>
                <strong>Missing mandatory fields from resume extraction:</strong>{" "}
                Please fill in {missingMandatoryKeys.join(", ")} below before approving your profile. You can also manually adjust any other details as needed.
              </div>
            </div>
          ) : showExtracted ? (
            <div className="notice success" role="status">
              <CheckCircle2 size={16} color="var(--primary, #047857)" />
              <div>
                <strong>All mandatory fields extracted.</strong> Review your details below, make any manual updates, and confirm your approval when ready.
              </div>
            </div>
          ) : null}
          <button
            onClick={() => run(
              () => api(`/resumes/${profile.resume_version_id}/reparse`, "POST"),
              "Re-extraction started. Missing fields will be filled from the resume; saved edits will be preserved.",
            )}
          >
            <RefreshCw size={15} /> Re-extract missing profile fields
          </button>
          <form
            className="panel"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!dirty || saving) return;
              setSaving(true);
              const saved = await run(
                async () =>
                  api("/profile", "PUT", {
                    ...profile,
                    employments: JSON.parse(employmentText),
                  }),
              );
              if (saved) {
                const text = JSON.stringify(saved.employments || [], null, 2);
                setProfile(saved);
                setEmploymentText(text);
                setSavedSnapshot(profileSnapshot(saved, text));
              }
              setSaving(false);
            }}
          >
            <div className="form-grid">
              {[
                ["name", "Name *", true],
                ["email", "Contact email *", true],
                ["phone", "Phone (optional)", false],
                ["linkedin", "LinkedIn (optional)", false],
                ["portfolio", "Portfolio (optional)", false],
                ["location", "Location *", true],
                ["designation", "Current designation *", true],
                ["notice_period", "Notice period (days, optional)", false],
                ["salary_expectations", "Salary expectations (optional)", false],
              ].map(([key, label, isMandatory]) => {
                const isMissing = isMandatory && (!profile[key as string] || !String(profile[key as string]).trim());
                return (
                  <label key={key as string}>
                    <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      {label as string}
                      {isMissing && <span style={{ color: "var(--danger, #b91c1c)", fontSize: 11 }}>Required</span>}
                    </span>
                    <input
                      value={profile[key as string] || ""}
                      onChange={(e) => update(key as string, e.target.value)}
                      placeholder={key === "notice_period" ? "e.g. 30 days" : undefined}
                      maxLength={key === "email" ? 254 : 200}
                      style={isMissing ? { borderColor: "var(--danger, #b91c1c)" } : {}}
                    />
                  </label>
                );
              })}
              <label className="full">
                <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Skills (comma separated) *
                  {(!profile.skills || profile.skills.length === 0) && (
                    <span style={{ color: "var(--danger, #b91c1c)", fontSize: 11 }}>Required</span>
                  )}
                </span>
                <input
                  value={(profile.skills || []).join(", ")}
                  onChange={(e) =>
                    update(
                      "skills",
                      e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    )
                  }
                  style={
                    !profile.skills || profile.skills.length === 0
                      ? { borderColor: "var(--danger, #b91c1c)" }
                      : {}
                  }
                />
              </label>
              <EmploymentEditor
                value={employmentText}
                onChange={setEmploymentText}
              />
              {[
                ["education", "Education"],
                ["certifications", "Certifications & training"],
                ["projects", "Projects"],
                ["achievements", "Achievements and responsibilities"],
              ].map(([key, label]) => (
                <label key={key} className="full">
                  {label} (one per line)
                  <textarea
                    rows={3}
                    value={(profile[key] || []).join("\n")}
                    onChange={(e) =>
                      update(key, e.target.value.split("\n").filter(Boolean))
                    }
                  />
                </label>
              ))}
              <label
                className="full"
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={!!profile.relocation_confirmed}
                  onChange={(e) =>
                    update("relocation_confirmed", e.target.checked)
                  }
                />
                I am willing to relocate.
              </label>
              <label
                className="full"
                style={{ display: "flex", alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={!!profile.approved}
                  onChange={(e) => update("approved", e.target.checked)}
                />
                I reviewed this profile and confirm that these facts reflect my
                actual experience.
              </label>
            </div>
            <div className="form-actions">
              <button className="primary" disabled={!dirty || saving}>
                <Check size={15} />
                Save profile
              </button>
              {profile.experience && (
                <span className="tag">
                  {profile.experience.months} months of dated experience ·
                  overlaps merged
                </span>
              )}
            </div>
          </form>
          <div className="panel">
            <h2>Search your resume knowledge</h2>
            <p>
              Source text is versioned. Semantic retrieval requires configured
              embeddings and Qdrant; lexical retrieval is clearly labelled.
            </p>
            <form
              className="toolbar-group"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await run(() =>
                  api("/knowledge?query=" + encodeURIComponent(query)),
                );
                if (r) setSources(r);
              }}
            >
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a skill or project…"
                aria-label="Search resume knowledge"
              />
              <button>Search sources</button>
            </form>
            {sources && (
              <>
                <span className="tag" style={{ marginTop: 15 }}>
                  {sources.mode}
                </span>
                {sources.sources.map((s: Data) => (
                  <pre className="markdown-source" key={s.hash}>
                    {s.text}
                  </pre>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </>
  );
}

function InterviewPage({ run, version, tasks }: { run: Runner; version: number; tasks: Data[] }) {
  const [resumes, setResumes] = useState<Data[]>([]),
    [guides, setGuides] = useState<Data[]>([]),
    [resume, setResume] = useState(""),
    [jd, setJD] = useState(""),
    [url, setUrl] = useState(""),
    [company, setCompany] = useState(""),
    [guide, setGuide] = useState<Data | null>(null),
    [tab, setTab] = useState("questions"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("");
  const [uploadTaskId, setUploadTaskId] = useState("");
  const [generationTaskId, setGenerationTaskId] = useState("");
  const [answerTaskId, setAnswerTaskId] = useState("");
  const uploadTask = tasks.find((task) => task.id === uploadTaskId);
  const generationTask = tasks.find((task) => task.id === generationTaskId);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const activeAnswerTask = tasks.find((task) => task.kind === "interview_answer" && ["queued", "running"].includes(task.status));
  const answerTask = activeAnswerTask || tasks.find((task) => task.id === answerTaskId);
  const uploading = !!uploadTaskId && (!uploadTask || ["queued", "running"].includes(uploadTask.status));
  const generating = !!generationTaskId && (!generationTask || ["queued", "running"].includes(generationTask.status));
  const answering = answerSubmitting || !!activeAnswerTask || (!!answerTaskId && (!answerTask || ["queued", "running"].includes(answerTask.status)));
  useEffect(() => {
    if (uploadTask?.status === "completed" && uploadTask.result?.resume_id) {
      setResume(uploadTask.result.resume_id);
    }
  }, [uploadTask?.status, uploadTask?.result?.resume_id]);
  useEffect(() => {
    if (!answerTask || !["completed", "failed"].includes(answerTask.status)) return;
    api("/interviews").then((items) => {
      setGuides(items);
      setGuide((previous) => items.find((item: Data) => item.id === previous?.id) || previous);
    }).catch(() => {});
  }, [answerTask?.status]);
  useEffect(() => {
    api("/resumes").then((r) => {
      setResumes(r);
      setResume((selected) => r.some((item: Data) => item.id === selected) ? selected : r.find((x: Data) => x.active)?.id || r[0]?.id || "");
    }).catch(() => {});
    api("/interviews").then((items) => {
      setGuides(items);
      setGuide((previous) => items.find((item: Data) => item.id === generationTask?.result?.content_id) || items.find((item: Data) => item.id === previous?.id) || (previous?.generation_mode === "built_in" ? null : previous));
    }).catch(() => {});
  }, [version, generationTask?.result?.content_id]);
  const generateGuide = async (kind: string) => {
    const queued = await run(() => api("/interviews", "POST", { kind, jd, resume_id: resume, company }), "Preparing interview questions only.");
    if (queued) setGenerationTaskId(queued.task_id);
  };
  const answerQuestion = async (guideId: string, questionId: string) => {
    if (answering) return;
    setAnswerSubmitting(true);
    try {
    const queued = await run(
      () => api(`/interviews/${guideId}/questions/${questionId}/answer`, "POST"),
      "Generating the answer for this question.",
    );
    if (queued) setAnswerTaskId(queued.task_id);
    } finally { setAnswerSubmitting(false); }
  };
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">SHOW UP WITH CONFIDENCE</span>
          <h1>A little preparation. A big difference.</h1>
          <p>
            Generate interview questions first, then request answers only for
            the questions you want to practice.
          </p>
        </div>
        <span className="tag">
          <MessageSquareText size={12} />
          Interview studio
        </span>
      </div>
      <div className="panel">
        <h2>What are you preparing for?</h2>
        <p>
          Add a job description and choose a resume. Alternate resumes never
          replace your active version automatically.
        </p>
        <div className="form-grid">
          <label>
            Company (optional)
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company name"
            />
          </label>
          <label>
            Resume version
            <select value={resume} onChange={(e) => setResume(e.target.value)}>
              <option value="">Select a processed resume</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                  {r.active ? " · active" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="full">
            Job description URL
            <div className="toolbar-group">
              <input
                style={{ flex: 1 }}
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/careers/job-listing"
              />
              <button
                type="button"
                disabled={!url.trim()}
                onClick={async () => {
                  const r = await run(() =>
                    api("/jd/extract", "POST", { url }),
                    "Job description extracted successfully.",
                  );
                  if (r) setJD(r.text);
                }}
              >
                Extract JD
                <ArrowUpRight size={13} />
              </button>
            </div>
          </label>
          <label className="full">
            Job description
            <textarea
              value={jd}
              rows={8}
              maxLength={60000}
              onChange={(e) => setJD(e.target.value)}
              placeholder="Paste the full job description here. Review extracted text before generating a guide."
            />
          </label>
          <label className="full">
            Or add an alternate resume
            <input
              type="file"
              accept=".pdf,.docx"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const b = new FormData();
                b.append("file", f);
                const queued = await run(
                  () => api("/resumes", "POST", b),
                  "Processing alternate resume. It will be selected automatically when ready.",
                );
                if (queued) setUploadTaskId(queued.task_id);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {uploadTaskId && (
          <div className={"notice " + (uploadTask?.status === "failed" ? "error" : "")} role="status">
            {uploadTask?.status === "failed" ? uploadTask.error : uploadTask?.status === "completed" ? "Resume ready and selected for this interview." : "Processing your resume…"}
          </div>
        )}
        {generationTaskId && (
          <div className={"notice " + (generationTask?.status === "failed" ? "error" : "")} role="status">
            {generationTask?.status === "failed" ? `${generationTask.error} Any completed questions are saved below.` : generating ? `Preparing questions: ${generationTask?.result?.questions || 0} of ${generationTask?.result?.total_questions || "the requested"} ready. ${generationTask?.result?.stage || "Contacting AI provider…"}` : "Your questions are ready below."}
          </div>
        )}
        {(answerTaskId || activeAnswerTask || answerSubmitting) && (
          <div className={"notice " + (answerTask?.status === "failed" ? "error" : "")} role="status">
            {answerTask?.status === "failed"
              ? answerTask.error
              : answering
                ? "Generating one answer. Other answer buttons are disabled until it finishes."
                : answerTask?.status === "completed"
                  ? "Answer generated and saved to this guide."
                  : ""}
          </div>
        )}
        <div className="form-actions">
          <button
            className="primary"
            disabled={!resume || jd.trim().length < 30 || uploading || generating}
            onClick={() => generateGuide("technical")}
          >
            <Sparkles size={15} />
            Technical Interview
          </button>
          <button
            disabled={!resume || jd.trim().length < 30 || uploading || generating}
            onClick={() => generateGuide("hr")}
          >
            <MessageSquareText size={15} />
            Non-Technical Interview
          </button>
        </div>
      </div>
      <div className="panel">
        <h2>Your preparation library</h2>
        {!guides.length ? (
          <Empty title="Your confidence starts here." icon="interview">
            <p>
              Generated guides and answers will be saved here so you can return
              to them without generating again.
            </p>
          </Empty>
        ) : (
          guides.map((g) => (
            <div className="resume-card" key={g.id}>
              <MessageSquareText />
              <div>
                <strong>
                  {g.company || "Role preparation"} ·{" "}
                  {g.kind === "hr" ? "Non-technical" : "Technical"}
                </strong>
                <p>
                  {g.questions.length} questions · {date(g.created_at)}
                  {g.generation_mode === "built_in" ? " · Built-in practice guide" : g.generation_status === "generating" ? " · More questions are being prepared" : g.generation_status === "failed" ? " · Partial guide saved" : ""}
                </p>
              </div>
              <button
                onClick={() => {
                  setGuide(g);
                  setJD(g.jd || "");
                  setResume(g.resume_version_id || "");
                  setCompany(g.company || "");
                  setTab("questions");
                }}
              >
                Open guide
                <ArrowRight size={13} />
              </button>
            </div>
          ))
        )}
      </div>
      {guide && (
        <div className="panel">
          <div className="page-title">
            <div>
              <span className="eyebrow">SAVED PREPARATION GUIDE</span>
              <h2>{guide.company || "Your next interview"}</h2>
            </div>
            <div className="toolbar-group">
              {["docx", "pdf"].map((f) => (
                <button
                  key={f}
                  onClick={() => run(() => downloadContent(guide.id, f))}
                >
                  <ArrowDownToLine size={13} />
                  {f.toUpperCase()}
                </button>
              ))}
              <button
                className="ghost"
                onClick={() => { setGuide(null); setGenerationTaskId(""); }}
                aria-label="Close guide"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          {guide.generation_status === "failed" && <div className="notice error" role="alert">{guide.generation_error} Completed questions are preserved below.</div>}
          <div className="tabs">
            {[
              ["questions", "Questions"],
              ["priorities", "Must-prepare"],
            ].map(([id, label]) => (
              <button
                className={tab === id ? "active" : ""}
                key={id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {(
            <>
              <div className="toolbar-group" style={{ marginBottom: 16 }}>
                <input
                  aria-label="Search questions"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions…"
                />
                <select
                  aria-label="Question category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">All categories</option>
                  {Array.from(
                    new Set<string>(
                      guide.questions.map((q: Data) => q.category),
                    ),
                  ).map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="table-wrap">
                <table className="guide-table">
                  <colgroup>
                    <col className="guide-question-col" />
                    <col className="guide-action-col" />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Answer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guide.questions
                      .filter(
                        (q: Data) =>
                          (!category || q.category === category) &&
                          q.question
                            .toLowerCase()
                            .includes(search.toLowerCase()) &&
                          (tab !== "priorities" ||
                            guide.top_question_ids.includes(q.id)),
                      )
                      .map((q: Data) => (
                        <Fragment key={q.id}>
                          <tr className={q.answer ? "has-answer" : ""}>
                            <td>
                              <h3>Q{guide.questions.indexOf(q) + 1}. {q.question}</h3>
                              <p className="guide-category">{q.category}</p>
                            </td>
                            <td className="guide-action">
                              {q.answer ? (
                                <span className="tag green"><Check size={12} />Answered</span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={answering || generating || guide.generation_status === "generating"}
                                  onClick={() => answerQuestion(guide.id, q.id)}
                                >
                                  <Sparkles size={13} />
                                  {answering && answerTask?.question_id === q.id ? "Generating…" : "Answer"}
                                </button>
                              )}
                            </td>
                          </tr>
                          {q.answer && (
                            <tr className="guide-answer-row">
                              <td colSpan={2}>
                                <h4>Answer</h4>
                                <p className="answer">{q.answer}</p>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

function SettingsPage({
  integrations,
  tasks,
  run,
  onDelete,
}: {
  integrations: Data;
  tasks: Data[];
  run: Runner;
  onDelete: () => void;
}) {
  const [storage, setStorage] = useState<Data>({}),
    [preferences, setPreferences] = useState<Data>({}),
    [deleting, setDeleting] = useState(false),
    [password, setPassword] = useState("");
  useEffect(() => {
    api("/storage").then(setStorage);
    api("/preferences").then(setPreferences);
  }, []);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>Your workspace, your way.</h1>
          <p>Save your search preferences and see what’s connected.</p>
        </div>
      </div>
      <div className="panel">
        <h2>Search preferences</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () =>
                api("/preferences", "PUT", { ...preferences, design: "amber" }),
              "Preferences saved.",
            );
          }}
          className="form-stack"
        >
          <label>
            Target titles (comma separated)
            <input
              value={(preferences.target_titles || []).join(", ")}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  target_titles: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <label>
            Target countries (comma separated)
            <input
              value={(preferences.countries || []).join(", ")}
              onChange={(e) =>
                setPreferences({
                  ...preferences,
                  countries: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </label>
          <button className="primary" style={{ justifySelf: "start" }}>
            Save preferences
          </button>
        </form>
      </div>
      <div className="panel">
        <h2>Service connections</h2>
        <p>
          Connection indicators show configuration presence. They do not confirm
          provider health or account access.
        </p>
        <div className="integration-list">
          {[
            ["ai", "AI generation"],
            ["semantic_search", "Semantic knowledge"],
            ["job_discovery", "Employer job boards"],
            ["password_email", "Password reset email"],
            ["object_storage", "Private object storage"],
            ["fallback", "Fallback AI"],
          ].map(([k, label]) => (
            <div className="integration" key={k}>
              <span className="stat-icon">
                {integrations[k] ? <CheckCircle2 /> : <Settings2 />}
              </span>
              <div>
                <strong>{label}</strong>
                <p>
                  {integrations[k]
                    ? "Configured"
                    : "Backend configuration needed"}
                </p>
              </div>
              <span className={"tag " + (integrations[k] ? "green" : "amber")}>
                {integrations[k] ? "Ready" : "Pending"}
              </span>
            </div>
          ))}
        </div>
        <p>
          Database: {integrations.database} · Application channel:{" "}
          {integrations.submission}
        </p>
      </div>
      <div className="panel">
        <h2>Storage & document lifecycle</h2>
        <p>
          {((storage.bytes || 0) / 1024 / 1024).toFixed(2)} MB stored ·{" "}
          {storage.temporary_files || 0} temporary files
        </p>
        <Notice>
          Generated binary files expire after 24 hours. Saved content, original
          resumes and supporting attachments remain available. Format conversion
          uses saved content without another AI call.
        </Notice>
      </div>
      <div className="panel">
        <h2>Recent processing tasks</h2>
        {!tasks.length ? (
          <p>No processing tasks yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.kind.replace("_", " ")}</td>
                    <td>
                      <span
                        className={
                          "tag " +
                          (t.status === "completed"
                            ? "green"
                            : t.status === "failed"
                              ? "amber"
                              : "")
                        }
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>{date(t.created_at)}</td>
                    <td style={{ whiteSpace: "normal" }}>
                      {t.error || JSON.stringify(t.result)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="panel">
        <h2>Delete your account</h2>
        <p>
          Permanently delete your account, resume files, applications, generated
          content and knowledge index.
        </p>
        <button className="danger" onClick={() => setDeleting(true)}>
          Delete account…
        </button>
      </div>
      {deleting && (
        <Modal
          title="Permanently delete your account?"
          close={() => setDeleting(false)}
        >
          <Notice error>
            This permanently removes your stored career data and cannot be
            undone.
          </Notice>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => api("/account", "DELETE", { password })))
                onDelete();
            }}
          >
            <label>
              Enter your password to confirm
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <div className="form-actions">
              <button className="danger">Permanently delete account</button>
              <button type="button" onClick={() => setDeleting(false)}>
                Keep my account
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
