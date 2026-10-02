#!/usr/bin/env node
/**
 * check-i18n.mjs — 语言包体检（漏 key + 漏翻 + 基准语言缺失）
 * 用法：node scripts/check-i18n.mjs [目标根目录]   （有问题退出码 1，可进 CI）
 *
 * 语言包**跟代码走**，所以先把三处按 locale 合并，再校验：
 *   app/src/locales/<locale>.json               共用词
 *   app/src/features/<域>/locales/<locale>.json feature 私有词
 *   app/src/components/<名>/locales/<locale>.json 组件私有词
 * 多出来的另一份 key 必须与**基准语言 zh-CN**完全一致（缺一个都算漏 key）。
 *
 * 四种检查：
 *   0) 基准语言 zh-CN 必须存在（它是唯一手写的源，缺了整套校验就失去基准）
 *   1) key 完整性：其他语言必须与合并后的 zh-CN key 集合完全一致
 *   2) 漏翻（en-*）：值里不允许出现汉字（语言中性样本走白名单）
 *   3) 漏翻（ja-* / zh-TW）：与 zh-CN 相同 / 出现简体专属字 → 报警
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/* 本脚本住在 scripts/，包根在上一层：默认校验这个仓库的 app/src 三处语言包。
   第一个参数可指定目标根目录（检查器自测用），相对/绝对都行。 */
const PACKAGE = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TARGET = resolve(process.argv[2] || PACKAGE)
process.chdir(TARGET)

const BASE = 'zh-CN'

const flat = (obj, prefix = '', out = {}) => {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out)
    else out[key] = v
  }
  return out
}

/* 三处路径按 locale 合并；某处不存在就跳过，不是错误。 */
const packs = {}
const addDir = (dir) => {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue
    const locale = basename(file, '.json')
    const parsed = JSON.parse(readFileSync(join(dir, file), 'utf8'))
    packs[locale] = { ...packs[locale], ...flat(parsed) }
  }
}
addDir(join(TARGET, 'app', 'src', 'locales'))
for (const layer of ['features', 'components']) {
  const root = join(TARGET, 'app', 'src', layer)
  if (!existsSync(root) || !statSync(root).isDirectory()) continue
  for (const name of readdirSync(root)) addDir(join(root, name, 'locales'))
}

const LANGS = Object.keys(packs).sort()
if (LANGS.length === 0) {
  console.error('✗ no locale packs found — expected app/src/locales/*.json (and the feature / component locales/ dirs)')
  process.exit(1)
}
if (!(BASE in packs)) {
  console.error(`✗ baseline locale ${BASE} is missing — it is the only hand-written source every other locale is checked against`)
  process.exit(1)
}
const base = packs[BASE]

// 刻意保留 CJK / 与技术无关的样本 key，不参与"漏翻"判定
const ALLOW_CJK = new Set([
  'card.hanText', 'card.kanaText', 'card.punctText', 'card.glyphCompareText', 'card.monoText',
  'card.mixedText', 'card.latinText', 'sample.message.agent1Html',
  'df.listSample',   /* 排序演示：四语必须是同一份输入，故意不翻 */
  /* 语言名用本语言自己的写法（endonym：中文 / 繁體中文 / English / 日本語），在所有语言包里都一样，不算漏翻 */
  'localeSwitch.zhCN', 'localeSwitch.zhTW', 'localeSwitch.enUS', 'localeSwitch.ja'
])
// 语言中立（各语言相同是正确的）：品牌名、文件名、token 名、纯数值/单位
const NEUTRAL = /^(Yao Agents|Agent|token|contract\.pdf|需求\.docx|requirements\.docx|risk-summary\.md|リスク摘要\.md|風險摘要\.md|6px|12px|hover 120ms|hairline|[\d.]+(px|ms|KB|MB)?)$/
const HAN = /[\u4e00-\u9fff]/
// 中日常用同形词：日文确实就这么写，与简中相同不算漏翻
const JA_KEEP = new Set(['背景', '合計', '完了', '変更', '最大', '最小', '内容', '画面', '保存', '設定', '確認', '削除', '追加', '編集', '検索', '実行', '選択', '名前', '状態', '詳細', '戻る', '次へ', '閉じる', '操作', '対象'])
// 简体专属字（在繁体里写法不同）—— 只列我们词库里会出现的
const SIMPLIFIED_ONLY = new Set([...'与东个临为丽举义乌乐乔习乡书买产仓仪们价众优会伟传伤伦伪体余佣侠侣侥侦侧侨俩俪俭债倾偿储儿兑党兰关兴兹养兽内冈册写军农冯冲决况冻净凄凉减凑凛几凤凭凯击凿刍划刘则刚创删别刬刭刽刿剀剂剐剑剥剧劝办务励劲劳势勋勐匀匮区医华协单卖卢卤卦卧卫却厂厅历厉压厌厕厢厦厨厮县参双发变叙叠叶号叹叽吁后吓吕吗吨听启吴呐呓呕呗员呛呜咏咙咛咝咤咸响哑哒哓哔哕哗哙哝哟唛唠唡唢唤啧啬啭啮啰啸喷喽喾嗫嗳嘘嘤嘱噜嚣囫囱囵图圹场坂坏块坚坛坜坝坞坟坠垄垅垒垦垩垫垭垱垲垴埘埙埚堑堕墙壮声壳壶处备复够头夸夹夺奁奂奋奖奥妆妇妈妩妪姗姜娄娅娆娇娈娱娲娴婳婴婵婶媪嫒嫔嫱嬷孙学孪宁宝实宠审宪宫宽宾寝对寻导寿将尔尘尧尴尸尽层屉届属屡屿岁岂岖岗岘岚岛岭岳岽岿峡峣峤峥峦崂崃崄崭嵘嵚嵝嵴巅巩币帅师帏帐帘帜带帧帮帱帻帼幂干并广庄庆庐庑库应庙庞废开异弃张弥弯弹强归当录彦彻径徕御忆忏忧忾怀态怂怃怄怅怆怜总怼怿恋恒恳恶恸恹恺恻恼恽悦悫悬悭悯惊惧惨惩惫惬惭惮惯愤愦愿慑懑懒懔戆戋戏戗战户扎扑扦执扩扪扫扬扰抚抛抟抠抡抢护报担拟拢拣拥拦拧拨择挂挚挛挝挞挟挠挡挢挣挤挥挦捞损捡换捣据捻掳掴掷掸掺揸揽揿搀搁搂搅携摄摅摆摇摈摊撑撵撷撸擞攒敌敛数斋斓斗斩断无旧时旷旸昙昼显晋晒晓晔晕晖暂暧札术朴机杀杂权条来杨杰极构枞枢枣枥枧枨枪枫枭柜柠柽栀栅标栈栉栊栋栌栎栏树栖样栾桠桡桢档桤桥桦桧桨桩梦梼梾检棂椁椟椠椤椭楼榄榇榈榉槛槟槠横樯樱橱橹橼檐檩欢欤欧歼殁殇残殒殓殚殡殴毁毕毙毡气氢氩氲汇汉污汤汹沟没沣沤沥沦沧沪泞泪泶泷泸泺泻泼泽泾洁洒洼浃浅浆浇浈浊测浍济浏浑浒浓浔涂涌涛涝涞涟涡涣涤润涧涨涩淀渊渍渎渐渑渔渗温湾湿溃溅滚滞满滢滤滥滨滩潆潇潋潍潜潴澜濑濒灭灯灵灾灿炀炉炜炝点炼炽烁烂烃烛烟烦烧烨烩烫烬热焕焖焘爱爷牍牦牵牺犊犟犷犹狈狞独狭狮狯狰狱狲猎猕猡猪猫猬献獭玛玮环现玺珉珑珰琐琼瑶璎瓒瓮瓯电画畅畴疖疗疟疠疡疬疮疯疱疴痈痉痒痖痨痪痫瘅瘆瘘瘪瘫瘾瘿癞癣癫皑皱皲盏盐监盖盗盘着睁睐睑瞒瞩矫矶矾矿砀码砖砚砺础硅硕确硷碍碛碜碱礼祎祯祷祸禀禄禅离秃秆种积称秽税稳穑穷窃窍窑窜窝窥窦竖竞笃笋笔笺笼筑筛筝筹签简箓箦箧箩箪箫篑篓篮篱籁类粜粝粤粪粮紧纟纠纡红纣纤纥约级纨纪纫纬纭纯纰纱纲纳纵纶纷纸纹纺纽纾线练组绅细织终绉绊绍绎经绑绒结绕绘给绚绛络绝绞统绢绣绥绩绪绫续绮绯绰绳维绵绶绷绸综绽绿缀缁缄缅缆缈缉缎缓缔缕编缘缚缜缝缠缤缩缪缭缮缯缴网罗罚罢羁羡翘耸耻聂聋职联聪肃肠肤肾肿胀胁胆胜胶脉脏脐脑脓脚脱脸腊腌腻腾舆舰舱艰艺节芜芦苇苋苍苏苹茎茏茧荆荐荚荛荞荟荡荣荤荧荨荫药莱莲莳获莹莺萝萤营萦萧萨葱蒋蓝蓟蓠蓣蔷蔺蔼蕲蕴薮藓虏虑虚虫虬虽虾蚀蚁蚂蚕蚝蚬蛊蛎蛏蛮蛰蛱蛲蛳蛴蜕蜗蜡蝇蝈蝉蝎蝼衅衔补衬衮袄袅袜袭装裆裢裤裥褛褴见观规觅视览觉觊觎觐觑触誉誊讠计订讣认讥讦讧讨让讪训议讯记讲讳讴讵讶讷许讹论讼讽设访诀证诂诃评诅识诈诉诊诋诌词诏译诒诓诔试诖诗诘诙诚诛话诞诟诠诡询诣诤该详诧诨诩诫诬语误诰诱诲诳说诵请诸诺读诽课诿谀谁调谄谅谆谈谊谋谍谎谏谐谑谒谓谕谗谙谚谛谜谟谡谢谣谤谦谧谨谩谪谬谭谱谴豮贝贞负贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贴贵贷贸费贺贻贼贾贿赁赂赃资赅赈赉赊赋赌赎赏赐赔赖赘赚赛赞赠赡赢赣赵赶趋跃跄跖践跸跹跻踊踌踪踬蹑蹒蹰蹿躏躯车轧轨轩转轭轮软轰轱轲轳轴轶轸轻载轿较辅辆辈辉辊辍辐辑输辕辖辗辘辙辚辞辩辫边辽达迁过迈运还这进远违连迟迩迳迹适选逊递逻遗遥邓邝邻郁郏郑郓郸酝酱酿释里鉴钆钇针钉钊钋钌钍钎钏钐钒钓钕钗钙钛钜钝钞钟钠钡钢钣钤钥钦钧钨钩钪钮钯钰钱钲钳钴钵钹钺钻钼钽钾钿铀铁铂铃铄铅铆铈铉铊铋铌铍铎铐铑铒铕铖铗铙铛铜铝铟铠铡铢铣铤铥铧铨铩铬铭铮铯铰铱铲铳铵银铷铸铺铻铼铽链铿销锁锂锃锄锅锆锈锉锋锌锐锑锒锔锗错锚锜锝锞锡锢锣锤锥锦锨锭键锯锰锱锲锴锵锶锷锸锹锻镀镁镂镇镉镊镌镍镏镐镑镒镓镖镗镘镛镜镝镞镟镡镢镣镤镥镦镧镨镩镪镫镬镭镮镯镰镲镳镶长门闩闪闭问闯闰闲间闵闷闸闹闺闻闽阀阁阂阄阅阆阈阉阊阋阌阍阎阏阐阑阔阕阖阗阙阚队阳阴阵阶际陆陇陈陉陕陨险随隐隶难雏雾霁霉靓静靥鞑鞒鞯韦韧韩韪韫韬韵页顶顷项顺须顽顾顿颁颂预颅领颇颈颊颌颍颏颐频颓颔颖颗题颚颛颜额颞颠颤颦颧风飏飐飒飓飕飘飙飞飨饤饥饦饧饨饩饪饫饬饭饮饯饰饱饲饴饵饶饷饺饼饿馀馁馄馅馆馈馊馋馍馏馐馒馓馔馕马驭驮驯驰驱驳驴驶驷驹驻驼驾驿骂骄骆骇骈骋验骏骐骑骗骚骛骜骝骞骟骠骡骢骤骥骨髅髋髌鬓魇魉鱼鱿鲁鲂鲅鲆鲇鲈鲋鲍鲎鲐鲑鲒鲔鲕鲚鲛鲜鲞鲟鲠鲡鲢鲤鲥鲦鲧鲨鲩鲫鲭鲮鲱鲲鲳鲴鲵鲶鲷鲸鲻鲼鳃鳄鳅鳇鳊鳌鳍鳎鳏鳐鳓鳔鳕鳖鳗鳙鳜鳝鳞鳟鸟鸠鸡鸢鸣鸥鸦鸨鸩鸪鸫鸬鸭鸯鸱鸳鸵鸶鸷鸽鸾鸿鹁鹂鹃鹄鹅鹆鹇鹈鹉鹊鹋鹌鹍鹎鹏鹑鹕鹗鹘鹚鹛鹜鹞鹟鹤鹦鹧鹨鹩鹪鹫鹬鹭鹰鹳麦麸黄黉黩黾鼋鼍鼹齐齑齿龀龃龄龅龆龇龈龉龊龋龌龙龚龛龟'])
// 守卫：以下字繁简同形，不能出现在 SIMPLIFIED_ONLY 里（否则会误报合法译文）
const SAME_FORM_GUARD = [...'放播常直使用空白面板本形按交人大小上下左右中西方位今明前步']
{
  const wrong = SAME_FORM_GUARD.filter(c => SIMPLIFIED_ONLY.has(c))
  if (wrong.length) { console.error('✗ check-i18n itself is broken: a same-form character was wrongly listed as simplified →', wrong.join('')); process.exit(1) }
}
const problems = []

// 0) key 命名与深度（i18n 规范 §2）：小驼峰 · 深度 ≤ 3 段（首段是命名空间/分组）· 不用缩写
const ABBREV = new Set(['nav', 'act', 'pnl', 'msg', 'btn', 'cfg', 'usr', 'cnt', 'idx'])
for (const k of Object.keys(base)) {
  const segs = k.split('.').slice(1)
  for (const seg of segs) if (!/^[a-z][A-Za-z0-9]*$/.test(seg)) problems.push(`key name is not lowerCamelCase: ${k}`)
  if (segs.length > 3) problems.push(`key is too deep (>3 segments): ${k}`)
  for (const seg of segs) if (ABBREV.has(seg)) problems.push(`key segment is abbreviated (full words required): ${k} — ${seg}`)
}

// 1) 页面里字面引用的 key 必须在语言包里存在（data-i18n="…" 与 tr('…')）
{
  const files = readdirSync('.').filter((f) => f.endsWith('.html'))
  const seen = new Set()
  for (const f of files) {
    const text = readFileSync(f, 'utf8')
    const keys = []
    for (const mm of text.matchAll(/data-i18n="([^"]+)"/g)) keys.push(mm[1])
    for (const mm of text.matchAll(/\btr\('([^']+)'\)/g)) keys.push(mm[1])
    for (const k of keys) {
      if (k.includes('{') || k.includes('+')) continue          // 含插值/拼接的跳过
      if (!(k in base) && !seen.has(k)) { seen.add(k); problems.push(`a page references a key that does not exist: ${k} (${f})`) }
    }
  }
}

for (const lang of LANGS) {
  if (lang === BASE) continue
  const pack = packs[lang]
  // 2) key 完整性（合并三处之后）
  for (const k of Object.keys(base)) if (!(k in pack)) problems.push(`[${lang}] missing key: ${k}`)
  for (const k of Object.keys(pack)) if (!(k in base)) problems.push(`[${lang}] extra key: ${k}`)
  // 3/4) 漏翻
  for (const [k, v] of Object.entries(pack)) {
    if (typeof v !== 'string' || ALLOW_CJK.has(k) || NEUTRAL.test(v)) continue
    // en-* 里出现汉字 = 没翻（字型样本走 ALLOW_CJK 白名单）
    if (lang.startsWith('en') && HAN.test(v)) problems.push(`[${lang}] untranslated (contains Han characters): ${k} = ${v}`)
    if (lang.startsWith('ja') && HAN.test(v) && v === base[k] && !JA_KEEP.has(v))
      problems.push(`[${lang}] looks untranslated (identical to ${BASE}): ${k} = ${v}`)
    // 繁中：只查"简体专属字"（词形相同的词不算错，避免误报）
    if (lang === 'zh-TW' && !ALLOW_CJK.has(k)) {
      const hit = [...v].filter(c => SIMPLIFIED_ONLY.has(c))
      if (hit.length) problems.push(`[${lang}] contains simplified character(s) ${hit.join('')}: ${k} = ${v}`)
    }
  }
}

console.log(`✓ locale packs: ${LANGS.join(' / ')} · baseline ${BASE} holds ${Object.keys(base).length} key(s)`)
if (problems.length) {
  console.log(`✗ ${problems.length} problem(s) found:`)
  problems.forEach(p => console.log('   ' + p))
  process.exit(1)
}
console.log('✓ no missing keys and no untranslated values')
