# Deployment Details

## Project Information
- **Project Name**: ott-drm-copilot
- **Team**: ishank-w-project
- **Vercel Project ID**: prj_D77Fo7P2Lh5l6hHNYCgcazK0QcOM

## Deployment URLs
- **Production URL**: https://ott-drm-copilot.vercel.app
- **Custom Domain**: https://ott-drm-troubleshooting-copilot.vercel.app
- **Alternative URL**: https://ott-drm-copilot-29pld3cs2-ishank-w-project.vercel.app

## API Endpoints
- **Health Check**: https://ott-drm-troubleshooting-copilot.vercel.app/api/health
- **Configuration**: https://ott-drm-troubleshooting-copilot.vercel.app/api/config
- **Analysis**: https://ott-drm-troubleshooting-copilot.vercel.app/api/analyze
- **API Docs**: https://ott-drm-troubleshooting-copilot.vercel.app/api/docs

## Technology Stack
- **Runtime**: Python 3.13
- **Framework**: FastAPI with Uvicorn
- **Frontend**: Static HTML/CSS/JS (served from `/public`)
- **Build System**: Vercel with uv (Python package manager)

## Configuration
- **Python Version**: >=3.10 (supports 3.10, 3.11, 3.12, 3.13)
- **Function Timeout**: 60 seconds
- **Region**: iad1 (Washington, D.C.)

## Key Files
- `vercel.json`: Vercel configuration
- `pyproject.toml`: Python project metadata and dependencies
- `api/index.py`: FastAPI application entry point
- `public/`: Static frontend files

## Status
✅ Deployment successful
✅ API endpoints responding
✅ Custom domain configured
✅ Static files being served correctly
✅ Pinecone RAG provider enabled and configured

## Environment Configuration
### RAG (Retrieval-Augmented Generation)
- **Provider**: Pinecone
- **Index**: ott-drm-ai-copilot
- **Namespace**: knowledge
- **Embedding Model**: llama-text-embed-v2
- **Cloud**: AWS (us-east-1)
- **Chunk Size**: 1000 tokens
- **Chunk Overlap**: 15%

### AI Features
- **AI Explanation**: Disabled (set to `false`)
- Can be enabled by setting `ENABLE_AI_EXPLANATION=true` in environment variables

## Notes
- The requested custom domain "OTT_DRM_Troubleshooting_Copilot.vercel.app" uses underscores which are not valid in DNS. Deployed as "ott-drm-troubleshooting-copilot.vercel.app" with hyphens instead.
- Pinecone is now the active RAG provider for semantic retrieval and knowledge base search
- All API keys and sensitive credentials are stored as encrypted environment variables in Vercel
