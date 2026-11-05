import type { Status } from "@/lib/planner/model";
import type { TemplateId } from "@/lib/planner/model";

export interface PlannerStrings {
  views: { down: string; right: string; radial: string; outline: string };
  viewLabel: string; undo: string; redo: string; zoomIn: string; zoomOut: string; fit: string; expandAll: string; collapseAll: string;
  share: string; shareDone: string; shareLong: string; shareCopyFailed: string; shareField: string; exportTitle: string; png: string; svg: string; pdf: string; json: string; exporting: string; exportFailed: string;
  readOnlyTitle: string; readOnlyText: string; makeCopy: string; mapsTitle: string; mapName: string; newFrom: string; create: string; templates: Record<TemplateId, string>; open: string; del: string; dup: string; imp: string; importError: string;
  outlineTitle: string; outlineHelp: string; outlineBuild: string; outlineError: string; savedOk: string;
  structure: string; levels: string; levelsHelp: string; levelName: string; levelColor: string; addLevel: string; removeLevel: string; levelBoxes: (n: number) => string; levelEmpty: string; levelKeep: string;
  tags: string; tagsHelp: string; tagName: string; addTag: string; removeTag: string; newTag: string;
  details: string; pick: string; title: string; note: string; status: string; due: string; tagsOf: string; level: string; statuses: Record<Status, string>;
  addChild: string; addSibling: string; earlier: string; later: string; remove: string; removeBranch: (n: number) => string; confirmRemove: string; cancel: string; untitled: string; newBox: string; childrenCount: (n: number) => string;
  expand: string; collapse: string; mapLabel: string; emptyHint: string;
  names: { blank: string; project: string; company: string; process: string; root: Record<TemplateId, string>; levels: Record<TemplateId, string[]> };
  defaultName: string;
}

export const strings: Record<"en" | "ar", PlannerStrings> = {
  en: {
    views: { down: "Top-down", right: "Left-to-right", radial: "Radial", outline: "Outline" },
    viewLabel: "Layout", undo: "Undo", redo: "Redo", zoomIn: "Zoom in", zoomOut: "Zoom out", fit: "Fit to screen", expandAll: "Expand all", collapseAll: "Collapse all",
    share: "Copy read-only link", shareDone: "Link copied. Anyone with it can view this plan but not change it.", shareLong: "This link is long. If it doesn't open in some apps, share the JSON file instead.", shareCopyFailed: "Copy it from the box below.", shareField: "Read-only link",
    exportTitle: "Export", png: "PNG image", svg: "SVG image", pdf: "PDF", json: "Plan file (JSON)", exporting: "Preparing…", exportFailed: "The export failed.",
    readOnlyTitle: "Read-only view", readOnlyText: "You are viewing a shared plan. You can open and close branches and read details, but not change it.", makeCopy: "Make an editable copy",
    mapsTitle: "Your plans", mapName: "Plan name", newFrom: "Start a new plan from", create: "Create", templates: { blank: "Blank", project: "Project plan", company: "Company structure", process: "Process map" },
    open: "Open", del: "Delete plan", dup: "Duplicate", imp: "Open a plan file", importError: "That file isn't a valid plan.",
    outlineTitle: "Build from an outline", outlineHelp: "Type or paste one box per line. Indent a line (two spaces or a tab) to make it a child of the line above.", outlineBuild: "Build plan", outlineError: "Add at least one line.", savedOk: "Saved in this browser.",
    structure: "Levels and tags", levels: "Levels", levelsHelp: "Each level has a name and a colour. A box's level is how deep it sits in the plan.", levelName: "Level name", levelColor: "Level colour", addLevel: "Add level", removeLevel: "Remove last level", levelBoxes: (n) => `${n} box${n === 1 ? "" : "es"}`, levelEmpty: "No boxes yet", levelKeep: "Last level (in use)",
    tags: "Tags", tagsHelp: "Make your own labels, such as Owner, Priority or Team, and attach them to any box.", tagName: "Tag name", addTag: "Add tag", removeTag: "Delete tag", newTag: "New tag",
    details: "Box details", pick: "Select a box to see and edit its details.", title: "Title", note: "Notes", status: "Status", due: "Due date", tagsOf: "Tags", level: "Level",
    statuses: { none: "No status", todo: "To do", doing: "In progress", done: "Done", blocked: "Blocked" },
    addChild: "Add child", addSibling: "Add sibling", earlier: "Move earlier", later: "Move later", remove: "Delete", removeBranch: (n) => `Delete this box and ${n} inside it`, confirmRemove: "Yes, delete", cancel: "Cancel", untitled: "Untitled", newBox: "New box", childrenCount: (n) => `${n} inside`,
    expand: "Expand", collapse: "Collapse", mapLabel: "Plan map", emptyHint: "Select a box, then use Add child to grow the plan.",
    names: {
      blank: "Blank plan", project: "Project plan", company: "Company structure", process: "Process map",
      root: { blank: "My plan", project: "Launch the product", company: "My company", process: "Order to delivery" },
      levels: { blank: ["Level 1", "Level 2"], project: ["Goal", "Phase", "Task"], company: ["Company", "Department", "Team"], process: ["Process", "Stage", "Step"] },
    },
    defaultName: "My plan",
  },
  ar: {
    views: { down: "من الأعلى للأسفل", right: "من اليسار لليمين", radial: "دائري", outline: "قائمة" },
    viewLabel: "التخطيط", undo: "تراجع", redo: "إعادة", zoomIn: "تكبير", zoomOut: "تصغير", fit: "ملاءمة الشاشة", expandAll: "توسيع الكل", collapseAll: "طي الكل",
    share: "نسخ رابط للقراءة فقط", shareDone: "تم نسخ الرابط. يمكن لأي شخص لديه الرابط عرض الخطة دون تعديلها.", shareLong: "هذا الرابط طويل. إن لم يُفتح في بعض التطبيقات فشارك ملف JSON بدلًا منه.", shareCopyFailed: "انسخه من الحقل أدناه.", shareField: "رابط للقراءة فقط",
    exportTitle: "تصدير", png: "صورة PNG", svg: "صورة SVG", pdf: "PDF", json: "ملف الخطة (JSON)", exporting: "جارٍ التجهيز…", exportFailed: "فشل التصدير.",
    readOnlyTitle: "عرض للقراءة فقط", readOnlyText: "أنت تشاهد خطة مشاركة. يمكنك فتح الفروع وإغلاقها وقراءة التفاصيل دون تعديلها.", makeCopy: "إنشاء نسخة قابلة للتعديل",
    mapsTitle: "خططك", mapName: "اسم الخطة", newFrom: "ابدأ خطة جديدة من", create: "إنشاء", templates: { blank: "فارغة", project: "خطة مشروع", company: "هيكل شركة", process: "خريطة عملية" },
    open: "فتح", del: "حذف الخطة", dup: "تكرار", imp: "فتح ملف خطة", importError: "هذا الملف ليس خطة صالحة.",
    outlineTitle: "بناء من قائمة", outlineHelp: "اكتب أو الصق مربعًا في كل سطر. أزح السطر (مسافتان أو Tab) ليصبح فرعًا للسطر الذي فوقه.", outlineBuild: "بناء الخطة", outlineError: "أضف سطرًا واحدًا على الأقل.", savedOk: "حُفظت في هذا المتصفح.",
    structure: "المستويات والوسوم", levels: "المستويات", levelsHelp: "لكل مستوى اسم ولون. مستوى المربع هو عمقه في الخطة.", levelName: "اسم المستوى", levelColor: "لون المستوى", addLevel: "إضافة مستوى", removeLevel: "حذف آخر مستوى", levelBoxes: (n) => `${n} مربع`, levelEmpty: "لا مربعات بعد", levelKeep: "آخر مستوى (قيد الاستخدام)",
    tags: "الوسوم", tagsHelp: "أنشئ وسومك الخاصة مثل المسؤول أو الأولوية أو الفريق، وأرفقها بأي مربع.", tagName: "اسم الوسم", addTag: "إضافة وسم", removeTag: "حذف الوسم", newTag: "وسم جديد",
    details: "تفاصيل المربع", pick: "اختر مربعًا لعرض تفاصيله وتعديلها.", title: "العنوان", note: "ملاحظات", status: "الحالة", due: "تاريخ الاستحقاق", tagsOf: "الوسوم", level: "المستوى",
    statuses: { none: "بلا حالة", todo: "للتنفيذ", doing: "قيد التنفيذ", done: "منجز", blocked: "متعثر" },
    addChild: "إضافة فرع", addSibling: "إضافة مربع مجاور", earlier: "تقديم", later: "تأخير", remove: "حذف", removeBranch: (n) => `حذف هذا المربع و${n} بداخله`, confirmRemove: "نعم، احذف", cancel: "إلغاء", untitled: "بلا عنوان", newBox: "مربع جديد", childrenCount: (n) => `${n} بداخله`,
    expand: "توسيع", collapse: "طي", mapLabel: "خريطة الخطة", emptyHint: "اختر مربعًا ثم استخدم «إضافة فرع» لتوسيع الخطة.",
    names: {
      blank: "خطة فارغة", project: "خطة مشروع", company: "هيكل شركة", process: "خريطة عملية",
      root: { blank: "خطتي", project: "إطلاق المنتج", company: "شركتي", process: "من الطلب إلى التسليم" },
      levels: { blank: ["المستوى 1", "المستوى 2"], project: ["الهدف", "المرحلة", "المهمة"], company: ["الشركة", "القسم", "الفريق"], process: ["العملية", "المرحلة", "الخطوة"] },
    },
    defaultName: "خطتي",
  },
};
