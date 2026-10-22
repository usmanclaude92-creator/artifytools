import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { Faq } from "@/components/tools/tool-sections";
import { JsonLd } from "@/components/ui/json-ld";

export const helpMetaAr = {
  title: "المساعدة",
  description: "إجابات عن الأسئلة الشائعة حول استخدام Artify Tools: العثور على الأدوات، والخصوصية، واختصارات لوحة المفاتيح، والمتصفحات المدعومة، وحل المشكلات.",
};

const faqs = [
  { question: "كيف أجد الأداة المناسبة؟", answer: "استخدم مربع البحث في الصفحة الرئيسية، أو اضغط Ctrl+K (أو Cmd+K على Mac) أو «/» في أي مكان من الموقع لفتح البحث. ويمكنك أيضاً التصفح حسب الفئة أو استخدام عوامل التصفية في صفحة جميع الأدوات." },
  { question: "هل تُرفع ملفاتي ونصوصي إلى الخادم؟", answer: "تعالج معظم أدوات Artify مدخلاتك بالكامل داخل متصفحك، ولا يُرفع أي شيء. وفي كل صفحة أداة قسم للخصوصية يوضح مكان المعالجة. أما أدوات الذكاء الاصطناعي فمختلفة: فهي ترسل نصك إلى مزوّد ذكاء اصطناعي، وتخبرك بذلك قبل استخدامها." },
  { question: "ما المتصفحات المدعومة؟", answer: "الإصدارات الحالية من Chrome وEdge وFirefox وSafari. تعتمد الأدوات على ميزات قياسية في المتصفح مثل Web Crypto API، وقد لا تتوفر في المتصفحات القديمة." },
  { question: "زر النسخ لا يعمل. ماذا أفعل؟", answer: "يحتاج النسخ إلى صفحة آمنة (https)، وفي بعض المتصفحات إلى إذن للوصول إلى الحافظة. إذا فشل، حدّد النص في مربع النتيجة وانسخه يدوياً." },
  { question: "هل تحفظون نتائجي؟", answer: "لا. النتائج موجودة فقط في الصفحة التي تعرضها. إذا حدّثت الصفحة أو أغلقت التبويب فستختفي، لذا انسخ أو نزّل كل ما تحتاج إلى الاحتفاظ به." },
  { question: "لماذا تختلف نتائج الحاسبة عن جدول البيانات لديّ؟", answer: "تستخدم حاسباتنا حساباً عشرياً دقيقاً، وتقرّب النصف بعيداً عن الصفر إلى منزلتين عشريتين. أما جداول البيانات فتستخدم الفاصلة العائمة الثنائية وقد تقرّب بشكل مختلف في الخانة الأخيرة." },
  { question: "هل يعمل Artify دون اتصال بالإنترنت؟", answer: "ليس بعد. بعد تحميل صفحة الأداة، تستمر الأدوات التي تعمل في المتصفح بالعمل إذا انقطع الاتصال، لكنك تحتاج إلى اتصال لفتح صفحات جديدة." },
  { question: "كيف أبلّغ عن خلل أو أطلب أداة؟", answer: "راجع صفحة «اتصل بنا» لمعرفة طريقة التواصل، واذكر اسم الأداة ومتصفحك وما حدث." },
];

const kbd = "rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-xs";

export function HelpAr() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: "ar",
          mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }}
      />
      <PageHeader title="المساعدة" description="إجابات سريعة عن الأسئلة الشائعة." breadcrumbs={[{ name: "الرئيسية", href: "/" }, { name: "المساعدة" }]} />
      <div className="container-page grid gap-12 py-10 lg:grid-cols-[1fr_20rem]">
        <div className="max-w-3xl">
          <Faq faqs={faqs} title="الأسئلة الشائعة" />
        </div>
        <aside aria-labelledby="shortcuts-heading" className="card h-fit p-6">
          <h2 id="shortcuts-heading" className="text-lg font-semibold">اختصارات لوحة المفاتيح</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt>فتح البحث</dt>
              <dd><kbd dir="ltr" className={kbd}>Ctrl/⌘ K</kbd> أو <kbd className={kbd}>/</kbd></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>التنقل بين النتائج</dt>
              <dd><kbd className={kbd}>↑</kbd> <kbd className={kbd}>↓</kbd></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>فتح النتيجة</dt>
              <dd><kbd className={kbd}>Enter</kbd></dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>إغلاق البحث أو القائمة</dt>
              <dd><kbd className={kbd}>Esc</kbd></dd>
            </div>
          </dl>
          <p className="mt-5 text-sm text-muted">
            ما زلت بحاجة إلى مساعدة؟ <Link href="/contact" className="text-accent-text underline underline-offset-4">تواصل معنا</Link>.
          </p>
        </aside>
      </div>
    </>
  );
}
