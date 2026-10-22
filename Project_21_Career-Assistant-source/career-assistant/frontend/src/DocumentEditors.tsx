import { useState } from "react";
import { api } from "./api";
type Data = Record<string, any>;
type Runner = (fn: () => Promise<any>, message?: string) => Promise<any>;

export function ContentEditor({
  content,
  run,
}: {
  content: Data;
  run: Runner;
}) {
  const [editing, setEditing] = useState(false),
    [sections, setSections] = useState<Data[]>(
      content.structured_content.sections,
    );
  return (
    <div style={{ margin: "16px 0" }}>
      {!editing ? (
        <button onClick={() => setEditing(true)}>Edit document text</button>
      ) : (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await run(
                () =>
                  api("/content/" + content.id, "PUT", {
                    structured_content: {
                      ...content.structured_content,
                      sections,
                    },
                  }),
                "Edits saved. Review and approve the updated content.",
              )
            )
              setEditing(false);
          }}
        >
          <div className="form-stack">
            {sections.map((s, i) => (
              <label key={i}>
                {s.heading}
                <textarea
                  rows={6}
                  value={s.text}
                  onChange={(e) =>
                    setSections(
                      sections.map((v, n) =>
                        n === i ? { ...v, text: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <div className="form-actions">
            <button className="primary">Save edits</button>
            <button type="button" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function RequirementEditor({
  job,
  run,
  done,
}: {
  job: Data;
  run: Runner;
  done: () => void;
}) {
  const [docs, setDocs] = useState(job.mandatory_documents.join(", ")),
    [known, setKnown] = useState(!!job.mandatory_documents_known);
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await run(
            () =>
              api("/jobs/" + job.id, "PATCH", {
                mandatory_documents: docs
                  .split(",")
                  .map((x: string) => x.trim())
                  .filter(Boolean),
                mandatory_documents_known: known,
              }),
            "Document requirements updated.",
          )
        )
          done();
      }}
    >
      <h3>Confirm mandatory documents</h3>
      <label>
        Employer requirements, comma separated
        <input value={docs} onChange={(e) => setDocs(e.target.value)} />
      </label>
      <label
        style={{ display: "flex", alignItems: "center", margin: "15px 0" }}
      >
        <input
          type="checkbox"
          checked={known}
          onChange={(e) => setKnown(e.target.checked)}
        />
        I reviewed the employer application form.
      </label>
      <button>Save document requirements</button>
    </form>
  );
}

export function SubmissionReview({
  outcomes,
  jobs,
  run,
  done,
}: {
  outcomes: Data[];
  jobs: Data[];
  run: Runner;
  done: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const supported = outcomes.filter(
    (o) => o.valid && o.channel === "greenhouse",
  );
  if (!supported.length) return null;
  return (
    <form
      className="panel"
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await run(
            () =>
              api("/applications/submit", "POST", {
                job_ids: supported.map((o) => o.job_id),
                confirmed,
              }),
            "Confirmed submissions queued. Review each processing outcome in Settings.",
          )
        )
          done();
      }}
    >
      <h3>Submit through authorized employer connectors</h3>
      <p>
        This sends your reviewed name, contact email, resume and available cover
        letter to the following employers through Greenhouse:
      </p>
      <ul>
        {supported.map((o) => (
          <li key={o.job_id}>
            {jobs.find((j) => j.id === o.job_id)?.company || o.job_id} —{" "}
            {jobs.find((j) => j.id === o.job_id)?.title}
          </li>
        ))}
      </ul>
      <label
        style={{ display: "flex", alignItems: "center", margin: "15px 0" }}
      >
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        />
        I reviewed these employers and documents and authorize these
        submissions.
      </label>
      <button className="primary" disabled={!confirmed}>
        Submit {supported.length} application{supported.length > 1 ? "s" : ""}
      </button>
      <p>
        Jobs needing additional answers or legal consent must be completed on
        the employer site. Uncertain submission outcomes are never retried
        automatically.
      </p>
    </form>
  );
}
