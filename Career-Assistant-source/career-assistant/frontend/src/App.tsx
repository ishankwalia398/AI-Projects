import { useState, useEffect, useCallback, ReactNode, FormEvent } from "react";
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
  Menu,
  MessageSquareText,
  Paperclip,
  Plus,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  Target,
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
import { date, pageNumbers, togglePageSelection } from "./viewLogic";

type Data = Record<string, any>;
type Runner = (operation: () => Promise<any>, message?: string) => Promise<any>;
const nav = [
  { id: "domestic", title: "Domestic Jobs", icon: BriefcaseBusiness },
  { id: "visa", title: "Visa Sponsored Jobs", icon: Globe2 },
  { id: "interview", title: "Interview Questions", icon: MessageSquareText },
];
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
        {import.meta.env.VITE_BACKEND_CONFIGURED === "false" && (
          <Notice>
            Account services are unavailable because the backend is not
            connected yet.
          </Notice>
        )}
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
  const run: Runner = async (fn, msg) => {
    setBusy(true);
    try {
      const r = await fn();
      if (msg) {
        setMessage(msg);
        setError(false);
      }
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
          setTasks((previous) => {
            const changed = previous.some((p) =>
              t.some((n: Data) => n.id === p.id && n.status !== p.status),
            );
            if (changed) reload();
            return t;
          });
        })
        .catch(() => {});
    }, 4000);
    return () => clearInterval(timer);
  }, [user]);
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
  return (
    <div className={"shell " + (menu ? "menu-open" : "")}>
      <aside className="sidebar">
        <Brand />
        <span className="nav-caption">YOUR WORKSPACE</span>
        <nav>
          {nav.map((n) => (
            <button
              key={n.id}
              className={"nav-button " + (page === n.id ? "active" : "")}
              onClick={() => go(n.id)}
            >
              <n.icon />
              {n.title}
            </button>
          ))}
        </nav>
        <span className="nav-caption">PERSONAL</span>
        <nav>
          <button
            className={"nav-button " + (page === "resume" ? "active" : "")}
            onClick={() => go("resume")}
          >
            <FileText />
            Resume library
          </button>
          <button
            className={"nav-button " + (page === "profile" ? "active" : "")}
            onClick={() => go("profile")}
          >
            <UserRound />
            Candidate profile
          </button>
        </nav>
        <div className="nav-end">
          <div className="side-note">
            <Sparkles size={17} color="var(--accent)" />
            <p>
              <strong>A little progress, every day.</strong>
            </p>
            <p>Your next chapter starts with the step you take today.</p>
          </div>
          <button
            className={"nav-button " + (page === "settings" ? "active" : "")}
            onClick={() => go("settings")}
          >
            <Settings2 />
            Settings
          </button>
          <button
            className="nav-button"
            onClick={() =>
              run(async () => {
                await api("/auth/logout", "POST");
                setUser(null);
                setCsrf("");
              })
            }
          >
            <LogOut />
            Logout
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="ghost mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            My workspace <ChevronRight size={12} />
            <strong>
              {nav.find((n) => n.id === page)?.title ||
                (
                  {
                    resume: "Resume library",
                    profile: "Candidate profile",
                    settings: "Settings",
                  } as Data
                )[page]}
            </strong>
          </div>
          <div className="account">
            <span className="tag green">
              <span style={{ fontSize: 8 }}>●</span> Private workspace
            </span>
            <span className="avatar">
              {user.username.slice(0, 2).toUpperCase()}
            </span>
            <span>{user.username}</span>
            <ChevronDown size={12} />
          </div>
        </header>
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
              . You can keep working; progress is saved.
            </Notice>
          )}
          {page === "domestic" || page === "visa" ? (
            <Jobs
              module={page}
              stats={stats}
              run={run}
              version={version}
              busy={busy}
              go={go}
            />
          ) : page === "resume" ? (
            <Resumes run={run} version={version} go={go} />
          ) : page === "profile" ? (
            <ProfileEditor run={run} version={version} />
          ) : page === "interview" ? (
            <InterviewPage run={run} version={version} />
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
}: {
  module: string;
  stats: Data;
  run: Runner;
  version: number;
  busy: boolean;
  go: (s: string) => void;
}) {
  const [jobs, setJobs] = useState<Data[]>([]),
    [total, setTotal] = useState(0),
    [page, setPage] = useState(1),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState(""),
    [sort, setSort] = useState("default"),
    [history, setHistory] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [add, setAdd] = useState(false),
    [detail, setDetail] = useState<Data | null>(null),
    [contentJob, setContentJob] = useState<string | null>(null),
    [outcomes, setOutcomes] = useState<Data[] | null>(null),
    [research, setResearch] = useState<Data | null>(null),
    [errors, setErrors] = useState<Record<string, string>>({}),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    setPage(1);
    setSelected([]);
    setErrors({});
  }, [module, query, status, sort, history]);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const params = new URLSearchParams({
      module,
      page: String(page),
      q: query,
      status,
      sort,
      history: String(history),
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
  }, [module, page, query, status, sort, history, version]);
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
          disabled={busy}
          onClick={() =>
            run(
              () => api("/jobs/discover", "POST", { module }),
              "Job discovery queued. Results will appear when processing completes.",
            )
          }
        >
          <Search size={16} />
          Find Jobs
        </button>
      </div>
      <div className="stats">
        {[
          {
            label: "Saved opportunities",
            value: stats.saved || 0,
            icon: BriefcaseBusiness,
            note: "Across your workspace",
          },
          {
            label: "Applications tracked",
            value: stats.applied || 0,
            icon: ArrowUpRight,
            note: "Every step, in one place",
          },
          {
            label: "At interview stage",
            value: stats.interviews || 0,
            icon: MessageSquareText,
            note: "Make a great impression",
          },
          {
            label: "Preparation guides",
            value: stats.guides || 0,
            icon: FileText,
            note: "Ready when you are",
          },
        ].map((s) => (
          <div className="stat" key={s.label}>
            <div className="stat-top">
              {s.label}
              <span className="stat-icon">
                <s.icon />
              </span>
            </div>
            <strong>{s.value}</strong>
            <small>{s.note}</small>
          </div>
        ))}
      </div>
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
              {module === "visa"
                ? "International opportunities"
                : "Your opportunities"}{" "}
              <span className="tag">{total} saved</span>
            </h2>
            <p style={{ margin: 0 }}>
              Matching Probability is an estimated fit score, not a hiring
              probability.
            </p>
          </div>
          <div className="toolbar-group">
            <button
              onClick={() =>
                run(async () => {
                  await api("/research", "POST", { module });
                }, "Title research queued.")
              }
            >
              <Sparkles size={14} />
              Suggest titles
            </button>
            <button
              onClick={async () => {
                const r = await run(() => api("/research/" + module));
                if (r) setResearch(r);
              }}
            >
              <FileText size={14} />
              Saved research
            </button>
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
                setHistory(false);
              }}
              aria-label="Reset to default"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="toolbar-group">
            <label
              style={{ display: "flex", alignItems: "center", fontSize: 11 }}
            >
              <input
                type="checkbox"
                checked={history}
                onChange={(e) => setHistory(e.target.checked)}
              />
              Include history
            </label>
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
                    "Generate Documents",
                    "Download Documents",
                    "Status",
                    "Date",
                    "Attachments",
                    "Comment",
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
                      {j.mandatory_documents.length
                        ? j.mandatory_documents.join(", ")
                        : j.mandatory_documents_known
                          ? "None listed"
                          : "Unknown · review form"}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          run(
                            () => api("/jobs/" + j.id + "/generate", "POST"),
                            "Document generation queued. Review generated text before downloading.",
                          )
                        }
                      >
                        <Sparkles size={12} />
                        Generate
                      </button>
                    </td>
                    <td>
                      <button onClick={() => setContentJob(j.id)}>
                        <ArrowDownToLine size={12} />
                        Documents
                      </button>
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
      {contentJob && (
        <Modal
          title="Your tailored documents"
          close={() => setContentJob(null)}
        >
          <ContentDocuments jobId={contentJob} run={run} version={version} />
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
          <Notice>{research.disclaimer}</Notice>
          <StructuredData value={research} />
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

function ContentDocuments({
  jobId,
  run,
  version,
}: {
  jobId: string;
  run: Runner;
  version: number;
}) {
  const [items, setItems] = useState<Data[]>([]);
  useEffect(() => {
    api("/content?job_id=" + jobId)
      .then(setItems)
      .catch(() => {});
  }, [jobId, version]);
  return (
    <>
      {!items.length ? (
        <Empty title="No generated content yet." icon="resume">
          <p>
            Use Generate in the job row to create saved resume and cover letter
            text. An AI provider must be configured.
          </p>
        </Empty>
      ) : (
        items.map((c) => (
          <div key={c.id} className="panel">
            <h2>
              {c.content_type === "resume" ? "Tailored resume" : "Cover letter"}
            </h2>
            <span className="tag">{c.validation_status.replace("_", " ")}</span>
            <pre>{c.markdown_content}</pre>
            <ContentEditor content={c} run={run} />
            {c.validation_status !== "approved" ? (
              <>
                <Notice>
                  Check every name, employer, date, metric and achievement
                  against your real experience before approval.
                </Notice>
                <button
                  className="primary"
                  onClick={() =>
                    run(
                      () => api("/content/" + c.id + "/approve", "POST"),
                      "Content approved. Formats are now available.",
                    )
                  }
                >
                  <Check size={14} />
                  Approve reviewed content
                </button>
              </>
            ) : (
              <div className="toolbar-group">
                {["docx", "pdf", "tex", "zip"].map((f) => (
                  <button
                    key={f}
                    onClick={() => run(() => downloadContent(c.id, f))}
                  >
                    <ArrowDownToLine size={13} />
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
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
  useEffect(() => {
    api("/profile")
      .then((p) => {
        setProfile(p);
        setEmploymentText(JSON.stringify(p?.employments || [], null, 2));
      })
      .catch(() => {});
  }, [version]);
  const update = (k: string, v: any) => setProfile((p) => ({ ...p, [k]: v }));
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
          <Notice>
            Extracted skills are suggestions from your resume text. Confirm them
            and complete missing fields. Employment dates use YYYY-MM or
            YYYY-MM-DD. Use an empty end date for a current role.
          </Notice>
          <form
            className="panel"
            onSubmit={async (e) => {
              e.preventDefault();
              await run(
                async () =>
                  api("/profile", "PUT", {
                    ...profile,
                    employments: JSON.parse(employmentText),
                  }),
                "Candidate profile saved.",
              );
            }}
          >
            <div className="form-grid">
              {[
                ["name", "Name"],
                ["email", "Contact email"],
                ["phone", "Phone (optional)"],
                ["linkedin", "LinkedIn (optional)"],
                ["portfolio", "Portfolio (optional)"],
                ["location", "Location"],
                ["designation", "Current designation"],
                ["notice_period", "Notice period (optional)"],
                ["salary_expectations", "Salary expectations (optional)"],
              ].map(([key, label]) => (
                <label key={key}>
                  {label}
                  <input
                    value={profile[key] || ""}
                    onChange={(e) => update(key, e.target.value)}
                    maxLength={key === "email" ? 254 : 200}
                  />
                </label>
              ))}
              <label className="full">
                Skills (comma separated)
                <input
                  value={(profile.skills || []).join(", ")}
                  onChange={(e) =>
                    update(
                      "skills",
                      e.target.value.split(",").map((s) => s.trim()),
                    )
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
              <button className="primary">
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

function InterviewPage({ run, version }: { run: Runner; version: number }) {
  const [resumes, setResumes] = useState<Data[]>([]),
    [guides, setGuides] = useState<Data[]>([]),
    [resume, setResume] = useState(""),
    [jd, setJD] = useState(""),
    [url, setUrl] = useState(""),
    [company, setCompany] = useState(""),
    [guide, setGuide] = useState<Data | null>(null),
    [tab, setTab] = useState("questions"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState(""),
    [mock, setMock] = useState<Data>({}),
    [mockIndex, setMockIndex] = useState(0);
  useEffect(() => {
    api("/resumes").then((r) => {
      setResumes(r);
      if (!resume)
        setResume(r.find((x: Data) => x.active)?.id || r[0]?.id || "");
    });
    api("/interviews").then(setGuides);
  }, [version]);
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">SHOW UP WITH CONFIDENCE</span>
          <h1>A little preparation. A big difference.</h1>
          <p>
            Role-specific questions, thoughtful answers, and a plan to make
            progress.
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
                placeholder="https://jobs.lever.co/…"
              />
              <button
                onClick={async () => {
                  const r = await run(() =>
                    api("/jd/extract", "POST", { url }),
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
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const b = new FormData();
                b.append("file", f);
                await run(
                  () => api("/resumes", "POST", b),
                  "Alternate resume queued. Select it after processing; your active resume is unchanged.",
                );
              }}
            />
          </label>
        </div>
        <div className="form-actions">
          <button
            className="primary"
            disabled={!resume || jd.length < 30}
            onClick={() =>
              run(
                () =>
                  api("/interviews", "POST", {
                    kind: "technical",
                    jd,
                    resume_id: resume,
                    company,
                  }),
                "Technical guide queued. Category batches are saved as they complete.",
              )
            }
          >
            <Sparkles size={15} />
            Technical Interview
          </button>
          <button
            disabled={!resume || jd.length < 30}
            onClick={() =>
              run(
                () =>
                  api("/interviews", "POST", {
                    kind: "hr",
                    jd,
                    resume_id: resume,
                    company,
                  }),
                "Non-technical guide queued. Each question includes answers and personalization notes.",
              )
            }
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
                  {g.questions.length} answered questions · {date(g.created_at)}
                </p>
              </div>
              <button
                onClick={() => {
                  setGuide(g);
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
                onClick={() => setGuide(null)}
                aria-label="Close guide"
              >
                <X size={16} />
              </button>
            </div>
          </div>
          <Notice>
            AI-generated preparation requires review. Predicted questions are
            not evidence of actual company interview questions. Code solutions
            have not been executed by this application.
          </Notice>
          <div className="tabs">
            {[
              ["questions", "Questions & answers"],
              ["priorities", "Must-prepare"],
              ["plans", "Preparation plans"],
              ["mocks", "Mock interview"],
              ["context", "Skills & research"],
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
          {["questions", "priorities"].includes(tab) ? (
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
                  <thead>
                    <tr>
                      <th>Question</th>
                      <th>Answer & preparation notes</th>
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
                        <tr key={q.id}>
                          <td>
                            <span className="tag">
                              {q.id} · {q.difficulty}
                            </span>
                            <h3>{q.question}</h3>
                            <p>{q.category}</p>
                            <small>
                              {q.source_classification} · {q.interview_round}
                            </small>
                          </td>
                          <td>
                            <strong>{q.short_answer}</strong>
                            <p className="answer">
                              {q.personalized_answer || q.detailed_answer}
                            </p>
                            <details>
                              <summary>
                                Full answer, examples & follow-ups
                              </summary>
                              <StructuredData value={q} />
                            </details>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : tab === "plans" ? (
            <>
              {["7", "14", "30"].map((days) => (
                <details key={days} className="panel">
                  <summary>{days}-day preparation plan</summary>
                  <StructuredData value={guide.plans[days]} />
                </details>
              ))}
            </>
          ) : tab === "context" ? (
            <StructuredData
              value={{
                candidate_summary: guide.candidate_summary,
                jd_analysis: guide.jd_analysis,
                skills_matrix: guide.skills_matrix,
                skill_gaps: guide.skill_gaps,
                top_topics: guide.top_topics,
                company_research: guide.company_research,
                readiness_checklist: guide.readiness_checklist,
                star_story_bank: guide.star_story_bank,
              }}
            />
          ) : (
            <>
              <label>
                Mock round
                <select
                  value={mockIndex}
                  onChange={(e) => setMockIndex(Number(e.target.value))}
                >
                  {(Array.isArray(guide.mock_interviews)
                    ? guide.mock_interviews
                    : []
                  ).map((m: Data, i: number) => (
                    <option key={i} value={i}>
                      {m.name || m.title || "Round " + (i + 1)}
                    </option>
                  ))}
                </select>
              </label>
              <StructuredData value={guide.mock_interviews[mockIndex]} />
              <label>
                Your practice answers and self-assessment
                <textarea
                  rows={8}
                  value={mock.answer || ""}
                  onChange={(e) => setMock({ ...mock, answer: e.target.value })}
                />
              </label>
              <label style={{ marginTop: 15 }}>
                Self-score (0–5)
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={mock.score || 0}
                  onChange={(e) =>
                    setMock({ ...mock, score: Number(e.target.value) })
                  }
                />
              </label>
              <button
                className="primary"
                style={{ marginTop: 15 }}
                onClick={() =>
                  run(
                    () =>
                      api("/interviews/" + guide.id + "/sessions", "POST", {
                        ...mock,
                        round: mockIndex,
                      }),
                    "Practice session saved.",
                  )
                }
              >
                Save practice session
              </button>
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
