/* 自动生成，勿手改 —— 源：i18n/*.json（node celadon/design/build-i18n.mjs） */
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
        "defaultPermission": "Default permission"
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
        "defaultPermission": "既定の権限"
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
        "defaultPermission": "默认权限"
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
        "defaultPermission": "預設權限"
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
    }
  }
};
