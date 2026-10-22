import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { Icon, type IconName } from "@/components/ui/icon";
import { getActiveTools, getPublishedCategories } from "@/lib/tools/registry";
import { arCount } from "@/lib/messages";

export const aboutMetaAr = {
  title: "من نحن",
  description: "Artify Tools مجموعة من الأدوات الإلكترونية المفيدة المصممة بعناية. تعرّف على ما نبنيه والمبادئ التي نعمل بها.",
};

const principles: { icon: IconName; title: string; text: string }[] = [
  { icon: "zap", title: "البساطة أولاً", text: "على الأداة أن تؤدي مهمة واحدة بوضوح. نختصر الخطوات والخيارات والتشويش حتى تبدو المهمة بديهية." },
  { icon: "shield-check", title: "الخصوصية في التصميم", text: "إذا أمكن تشغيل الأداة داخل متصفحك فإنها تعمل فيه. وإذا لم يمكن، نخبرك بدقة إلى أين تذهب بياناتك." },
  { icon: "circle-check", title: "الدقة والعناية", text: "تستخدم الحاسبات حساباً عشرياً دقيقاً، وتشرح أدوات التحليل أخطاءها، ونختبر الحالات الاستثنائية بدلاً من الاكتفاء بالأمل." },
  { icon: "laptop", title: "متاحة للجميع", text: "سهلة الاستخدام بلوحة المفاتيح، ومتوافقة مع قارئات الشاشة، وواضحة بأي حجم، وتحترم إعدادات تقليل الحركة." },
];

export function AboutAr() {
  const active = getActiveTools().length;
  const cats = getPublishedCategories().length;
  return (
    <>
      <PageHeader
        eyebrow="من نحن"
        title="أدوات قوية. ببساطة أنيقة."
        description="Artify Tools وجهة واحدة مرتبة للمهام الرقمية الصغيرة التي تقاطع يومك: العدّ والتحويل والحساب والتنسيق والتوليد."
        breadcrumbs={[{ name: "الرئيسية", href: "/" }, { name: "من نحن" }]}
      />
      <div className="container-page space-y-16 py-10">
        <section className="prose-artify" aria-labelledby="mission">
          <h2 id="mission" className="!mt-0">ما الذي نبنيه</h2>
          <p>
            معظم الأدوات الإلكترونية مزدحمة أو بطيئة أو غامضة بشأن ما تفعله بمدخلاتك. نؤمن بأن الأدوات اليومية تستحق العناية التي تحظى بها المنتجات الكبيرة: واجهة واضحة، ونتائج صحيحة، وخصوصية صادقة.
          </p>
          <p>
            يقدّم Artify اليوم <strong>{arCount(active, "أداة عاملة واحدة", "أداتين عاملتين", "أدوات عاملة", "أداة عاملة")}</strong> ضمن <strong>{arCount(cats, "فئة واحدة", "فئتين", "فئات", "فئة")}</strong>، مع خطط لأدوات الصور والمستندات والأعمال المدعومة بالذكاء الاصطناعي. لا نضيف أداة إلا إذا كانت تعمل فعلاً، ونضع وسم «تجريبية» على أي ميزة قيد التجربة.
          </p>
        </section>

        <section aria-labelledby="principles-heading">
          <h2 id="principles-heading" className="text-2xl font-semibold">مبادئنا</h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2">
            {principles.map((p) => (
              <li key={p.title} className="card p-6">
                <Icon name={p.icon} size={26} className="text-accent-text" />
                <h3 className="mt-4 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-muted">{p.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="prose-artify" aria-labelledby="next-heading">
          <h2 id="next-heading" className="!mt-0">إلى أين نتجه</h2>
          <p>
            التالي في خطتنا: أدوات الصور (تغيير الحجم والضغط والتحويل)، وأدوات PDF (الدمج والتقسيم واستخراج الصفحات)، والمزيد من أدوات المطورين، والأدوات المدعومة بالذكاء الاصطناعي. هذه خطط وليست وعوداً بمواعيد محددة؛ ويمكنك متابعة التقدم في <Link href="/changelog">سجل التغييرات</Link>.
          </p>
          <p>
            لديك اقتراح أو وجدت مشكلة؟ <Link href="/contact">تواصل معنا</Link>.
          </p>
        </section>
      </div>
    </>
  );
}
