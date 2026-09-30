/* 自动生成，勿手改 —— 源：i18n/*.json（node packages/celadon/design/build-i18n.mjs） */
window.CELADON_I18N = {
  "en": {
    "ui": {
      "brand": "Yao Agents",
      "newTask": "New task",
      "nav": {
        "chat": "Chat",
        "inbox": "Inbox",
        "board": "Board",
        "workspace": "Workspace",
        "computer": "Computer",
        "knowledge": "Knowledge"
      },
      "inbox": {
        "unreadCount": "{count} unread",
        "searchPlaceholder": "Search messages…",
        "filterAll": "All",
        "filterUnread": "Unread",
        "filterArchived": "Archived"
      },
      "time": {
        "today": "Today",
        "yesterday": "Yesterday",
        "earlier": "Earlier"
      },
      "thread": {
        "newMessages": "{count} new messages",
        "dateAt": "Today {time}",
        "changesChip": "Changes +{added} −{removed}"
      },
      "tool": {
        "readFiles": "Read files"
      },
      "status": {
        "done": "Done"
      },
      "agent": "Agent",
      "ask": {
        "pending": "Needs your input",
        "pendingAt": "Needs your input · {time}",
        "differences": "{count} differences",
        "question": "Which summary angle should I use? It changes the output structure:",
        "optionRiskFirst": "Summarize by risk first (recommended)",
        "optionChronological": "Summarize chronologically",
        "optionCustom": "I will specify my own"
      },
      "composer": {
        "placeholder": "Continue: add the risks to the acceptance criteria…",
        "defaultPermission": "Default permission",
        "awaitConfirm": "Please confirm the options above to continue…"
      },
      "panel": {
        "inProgress": "In progress",
        "highPriority": "High priority",
        "remainingDays": "{days} days left",
        "actionComplete": "Mark complete",
        "actionPause": "Pause",
        "actionOpenFullPage": "Open full page",
        "subtasks": "Subtasks",
        "gates": "Gates",
        "changes": "Changes",
        "relatedFiles": "Related files",
        "activity": "Activity"
      },
      "activity": {
        "readDocuments": "Read {count} documents",
        "extractRisks": "Extracted {count} risks",
        "waitingConfirmation": "Waiting for confirmation"
      },
      "theme": {
        "light": "Light",
        "dark": "Dark"
      },
      "task": {
        "id": "Task ID"
      }
    },
    "sample": {
      "conversation": {
        "greeting": {
          "title": "Intro & capabilities",
          "subtitle": "Covered document handling and available tools"
        },
        "weekly": {
          "title": "Weekly report",
          "subtitle": "Weekly progress from the template"
        },
        "scraping": {
          "title": "Scraping job",
          "subtitle": "12 pages completed"
        },
        "contract": {
          "title": "Contract review",
          "subtitle": "3 risks flagged"
        },
        "invoice": {
          "title": "Invoice check",
          "subtitle": "2 vouchers generated"
        },
        "siteCheck": {
          "title": "Site check",
          "subtitle": "3 domains healthy"
        }
      },
      "message": {
        "user1": "Hi — could you review these two documents? Focus on the risk clauses in the contract.",
        "agent1Html": "I have read both. I found <b>3 risks</b> in the contract: ① §4.2 has no cap on the payment period; ② §7 liabilities are unbalanced; ③ Annex II is missing the signature page.",
        "agent2": "Summarized by risk first, with the source clause and page numbers."
      },
      "tool": {
        "readLineContract": "contract.pdf · 12 pages · text extracted",
        "readLineRequirements": "requirements.docx · 4 pages · text extracted"
      },
      "panel": {
        "taskTitle": "Contract review",
        "subtaskRead": "Read contract.pdf / requirements.docx",
        "subtaskExtract": "Extract risk clauses with page numbers",
        "subtaskGenerate": "Generate risk-summary.md",
        "subtaskAcceptance": "Add to acceptance criteria (waiting on your input)",
        "gateVisual": "visual {count} differences"
      },
      "diff": {
        "line1": "- Payment period: quarterly settlement",
        "line2": "+ Payment period: ≤30 days (§4.2)",
        "line3": "- Liability: borne by each party",
        "line4": "+ Liability: mutual, 0.05%/day late"
      },
      "file": {
        "contract": "contract.pdf",
        "requirements": "requirements.docx",
        "riskSummary": "risk-summary.md"
      }
    },
    "card": {
      "title": "Celadon design baseline",
      "subtitle": "tokens · pairings · fonts · contrast — all read live from tokens.css (zero hardcoded values)",
      "source": "Source: tokens.less → build-css.mjs → tokens.css. Font tokens are in the specimen below. After changing a token run pnpm design:css — this page needs no edits.",
      "sectionPairs": "Key pairings (foreground on background · computed live)",
      "pairsNote": "Most tokens come in two tiers (solid and soft fill). Pairing them wrongly looks like --warm + --warm-text: 1.41:1, effectively invisible.",
      "sectionContrast": "Measured contrast (WCAG 2.1 · AA body 4.5:1 / AAA 7:1)",
      "sectionTypography": "Typography specimen (4 languages · font stack switched by :lang)",
      "typographyNote": "Per-language stacks are mandatory: Traditional Chinese must not fall back to Simplified glyphs, and Japanese must not fall back to Chinese glyph forms.",
      "sectionRedlines": "Usage rules",
      "tableTheme": "Theme",
      "tableToken": "token",
      "tableValue": "Value",
      "tableBackground": "Background",
      "tableContrast": "Contrast",
      "tableLevel": "Level",
      "themeLight": "Light",
      "themeDark": "Dark",
      "samplePrefix": "Sample",
      "stackLabel": "Resolved font stack",
      "mixedLabel": "Mixed (body default 13px)",
      "hanLabel": "Han glyphs (SC / TC / JP differences)",
      "kanaLabel": "Kana and voiced marks",
      "latinLabel": "Latin and digits",
      "punctLabel": "Full-width punctuation",
      "monoLabel": "Monospace (code / paths)",
      "glyphCompare": "Glyph comparison",
      "glyphCompareText": "直 骨 今 令 収 收 真 具 门 門 温 溫 骨 滑 次",
      "mixedText": "The agent read contract.pdf (12 pages) → 3 risks found. Please confirm before 14:06.",
      "hanText": "Celadon glaze is calm and warm; the risk assessment and clauses are annotated with page numbers.",
      "kanaText": "エージェントが契約書を読み込み、リスクを 3 件抽出しました。",
      "latinText": "Yao Agents 2.0 — Quick brown fox jumps over 0123456789 (AA 4.77:1).",
      "punctText": "「」『』《》〈〉【】——……、。：；！？（）",
      "monoText": "const brand = '#2A7B7B';  risk_count <- 3;  // revenue / contract",
      "langNote": "The language buttons only switch this page. The specimen keeps all four languages side by side for comparison.",
      "redlines": [
        "Brand has two tiers: solid (--brand + white text) only for primary buttons/badges (max 2 per view); soft (--brand-soft + brand text) for selection, bubbles and avatars.",
        "Never mix the amber tiers: --warm pairs with --warm-contrast; --warm-soft pairs with --warm-text.",
        "In dark mode, brand text/outlines on soft fills must use --brand-lift.",
        "All four interaction states (default/hover/active/disabled); keyboard focus must stay visible (--focus-ring).",
        "--brand-display is fill-only: never put text or icons on it.",
        "Success is soft fill + icon only; never a large solid fill.",
        "Use --border-default/--border-control for controls; --border-subtle is decorative only.",
        "No hardcoded colours in less/tsx (system colours excepted); always spell out token and class names."
      ],
      "usage": {
        "brand": "Primary button / badge / selected text",
        "brandHover": "Hover",
        "brandActive": "Pressed",
        "brandSoft": "Soft button · selected row · bubble",
        "brandDisplay": "Large fills/graphics (no text)",
        "brandText": "Text on the brand fill",
        "brandLift": "Dark mode only (text/outline)",
        "focusRingColor": "Keyboard focus ring colour (2px offset + 2px width)",
        "focusRingWidth": "Focus ring width",
        "focusRingOffset": "Gap between ring and control",
        "backgroundDisabled": "Disabled background",
        "textDisabled": "Disabled text (contrast exempt)",
        "borderDisabled": "Disabled border",
        "scrim": "Modal / drawer scrim",
        "backgroundApp": "Window background",
        "backgroundNavigation": "① Navigation column",
        "backgroundContent": "② Content area (not pure white)",
        "backgroundSurface": "③ Panel / card",
        "backgroundField": "Input / field",
        "backgroundHover": "Hover",
        "backgroundActive": "Pressed fill (neutral controls)",
        "backgroundSelected": "Selected row (= brand soft)",
        "backgroundReadonly": "Read-only field fill (use secondary text)",
        "borderSubtle": "Decorative line",
        "borderDefault": "Default border",
        "borderControl": "Control border",
        "borderHover": "Control border on hover",
        "textPrimary": "Primary text",
        "textSecondary": "Secondary text",
        "textTertiary": "Tertiary text",
        "textPlaceholder": "Input placeholder (same as tertiary text)",
        "textMuted": "Decoration only (dividers, watermarks; never text)",
        "success": "Success (traditional green)",
        "successSoft": "Success soft fill",
        "warning": "Warning (alias of --warm)",
        "warningSoft": "Warning soft fill",
        "warm": "Amber solid fill (pair with --warm-contrast)",
        "warmSoft": "Amber soft fill (pair with --warm-text)",
        "warmText": "Text on the amber soft fill",
        "warmContrast": "Text on the amber solid fill",
        "danger": "Danger (vermilion)",
        "dangerSoft": "Danger soft fill",
        "fontSize11": "Latin/digit badges only",
        "fontSize12": "Minimum for Chinese",
        "fontSize13": "Body default",
        "fontSize16": "Fills the old 15→17 gap",
        "spacing8": "Spacing 8",
        "spacing12": "Spacing 12",
        "spacing16": "Spacing 16",
        "radiusSmall": "6px",
        "radiusMedium": "Default, 8px",
        "radiusLarge": "12px",
        "radiusPill": "Badges/tabs/avatars only",
        "rowHeight": "Row height 40",
        "columnHeaderHeight": "Column header 40 (all three equal)",
        "durationFast": "hover 120ms",
        "durationBase": "expand 200ms",
        "easing": "Easing curve",
        "shadowSubtle": "hairline",
        "shadowFloating": "Floating layer",
        "fontFamilyUi": "UI font (Latin + fallback)",
        "fontFamilyMonospace": "Monospace font",
        "brandInk": "Brand text/icons (soft button, selected row, bubble; 4.8:1 on the soft fill, switches to the lifted tone in dark)",
        "brandSolidHover": "Solid button hover fill (white text, >=4.5:1)",
        "brandSolidActive": "Solid button pressed fill (white text, >=4.5:1)"
      },
      "group": {
        "brand": "Brand",
        "interaction": "Interaction",
        "background": "Neutral · Surfaces",
        "border": "Neutral · Borders",
        "text": "Neutral · Text",
        "semantic": "Semantic",
        "metrics": "Size · Radius · Motion"
      },
      "state": {
        "statesTitle": "Control states · live preview",
        "statesNote": "All states at once: the .is-* classes mirror the real pseudo-classes (:hover/:focus/:read-only/:disabled) from the same tokens",
        "groupInput": "Input",
        "groupButton": "Button",
        "default": "Default",
        "hover": "Hover",
        "active": "Pressed",
        "focus": "Focus",
        "disabled": "Disabled",
        "filled": "Filled",
        "placeholder": "Placeholder",
        "readonly": "Read-only",
        "error": "Error",
        "errorHint": "Invalid date",
        "solid": "Primary",
        "soft": "Soft"
      },
      "reason": {
        "fill": "Fill",
        "line": "Border",
        "overlay": "Overlay",
        "dark": "Dark only",
        "exempt": "Disabled (exempt)",
        "deco": "Decoration"
      },
      "gradeAaa": "AAA",
      "gradeAa": "AA",
      "gradeLarge": "Large text / graphics",
      "gradeFail": "Below AA",
      "contrastLegend": "Level: AAA >= 7:1 - AA >= 4.5:1 (body text) - large text or graphics >= 3:1 - below AA < 3:1. Anything under 4.5:1 must not carry body text.",
      "reasonNote": "\"Fill / border / overlay / dark only\" are not judged for text contrast (see key pairs for real usage); \"disabled (exempt)\" follows the WCAG exemption for disabled controls."
    }
  },
  "ja": {
    "ui": {
      "brand": "Yao Agents",
      "newTask": "新規タスク",
      "nav": {
        "chat": "チャット",
        "inbox": "受信トレイ",
        "board": "ボード",
        "workspace": "ワークスペース",
        "computer": "コンピュータ",
        "knowledge": "ナレッジ"
      },
      "inbox": {
        "unreadCount": "未読 {count}",
        "searchPlaceholder": "メッセージを検索…",
        "filterAll": "すべて",
        "filterUnread": "未読",
        "filterArchived": "アーカイブ済み"
      },
      "time": {
        "today": "今日",
        "yesterday": "昨日",
        "earlier": "それ以前"
      },
      "thread": {
        "newMessages": "新着 {count} 件",
        "dateAt": "今日 {time}",
        "changesChip": "変更 +{added} −{removed}"
      },
      "tool": {
        "readFiles": "ファイルを読み込む"
      },
      "status": {
        "done": "完了"
      },
      "agent": "エージェント",
      "ask": {
        "pending": "確認待ち",
        "pendingAt": "確認待ち · {time}",
        "differences": "差分 {count} 件",
        "question": "要約の観点はどれにしますか？出力の構成が変わります：",
        "optionRiskFirst": "「リスク優先」で要約（推奨）",
        "optionChronological": "「時系列」で要約",
        "optionCustom": "自分で指定する"
      },
      "composer": {
        "placeholder": "続けて：リスクを要件定義の受け入れ条件に追記…",
        "defaultPermission": "既定の権限",
        "awaitConfirm": "上記の選択肢を確認してから続けてください…"
      },
      "panel": {
        "inProgress": "進行中",
        "highPriority": "優先度：高",
        "remainingDays": "残り {days} 日",
        "actionComplete": "完了にする",
        "actionPause": "保留",
        "actionOpenFullPage": "全画面で開く",
        "subtasks": "サブタスク",
        "gates": "ゲート",
        "changes": "変更",
        "relatedFiles": "関連ファイル",
        "activity": "アクティビティ"
      },
      "activity": {
        "readDocuments": "ドキュメント {count} 件を読み込み",
        "extractRisks": "リスク {count} 件を抽出",
        "waitingConfirmation": "観点の確認待ち"
      },
      "theme": {
        "light": "ライト",
        "dark": "ダーク"
      },
      "task": {
        "id": "タスク ID"
      }
    },
    "sample": {
      "conversation": {
        "greeting": {
          "title": "ご挨拶と機能のご案内",
          "subtitle": "ドキュメント処理と利用可能なツールをご案内"
        },
        "weekly": {
          "title": "週報の作成",
          "subtitle": "テンプレートで今週の進捗を集計"
        },
        "scraping": {
          "title": "データ収集タスク",
          "subtitle": "12 ページ完了"
        },
        "contract": {
          "title": "契約書レビュー",
          "subtitle": "リスク 3 件を指摘"
        },
        "invoice": {
          "title": "請求書チェック",
          "subtitle": "証憑を 2 件作成"
        },
        "siteCheck": {
          "title": "サイト監視",
          "subtitle": "3 ドメイン正常"
        }
      },
      "message": {
        "user1": "こんにちは。この 2 つのドキュメントを確認してもらえますか？契約書のリスク条項が中心です。",
        "agent1Html": "両方読みました。契約書に<b>リスクが 3 件</b>あります：① 第 4.2 条 支払期間に上限がない；② 第 7 条 責任が不均衡；③ 別紙 2 に署名欄がない。",
        "agent2": "リスク優先で要約し、根拠条項とページを付記しました。"
      },
      "tool": {
        "readLineContract": "contract.pdf · 12 ページ · 本文を抽出",
        "readLineRequirements": "要件定義.docx · 4 ページ · 本文を抽出"
      },
      "panel": {
        "taskTitle": "契約書レビュー",
        "subtaskRead": "contract.pdf / 要件定義.docx を読み込む",
        "subtaskExtract": "リスク条項を抽出しページを付記",
        "subtaskGenerate": "リスク摘要.md を生成",
        "subtaskAcceptance": "受け入れ条件に追記（観点の確認待ち）",
        "gateVisual": "visual {count} 件"
      },
      "diff": {
        "line1": "- 支払期間：四半期ごとの精算",
        "line2": "+ 支払期間：≤30 日（4.2 条）",
        "line3": "- 責任：双方が各自負担",
        "line4": "+ 責任：対等、遅延は 0.05%/日"
      },
      "file": {
        "contract": "contract.pdf",
        "requirements": "要件定義.docx",
        "riskSummary": "リスク摘要.md"
      }
    },
    "card": {
      "title": "Celadon デザインベースライン",
      "subtitle": "トークン · ペアリング · フォント · コントラスト —— すべて tokens.css から取得（ハードコードなし）",
      "source": "出典：tokens.less → build-css.mjs → tokens.css。フォントのトークンは下の見本を参照。変更後は pnpm design:css を実行（本ページの編集は不要）。",
      "sectionPairs": "主要なペアリング（前景 on 背景 · 自動計算）",
      "pairsNote": "多くのトークンは「塗り」と「淡色」の2段構成です。組み合わせを誤ると --warm + --warm-text（1.41:1）のように、ほぼ見えなくなります。",
      "sectionContrast": "コントラスト実測（WCAG 2.1 · AA 本文 4.5:1 / AAA 7:1）",
      "sectionTypography": "フォント見本（4 言語 · :lang でスタックを切替）",
      "typographyNote": "言語ごとにスタックを分けるのは必須です。繁体字が簡体字の字形で、日本語が中国語の字形で表示されると誤字になります。",
      "sectionRedlines": "使用ルール",
      "tableTheme": "テーマ",
      "tableToken": "token",
      "tableValue": "値",
      "tableBackground": "背景",
      "tableContrast": "コントラスト",
      "tableLevel": "評価",
      "themeLight": "ライト",
      "themeDark": "ダーク",
      "samplePrefix": "例",
      "stackLabel": "解決されたフォントスタック",
      "mixedLabel": "混植（本文既定 13px）",
      "hanLabel": "漢字（SC / TC / JP の字形差）",
      "kanaLabel": "かなと濁点",
      "latinLabel": "ラテン文字と数字",
      "punctLabel": "全角約物",
      "monoLabel": "等幅（コード / パス）",
      "glyphCompare": "字形の比較",
      "glyphCompareText": "直 骨 今 令 収 收 真 具 门 門 温 溫 骨 滑 次",
      "mixedText": "Agent が contract.pdf（12 ページ）を読み込み、リスクを 3 件検出しました。14:06 までにご確認ください。",
      "hanText": "青磁の釉色は穏やかで温かみがあります。リスク評価と契約条項にページ番号を付記しました。",
      "kanaText": "エージェントが契約書を読み込み、リスクを 3 件抽出しました。",
      "latinText": "Yao Agents 2.0 — Quick brown fox jumps over 0123456789 (AA 4.77:1).",
      "punctText": "「」『』《》〈〉【】——……、。：；！？（）",
      "monoText": "const brand = '#2A7B7B';  risk_count <- 3;  // 収入・契約書",
      "langNote": "言語ボタンは本ページの文言のみ切替えます。フォント見本は 4 言語を常時並べて比較できます。",
      "redlines": [
        "ブランドは2段構成：塗り（--brand + 白文字）は主要ボタン/バッジのみ（画面に最大2か所）、淡色（--brand-soft + ブランド文字）は選択行・バブル・アバターに。",
        "アンバーの2段を混ぜない：--warm は --warm-contrast と、--warm-soft は --warm-text と組み合わせる。",
        "ダークモードで「淡色地 + ブランド文字/枠線」は必ず --brand-lift を使う。",
        "インタラクションは4状態（default/hover/active/disabled）を揃え、キーボードフォーカスを常に見えるように（--focus-ring）。",
        "--brand-display は塗り専用。文字やアイコンを載せない。",
        "成功は淡色地 + アイコンのみ。大きな塗りは使わない。",
        "部品の枠線は --border-default / --border-control、--border-subtle は装飾用のみ。",
        "ハードコード禁止（システム色を除く）。トークン名・クラス名は省略せず正式名で。"
      ],
      "usage": {
        "brand": "主要ボタン / バッジ / 選択文字",
        "brandHover": "ホバー",
        "brandActive": "押下",
        "brandSoft": "淡色ボタン · 選択行 · バブル",
        "brandDisplay": "面塗り/図形（文字を載せない）",
        "brandText": "ブランド地の文字",
        "brandLift": "ダーク専用（文字/枠線）",
        "focusRingColor": "フォーカスリング色（2px offset + 2px 幅）",
        "focusRingWidth": "リング幅",
        "focusRingOffset": "リングと部品の隙間",
        "backgroundDisabled": "無効時の背景",
        "textDisabled": "無効時の文字（コントラスト免除）",
        "borderDisabled": "無効時の枠線",
        "scrim": "モーダル/ドロワーのスクリム",
        "backgroundApp": "ウィンドウ背景",
        "backgroundNavigation": "① ナビ列",
        "backgroundContent": "② コンテンツ領域（純白ではない）",
        "backgroundSurface": "③ パネル/カード",
        "backgroundField": "入力欄/フィールド",
        "backgroundHover": "ホバー",
        "backgroundActive": "押下時の背景（中立コントロール）",
        "backgroundSelected": "選択行（= ブランド淡色）",
        "backgroundReadonly": "読み取り専用フィールドの背景（文字は副テキスト）",
        "borderSubtle": "装飾ライン",
        "borderDefault": "標準の枠線",
        "borderControl": "部品の枠線",
        "borderHover": "ホバー時の境界線",
        "textPrimary": "主テキスト",
        "textSecondary": "副テキスト",
        "textTertiary": "第三階層",
        "textPlaceholder": "入力プレースホルダー（第三階層テキストと同色）",
        "textMuted": "装飾専用（区切り・透かし。文字には使わない）",
        "success": "成功（伝統色）",
        "successSoft": "成功の淡色",
        "warning": "警告（--warm の別名）",
        "warningSoft": "警告の淡色",
        "warm": "アンバー塗り（--warm-contrast と対）",
        "warmSoft": "アンバー淡色（--warm-text と対）",
        "warmText": "アンバー淡色地の文字",
        "warmContrast": "アンバー塗り地の文字",
        "danger": "危険（朱色）",
        "dangerSoft": "危険の淡色",
        "fontSize11": "欧文/数字の角標のみ",
        "fontSize12": "中国語の最小",
        "fontSize13": "本文の既定",
        "fontSize16": "15→17 の欠番を補完",
        "spacing8": "余白 8",
        "spacing12": "余白 12",
        "spacing16": "余白 16",
        "radiusSmall": "6px",
        "radiusMedium": "既定 8px",
        "radiusLarge": "12px",
        "radiusPill": "バッジ/タブ/アバターのみ",
        "rowHeight": "行の高さ 40",
        "columnHeaderHeight": "列ヘッダ 40（3列で統一）",
        "durationFast": "hover 120ms",
        "durationBase": "展開 200ms",
        "easing": "イージング",
        "shadowSubtle": "hairline",
        "shadowFloating": "フローティング",
        "fontFamilyUi": "UI フォント（欧文 + フォールバック）",
        "fontFamilyMonospace": "等幅フォント",
        "brandInk": "ブランド色の文字/アイコン（淡色ボタン・選択行・バブル。淡色地で 4.8:1、暗色では自動で明るい方に切替）",
        "brandSolidHover": "主ボタンのホバー背景（白文字 ≥4.5:1）",
        "brandSolidActive": "主ボタンの押下背景（白文字 ≥4.5:1）"
      },
      "group": {
        "brand": "ブランド",
        "interaction": "インタラクション",
        "background": "ニュートラル · 面",
        "border": "ニュートラル · 境界",
        "text": "ニュートラル · 文字",
        "semantic": "セマンティック",
        "metrics": "サイズ · 角丸 · モーション"
      },
      "state": {
        "statesTitle": "コントロール状態 · ライブプレビュー",
        "statesNote": "全状態を同時表示：.is-* クラスは実際の疑似クラス（:hover/:focus/:read-only/:disabled）と一対一、同一トークン",
        "groupInput": "入力欄",
        "groupButton": "ボタン",
        "default": "既定",
        "hover": "ホバー",
        "active": "押下",
        "focus": "フォーカス",
        "disabled": "無効",
        "filled": "入力済み",
        "placeholder": "プレースホルダー",
        "readonly": "読み取り専用",
        "error": "エラー",
        "errorHint": "日付形式が不正です",
        "solid": "主ボタン",
        "soft": "淡色"
      },
      "reason": {
        "fill": "塗り",
        "line": "境界線",
        "overlay": "オーバーレイ",
        "dark": "暗色のみ",
        "exempt": "無効（免除）",
        "deco": "装飾"
      },
      "gradeAaa": "AAA",
      "gradeAa": "AA",
      "gradeLarge": "大サイズ文字・図形",
      "gradeFail": "AA 未満",
      "contrastLegend": "等級：AAA ≥7:1 · AA ≥4.5:1（本文）· 大サイズ文字・図形 ≥3:1 · AA 未満 <3:1。4.5:1 未満は本文に使用しないこと。",
      "reasonNote": "「塗り / 境界線 / オーバーレイ / 暗色のみ」は文字コントラスト判定の対象外（実際の用法は「主要な組み合わせ」参照）。「無効（免除）」は WCAG の無効コントロール免除に準拠。"
    }
  },
  "zh-CN": {
    "ui": {
      "brand": "Yao Agents",
      "newTask": "新任务",
      "nav": {
        "chat": "聊天",
        "inbox": "收件箱",
        "board": "看板",
        "workspace": "工作区",
        "computer": "电脑",
        "knowledge": "知识库"
      },
      "inbox": {
        "unreadCount": "{count} 未读",
        "searchPlaceholder": "搜索消息…",
        "filterAll": "全部",
        "filterUnread": "未读",
        "filterArchived": "已归档"
      },
      "time": {
        "today": "今天",
        "yesterday": "昨天",
        "earlier": "更早"
      },
      "thread": {
        "newMessages": "{count} 条新消息",
        "dateAt": "今天 {time}",
        "changesChip": "变更 +{added} −{removed}"
      },
      "tool": {
        "readFiles": "读取文件"
      },
      "status": {
        "done": "完成"
      },
      "agent": "Agent",
      "ask": {
        "pending": "待你确认",
        "pendingAt": "待你确认 · {time}",
        "differences": "{count} 处差异",
        "question": "摘要口径按哪个来？这会影响输出结构：",
        "optionRiskFirst": "按「风险优先」汇总（推荐）",
        "optionChronological": "按「时间顺序」汇总",
        "optionCustom": "我自己补口径"
      },
      "composer": {
        "placeholder": "继续：把风险点补进需求文档的验收条款…",
        "defaultPermission": "默认权限",
        "awaitConfirm": "请先确认上方选项后继续…"
      },
      "panel": {
        "inProgress": "进行中",
        "highPriority": "高优先级",
        "remainingDays": "剩余 {days} 天",
        "actionComplete": "标记完成",
        "actionPause": "挂起",
        "actionOpenFullPage": "全页打开",
        "subtasks": "子任务",
        "gates": "门禁",
        "changes": "变更",
        "relatedFiles": "相关文件",
        "activity": "活动"
      },
      "activity": {
        "readDocuments": "读取 {count} 份文档",
        "extractRisks": "提取 {count} 处风险",
        "waitingConfirmation": "等待口径确认"
      },
      "theme": {
        "light": "浅色",
        "dark": "暗色"
      },
      "task": {
        "id": "任务 ID"
      }
    },
    "sample": {
      "conversation": {
        "greeting": {
          "title": "打招呼与功能咨询",
          "subtitle": "已介绍文档处理能力与可用工具"
        },
        "weekly": {
          "title": "周报生成",
          "subtitle": "按模板汇总本周进展"
        },
        "scraping": {
          "title": "数据抓取任务",
          "subtitle": "已完成 12 个页面"
        },
        "contract": {
          "title": "合同审阅",
          "subtitle": "风险点 3 处 · 已标注"
        },
        "invoice": {
          "title": "发票核对",
          "subtitle": "已生成 2 张凭证"
        },
        "siteCheck": {
          "title": "站点巡检",
          "subtitle": "3 个域名正常"
        }
      },
      "message": {
        "user1": "你好，能帮我看看这两份文档吗？重点是合同里的风险条款。",
        "agent1Html": "两份都读完了。合同里我找到 <b>3 处风险</b>：① 第 4.2 条付款周期无上限；② 第 7 条违约责任不对等；③ 附件二缺失签章页。",
        "agent2": "已按风险优先输出，并标注了依据条款页码。"
      },
      "tool": {
        "readLineContract": "contract.pdf · 12 页 · 已提取正文",
        "readLineRequirements": "需求.docx · 4 页 · 已提取正文"
      },
      "panel": {
        "taskTitle": "合同审阅",
        "subtaskRead": "读取 contract.pdf / 需求.docx",
        "subtaskExtract": "提取风险条款并标页码",
        "subtaskGenerate": "生成 风险摘要.md",
        "subtaskAcceptance": "补进验收条款（待你确认口径）",
        "gateVisual": "visual {count} 处"
      },
      "diff": {
        "line1": "- 付款周期：按季度结算",
        "line2": "+ 付款周期：≤30 天（4.2 条）",
        "line3": "- 违约责任：双方各承担",
        "line4": "+ 违约责任：对等，逾期按 0.05%/日"
      },
      "file": {
        "contract": "contract.pdf",
        "requirements": "需求.docx",
        "riskSummary": "风险摘要.md"
      }
    },
    "card": {
      "title": "Celadon 设计基线",
      "subtitle": "token · 配对 · 字体 · 对比度 —— 全部实时读 tokens.css（零硬编码）",
      "source": "源：tokens.less → build-css.mjs → tokens.css；字体 token 见「字体样本」。改 token 后跑 pnpm design:css 即可，本页无需改动。",
      "sectionPairs": "关键配对（前景 on 背景 · 自动实算）",
      "pairsNote": "同一 token 有\"实心底\"和\"浅底\"两种用法，配对用错就会像 --warm + --warm-text（1.41:1，几乎不可见）。",
      "sectionContrast": "对比度实测（WCAG 2.1 · AA 正文 4.5:1 / AAA 7:1）",
      "sectionTypography": "字体样本（四语 · 按 :lang 切换字体栈）",
      "typographyNote": "字体栈按语言分开是必须的：繁中若走 SC 字形会出现\"简体字形冒充繁体\"的错字，日文若走中文字形会出现汉字写法错误。",
      "sectionRedlines": "用法红线",
      "tableTheme": "主题",
      "tableToken": "token",
      "tableValue": "色值",
      "tableBackground": "背景",
      "tableContrast": "对比度",
      "tableLevel": "等级",
      "themeLight": "浅色",
      "themeDark": "暗色",
      "samplePrefix": "示例",
      "stackLabel": "解析后的字体栈",
      "mixedLabel": "混排（正文默认 13px）",
      "hanLabel": "汉字（SC / TC / JP 字形差异）",
      "kanaLabel": "假名与浊点",
      "latinLabel": "拉丁与数字",
      "punctLabel": "全角标点",
      "monoLabel": "等宽（代码 / 路径）",
      "glyphCompare": "字形对照",
      "glyphCompareText": "直 骨 今 令 収 收 真 具 门 門 温 溫 骨 滑 次",
      "mixedText": "Agent 已读取 contract.pdf（12 页）→ 风险 3 处，请在 14:06 前确认。",
      "hanText": "青瓷釉色温润，风险评估与合同条款已标注页码。",
      "kanaText": "エージェントが契約書を読み込み、リスクを 3 件抽出しました。",
      "latinText": "Yao Agents 2.0 — Quick brown fox jumps over 0123456789 (AA 4.77:1).",
      "punctText": "「」『』《》〈〉【】——……、。：；！？（）",
      "monoText": "const brand = '#2A7B7B';  risk_count <- 3;  // 収入・契約書",
      "langNote": "语言按钮只切本页文字；字体样本四列恒显四语，便于横向对比字形。",
      "redlines": [
        "品牌分两档：实心档（--brand + 白字）只用于主按钮/徽标（≤2 处）；浅底档（--brand-soft + 品牌字）用于选中/气泡/头像。",
        "琥珀两档不得混用：--warm 配 --warm-contrast；--warm-soft 配 --warm-text。",
        "暗色下\"浅底 + 品牌字/描边\"一律用 --brand-lift。",
        "交互四态齐（default/hover/active/disabled），键盘焦点必须可见（--focus-ring）。",
        "--brand-display 只做填充/图形，不承载文字与图标。",
        "success 只用软底 + 图标，不做大面积实心。",
        "控件边界用 --border-default/--border-control，--border-subtle 只作装饰线。",
        "禁硬编码：less/tsx 不得出现颜色字面量（系统色除外）；变量/类名用全称不用缩写。"
      ],
      "usage": {
        "brand": "主按钮 / 徽标 / 选中文字",
        "brandHover": "悬停",
        "brandActive": "按下",
        "brandSoft": "浅底按钮 · 选中底 · 气泡",
        "brandDisplay": "大面积填充/图形（不承载文字）",
        "brandText": "品牌底上的文字",
        "brandLift": "仅暗色用（文字/描边档）",
        "focusRingColor": "键盘焦点环颜色（2px offset + 2px 宽）",
        "focusRingWidth": "焦点环宽度",
        "focusRingOffset": "焦点环与控件间隙",
        "backgroundDisabled": "禁用底",
        "textDisabled": "禁用字（豁免对比度）",
        "borderDisabled": "禁用边界",
        "scrim": "弹窗/抽屉遮罩",
        "backgroundApp": "窗口底",
        "backgroundNavigation": "① 导航列",
        "backgroundContent": "② 内容区（非纯白）",
        "backgroundSurface": "③ 面板/卡片",
        "backgroundField": "输入框/字段",
        "backgroundHover": "悬停",
        "backgroundActive": "按下态底（中性控件）",
        "backgroundSelected": "选中底（= 品牌浅底）",
        "backgroundReadonly": "只读字段底（文字用次要文字）",
        "borderSubtle": "装饰线",
        "borderDefault": "常规边界",
        "borderControl": "控件边界",
        "borderHover": "控件悬停边界",
        "textPrimary": "主文字",
        "textSecondary": "次要文字",
        "textTertiary": "第三级",
        "textPlaceholder": "输入占位文字（与三级文字同色）",
        "textMuted": "纯装饰（分隔符/水印；不承载文字）",
        "success": "成功（松花绿 · 传统色）",
        "successSoft": "成功软底",
        "warning": "警示（= --warm 别名）",
        "warningSoft": "警示软底",
        "warm": "琥珀实心底（须配 --warm-contrast）",
        "warmSoft": "琥珀浅底（须配 --warm-text）",
        "warmText": "琥珀浅底上的文字",
        "warmContrast": "压在 --warm 实心底上的文字",
        "danger": "危险（朱红）",
        "dangerSoft": "危险软底",
        "fontSize11": "仅西文/数字角标",
        "fontSize12": "中文最小档",
        "fontSize13": "正文默认",
        "fontSize16": "补档（原 15→17 断档）",
        "spacing8": "间距 8",
        "spacing12": "间距 12",
        "spacing16": "间距 16",
        "radiusSmall": "6px",
        "radiusMedium": "主档 8px",
        "radiusLarge": "12px",
        "radiusPill": "仅徽标/标签/头像",
        "rowHeight": "行高 40",
        "columnHeaderHeight": "列头 40（三列等高）",
        "durationFast": "hover 120ms",
        "durationBase": "展开 200ms",
        "easing": "缓动曲线",
        "shadowSubtle": "hairline",
        "shadowFloating": "浮层",
        "fontFamilyUi": "界面字体（拉丁 + 兜底）",
        "fontFamilyMonospace": "等宽字体",
        "brandInk": "品牌色文字/图标（浅底按钮 · 选中底 · 气泡；软底 4.8:1，暗色自动切提亮档）",
        "brandSolidHover": "实心按钮悬停底（白字 ≥4.5:1）",
        "brandSolidActive": "实心按钮按下底（白字 ≥4.5:1）"
      },
      "group": {
        "brand": "品牌",
        "interaction": "交互态",
        "background": "中性 · 面",
        "border": "中性 · 界",
        "text": "中性 · 字",
        "semantic": "语义",
        "metrics": "尺寸 · 圆角 · 动效"
      },
      "state": {
        "statesTitle": "控件状态 · 实时预览",
        "statesNote": "静态展示多态：`.is-*` 类与真实伪类（:hover/:focus/:read-only/:disabled）一一对应，同一份 token",
        "groupInput": "输入框",
        "groupButton": "按钮",
        "default": "默认",
        "hover": "悬停",
        "active": "按下",
        "focus": "聚焦",
        "disabled": "禁用",
        "filled": "已填",
        "placeholder": "占位",
        "readonly": "只读",
        "error": "错误",
        "errorHint": "日期格式不正确",
        "solid": "主按钮",
        "soft": "浅底"
      },
      "reason": {
        "fill": "填充",
        "line": "边界",
        "overlay": "遮罩",
        "dark": "仅暗色",
        "exempt": "禁用豁免",
        "deco": "装饰"
      },
      "gradeAaa": "AAA",
      "gradeAa": "AA",
      "gradeLarge": "大字 / 图形",
      "gradeFail": "不达标",
      "contrastLegend": "等级：AAA ≥7:1 · AA ≥4.5:1（正文标准）· 大字/图形 ≥3:1 · 不达标 <3:1；正文低于 4.5:1 不能用于正文。",
      "reasonNote": "「填充 / 边界 / 遮罩 / 仅暗色」不参与文字对比度判定（用法见「关键配对」）；「禁用豁免」按 WCAG 对禁用控件豁免。"
    }
  },
  "zh-TW": {
    "ui": {
      "brand": "Yao Agents",
      "newTask": "新增任務",
      "nav": {
        "chat": "聊天",
        "inbox": "收件匣",
        "board": "看板",
        "workspace": "工作區",
        "computer": "電腦",
        "knowledge": "知識庫"
      },
      "inbox": {
        "unreadCount": "{count} 未讀",
        "searchPlaceholder": "搜尋訊息…",
        "filterAll": "全部",
        "filterUnread": "未讀",
        "filterArchived": "已封存"
      },
      "time": {
        "today": "今天",
        "yesterday": "昨天",
        "earlier": "更早"
      },
      "thread": {
        "newMessages": "{count} 則新訊息",
        "dateAt": "今天 {time}",
        "changesChip": "變更 +{added} −{removed}"
      },
      "tool": {
        "readFiles": "讀取檔案"
      },
      "status": {
        "done": "完成"
      },
      "agent": "Agent",
      "ask": {
        "pending": "待你確認",
        "pendingAt": "待你確認 · {time}",
        "differences": "{count} 處差異",
        "question": "摘要口徑依哪個？這會影響輸出結構：",
        "optionRiskFirst": "依「風險優先」彙總（建議）",
        "optionChronological": "依「時間順序」彙總",
        "optionCustom": "我自己補口徑"
      },
      "composer": {
        "placeholder": "繼續：把風險點補進需求文件的驗收條款…",
        "defaultPermission": "預設權限",
        "awaitConfirm": "請先確認上方選項後繼續…"
      },
      "panel": {
        "inProgress": "進行中",
        "highPriority": "高優先",
        "remainingDays": "剩餘 {days} 天",
        "actionComplete": "標記完成",
        "actionPause": "擱置",
        "actionOpenFullPage": "全頁開啟",
        "subtasks": "子任務",
        "gates": "品質關卡",
        "changes": "變更",
        "relatedFiles": "相關檔案",
        "activity": "活動"
      },
      "activity": {
        "readDocuments": "讀取 {count} 份文件",
        "extractRisks": "提取 {count} 處風險",
        "waitingConfirmation": "等待口徑確認"
      },
      "theme": {
        "light": "淺色",
        "dark": "深色"
      },
      "task": {
        "id": "任務 ID"
      }
    },
    "sample": {
      "conversation": {
        "greeting": {
          "title": "打招呼與功能諮詢",
          "subtitle": "已介紹文件處理能力與可用工具"
        },
        "weekly": {
          "title": "週報產生",
          "subtitle": "依範本彙總本週進度"
        },
        "scraping": {
          "title": "資料擷取任務",
          "subtitle": "已完成 12 個頁面"
        },
        "contract": {
          "title": "合約審閱",
          "subtitle": "風險點 3 處 · 已標註"
        },
        "invoice": {
          "title": "發票核對",
          "subtitle": "已產生 2 張憑證"
        },
        "siteCheck": {
          "title": "網站巡檢",
          "subtitle": "3 個網域正常"
        }
      },
      "message": {
        "user1": "你好，能幫我看看這兩份文件嗎？重點是合約裡的風險條款。",
        "agent1Html": "兩份都讀完了。合約裡我找到 <b>3 處風險</b>：① 第 4.2 條付款週期無上限；② 第 7 條違約責任不對等；③ 附件二缺少簽章頁。",
        "agent2": "已依風險優先輸出，並標註了依據條款頁碼。"
      },
      "tool": {
        "readLineContract": "contract.pdf · 12 頁 · 已擷取正文",
        "readLineRequirements": "需求.docx · 4 頁 · 已擷取正文"
      },
      "panel": {
        "taskTitle": "合約審閱",
        "subtaskRead": "讀取 contract.pdf / 需求.docx",
        "subtaskExtract": "提取風險條款並標註頁碼",
        "subtaskGenerate": "產生 風險摘要.md",
        "subtaskAcceptance": "補進驗收條款（待你確認口徑）",
        "gateVisual": "visual {count} 處"
      },
      "diff": {
        "line1": "- 付款週期：按季度結算",
        "line2": "+ 付款週期：≤30 天（4.2 條）",
        "line3": "- 違約責任：雙方各自承擔",
        "line4": "+ 違約責任：對等，逾期按 0.05%/日"
      },
      "file": {
        "contract": "contract.pdf",
        "requirements": "需求.docx",
        "riskSummary": "風險摘要.md"
      }
    },
    "card": {
      "title": "Celadon 設計基準",
      "subtitle": "token · 配對 · 字體 · 對比度 —— 全部即時讀取 tokens.css（零硬編碼）",
      "source": "來源：tokens.less → build-css.mjs → tokens.css；字體 token 見「字體樣本」。改 token 後跑 pnpm design:css，本頁無需修改。",
      "sectionPairs": "關鍵配對（前景 on 背景 · 自動實算）",
      "pairsNote": "同一個 token 有「實心底」與「淺底」兩種用法，配對用錯就會像 --warm + --warm-text（1.41:1，幾乎看不見）。",
      "sectionContrast": "對比度實測（WCAG 2.1 · AA 正文 4.5:1 / AAA 7:1）",
      "sectionTypography": "字體樣本（四語 · 依 :lang 切換字體堆疊）",
      "typographyNote": "字體堆疊必須依語言分開：繁中若走 SC 字形會出現「簡體字形冒充繁體」的錯字，日文若走中文字形會出現漢字寫法錯誤。",
      "sectionRedlines": "用法紅線",
      "tableTheme": "主題",
      "tableToken": "token",
      "tableValue": "色值",
      "tableBackground": "背景",
      "tableContrast": "對比度",
      "tableLevel": "等級",
      "themeLight": "淺色",
      "themeDark": "深色",
      "samplePrefix": "範例",
      "stackLabel": "解析後的字體堆疊",
      "mixedLabel": "混排（正文預設 13px）",
      "hanLabel": "漢字（SC / TC / JP 字形差異）",
      "kanaLabel": "假名與濁點",
      "latinLabel": "拉丁與數字",
      "punctLabel": "全形標點",
      "monoLabel": "等寬（程式碼 / 路徑）",
      "glyphCompare": "字形對照",
      "glyphCompareText": "直 骨 今 令 収 收 真 具 门 門 温 溫 骨 滑 次",
      "mixedText": "Agent 已讀取 contract.pdf（12 頁）→ 風險 3 處，請在 14:06 前確認。",
      "hanText": "青瓷釉色溫潤，風險評估與合約條款已標註頁碼。",
      "kanaText": "エージェントが契約書を読み込み、リスクを 3 件抽出しました。",
      "latinText": "Yao Agents 2.0 — Quick brown fox jumps over 0123456789 (AA 4.77:1).",
      "punctText": "「」『』《》〈〉【】——……、。：；！？（）",
      "monoText": "const brand = '#2A7B7B';  risk_count ← 3;  // 収入・契約書",
      "langNote": "語言按鈕只切換本頁文字；字體樣本四欄固定顯示四語，方便橫向對照字形。",
      "redlines": [
        "品牌分兩檔：實心檔（--brand + 白字）僅用於主按鈕／徽標（≤2 處）；淺底檔（--brand-soft + 品牌字）用於選取／氣泡／頭像。",
        "琥珀兩檔不得混用：--warm 配 --warm-contrast；--warm-soft 配 --warm-text。",
        "深色模式下「淺底 + 品牌字／描邊」一律用 --brand-lift。",
        "互動四態齊（default/hover/active/disabled），鍵盤焦點必須可見（--focus-ring）。",
        "--brand-display 只做填色／圖形，不承載文字與圖示。",
        "success 只用淺底 + 圖示，不做大面積實心。",
        "控制項邊界用 --border-default／--border-control，--border-subtle 只作裝飾線。",
        "禁硬編碼：less/tsx 不得出現顏色字面值（系統色除外）；變數／類名用全稱不用縮寫。"
      ],
      "usage": {
        "brand": "主按鈕 / 徽標 / 選取文字",
        "brandHover": "懸停",
        "brandActive": "按下",
        "brandSoft": "淺底按鈕 · 選取底 · 氣泡",
        "brandDisplay": "大面積填色/圖形（不承載文字）",
        "brandText": "品牌底上的文字",
        "brandLift": "僅深色用（文字/描邊）",
        "focusRingColor": "鍵盤焦點環顏色（2px offset + 2px 寬）",
        "focusRingWidth": "焦點環寬度",
        "focusRingOffset": "焦點環與控制項間隙",
        "backgroundDisabled": "停用底",
        "textDisabled": "停用字（豁免對比度）",
        "borderDisabled": "停用邊界",
        "scrim": "彈窗/抽屜遮罩",
        "backgroundApp": "視窗底",
        "backgroundNavigation": "① 導覽列",
        "backgroundContent": "② 內容區（非純白）",
        "backgroundSurface": "③ 面板/卡片",
        "backgroundField": "輸入框/欄位",
        "backgroundHover": "懸停",
        "backgroundActive": "按下態底（中性控件）",
        "backgroundSelected": "選取底（= 品牌淺底）",
        "backgroundReadonly": "唯讀欄位底（文字用次要文字）",
        "borderSubtle": "裝飾線",
        "borderDefault": "一般邊界",
        "borderControl": "控制項邊界",
        "borderHover": "控件懸停邊界",
        "textPrimary": "主文字",
        "textSecondary": "次要文字",
        "textTertiary": "第三級",
        "textPlaceholder": "輸入佔位文字（與三級文字同色）",
        "textMuted": "純裝飾（分隔符／浮水印；不承載文字）",
        "success": "成功（松花綠 · 傳統色）",
        "successSoft": "成功軟底",
        "warning": "警示（= --warm 別名）",
        "warningSoft": "警示淺底",
        "warm": "琥珀實心底（須配 --warm-contrast）",
        "warmSoft": "琥珀淺底（須配 --warm-text）",
        "warmText": "琥珀淺底上的文字",
        "warmContrast": "壓在 --warm 實心底上的文字",
        "danger": "危險（朱紅）",
        "dangerSoft": "危險淺底",
        "fontSize11": "僅西文/數字角標",
        "fontSize12": "中文最小檔",
        "fontSize13": "正文預設",
        "fontSize16": "補檔（原 15→17 斷檔）",
        "spacing8": "間距 8",
        "spacing12": "間距 12",
        "spacing16": "間距 16",
        "radiusSmall": "6px",
        "radiusMedium": "主檔 8px",
        "radiusLarge": "12px",
        "radiusPill": "僅徽標/標籤/頭像",
        "rowHeight": "行高 40",
        "columnHeaderHeight": "列頭 40（三欄等高）",
        "durationFast": "hover 120ms",
        "durationBase": "展開 200ms",
        "easing": "緩動曲線",
        "shadowSubtle": "hairline",
        "shadowFloating": "浮層",
        "fontFamilyUi": "介面字體（拉丁 + 後備）",
        "fontFamilyMonospace": "等寬字體",
        "brandInk": "品牌色文字/圖示（淺底按鈕 · 選取底 · 氣泡；軟底 4.8:1，暗色自動切提亮檔）",
        "brandSolidHover": "實心按鈕懸停底（白字 ≥4.5:1）",
        "brandSolidActive": "實心按鈕按下底（白字 ≥4.5:1）"
      },
      "group": {
        "brand": "品牌",
        "interaction": "互動態",
        "background": "中性 · 面",
        "border": "中性 · 界",
        "text": "中性 · 字",
        "semantic": "語意",
        "metrics": "尺寸 · 圓角 · 動效"
      },
      "state": {
        "statesTitle": "控件狀態 · 即時預覽",
        "statesNote": "靜態展示多態：`.is-*` 類與真實偽類（:hover/:focus/:read-only/:disabled）一一對應，同一份 token",
        "groupInput": "輸入框",
        "groupButton": "按鈕",
        "default": "預設",
        "hover": "懸停",
        "active": "按下",
        "focus": "聚焦",
        "disabled": "停用",
        "filled": "已填",
        "placeholder": "佔位",
        "readonly": "唯讀",
        "error": "錯誤",
        "errorHint": "日期格式不正確",
        "solid": "主按鈕",
        "soft": "淺底"
      },
      "reason": {
        "fill": "填充",
        "line": "邊界",
        "overlay": "遮罩",
        "dark": "僅暗色",
        "exempt": "停用豁免",
        "deco": "裝飾"
      },
      "gradeAaa": "AAA",
      "gradeAa": "AA",
      "gradeLarge": "大字 / 圖形",
      "gradeFail": "不達標",
      "contrastLegend": "等級：AAA ≥7:1 · AA ≥4.5:1（正文標準）· 大字/圖形 ≥3:1 · 不達標 <3:1；正文低於 4.5:1 不能用於正文。",
      "reasonNote": "「填充 / 邊界 / 遮罩 / 僅暗色」不參與文字對比度判定（用法見「關鍵配對」）；「停用豁免」依 WCAG 對停用控件豁免。"
    }
  }
};
