# OTT / DRM / Streaming — Curated Resource Index for RAG Ingestion

Compiled: August 16, 2026
Scope: OTT, Widevine, FairPlay, PlayReady, HLS, MPEG-DASH, CDN, ABR, HDCP, CENC, PSSH,
license acquisition, player errors, device compatibility, historical production incidents.

Each entry includes: Topic | Resource Title | URL | Type | Why it's useful.
Organized so each section can be chunked independently for embedding.

---

## 1. OTT (Over-The-Top) — General

1. **DASH-IF** — https://dashif.org — Org site. Standards body hub for DASH/CMAF/streaming interoperability guidelines; good root for crawling multiple sub-specs.
2. **SVTA (Streaming Video Technology Alliance)** — https://www.svta.org — Org site. Industry alliance publishing shared vocabularies (error codes, device matrices, QoE definitions) across OTT vendors — high-value for RAG since it aggregates cross-vendor standards.
3. **SVTA University resource index** — https://university.svta.org — Curated links to DRM/streaming vendor docs (Widevine, PlayReady, FairPlay) in one place.
4. **Bitmovin Developer Docs (Encoding + Playback)** — https://developer.bitmovin.com — Vendor docs, has an `llms.txt` index (https://developer.bitmovin.com/encoding/llms.txt) explicitly formatted for AI ingestion — ideal RAG source.
5. **OTTVerse** — https://ottverse.com — Industry blog with deep technical explainers on DRM, HLS, DASH, CMAF, ABR internals, written by streaming engineers.
6. **Unified Streaming Docs** — https://docs.unified-streaming.com — Practical packaging/DRM implementation docs (CENC, CPIX, multi-DRM).

---

## 2. Widevine (Google DRM)

1. **Widevine official developer docs** — https://developers.google.com/widevine/drm/overview — Primary source. Architecture, Cloud License Service endpoints, EME integration, encryption-scheme-per-platform mapping.
2. **Widevine DRM Architecture Overview (whitepaper PDF)** — https://www.whymatematica.com/wp-content/uploads/2018/08/Widevine_DRM_Architecture_Overview.pdf — Deep architecture doc: License Server flow, OEMCrypto, InitData/CDM flow diagrams — good for RAG chunks on license request/response sequence.
3. **Widevine solutions page** — https://widevine.com/solutions/widevine-drm — CWIP certification program, CENC/EME open-spec references.
4. **Widevine security levels (Bitmovin)** — https://developer.bitmovin.com/playback/docs/widevine-security-levels-in-web-video-playback — L1/L2/L3 explained with `videoRobustness` config guidance.
5. **Widevine L1/L2/L3 deep-dive (Forasoft)** — https://www.forasoft.com/learn/video-streaming/articles-streaming/widevine-l1-l2-l3 — Practical device-matrix framing of security levels vs. resolution entitlement.
6. **Widevine security levels device compatibility (bunny.net)** — https://docs.bunny.net/stream/widevine-security-levels — Concrete device/browser support tables for L1/L2/L3.
7. **Wikipedia: Widevine** — https://en.wikipedia.org/wiki/Widevine — Background/history (Google acquisition 2010, cross-platform support).
8. **VdoCipher: Widevine DRM guide** — https://www.vdocipher.com/blog/widevine-drm-hollywood-video/ — Practical integration explainer covering Shaka Player + EME + OEMCrypto relationship.
9. **DoveRunner/PallyCon Widevine Android SDK docs** — https://pallycon.com/docs/en/multidrm/clients/widevine-android/ — Vendor SDK integration reference, useful for Android-specific implementation questions.

---

## 3. Apple FairPlay Streaming (FPS)

1. **Apple Developer: fairPlayStreaming (AVContentKeySystem)** — https://developer.apple.com/documentation/avfoundation/avcontentkeysystem/fairplaystreaming — Primary API reference.
2. **FairPlay Streaming Overview (official PDF spec)** — https://developer.apple.com/streaming/fps/FairPlayStreamingOverview.pdf — Canonical FPS spec: SPC/CKC message flow, AES-128 key delivery, offline HLS support, AirPlay handling.
3. **Technical Note TN2454: Debugging FairPlay Streaming** — https://developer.apple.com/library/archive/technotes/tn2454/_index.html — Official Apple debugging guide: interpreting FPS error codes, Web Inspector usage for Safari FPS issues. Directly useful for player-error troubleshooting section.
4. **Apple Developer: Streaming and AirPlay** — https://developer.apple.com/documentation/avfoundation/streaming-and-airplay — FairPlay-protected asset handling during AirPlay.
5. **Apple Developer Forums — Streaming subtopic** — https://developer.apple.com/forums/topics/media-technologies/streaming — Live troubleshooting threads (e.g., CoreMediaError -19156/-19160 for FairPlay+HDMI) — good for real-world error-pattern examples.
6. **bunny.net FairPlay deployment guide** — https://docs.bunny.net/stream/fairplay-deployment — Step-by-step FPS Deployment Package / certificate acquisition walkthrough.
7. **DoveRunner FairPlay iOS SDK docs** — https://pallycon.com/docs/en/multidrm/clients/fairplay-ios/ — Vendor SDK code samples for FPS content playback.

---

## 4. Microsoft PlayReady

1. **PlayReady Documentation Portal / Links hub** — https://learn.microsoft.com/en-us/playready/advanced/testservers/documentation-links — Master index of PlayReady docs, SDKs, sample apps, compliance rules.
2. **PlayReady DRM for UWP apps** — https://learn.microsoft.com/en-us/windows/uwp/audio-video-camera/playready-client-sdk — Output protection levels, Compliance Rules, CENC v2 recommendation for HWDRM.
3. **PlayReady Plugin for Android Specification** — https://learn.microsoft.com/en-us/playready/specifications/playready-plugin-for-android-specification — Maps MediaDrm/MediaCrypto APIs to PlayReady DRM Manager calls (getKeyRequest, provideKeyResponse) — useful for license-acquisition-flow chunking.
4. **PlayReady White Papers (rights management header schema)** — https://www.microsoft.com/playready/documents/ — v4.0/v4.1 rights management header technical spec.
5. **Wikipedia: PlayReady** — https://en.wikipedia.org/wiki/PlayReady — History/background, domain licensing concept, embedded licenses.
6. **Muvi: Microsoft PlayReady DRM comprehensive guide** — https://www.muvi.com/blogs/microsoft-playready-drm-explained/ — Plain-language architecture overview (license server, domain controller), supported formats (DASH/HLS/MSS).
7. **OTTVerse: How PlayReady works** — https://ottverse.com/microsoft-playready-how-does-it-work/ — SL2000/SL3000 security levels explained, TEE-based hardware protection details.

---

## 5. HLS (HTTP Live Streaming)

1. **RFC 8216 — HTTP Live Streaming** — https://datatracker.ietf.org/doc/html/rfc8216 — The canonical (informational) IETF spec, protocol version 7. Core normative reference for playlist/segment rules, fMP4 requirements.
2. **draft-pantos-hls-rfc8216bis (latest, 2nd Edition draft)** — https://datatracker.ietf.org/doc/html/draft-pantos-hls-rfc8216bis — Living update to RFC 8216 (protocol v13 as of the 2026 draft); should be preferred over RFC 8216 for current tag behavior.
3. **HLS Authoring Specification for Apple Devices** — https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices — Apple's living authoring rules (encoding ladders, segment durations, LL-HLS requirements).
4. **HLS Authoring Spec Appendixes** — https://developer.apple.com/documentation/http-live-streaming/hls-authoring-specification-for-apple-devices-appendixes — Supplementary tables/details.
5. **What's New in HTTP Live Streaming — WWDC 2026** — https://developer.apple.com/streaming/Whats-new-HLS.pdf — Latest tag additions (e.g., EXT-X-PRELOAD-HINT TYPE=KEY for key-rotation thundering-herd mitigation), links to Content Steering draft.
6. **Content Steering Internet-Draft** — https://datatracker.ietf.org/doc/html/draft-pantos-content-steering-05 — CDN/multi-CDN steering spec referenced by HLS.
7. **Wikipedia: HTTP Live Streaming** — https://en.wikipedia.org/wiki/HTTP_Live_Streaming — History, adoption stats, m3u8/media-type background.
8. **Apple Streaming resources hub** — https://developer.apple.com/streaming/ — Central landing page for all official HLS/FPS PDFs and sample streams.

---

## 6. MPEG-DASH

1. **ISO/IEC 23009-1 (official standard record)** — https://www.iso.org (search 23009-1) — The normative DASH standard (Media Presentation Description + segment formats). Purchase/summary via ISO; use DASH-IF guidelines below for practical/free interpretation.
2. **DASH-IF Guidelines for Implementation — Interoperability Points (latest, v4.3)** — https://dashif.org/docs/DASH-IF-IOP-v4.3.pdf — The most-used practical implementation guide: profiles, DRM/key rotation guidance, HD/UHD/multi-channel-audio extensions.
3. **DASH-IF: Completed Interoperability Documents (version history)** — https://dashif.org/guidelines/earlier-versions/ — Full changelog from IOP v1.0 → v4.x (ad insertion, trick modes, CEA608/708, key rotation additions per version) — good for tracing spec evolution.
4. **DASH-IF: Other guideline documents** — https://dashif.org/guidelines/others/ — ATSC 3.0 interoperability, SAND (Server and Network Assisted DASH), Token-based Access Control (TAC), CMAF Live Media Ingest Protocol.
5. **DASH-IF Identifiers/References** — https://dashif.org/identifiers/references/ — Canonical bibliography (ISO 23009-1:2022, 3GPP TS26.247, ISO 14496-12, etc.) tying DASH to related MPEG standards.
6. **Wikipedia: DASH-IF** — https://en.wikipedia.org/wiki/DASH-IF — Org background and IOP version history summary.
7. **ETSI TS 103 285 (DVB Profile of MPEG-DASH)** — https://www.etsi.org/deliver/etsi_ts/103200_103299/103285/01.02.01_60/ts_103285v010201p.pdf — DVB's constrained DASH profile used in broadcast/OTT hybrid deployments.

---

## 7. CDN (Content Delivery Network) & Delivery Architecture

1. **AT&T Developer: Adaptive Bitrate Video Streaming Best Practice** — https://developer.att.com/video-optimizer/docs/best-practices/adaptive-bitrate-video-streaming — CDN + ABR ladder fundamentals, segment sizing guidance.
2. **CacheFly: ABR algorithm tweaks to boost QoE without over-provisioning** — https://www.cachefly.com/news/adaptive-bitrate-streaming-algorithm-tweaks-to-boost-qoe-without-over-provisioning/ — CDN load-balancing techniques, device/network-tailored ABR profiles, cost-vs-QoE tradeoffs.
3. **BlazingCDN: CDN Stream Optimization — ABR and Low-Latency HLS** — https://blog.blazingcdn.com/en-us/cdn-stream-optimization-adaptive-bitrate-low-latency-hls — 2026-current guidance on LL-HLS part-duration tuning, thundering herd/playlist desync/PRELOAD-HINT cache-miss failure modes at the CDN edge — strong source for the "player errors / production incidents" intersection with CDN.
4. **DASH-IF SAND guideline** (see §6.4) — Server-and-network-assisted delivery signalling between CDN and DASH clients.

---

## 8. ABR (Adaptive Bitrate Streaming)

1. **Dacast: Adaptive Bitrate Streaming — What It Is and How ABR Works (2026 Update)** — https://www.dacast.com/blog/adaptive-bitrate-streaming/ — Clear breakdown of throughput-based vs. buffer-based ABR algorithms, manifest-driven bitrate ladder concept.
2. **arXiv: Tiyuntsong — Self-Play RL for ABR Streaming** — https://arxiv.org/pdf/1811.06166 — Academic background/appendix explaining classical ABR architecture (client buffer, throughput estimation) before introducing RL approach.
3. **arXiv: CBA — Contextual Quality Adaptation for ABR** — https://arxiv.org/pdf/1901.05712 — Survey of adaptation algorithms (SDNDASH, NDN-based ABR) — useful for advanced/next-gen ABR research context.
4. **arXiv: Reducing Traffic Wastage in Video Streaming via Bandwidth-Efficient Bitrate Adaptation (BE-ABR)** — https://arxiv.org/pdf/2412.07270 — Modern (2025) research on buffer control + wastage reduction, relevant to mobile/OTT bandwidth efficiency.
5. **arXiv: Improving ABR for Short-Video Streaming (SABR) with Multi-Agent RL** — https://arxiv.org/pdf/2304.04637 — Short-form video (Reels/Shorts-style) ABR/prefetch challenges, distinct from long-form VOD ABR.

---

## 9. HDCP (High-bandwidth Digital Content Protection)

1. **HDCP 2.3 on HDMI Specification (official, Digital Content Protection LLC)** — https://www.digital-cp.com/sites/default/files/specifications/HDCP%20on%20HDMI%20Specification%20Rev2_3.pdf — Primary normative spec: authentication/key exchange, revocation, HDCP-protected interface definitions, EESS.
2. **HDCP 2.2 on HDMI Specification (official)** — https://www.digital-cp.com/sites/default/files/specifications/HDCP%20on%20HDMI%20Specification%20Rev2_2_Final1.pdf — Predecessor spec, useful for version-diff understanding.
3. **HDCP 2.3 HDMI Compliance Test Specification** — https://www.digital-cp.com/sites/default/files/specifications/HDCP%202.3%20on%20HDMI%20Compliance%20Test%20Sepcification%20Rev%201.0.pdf — Formal test procedures (useful for QA test-case generation against HDCP behavior).
4. **Extron: Introduction to HDCP 2.3 (whitepaper)** — https://www.eticketav.com/wp-content/uploads/2025/08/wht-ppr-hdcp-2-3.pdf — Plain-language version history (HDCP 1.x → 2.3), Content Stream Type concept, backward-compatibility notes.
5. **Semiconductor Engineering: HDCP 2.3 — Enabling Robust Security of High-Res Displays** — https://semiengineering.com/hdcp-2-3-enabling-robust-security-of-high-res-displays/ — Crypto primitives used (RSA-3072/2048, HMAC-SHA256, AES-CTR-128), device landscape (STBs, dongles, TVs).
6. **Swank Motion Pictures: Content Protection – HDCP (support article)** — https://swankmp.zendesk.com/hc/en-us/articles/4404576654484-Content-Protection-HDCP — Practical troubleshooting: which connectors support HDCP (HDMI/DisplayPort/USB-C Thunderbolt, not SDI), common large-venue/LED-wall failure scenarios — good for real-world "device compatibility / player errors" cross-reference.

---

## 10. CENC (Common Encryption) & PSSH

1. **W3C: "cenc" Initialization Data Format (EME registry spec)** — https://www.w3.org/TR/eme-stream-mp4/ — Normative spec on how PSSH boxes become EME `initData`, multiple-PSSH handling rules.
2. **ISO/IEC 23001-7:2023 (3rd edition, official excerpt)** — https://cdn.standards.iteh.ai/samples/84637/04ebded1a92a4c8ab9be6f419a3252ed/ISO-IEC-23001-7-2023.pdf — Current normative CENC standard text: scheme signalling (schm box), ProtectionSchemeInfoBox, sample auxiliary info structures.
3. **ISO.org record: ISO/IEC 23001-7:2012 (original, withdrawn/superseded)** — https://www.iso.org/standard/60397.html — Historical baseline definition of the 'cenc' scheme for context/version tracking.
4. **Forasoft: Common Encryption (CENC) in Depth** — https://www.forasoft.com/learn/video-streaming/articles-streaming/common-encryption-cenc — Excellent practical synthesis: cenc vs. cbcs vs. cbc1 vs. cens schemes, why cbcs is the 2026 multi-DRM production default (FairPlay-only-cbcs constraint), pssh/tenc box roles.
5. **Medium (Poby's Home): Common Encryption in ISO Base Media File Format** — https://poby.medium.com/common-encryption-in-iso-based-media-file-format-388b46a3cf27 — Concise summary of ISO/IEC 23001-7:2016 with encryption-mode table (cenc/cbc1/cens/cbcs) and PSSH-per-DRM-system explanation.
6. **GPAC Wiki: Common Encryption (MP4Box practical guide)** — https://wiki.gpac.io/xmlformats/Common-Encryption/ (mirror: https://github.com/gpac/gpac/wiki/Common-Encryption) — Hands-on tool reference for encrypting/inspecting CENC files, PSSH payload structure, DRMInfo XML format — useful for building validation/test tooling.
7. **Unified Streaming: Common Encryption (CENC) docs** — https://docs.unified-streaming.com/documentation/drm/common-encryption.html — Practical packaging config guidance (default `cenc` scheme, CPIX `commonEncryptionScheme` override).

---

## 11. License Acquisition (Cross-DRM)

1. **Widevine Cloud License Service overview** — (within) https://developers.google.com/widevine/drm/overview — Test/Production environment split, content-key retrieval vs. license-fulfillment endpoints.
2. **PlayReady Android Plugin Spec — license acquisition flow** — https://learn.microsoft.com/en-us/playready/specifications/playready-plugin-for-android-specification — Detailed getKeyRequest/provideKeyResponse ↔ Drm_LicenseAcq_GenerateChallenge/ProcessResponse mapping; LicenseChallengeCustomData handling.
3. **FairPlay Streaming Overview — SPC/CKC flow** — https://developer.apple.com/streaming/fps/FairPlayStreamingOverview.pdf — Server Playback Context (SPC) request → Content Key Context (CKC) response cycle, device-identification-without-PII design.
4. **DASH-IF Token-based Access Control for DASH (TAC)** — via https://dashif.org/guidelines/others/ — Access Token format/transport spec covering authenticated access to MPDs, licenses, keys, and segments — directly relevant to license-acquisition authorization layer.
5. **W3C Encrypted Media Extensions (EME) spec** — referenced throughout Widevine/PlayReady/FairPlay docs — the browser-side generateRequest/updateSession API all three DRMs implement underneath (search "W3C EME specification" for current TR link).

---

## 12. Player Errors (Cross-Player Reference)

1. **SVTA: Standardized Player Error Codes project** — https://www.svta.org/project/standardized-player-error-codes/ — Industry effort mapping iOS, ExoPlayer, dash.js, shaka.js, hls.js, Roku, tvOS, FireTV error codes to a common taxonomy. **High-value single source for a player-error RAG section.**
2. **Shaka Player: Error Handling tutorial** — https://shaka-player-demo.appspot.com/docs/api/tutorial-errors.html (GitHub source: https://github.com/shaka-project/shaka-player/blob/main/docs/tutorials/errors.md) — CRITICAL vs. non-fatal severity model, failureCallback, retry-to-critical-error conversion.
3. **Shaka Player: full error code reference (lib/util/error.js)** — https://shaka-project.github.io/shaka-player/docs/api/lib_util_error.js.html — Exhaustive enumerated error list (e.g., CONTENT_UNSUPPORTED_BY_BROWSER 4032, DASH_XLINK_DEPTH_LIMIT 4028) — good for granular error-lookup chunking.
4. **Shaka Player FAQ** — https://github.com/shaka-project/shaka-player/blob/main/docs/tutorials/faq.md — Common real-world gotchas: PlayReady + EXT-X-SESSION-KEY requirement, EME robustness warnings, iOS DASH-not-supported explanation, live-stream buffering loop issue.
5. **Radiant Media Player: Error Management docs** — https://www.radiantmediaplayer.com/docs/latest/error-management.html — Cross-references hls.js and Shaka error codes with wrapper-level error/warning code mapping (e.g., INTERSTITIAL_ASSET_ERROR).
6. **Apple TN2454: Debugging FairPlay Streaming** — https://developer.apple.com/library/archive/technotes/tn2454/_index.html — (also listed in §3) Official FPS error-message interpretation guide.
7. **Apple Developer Forums — Streaming errors thread examples** — https://developer.apple.com/forums/topics/media-technologies/streaming — Real CoreMediaErrorDomain codes (e.g., -19156, -19160) tied to FairPlay+HDMI/Lightning adapter scenarios.

---

## 13. Device Compatibility

1. **SVTA OTT Device Compatibility Matrix (GitHub, open dataset)** — https://github.com/streaming-video-technology-alliance/ott_device_matrix — Structured JSON schema (brand/model/OS/codecs/DRM/security level/streaming formats/HDR/audio codec support) — **directly RAG-ingestible structured dataset**, ideal for embedding as-is.
2. **DoveRunner: Supported Environments docs** — https://docs.doverunner.com/content-security/multi-drm/getting-started/supported-env/ — Real-world device caveats (e.g., older Smart TVs lacking CBCS support), recommended baseline codecs (AVC baseline/main + AAC) for max compatibility.
3. **bunny.net: Widevine Security Levels device support table** — https://docs.bunny.net/stream/widevine-security-levels — Which device classes (Smart TVs, Android, Fire TV vs. desktop Chrome/Firefox) typically support L1 vs. L3.
4. **Intertrust ExpressPlay: Widevine device support & VMP** — https://www.expressplay.com/products/google-widevine-drm/ — Verified Media Path (VMP) concept, Chrome-desktop-L3-only limitation, browser/CDM update guidance for OTT operators.
5. **Forasoft: Widevine L1/L2/L3 practical device map (2026)** — https://www.forasoft.com/learn/video-streaming/articles-streaming/widevine-l1-l2-l3 — QA-relevant framing: "device-by-device QA matrix" as the actual bulk of DRM integration work — directly resonant with QA/test-planning use cases.

---

## 14. Historical Production Incidents (OTT/Streaming Postmortems)

1. **Netflix 2012 Christmas Eve AWS ELB outage — postmortem review** — https://github.com/Operations-Incident-Board/Postmortem-Report-Reviews/blob/master/2016-03-14-gabinante-netflix-streaming-2012-12-24.md — Detailed analysis of AWS state-data-deletion incident that took Netflix down for ~22 hours; includes critique of Netflix's incident awareness/response gap. Good template for RCA-writing training data.
2. **AWS's own postmortem of the same incident** — http://aws.amazon.com/message/6805 — Primary source referenced in the above; AWS's account of the ELB failure and restoration timeline.
3. **TechLogStack: engineering case studies (Netflix, Hotstar, Slack, Stripe, Shopify, etc.)** — https://techlogstack.com/explore/ — Aggregator of real postmortems/incident writeups across streaming and adjacent infra companies, including Netflix Chaos Monkey origin story and Hotstar's 2019 Cricket World Cup traffic-spike scaling story.
4. **Netflix Live Origin scaling story (65M concurrent streams)** — https://techlogstack.com/explore/netflix-live-origin-tyson-paul-2024/ — Netflix's live-origin storage redesign case study, plus Hotstar's 1.1M-viewers-per-minute surge during the 2019 World Cup semi-final.
5. **ThousandEyes: Netflix Broadcast Disruption analysis** — https://www.thousandeyes.com/blog/netflix-disruption-analysis-november-15-2024 — Third-party network-observability RCA of a Netflix live-event degradation, isolating congestion/content-availability as root cause vs. global network issues.
6. **TechCrunch: Disney+ Hotstar domain-renewal outage (Feb 2023)** — https://techcrunch.com/2023/02/17/disney-hotstar-glitches-due-to-domain-renewal-issue — Real incident during a live cricket match traced to a domain-registrar renewal glitch — good example of a non-technical-DRM root cause.
7. **Gulf News: AWS outage takes down Netflix/Disney+/Prime Video (major cloud dependency incident)** — https://gulfnews.com/business/retail/amazon-outage-hits-major-websites-streaming-apps-1.1638899250524 — Illustrates cascading OTT impact from a single cloud provider's network/API failure (Netflix reportedly lost 26% of traffic).
8. **ProductMint: The 15 Biggest Streaming (Service) Failures of All Time** — https://productmint.com/streaming-failures/ — Business-failure case studies (Hooq, FilmStruck, Quibi, etc.) — useful if the RAG also needs business/strategy failure context, not just technical outages.
9. **Flixed: Biggest Streaming Failures of All Time** — https://flixed.io/biggest-streaming-failures — Additional business/legal case studies (VidAngel litigation, OnLive collapse) for historical context.

---

## Notes on using this file with a RAG pipeline

- **Chunking suggestion:** split by `##` section headers (14 sections above); each numbered resource line is already a self-contained citation unit, so you can further chunk at the line level if your embedder benefits from smaller units.
- **Freshness caveat:** several sources are dated 2025–2026 (e.g., BlazingCDN LL-HLS article, Forasoft CENC/Widevine articles, HLS RFC8216bis draft). DRM/HLS/DASH specs evolve continuously — re-crawl the primary spec URLs (RFC 8216bis, ISO/IEC 23009-1, ISO/IEC 23001-7, HDCP spec, Widevine/PlayReady/FairPlay official docs) periodically rather than treating this list as static.
- **Primary vs. secondary sources:** entries in §2–§10 marked "official"/"primary" (Apple, Google, Microsoft, ISO, DCP, W3C, IETF) should be weighted higher in retrieval than vendor-blog or SEO-content secondary sources; secondary sources are included because they translate dense specs into practical, QA-actionable language.
- **Structured dataset call-out:** the SVTA OTT Device Compatibility Matrix (§13.1) is JSON, not prose — worth ingesting as structured records rather than flattened text if your RAG supports mixed content types.
- **Gaps to fill manually:** paywalled/purchase-only ISO standards (23009-1, 23001-7 full text) are only partially accessible via free excerpts here; if you have Kaltura's or a partner's licensed copies, add those directly for full-text accuracy.
