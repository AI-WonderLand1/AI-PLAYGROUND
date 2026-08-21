import { WorkflowTemplate } from '../../types';

export const mediaVideoTemplates: WorkflowTemplate[] = [
  {
    id: 'tpl-media-1-veo3-tiktok-generator',
    name: 'Generate AI viral videos with VEO 3 and upload to TikTok',
    slug: 'generate-ai-viral-videos-veo3-tiktok',
    category: 'Social Media & Video',
    complexity: 'Advanced',
    author: {
      name: 'CreatorOps Studio',
      role: 'Short-Form Automation Lead',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Autonomous TikTok Creator: pulls viral prompt hooks from Google Sheets, renders hyper-realistic AI video clips using Fal.ai Veo 3, overlays dynamic captions, and schedules TikTok publication.',
    longDescription: 'Automate your entire TikTok short-form content pipeline from ideation to publishing. This workflow monitors a Google Sheet content queue for pending video ideas, calls Google DeepMind Veo 3 via Fal.ai API for photorealistic generative video generation, uploads media to Blotato for thumbnail and caption processing, and posts directly to TikTok with optimal trending hashtags.',
    tags: ['Veo 3', 'Fal.ai', 'TikTok API', 'Blotato', 'Google Sheets', 'Video Generation', 'Viral Content'],
    nodeCount: 8,
    stars: 2450,
    downloads: 49100,
    featured: true,
    estimatedSetupMinutes: 20,
    useCases: [
      'Scaling faceless TikTok accounts with high-aesthetic cinematic AI video clips',
      'Automating daily scheduled drops of AI art, scenery, and product teasers',
      'Eliminating manual video editing and export bottlenecks'
    ],
    setupSteps: [
      'Create a Fal.ai account and obtain API key with Veo 3 access',
      'Connect your TikTok Creator account via Blotato or TikTok OAuth2',
      'Set up a Google Sheet with columns: Topic, Prompt, Status, ScheduledDate',
      'Activate the schedule trigger to produce videos on auto-pilot'
    ],
    requiredCredentials: ['httpHeaderAuth', 'googleSheetsOAuth2'],
    documentationMarkdown: `
# AI Viral Video Generation with VEO 3 & TikTok

Generate photorealistic short-form videos with Google DeepMind Veo 3 and auto-publish to TikTok.

### Workflow Architecture:
1. **Google Sheets Trigger**: Polls for rows where \`Status = 'Ready'\`.
2. **Fal.ai Veo 3 Node**: Submits prompt with cinematic camera movement parameters.
3. **Wait Node / Webhook Poller**: Waits for generation completion (approx 60-90s).
4. **Blotato Media Uploader**: Adds auto-captions and background audio.
5. **TikTok Publish**: Dispatches post with video description, sound, and hashtags.
6. **Sheet Status Update**: Marks row as \`Status = 'Published'\`.
`,
    workflow: {
      name: "Generate AI viral videos with VEO 3 and upload to TikTok",
      nodes: [
        {
          id: "veo-sheet-poll",
          name: "Poll Google Sheet Video Queue",
          type: "n8n-nodes-base.googleSheetsTrigger",
          position: [200, 300],
          parameters: { pollTimes: { item: [{ mode: "everyHour" }] } },
          typeVersion: 1
        },
        {
          id: "veo-generate-prompt",
          name: "Format Veo3 Prompt & Aspect Ratio",
          type: "n8n-nodes-base.set",
          position: [440, 300],
          parameters: {
            assignments: {
              assignments: [
                { id: "p1", name: "prompt", type: "string", value: "={{ $json.Prompt }}, cinematic lighting, 4k 60fps, 9:16 vertical, photorealistic" },
                { id: "p2", name: "aspect_ratio", type: "string", value: "9:16" }
              ]
            }
          },
          typeVersion: 3.4
        },
        {
          id: "veo-call-fal",
          name: "Call Fal.ai Veo3 API",
          type: "n8n-nodes-base.httpRequest",
          position: [680, 300],
          parameters: {
            method: "POST",
            url: "https://queue.fal.run/fal-ai/veo3",
            authentication: "genericCredentialType",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "prompt", value: "={{ $json.prompt }}" },
                { name: "aspect_ratio", value: "9:16" },
                { name: "duration", value: 5 }
              ]
            }
          },
          typeVersion: 4.2
        },
        {
          id: "veo-wait-render",
          name: "Wait For Video Render",
          type: "n8n-nodes-base.wait",
          position: [920, 300],
          parameters: { resume: "afterTimeInterval", waitAmount: 75, waitUnit: "seconds" },
          typeVersion: 1.1
        },
        {
          id: "veo-fetch-status",
          name: "Fetch Rendered Video URL",
          type: "n8n-nodes-base.httpRequest",
          position: [1160, 300],
          parameters: {
            url: "=https://queue.fal.run/fal-ai/veo3/requests/{{ $('Call Fal.ai Veo3 API').item.json.request_id }}/status",
            authentication: "genericCredentialType"
          },
          typeVersion: 4.2
        },
        {
          id: "veo-publish-tiktok",
          name: "Publish Video to TikTok",
          type: "n8n-nodes-base.httpRequest",
          position: [1400, 300],
          parameters: {
            method: "POST",
            url: "https://backend.blotato.com/v2/posts",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "platform", value: "TIKTOK" },
                { name: "mediaUrl", value: "={{ $json.video.url }}" },
                { name: "caption", value: "={{ $('Poll Google Sheet Video Queue').item.json.Topic }} #ai #cinematic #veo3" }
              ]
            }
          },
          typeVersion: 4.2
        }
      ],
      connections: {
        "Poll Google Sheet Video Queue": { main: [[{ node: "Format Veo3 Prompt & Aspect Ratio", type: "main", index: 0 }]] },
        "Format Veo3 Prompt & Aspect Ratio": { main: [[{ node: "Call Fal.ai Veo3 API", type: "main", index: 0 }]] },
        "Call Fal.ai Veo3 API": { main: [[{ node: "Wait For Video Render", type: "main", index: 0 }]] },
        "Wait For Video Render": { main: [[{ node: "Fetch Rendered Video URL", type: "main", index: 0 }]] },
        "Fetch Rendered Video URL": { main: [[{ node: "Publish Video to TikTok", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-media-2-nanobanana-veo3-multipost',
    name: 'Generate AI viral videos with NanoBanana & VEO3, shared on 5 social networks',
    slug: 'ai-viral-videos-nanobanana-veo3-social-syndication',
    category: 'Social Media & Video',
    complexity: 'Advanced',
    author: {
      name: 'OmniGrowth Lab',
      role: 'Growth Marketing Agency',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Omnichannel Short-Form Powerhouse: scripts viral concepts with NanoBanana LLM, synthesizes video in Veo3, and simultaneously distributes to YouTube Shorts, Instagram Reels, TikTok, Facebook & LinkedIn.',
    longDescription: 'Produce once, distribute everywhere. This multi-platform syndication pipeline generates creative viral prompts with an AI agent, sends generation requests to Veo 3, processes the MP4 output through Blotato media hub, and parallel-publishes to Instagram Reels, YouTube Shorts, TikTok, Facebook Pages, and LinkedIn video feeds.',
    tags: ['NanoBanana', 'Veo3', 'Instagram Reels', 'YouTube Shorts', 'TikTok', 'LinkedIn Video', 'Blotato'],
    nodeCount: 10,
    stars: 2890,
    downloads: 54100,
    featured: true,
    estimatedSetupMinutes: 25,
    useCases: [
      'Multiplying reach across 5 major video platforms from a single automated trigger',
      'Scaling brand visibility with daily autonomous video drops',
      'Repurposing video content automatically with platform-specific captions'
    ],
    setupSteps: [
      'Connect Blotato social syndication account credentials',
      'Add Fal.ai Veo 3 API credentials in the video generation node',
      'Configure social accounts (Instagram, TikTok, YouTube, Facebook, LinkedIn)',
      'Trigger workflow manually or set daily schedule timer'
    ],
    requiredCredentials: ['httpHeaderAuth', 'openAiApi'],
    documentationMarkdown: `
# Multi-Platform AI Video Syndication with NanoBanana & VEO 3

Generates vertical videos and simultaneously posts to 5 social channels.
`,
    workflow: {
      name: "Generate AI viral videos with NanoBanana & VEO3",
      nodes: [
        {
          id: "nb-sched",
          name: "Trigger: Daily Video Generator",
          type: "n8n-nodes-base.scheduleTrigger",
          position: [200, 320],
          parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 9 * * *" }] } },
          typeVersion: 1.2
        },
        {
          id: "nb-agent",
          name: "NanoBanana Concept & Script Agent",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [440, 320],
          parameters: {
            promptType: "define",
            text: "Generate a viral, mesmerizing 5-second video visual description about futuristic technology.",
            options: { systemMessage: "You are an expert viral video prompt engineer for Veo 3." }
          },
          typeVersion: 1.7
        },
        {
          id: "nb-model",
          name: "Claude 3.5 Sonnet / GPT-4o",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [440, 540],
          parameters: { model: "gpt-4o", options: { temperature: 0.8 } },
          typeVersion: 1.2
        },
        {
          id: "nb-veo",
          name: "Call Veo3 API",
          type: "n8n-nodes-base.httpRequest",
          position: [680, 320],
          parameters: {
            method: "POST",
            url: "https://queue.fal.run/fal-ai/veo3",
            authentication: "genericCredentialType"
          },
          typeVersion: 4.2
        },
        {
          id: "nb-upload",
          name: "Upload Video to Blotato Hub",
          type: "n8n-nodes-base.httpRequest",
          position: [920, 320],
          parameters: { method: "POST", url: "https://backend.blotato.com/v2/media" },
          typeVersion: 4.2
        },
        {
          id: "nb-ig",
          name: "Post to INSTAGRAM REELS",
          type: "n8n-nodes-base.httpRequest",
          position: [1180, 140],
          parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
          typeVersion: 4.2
        },
        {
          id: "nb-yt",
          name: "Post to YOUTUBE SHORTS",
          type: "n8n-nodes-base.httpRequest",
          position: [1180, 260],
          parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
          typeVersion: 4.2
        },
        {
          id: "nb-tt",
          name: "Post to TIKTOK",
          type: "n8n-nodes-base.httpRequest",
          position: [1180, 380],
          parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
          typeVersion: 4.2
        },
        {
          id: "nb-fb",
          name: "Post to FACEBOOK REELS",
          type: "n8n-nodes-base.httpRequest",
          position: [1180, 500],
          parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
          typeVersion: 4.2
        },
        {
          id: "nb-li",
          name: "Post to LINKEDIN VIDEO",
          type: "n8n-nodes-base.httpRequest",
          position: [1180, 620],
          parameters: { method: "POST", url: "https://backend.blotato.com/v2/posts" },
          typeVersion: 4.2
        }
      ],
      connections: {
        "Trigger: Daily Video Generator": { main: [[{ node: "NanoBanana Concept & Script Agent", type: "main", index: 0 }]] },
        "Claude 3.5 Sonnet / GPT-4o": { ai_languageModel: [[{ node: "NanoBanana Concept & Script Agent", type: "ai_languageModel", index: 0 }]] },
        "NanoBanana Concept & Script Agent": { main: [[{ node: "Call Veo3 API", type: "main", index: 0 }]] },
        "Call Veo3 API": { main: [[{ node: "Upload Video to Blotato Hub", type: "main", index: 0 }]] },
        "Upload Video to Blotato Hub": {
          main: [
            [{ node: "Post to INSTAGRAM REELS", type: "main", index: 0 }],
            [{ node: "Post to YOUTUBE SHORTS", type: "main", index: 0 }],
            [{ node: "Post to TIKTOK", type: "main", index: 0 }],
            [{ node: "Post to FACEBOOK REELS", type: "main", index: 0 }],
            [{ node: "Post to LINKEDIN VIDEO", type: "main", index: 0 }]
          ]
        }
      }
    }
  },
  {
    id: 'tpl-media-3-wordpress-news-to-youtube-heygen',
    name: 'Generate news digest videos from WordPress to YouTube with HeyGen',
    slug: 'wordpress-news-digest-video-heygen-youtube',
    category: 'Social Media & Video',
    complexity: 'Advanced',
    author: {
      name: 'MediaTech Newsroom',
      role: 'Automated Broadcast Lead',
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Turn written blog posts into professional AI avatar news broadcasts: listens to new WordPress posts, drafts broadcast scripts with Claude 3.5 Sonnet, renders realistic presenter video in HeyGen, and publishes to YouTube.',
    longDescription: 'Automate your video journalism workflow. When you publish a post on WordPress, this workflow extracts the article text, uses Claude 3.5 Sonnet to condense it into a 60-second presenter script with teleprompter cues, calls HeyGen API to render a photo-realistic AI news avatar in 1080p HD, and uploads the video file directly to your YouTube channel.',
    tags: ['HeyGen', 'WordPress', 'YouTube API', 'Claude 3.5 Sonnet', 'News Video', 'AI Presenter'],
    nodeCount: 7,
    stars: 1850,
    downloads: 29800,
    featured: false,
    estimatedSetupMinutes: 20,
    useCases: [
      'Converting company blog posts into engaging YouTube video updates',
      'Daily automated tech and market news recap channels',
      'Repurposing written newsletters into video broadcasts'
    ],
    setupSteps: [
      'Connect WordPress Webhook or REST API credentials',
      'Add HeyGen API Key and select your preferred avatar and voice model',
      'Connect YouTube OAuth2 credentials with video upload scopes',
      'Configure YouTube title, description tags, and thumbnail defaults'
    ],
    requiredCredentials: ['wordpressApi', 'httpHeaderAuth', 'youTubeOAuth2Api'],
    documentationMarkdown: `
# WordPress to YouTube News Digest with HeyGen

Automatically convert your WordPress articles into broadcast-quality presenter videos on YouTube.
`,
    workflow: {
      name: "Generate news digest videos from WordPress to YouTube with HeyGen",
      nodes: [
        {
          id: "wp-trigger",
          name: "WordPress Post Published Trigger",
          type: "n8n-nodes-base.wordpressTrigger",
          position: [200, 300],
          parameters: { event: "postPublished" },
          typeVersion: 1
        },
        {
          id: "wp-script-agent",
          name: "Claude 3.5 News Script Writer",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [440, 300],
          parameters: {
            promptType: "define",
            text: "=Turn this blog post into a concise 60-second broadcast script for an avatar presenter:\n\nTitle: {{ $json.title.rendered }}\nContent: {{ $json.content.rendered }}"
          },
          typeVersion: 1.7
        },
        {
          id: "wp-model",
          name: "Anthropic Claude Model",
          type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
          position: [440, 520],
          parameters: { model: "claude-3-5-sonnet-20241022" },
          typeVersion: 1.2
        },
        {
          id: "wp-heygen",
          name: "Generate Avatar Video (HeyGen)",
          type: "n8n-nodes-base.httpRequest",
          position: [700, 300],
          parameters: {
            method: "POST",
            url: "https://api.heygen.com/v2/video/generate",
            sendBody: true,
            bodyParameters: {
              parameters: [
                { name: "video_inputs[0].character.type", value: "avatar" },
                { name: "video_inputs[0].character.avatar_id", value: "Abigail_standing_business_front" },
                { name: "video_inputs[0].voice.input_text", value: "={{ $json.output }}" }
              ]
            }
          },
          typeVersion: 4.2
        },
        {
          id: "wp-wait",
          name: "Wait For HeyGen Rendering",
          type: "n8n-nodes-base.wait",
          position: [920, 300],
          parameters: { resume: "afterTimeInterval", waitAmount: 120, waitUnit: "seconds" },
          typeVersion: 1.1
        },
        {
          id: "wp-youtube",
          name: "Upload Video to YouTube",
          type: "n8n-nodes-base.youTube",
          position: [1160, 300],
          parameters: {
            operation: "upload",
            title: "={{ $('WordPress Post Published Trigger').item.json.title.rendered }} | Daily Digest",
            privacyStatus: "public"
          },
          typeVersion: 1
        }
      ],
      connections: {
        "WordPress Post Published Trigger": { main: [[{ node: "Claude 3.5 News Script Writer", type: "main", index: 0 }]] },
        "Anthropic Claude Model": { ai_languageModel: [[{ node: "Claude 3.5 News Script Writer", type: "ai_languageModel", index: 0 }]] },
        "Claude 3.5 News Script Writer": { main: [[{ node: "Generate Avatar Video (HeyGen)", type: "main", index: 0 }]] },
        "Generate Avatar Video (HeyGen)": { main: [[{ node: "Wait For HeyGen Rendering", type: "main", index: 0 }]] },
        "Wait For HeyGen Rendering": { main: [[{ node: "Upload Video to YouTube", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-media-4-youtube-transcript-extractor',
    name: 'Extract transcripts from external YouTube videos using YouTube Transcript API',
    slug: 'extract-transcripts-youtube-video-transcript-api',
    category: 'Social Media & Video',
    complexity: 'Intermediate',
    author: {
      name: 'InsightForge',
      role: 'Research Automations',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Instant YouTube Video Summarizer: input any YouTube video URL, fetches raw time-stamped subtitles & transcripts, extracts key timestamps and executive takeaways via AI, and saves to Notion.',
    longDescription: 'Digest multi-hour podcasts, tutorials, and keynote talks in seconds. This workflow accepts YouTube URLs via Webhook or manual trigger, calls the YouTube Transcript API to download accurate captions with timestamps, analyzes the text using Claude 3.5 Sonnet to create chapter summaries, and creates a formatted page in your Notion Knowledge Base.',
    tags: ['YouTube Transcripts', 'Notion', 'Video Summarizer', 'Claude 3.5', 'Research', 'Podcasts'],
    nodeCount: 6,
    stars: 1720,
    downloads: 31200,
    featured: false,
    estimatedSetupMinutes: 10,
    useCases: [
      'Summarizing 2-hour technical conference talks and podcasts into 3-minute executive briefs',
      'Building an automated YouTube research repository in Notion',
      'Generating timestamped chapter markers for content editors'
    ],
    setupSteps: [
      'Set up your Notion API integration token and connect your Database',
      'Add Anthropic Claude or OpenAI API key',
      'Send a test YouTube URL payload to the Webhook'
    ],
    requiredCredentials: ['notionApi', 'openAiApi'],
    documentationMarkdown: `
# Extract Transcripts from External YouTube Videos

Fetches full YouTube video transcripts and creates structured Notion summaries.
`,
    workflow: {
      name: "Extract transcripts from external YouTube videos",
      nodes: [
        {
          id: "yt-tr-webhook",
          name: "YouTube URL Trigger",
          type: "n8n-nodes-base.webhook",
          position: [200, 300],
          parameters: { path: "summarize-youtube", httpMethod: "POST" },
          typeVersion: 1.1
        },
        {
          id: "yt-tr-fetch",
          name: "Fetch YouTube Transcript API",
          type: "n8n-nodes-base.httpRequest",
          position: [440, 300],
          parameters: {
            url: "=https://yt-transcript-api.vercel.app/api/transcript?video_id={{ $json.body.video_id }}"
          },
          typeVersion: 4.2
        },
        {
          id: "yt-tr-agent",
          name: "Video Summarizer & Chapter Extractor",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [680, 300],
          parameters: {
            promptType: "define",
            text: "=Extract core themes, key takeaways, and timestamped highlights from this transcript:\n\n{{ $json.transcript }}"
          },
          typeVersion: 1.7
        },
        {
          id: "yt-tr-model",
          name: "OpenAI GPT-4o Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [680, 520],
          parameters: { model: "gpt-4o" },
          typeVersion: 1.2
        },
        {
          id: "yt-tr-notion",
          name: "Save Summary to Notion",
          type: "n8n-nodes-base.notion",
          position: [920, 300],
          parameters: {
            resource: "databasePage",
            operation: "create",
            databaseId: "YOUR_NOTION_DB_ID"
          },
          typeVersion: 2
        }
      ],
      connections: {
        "YouTube URL Trigger": { main: [[{ node: "Fetch YouTube Transcript API", type: "main", index: 0 }]] },
        "Fetch YouTube Transcript API": { main: [[{ node: "Video Summarizer & Chapter Extractor", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Model": { ai_languageModel: [[{ node: "Video Summarizer & Chapter Extractor", type: "ai_languageModel", index: 0 }]] },
        "Video Summarizer & Chapter Extractor": { main: [[{ node: "Save Summary to Notion", type: "main", index: 0 }]] }
      }
    }
  },
  {
    id: 'tpl-media-5-competitor-vision-analysis',
    name: 'Analyze competitor visual content across Instagram and TikTok with Vision AI',
    slug: 'competitor-visual-content-analysis-vision-ai',
    category: 'Social Media & Video',
    complexity: 'Advanced',
    author: {
      name: 'GrowthIntel Agency',
      role: 'Competitive Strategy Team',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    description: 'Automated Competitive Spy Engine: scrapes competitor posts via Apify, feeds video keyframes and image covers into GPT-4o Vision, decodes visual hooks, and compiles a weekly intelligence report.',
    longDescription: 'Gain an unfair creative advantage. This scheduled workflow runs weekly scrapes on top competitor social handles across Instagram and TikTok, extracts high-engagement thumbnails and video frames, passes images to GPT-4o Vision to decode color schemes, text overlays, emotional hooks, and formats, and delivers a comprehensive competitor breakdown to Slack and Google Sheets.',
    tags: ['Vision AI', 'GPT-4o Vision', 'Apify', 'Instagram Scraper', 'TikTok Analytics', 'Competitive Intelligence'],
    nodeCount: 8,
    stars: 1610,
    downloads: 27500,
    featured: false,
    estimatedSetupMinutes: 20,
    useCases: [
      'Tracking competitor visual branding and thumbnail hook trends automatically',
      'Discovering viral video formats before they become oversaturated',
      'Delivering weekly creative strategy briefs to marketing teams'
    ],
    setupSteps: [
      'Add Apify API token and choose your Instagram/TikTok scraper actor',
      'Add OpenAI API key for GPT-4o Multimodal Vision analysis',
      'Configure Slack destination channel or Google Sheets logging URL'
    ],
    requiredCredentials: ['httpHeaderAuth', 'openAiApi', 'slackApi'],
    documentationMarkdown: `
# Competitor Visual Content Analysis with Vision AI

Automatically dissect competitor Instagram Reels and TikTok thumbnails to identify winning visual hooks.
`,
    workflow: {
      name: "Analyze competitor visual content across Instagram and TikTok",
      nodes: [
        {
          id: "comp-cron",
          name: "Schedule: Weekly Monday Run",
          type: "n8n-nodes-base.scheduleTrigger",
          position: [200, 300],
          parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 8 * * 1" }] } },
          typeVersion: 1.2
        },
        {
          id: "comp-apify",
          name: "Apify Social Scraper Actor",
          type: "n8n-nodes-base.httpRequest",
          position: [440, 300],
          parameters: {
            method: "POST",
            url: "https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items"
          },
          typeVersion: 4.2
        },
        {
          id: "comp-vision",
          name: "GPT-4o Vision Hook Breakdown",
          type: "@n8n/n8n-nodes-langchain.agent",
          position: [680, 300],
          parameters: {
            promptType: "define",
            text: "=Analyze this competitor visual cover: {{ $json.displayUrl }}. Explain why this hook worked, analyze text placement, color saturation, and emotional trigger."
          },
          typeVersion: 1.7
        },
        {
          id: "comp-model",
          name: "OpenAI GPT-4o Vision Model",
          type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
          position: [680, 520],
          parameters: { model: "gpt-4o" },
          typeVersion: 1.2
        },
        {
          id: "comp-slack",
          name: "Post Intelligence Brief to Slack",
          type: "n8n-nodes-base.slack",
          position: [920, 300],
          parameters: {
            channel: "#competitor-intel",
            text: "=📊 Competitor Visual Hook Breakdown:\n\n{{ $json.output }}"
          },
          typeVersion: 2.1
        }
      ],
      connections: {
        "Schedule: Weekly Monday Run": { main: [[{ node: "Apify Social Scraper Actor", type: "main", index: 0 }]] },
        "Apify Social Scraper Actor": { main: [[{ node: "GPT-4o Vision Hook Breakdown", type: "main", index: 0 }]] },
        "OpenAI GPT-4o Vision Model": { ai_languageModel: [[{ node: "GPT-4o Vision Hook Breakdown", type: "ai_languageModel", index: 0 }]] },
        "GPT-4o Vision Hook Breakdown": { main: [[{ node: "Post Intelligence Brief to Slack", type: "main", index: 0 }]] }
      }
    }
  }
];
