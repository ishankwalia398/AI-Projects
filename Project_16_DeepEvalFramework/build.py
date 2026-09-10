"""Build the walkthrough and validate the live dashboard template."""
from pathlib import Path
import runpy
import shutil

ROOT = Path(__file__).resolve().parent
SNAPSHOT = ROOT / "03_DeepFramework/dashboard/snapshot"
runpy.run_path(str(SNAPSHOT / "build_static.py"), run_name="__main__")
output = ROOT / "dist"
output.mkdir(exist_ok=True)
shutil.copy2(SNAPSHOT / "dist/how-it-works.html", output / "how-it-works.html")
from app import templates, catalog, CATEGORIES
from hosted import CHATBOT_MODEL, JUDGE_MODEL
page = templates.env.get_template("index.html").render(
    cards=catalog(), categories=CATEGORIES, judge_model=JUDGE_MODEL,
    chatbot_url=CHATBOT_MODEL, rag_url="Bundled policies - BM25 retrieval",
)
assert "snapshot" not in page.lower()
assert page.count('<article class="card"') == 25
(output / "index.html").write_text(page, encoding="utf-8")
print("Live template validated: 25 metric cards, no snapshot notice.")
