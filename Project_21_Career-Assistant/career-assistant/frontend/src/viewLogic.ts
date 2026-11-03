export function togglePageSelection(
  selected: string[],
  pageIds: string[],
  checked: boolean,
): string[] {
  return checked
    ? Array.from(new Set([...selected, ...pageIds]))
    : selected.filter((id) => !pageIds.includes(id));
}
export function pageNumbers(totalPages: number, current: number): number[] {
  const total = Math.max(1, Math.floor(totalPages));
  const start = Math.min(Math.max(1, current - 2), Math.max(1, total - 4));
  return Array.from({ length: Math.min(total, 5) }, (_, i) => start + i);
}
export function date(value: string): string {
  if (!value) return "—";
  const normalized = /Z$|[+-]\d{2}:\d{2}$/.test(value) ? value : value + "Z";
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

type Task = Record<string, any>;
export function discoveryTask(tasks: Task[], module: string, openedAt: number): Task | undefined {
  return tasks.find((task) => task.kind === "discover" && task.module === module &&
    (["queued", "running"].includes(task.status) || new Date(task.created_at + (task.created_at?.endsWith("Z") ? "" : "Z")).getTime() >= openedAt));
}

export function tasksChanged(previous: Task[], next: Task[]): boolean {
  return next.some((task) => {
    const old = previous.find((item) => item.id === task.id);
    return !old || old.status !== task.status || JSON.stringify(old.result) !== JSON.stringify(task.result);
  }) || previous.length !== next.length;
}

export function taskCompletion(task: Task): string {
  if (task.status === "failed") return task.error || "Processing failed. Please retry.";
  if (task.kind === "ingest") return "Resume processed and ready to use.";
  if (task.kind === "interview") return "Interview questions are ready in your preparation library.";
  if (task.kind === "interview_answer") return "The answer is saved to your interview guide.";
  if (task.kind === "countries") return task.result?.cached ? "Showing your saved country suggestions." : "Country suggestions are ready.";
  if (task.kind === "research") return task.result?.cached ? "Showing your saved title suggestions." : "Title suggestions are ready.";
  if (task.kind === "document") return "Your document is ready below.";
  if (task.kind === "reparse") return "Profile extraction finished. Review the updated candidate profile.";
  if (task.kind === "discover") return `Job discovery complete. ${task.result?.saved || 0} matching jobs found.`;
  return "Processing completed.";
}

export const profileFields = ["name","email","phone","linkedin","portfolio","location","designation","skills","employments","education","certifications","projects","achievements","notice_period","salary_expectations","relocation_confirmed","approved"];
export function profileSnapshot(profile: Record<string, any> | null, employmentText: string): string {
  if (!profile) return "";
  let employments: unknown;
  try { employments = JSON.parse(employmentText); } catch { employments = employmentText; }
  return JSON.stringify(profileFields.map((key) => key === "employments" ? employments : profile[key]));
}
export function answerDetails(question: Record<string, any>): Record<string, any> {
  const hidden = new Set(["id","question","difficulty","source_classification","interview_round","preparation_note","short_answer","detailed_answer","personalized_answer","jd_relevance","resume_relevance","qualitative_likelihood","priority"]);
  return Object.fromEntries(Object.entries(question).filter(([key]) => !hidden.has(key)));
}

export function titleRegions(research: Record<string, any>, module: string): {region: string; titles: string[]}[] {
  const titles = (values: any[]) => Array.from(new Set((values || []).map((value) => typeof value === "string" ? value : value.title).filter((value) => typeof value === "string" && value.trim())));
  if (Array.isArray(research.regions)) return research.regions.map((group: any) => ({region: group.region, titles: titles(group.titles || group.countries)}));
  // Older saved suggestions had a global title list. Keep them readable without displaying raw provider data.
  if (module === "domestic") return [{region: "India", titles: titles(research.titles)}];
  const names = Array.from(new Set<string>((research.countries || []).flatMap((country: any) => country.regions?.length ? country.regions : [country.country]).filter(Boolean)));
  return (names.length ? names : ["International"]).map((region) => ({region, titles: titles(research.titles)}));
}
