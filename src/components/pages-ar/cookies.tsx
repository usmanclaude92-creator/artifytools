import { AnalyticsChoice } from "@/components/layout/google-analytics";
import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";

export const cookiesMetaAr = {
  title: "سياسة ملفات تعريف الارتباط",
  description: "ما يخزنه Artify Tools في متصفحك: تفضيل المظهر، وملفات Google Analytics فقط إذا وافقت.",
};

export function CookiesAr() {
  return (
    <>
      <PageHeader title="سياسة ملفات تعريف الارتباط" description="آخر تحديث: 29 أكتوبر 2026." breadcrumbs={[{ name: "الرئيسية", href: "/" }, { name: "ملفات تعريف الارتباط" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          <h2 className="!mt-0">لا ملفات تعريف ارتباط إلا بموافقتك</h2>
          <p>لا يضع Artify Tools ملفات تعريف ارتباط قبل موافقتك. نحصي زيارات الصفحات باستخدام Vercel Web Analytics الذي يعمل دون ملفات تعريف الارتباط، وإذا وافقت فباستخدام Google Analytics الذي يضع ملفات تعريف ارتباط. لا نحمّل إعلانات ولا نصوص تتبع عبر المواقع؛ راجع <Link href="/privacy">سياسة الخصوصية</Link> لمعرفة ما يُسجَّل.</p>
          <AnalyticsChoice labels={{ unset: "لم تختر بعد. Google Analytics متوقف.", on: "Google Analytics يعمل.", off: "Google Analytics متوقف.", accept: "موافق", decline: "رفض" }} />

          <h2>ملفات Google Analytics</h2>
          <ul>
            <li><code>_ga</code> و<code>_ga_G-3ENMEZHTYZ</code> — يضعها Google Analytics بعد موافقتك فقط. تميّز الزيارات لنحصيها، وتدوم حتى سنتين.</li>
          </ul>
          <p>نعطّل ميزات الإعلانات لدى Google ونحذف معاملات الاستعلام من عنوان الصفحة قبل إرساله. اختر «رفض» أعلاه (أو امسح بيانات الموقع) لإيقافه في أي وقت.</p>

          <h2>ما نحفظه في متصفحك</h2>
          <p>الشيء الوحيد المحفوظ هو تفضيلك لمظهر الألوان، إذا اخترت واحداً:</p>
          <ul>
            <li><code>artify-theme</code> (التخزين المحلي) — يحفظ القيمة «light» أو «dark». يبقى على جهازك ولا يُرسل إلينا أبداً.</li>
          </ul>
          <p>يمكنك حذفه في أي وقت من إعدادات بيانات المواقع في متصفحك.</p>

          <h2>الأطراف الثالثة</h2>
          <p>تُقدَّم الخطوط من نطاقنا الخاص، ولا يتضمن الموقع أي أدوات مدمجة من جهات خارجية. ترسل أدوات الذكاء الاصطناعي النص الذي تقدّمه إلى مزوّد ذكاء اصطناعي فقط عند ضغطك على الزر؛ راجع <Link href="/privacy">سياسة الخصوصية</Link>.</p>

          <h2>إذا تغيّر ذلك</h2>
          <p>إذا أضفنا ملفات تعريف ارتباط أخرى، فسنحدّث هذه الصفحة أولاً ونطلب موافقتك حيث يشترط القانون ذلك.</p>
        </div>
      </div>
    </>
  );
}
