import streamlit as st


def apply_theme(mode: str):
    dark = mode == "Dark"
    bg, card, text, muted, border = (("#08111f", "#101d31", "#e8f1ff", "#9fb2cc", "#243b5a") if dark else ("#f4f8fd", "#ffffff", "#10233f", "#50657f", "#d5e2f0"))
    color_scheme = "dark" if dark else "light"
    st.markdown(f"""<style>
    .stApp {{ background:{bg}; color:{text}; color-scheme:{color_scheme}; }}
    [data-testid="stHeader"] {{ background:transparent; }}
    [data-testid="stSidebar"] {{ background:{card}; }}
    div[data-testid="stMetric"], .qa-card {{ background:{card}; border:1px solid {border}; border-radius:14px; padding:14px; }}
    h1,h2,h3,p,label {{ color:{text}; }} .qa-subtitle {{ color:{muted}; font-size:1.08rem; }}
    [data-testid="stTextArea"] div[data-baseweb="base-input"],
    [data-testid="stTextArea"] div[data-baseweb="textarea"],
    [data-testid="stTextArea"] div[data-baseweb="textarea"] > div {{
        background-color:{card} !important;
        border-color:{border} !important;
    }}
    [data-testid="stTextArea"] textarea {{
        background-color:{card} !important;
        color:{text} !important;
        caret-color:{text} !important;
        -webkit-text-fill-color:{text} !important;
    }}
    [data-testid="stTextArea"] textarea::placeholder {{
        color:{muted} !important;
        -webkit-text-fill-color:{muted} !important;
        opacity:1;
    }}
    [data-testid="stTextArea"] textarea::selection {{
        background:#7db4ff;
        color:#08111f;
        -webkit-text-fill-color:#08111f;
    }}
    .qa-badge {{ display:inline-block; border-radius:999px; padding:4px 10px; background:#1264d8; color:white; font-weight:600; }}
    .stButton button[kind="primary"] {{ background:#1264d8; border-color:#1264d8; }}
    </style>""", unsafe_allow_html=True)
