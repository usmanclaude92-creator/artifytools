import Link from "@/components/ui/locale-link";
import { PageHeader } from "@/components/layout/page-header";
import { buttonClasses } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/feedback";
import { siteConfig } from "@/lib/config";

export const contactMetaAr = {
  title: "اتصل بنا",
  description: "طرق التواصل مع فريق Artify Tools لإرسال الملاحظات أو الإبلاغ عن الأخطاء أو اقتراح أدوات جديدة.",
};

export function ContactAr() {
  const email = siteConfig.contactEmail;
  return (
    <>
      <PageHeader title="اتصل بنا" description="نرحّب بملاحظاتك وبلاغات الأخطاء وأفكار الأدوات." breadcrumbs={[{ name: "الرئيسية", href: "/" }, { name: "اتصل بنا" }]} />
      <div className="container-page py-10">
        <div className="prose-artify">
          {email ? (
            <p className="!mt-0">
              راسلنا على <a href={`mailto:${email}`} dir="ltr">{email}</a>.
            </p>
          ) : (
            <StatusMessage tone="info">
              لم يُنشر عنوان تواصل عام بعد. سيظهر هنا فور إعداد صندوق بريد الدعم.
            </StatusMessage>
          )}
          <h2>ما الذي يساعدنا على مساعدتك</h2>
          <ul>
            <li><strong>بلاغ خطأ:</strong> اسم الأداة، وما أدخلته (دون بيانات حساسة)، وما توقعته، وما حدث فعلاً.</li>
            <li><strong>المتصفح والجهاز:</strong> مثل «Safari 18 على iPhone».</li>
            <li><strong>فكرة أداة:</strong> المهمة التي تحاول إنجازها، ولماذا لا تفي الخيارات الحالية بالغرض.</li>
          </ul>
          <h2>قبل أن تراسلنا</h2>
          <p>
            ستجد كثيراً من الإجابات في <Link href="/help">مركز المساعدة</Link>. يُرجى عدم إرسال كلمات المرور أو المستندات الشخصية أو أي مواد سرية عبر البريد الإلكتروني.
          </p>
        </div>
        <div className="mt-8">
          <Link href="/help" className={buttonClasses({ variant: "secondary" })}>زيارة مركز المساعدة</Link>
        </div>
      </div>
    </>
  );
}
