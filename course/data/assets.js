/*
 * 资源清单 —— 所有图片/封面/背景/纹理的单一登记处。
 * 交付图片后：把文件放到 path 指定位置，再把对应条目的 status 改为 "ready"（或 "needs-review"）。
 * 引擎只会加载 status 不是 "missing" 的文件，所以未交付的图片不会触发浏览器报错，界面显示设计过的占位图。
 * provider / promptDoc / note 仅供团队内部追溯，不在 UI 中逐图展示（AI 图只在首屏与页脚统一声明）。
 */
window.ASSET_MANIFEST = {
  version: "1.0.0",
  updated: "2026-10-24",
  items: [
    { id: "bg", theme: "", kind: "image", path: "assets/ui/bg.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/prompts/03_GPT-Image2_美术资产.md", usedBy: ["index.html#bg"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-cover", theme: "wudai", kind: "image", path: "assets/ui/cover-wudai.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, 上方留暗部叠标题", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/prompts/03_GPT-Image2_美术资产.md", usedBy: ["theme.wudai.js#meta.cover"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "suitang-cover", theme: "suitang", kind: "image", path: "assets/ui/cover-suitang.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, 上方留暗部叠标题", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/prompts/03_GPT-Image2_美术资产.md", usedBy: ["theme.suitang.js#meta.cover"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "song-cover", theme: "song", kind: "image", path: "assets/ui/cover-song.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, 上方留暗部叠标题", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/prompts/03_GPT-Image2_美术资产.md", usedBy: ["theme.song.js#meta.cover"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e01", theme: "wudai", kind: "image", path: "assets/events/wudai/e01.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e01"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e02", theme: "wudai", kind: "image", path: "assets/events/wudai/e02.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e02"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e03", theme: "wudai", kind: "image", path: "assets/events/wudai/e03.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e03"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e04", theme: "wudai", kind: "image", path: "assets/events/wudai/e04.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e04"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e05", theme: "wudai", kind: "image", path: "assets/events/wudai/e05.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e05"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e06", theme: "wudai", kind: "image", path: "assets/events/wudai/e06.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e06"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e07", theme: "wudai", kind: "image", path: "assets/events/wudai/e07.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e07"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e08", theme: "wudai", kind: "image", path: "assets/events/wudai/e08.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e08"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e09", theme: "wudai", kind: "image", path: "assets/events/wudai/e09.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e09"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e10", theme: "wudai", kind: "image", path: "assets/events/wudai/e10.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P0", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e10"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "wudai-e11", theme: "wudai", kind: "image", path: "assets/events/wudai/e11.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/五代十国_图片脚本.md", usedBy: ["theme.wudai.js#e11"], note: "2026-10-23 / GPT-Image2 真插画" },
    { id: "suitang-e01", theme: "suitang", kind: "image", path: "assets/events/suitang/e01.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/隋唐_图片脚本.md", usedBy: ["theme.suitang.js#e01"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "suitang-e02", theme: "suitang", kind: "image", path: "assets/events/suitang/e02.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/隋唐_图片脚本.md", usedBy: ["theme.suitang.js#e02"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "suitang-e03", theme: "suitang", kind: "image", path: "assets/events/suitang/e03.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/隋唐_图片脚本.md", usedBy: ["theme.suitang.js#e03"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "suitang-e04", theme: "suitang", kind: "image", path: "assets/events/suitang/e04.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/隋唐_图片脚本.md", usedBy: ["theme.suitang.js#e04"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "suitang-e05", theme: "suitang", kind: "image", path: "assets/events/suitang/e05.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/隋唐_图片脚本.md", usedBy: ["theme.suitang.js#e05"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "suitang-e06", theme: "suitang", kind: "image", path: "assets/events/suitang/e06.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P1", status: "ready", promptDoc: "docs/history/隋唐_图片脚本.md", usedBy: ["theme.suitang.js#e06"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "song-e01", theme: "song", kind: "image", path: "assets/events/song/e01.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P2", status: "ready", promptDoc: "docs/history/宋朝_图片脚本.md", usedBy: ["theme.song.js#e01"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "song-e02", theme: "song", kind: "image", path: "assets/events/song/e02.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P2", status: "ready", promptDoc: "docs/history/宋朝_图片脚本.md", usedBy: ["theme.song.js#e02"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "song-e03", theme: "song", kind: "image", path: "assets/events/song/e03.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P2", status: "ready", promptDoc: "docs/history/宋朝_图片脚本.md", usedBy: ["theme.song.js#e03"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "song-e04", theme: "song", kind: "image", path: "assets/events/song/e04.jpg", spec: "1920x1080 JPEG, sRGB, 16:9, no text/watermark, ≤600KB", provider: "gpt-image2", priority: "P2", status: "ready", promptDoc: "docs/history/宋朝_图片脚本.md", usedBy: ["theme.song.js#e04"], note: "2026-10-23 / gpt-image-2 via cctq.ai" },
    { id: "map-relief", theme: "", kind: "texture", path: "assets/map/relief-<主题>.jpg", spec: "已退役；真实地形改由 data/dem/regions.js 提供", provider: "claude", priority: "P2", status: "retired", promptDoc: "", usedBy: [], note: "v0.4 起使用 SRTM/GMTED/ETOPO1 DEM，不再使用可选平面晕渲底图" }
  ]
};

/* v0.4：事件图全景；未替换槽位仍为程序化 2:1 示意，P0 槽位为 GPT-Image2 真 2:1 环境图。 */
(function () {
  var ids = [];
  ["wudai/e01","wudai/e02","wudai/e03","wudai/e04","wudai/e05","wudai/e06","wudai/e07","wudai/e08","wudai/e09","wudai/e10","wudai/e11",
   "suitang/e01","suitang/e02","suitang/e03","suitang/e04","suitang/e05","suitang/e06",
   "song/e01","song/e02","song/e03","song/e04"].forEach(function (id) { ids.push(id); });
  var truePanos = {
    "wudai/e06": true,
    "wudai/e07": true,
    "wudai/e08": true,
    "wudai/e11": true,
    "song/e03": true,
    "suitang/e03": true
  };
  var panos = ids.map(function (id) {
    var isTrue = !!truePanos[id];
    return {
      id: "vr-" + id.replace("/", "-"),
      theme: id.split("/")[0],
      kind: "pano",
      path: "assets/vr/" + id + ".jpg",
      spec: isTrue ? "4096x2048 JPEG, sRGB, 2:1 equirectangular, ≤1.2MB (upscaled from 1774x887)" : "4096x2048 JPEG, 2:1 equirectangular placeholder",
      provider: isTrue ? "gpt-image2" : "procedural",
      priority: isTrue ? "P0" : "P1",
      status: "ready",
      promptDoc: isTrue ? "docs/handoff/IMAGE_ASSETS_2026-10-24.json" : "docs/prompts/04_GPT-Image2_VR全景.md",
      usedBy: ["js/vr360.js"],
      note: isTrue ? "2026-10-24 / GPT-Image2 真 2:1 全景；直接生成球面环境并修补接缝，1774×887 等比上采样至 4096×2048，非原生 4K；AI 艺术复原，非历史影像" : "由 16:9 AI 插画扩展的 2:1 全景示意，非全景摄影；可替换为 GPT-Image2 真全景"
    };
  });
  window.ASSET_MANIFEST.items = window.ASSET_MANIFEST.items.concat(panos);
})();
