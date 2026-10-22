import { ReactNode } from "react";

function label(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
export default function StructuredData({
  value,
  name = "",
}: {
  value: any;
  name?: string;
}): ReactNode {
  if (value === null || value === undefined)
    return <p>Insufficient information to determine.</p>;
  if (typeof value !== "object")
    return [
      "solution",
      "code",
      "sql",
      "schema",
      "sample_data",
      "expected_output",
    ].some((k) => name.toLowerCase().includes(k)) ? (
      <pre>{String(value)}</pre>
    ) : (
      <p className="answer">{String(value)}</p>
    );
  if (Array.isArray(value))
    return (
      <div>
        {value.map((item, i) => (
          <div
            key={i}
            style={{
              borderBottom: "1px solid var(--border)",
              padding: "5px 0",
            }}
          >
            {typeof item === "object" ? (
              <StructuredData value={item} />
            ) : (
              <p>{String(item)}</p>
            )}
          </div>
        ))}
      </div>
    );
  return (
    <div>
      {Object.entries(value).map(([key, item]) => (
        <section key={key} style={{ margin: "14px 0" }}>
          <strong style={{ fontSize: 12 }}>{label(key)}</strong>
          <StructuredData value={item} name={key} />
        </section>
      ))}
    </div>
  );
}

export function EmploymentEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (s: string) => void;
}) {
  let rows: Record<string, any>[] = [];
  try {
    rows = JSON.parse(value);
  } catch {}
  const update = (index: number, key: string, next: any) =>
    onChange(
      JSON.stringify(
        rows.map((r, i) => (i === index ? { ...r, [key]: next } : r)),
      ),
    );
  return (
    <div className="full">
      <h3>Employment history</h3>
      <p style={{ fontSize: 12 }}>
        Add real employers and dates. Leave the end date empty for a current
        role. Unknown dates can remain blank for review.
      </p>
      {rows.map((r, i) => (
        <div className="panel" key={i}>
          <div className="form-grid">
            {[
              ["employer", "Employer"],
              ["title", "Job title"],
              ["start", "Start month"],
              ["end", "End month (empty if current)"],
              ["domain", "Industry or domain"],
            ].map(([key, text]) => (
              <label key={key}>
                {text}
                <input
                  type={["start", "end"].includes(key) ? "month" : "text"}
                  value={r[key] || ""}
                  onChange={(e) => update(i, key, e.target.value)}
                />
              </label>
            ))}
            <label>
              Technologies (comma separated)
              <input
                value={(r.technologies || []).join(", ")}
                onChange={(e) =>
                  update(
                    i,
                    "technologies",
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>
          </div>
          <button
            type="button"
            className="ghost danger"
            onClick={() =>
              onChange(JSON.stringify(rows.filter((_, j) => i !== j)))
            }
            style={{ marginTop: 10 }}
          >
            Remove role
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          onChange(
            JSON.stringify([
              ...rows,
              {
                employer: "",
                title: "",
                start: "",
                end: "",
                domain: "",
                technologies: [],
              },
            ]),
          )
        }
      >
        Add employment
      </button>
    </div>
  );
}
