import {
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  FileText,
  Globe2,
  LayoutDashboard,
  MessageSquareText,
  Search,
  Sparkles,
} from "lucide-react";

export default function AmberPreview() {
  return (
    <div className="design-page standalone amber-preview">
      <div className="design-heading">
        <span className="eyebrow">CAREER ASSISTANT · AMBER DESK</span>
        <h1>Your next chapter, in a warmer light.</h1>
        <p>
          Warm cream, burnt orange and a focused workspace. Your selected
          design.
        </p>
      </div>
      <article className="design-card">
        {" "}
        <div className="mini amber">
          <div className="mini-top">
            <span className="mini-logo">
              <BriefcaseBusiness size={15} /> Career Assistant
            </span>
            <span className="mini-avatar">YA</span>
          </div>
          <div className="mini-layout">
            <aside>
              <span className="mini-nav active">
                <LayoutDashboard />
                Overview
              </span>
              <span className="mini-nav">
                <BriefcaseBusiness />
                Domestic Jobs
              </span>
              <span className="mini-nav">
                <Globe2 />
                Visa Sponsored
              </span>
              <span className="mini-nav">
                <MessageSquareText />
                Interview Questions
              </span>
              <div className="mini-aside-end">
                <FileText />
                Your resume <CheckCircle2 size={12} />
              </div>
            </aside>
            <main>
              <div className="mini-breadcrumb">
                YOUR CAREER, IN MOTION <Sparkles size={10} />
              </div>
              <h2>Your next chapter starts here.</h2>
              <p>A little progress today. A world of possibilities tomorrow.</p>
              <div className="mini-stats">
                <div>
                  <span>Saved opportunities</span>
                  <strong>
                    12 <small>↗ 3 this week</small>
                  </strong>
                </div>
                <div>
                  <span>Applications in progress</span>
                  <strong>
                    4 <small>Keep going</small>
                  </strong>
                </div>
              </div>
              <div className="mini-banner">
                <div>
                  <b>Find your next great role</b>
                  <p>Opportunities that fit your experience and ambition.</p>
                </div>
                <button tabIndex={-1}>
                  <Search size={10} /> Explore jobs
                </button>
              </div>
              <div className="mini-list-title">
                <b>Your opportunities</b>
                <span>
                  View all <ArrowUpRight size={10} />
                </span>
              </div>
              <div className="mini-list">
                <span className="company-icon">N</span>
                <div>
                  <b>Senior Software Engineer</b>
                  <p>Northstar · Bengaluru, India</p>
                </div>
                <span className="fit">92% fit</span>
              </div>
              <div className="mini-list">
                <span className="company-icon alt">A</span>
                <div>
                  <b>Engineering Lead</b>
                  <p>Arc Labs · Remote</p>
                </div>
                <span className="fit">88% fit</span>
              </div>
              <div className="mini-disclaimer">
                ILLUSTRATIVE DESIGN DATA · NOT LIVE JOB RESULTS
              </div>
            </main>
          </div>
        </div>
        <div className="design-info">
          <span className="eyebrow">FINAL SELECTED THEME</span>
          <h2>Amber Desk</h2>
          <p>
            This is the only theme in Career Assistant. The application uses
            this palette throughout login, your workspace, forms and interview
            preparation.
          </p>
        </div>
      </article>
      <p className="preview-note">
        Illustrative design data · not live job results.
      </p>
    </div>
  );
}
