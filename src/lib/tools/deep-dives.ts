import type { Locale } from "@/lib/i18n";

export interface DeepDiveSection {
  heading: string;
  paragraphs: string[];
}

/**
 * Extra written content for the busiest tool pages: practical tips, common problems and when to use a different
 * tool. Paragraphs may contain links written as [text](/tools/merge-pdf).
 */
const en: Record<string, DeepDiveSection[]> = {
  "compress-pdf": [
    { heading: "Tips for the smallest file that still looks good", paragraphs: ["Start with the Balanced level and look at the size shown after compression. If it is not small enough, compress the original again at the Strong level rather than compressing the result twice, because every extra pass adds blur. Zoom in on small print, stamps and signatures before you send the file.", "Scanned documents shrink the most. A mostly-text PDF is already small and may not shrink at all, in which case the tool keeps your original."] },
    { heading: "When a file will not get under a limit", paragraphs: ["Remove pages you do not need with [Remove Pages from PDF](/tools/remove-pages-from-pdf), or cut the file into parts with [Split PDF](/tools/split-pdf). For strict limits such as 100 KB or 200 KB, read our guide to [compressing a PDF to 100 KB, 200 KB, 500 KB or 1 MB](/guides/compress-pdf-to-100kb-200kb-500kb-1mb)."] },
  ],
  "merge-pdf": [
    { heading: "Tips for a tidy merged document", paragraphs: ["Name your files so they sort in the order you want, add them all at once, then fix the order with the arrows before merging. Pages are copied without re-compression, so quality stays the same, but the merged file is as large as all the originals combined.", "If the result is too large to email, run it through [Compress PDF](/tools/compress-pdf) afterwards, not before."] },
    { heading: "Common problems", paragraphs: ["A file that is refused is usually password-protected. Unlock it first with [Unlock PDF](/tools/unlock-pdf). If a page ends up sideways or in the wrong place, fix it with [Organize PDF](/tools/organize-pdf) instead of merging again. See the full walkthrough in our guide on [merging PDF files](/guides/how-to-merge-pdf-files)."] },
  ],
  "pdf-to-excel": [
    { heading: "Getting clean columns", paragraphs: ["The tool finds columns from the gaps between values on each page, so PDFs created by Excel, accounting software and banks convert best. Check that the totals in your spreadsheet match the totals printed in the PDF before you rely on the data.", "Amounts such as 1,250.500, 15% and (300.00) are turned into real numbers so sums and sorting work. Codes with leading zeros are kept as text so the zeros are not lost."] },
    { heading: "Scans and statements", paragraphs: ["A scanned PDF is a picture, so run it through [Image to Text (OCR)](/tools/image-to-text) first. For bank statements, [Bank Statement Converter](/tools/bank-statement-converter) rebuilds one row per transaction and checks the running balance. More help is in our guide on [converting PDF to Excel](/guides/how-to-convert-pdf-to-excel)."] },
  ],
  "pdf-to-word": [
    { heading: "What converts well and what needs a check", paragraphs: ["Headings, paragraphs, bold and italic text and Arabic right-to-left lines are rebuilt as real Word content. Tables, multi-column layouts and pictures inside text pages are not rebuilt, so check those in Word after converting.", "A scanned PDF has no text to convert. Use [Image to Text (OCR)](/tools/image-to-text) to get editable text from scans."] },
    { heading: "Other ways to get the words out", paragraphs: ["If you only need the text, [PDF to Text](/tools/pdf-to-text) is faster and has no formatting problems. Our guide on [converting PDF to Word and keeping the formatting](/guides/how-to-convert-pdf-to-word-keep-formatting) explains what to expect."] },
  ],
  "image-to-text": [
    { heading: "Photos that give accurate text", paragraphs: ["Hold the camera straight above the page, use even light without glare, and make sure the text is sharp. Crop away borders and pictures with [Crop Image](/tools/crop-image), and choose the right language: the wrong one produces gibberish. Mixed Arabic and English text works when you select both languages.", "Always proofread numbers, names and dates, which are the most important and the easiest to misread."] },
    { heading: "Formats and next steps", paragraphs: ["You can copy the text, download it as a .txt or Word file, or make a searchable PDF that keeps the original page image. For PDFs that already contain text, [PDF to Text](/tools/pdf-to-text) is instant and exact. Read more in our guide to [extracting text from an image with OCR](/guides/how-to-extract-text-from-an-image-ocr)."] },
  ],
  "bank-statement-converter": [
    { heading: "Choosing automatic or manual conversion", paragraphs: ["Automatic conversion handles most statements: it joins descriptions that wrap over several lines, removes repeated headers and footers, and turns amounts into real numbers. Switch to Manual Selection when a layout is unusual, for example tables without lines or notes between rows. You draw a box around each table and label the columns, and only what is inside your boxes is converted.", "Scanned statements are read with OCR in your browser, so check amounts carefully."] },
    { heading: "Check before you use the numbers", paragraphs: ["The balance check recalculates the running balance and flags any row that does not match the printed one. Confirm the date format with a date you know, because day-first and month-first dates look alike early in the month. Our guide on [converting a bank statement PDF to Excel](/guides/convert-bank-statement-pdf-to-excel) walks through the whole job."] },
  ],
  "cheque-printer": [
    { heading: "Getting the alignment right", paragraphs: ["Always do a test print on plain paper first, hold it over a real cheque leaf against a light, and adjust positions in millimetres. In the print dialog choose 100% scale (actual size) and no margins, otherwise everything shifts. Save the layout so the next cheque needs no adjustment.", "The tool fills in cheque leaves your bank gave you. It does not print blank cheques, which banks do not accept."] },
    { heading: "Amount in words and safety", paragraphs: ["The amount in words is written for you in Arabic or English, with the right forms for three-decimal Gulf currencies. Use a crossing such as A/C Payee Only and asterisks around the figures to prevent changes. Learn the rules in our guide on [writing the amount in words on a cheque](/guides/how-to-write-cheque-amount-in-words), or try [Amount in Words](/tools/amount-in-words) on its own."] },
  ],
  "amount-in-words": [
    { heading: "Using the result on cheques and invoices", paragraphs: ["Copy the wording exactly and read it once before you sign, because some banks prefer their own phrasing. Put the figures next to the currency symbol and fill the rest of the line so nothing can be added. Currencies with three decimals, such as the Omani rial and Kuwaiti dinar, use a thousandth subunit, so the third digit matters.", "Our guide on [writing the amount in words on a cheque](/guides/how-to-write-cheque-amount-in-words) explains the conventions step by step."] },
    { heading: "Arabic grammar handled for you", paragraphs: ["Arabic changes the currency word with the number: one, two, three to ten, eleven to ninety-nine, and round hundreds each use a different form. Subunits such as بيسة and هللة are feminine. The tool applies these rules automatically. To print the result on a cheque, use [Cheque Printer](/tools/cheque-printer)."] },
  ],
  "compress-image": [
    { heading: "Hitting an exact size such as 100 KB", paragraphs: ["Type a target size and the tool finds the highest quality that fits, reducing the dimensions only if it must. For the best results resize the picture to the pixels you need first with [Resize Image](/tools/resize-image), then compress. JPG and WebP suit photographs; PNG is lossless and rarely shrinks enough.", "Compressed images are saved without hidden data such as GPS location and camera details, which is useful before posting photos publicly."] },
    { heading: "Common problems", paragraphs: ["If the face or text looks smeared at a very small size, raise the target a little or reduce the dimensions. For portals with strict limits, follow our guide on [compressing an image to 100 KB, 50 KB or 20 KB](/guides/how-to-compress-an-image-to-100kb)."] },
  ],
  "split-pdf": [
    { heading: "Writing page ranges", paragraphs: ["Separate items with commas. 2-4 means pages 2 to 4, 7 means page 7, and 8- means page 8 to the end. Each comma-separated item becomes its own file. To combine pages from different places into one document, split them out and join them with [Merge PDF](/tools/merge-pdf).", "If you only want to delete pages, [Remove Pages from PDF](/tools/remove-pages-from-pdf) is quicker."] },
    { heading: "When to split", paragraphs: ["Common reasons are upload size limits, sending only the relevant part of a confidential document, and separating a batch of scans. Read our guide on [splitting a PDF and extracting pages](/guides/how-to-split-a-pdf-and-extract-pages) for examples."] },
  ],
  "remove-background": [
    { heading: "Getting a clean cut-out", paragraphs: ["Photos with a clear subject, even light and a background that differs in colour work best. Fine hair, fur and see-through objects such as glass are harder, so use a high-resolution photo and zoom in to check the edges. Crop tightly with [Crop Image](/tools/crop-image) before removing the background.", "The first use downloads the AI model once, and then it runs on your device with no limits or watermarks."] },
    { heading: "After the cut-out", paragraphs: ["Download a transparent PNG, or add a solid colour such as white and save as JPG for forms. Resize it for your marketplace or profile with [Resize Image](/tools/resize-image). Our guide on [removing a background from a photo](/guides/how-to-remove-background-from-a-photo) covers the details."] },
  ],
  "jpg-to-pdf": [
    { heading: "Building a neat PDF from photos", paragraphs: ["Add the images, put them in order and choose A4 or Letter with a small margin for printing, or keep each page the size of its picture. JPG photos are placed as they are, so quality is not reduced. Straight, cropped photos look best, so crop edges with [Crop Image](/tools/crop-image) first.", "Many photos make a big PDF. Compress it afterwards with [Compress PDF](/tools/compress-pdf)."] },
    { heading: "iPhone photos", paragraphs: ["Safari reads HEIC photos from an iPhone; other browsers may not. Convert them to JPG with [Image Converter](/tools/image-converter) or set the camera to Most Compatible. See our guide on [converting JPG to PDF](/guides/how-to-convert-jpg-to-pdf)."] },
  ],
  "sign-pdf": [
    { heading: "Making your signature look right", paragraphs: ["Draw it slowly, type your name in a handwriting style, or upload a photo of your real signature signed in dark ink on white paper and cropped tightly. Place it on the line, resize it, and add initials or the date on the other pages that need them.", "An image signature is accepted for many everyday documents. Some contracts and official filings need a certificate-based digital signature, so ask the recipient what they accept."] },
    { heading: "Before you send it", paragraphs: ["Fill in other fields with [Edit PDF](/tools/edit-pdf), and lock the file with a password using [Protect PDF](/tools/protect-pdf) if it is confidential. Our guide on [signing a PDF online](/guides/how-to-sign-a-pdf-online-for-free) has the full steps."] },
  ],
};

const ar: Record<string, DeepDiveSection[]> = {
  "compress-pdf": [
    { heading: "نصائح لأصغر ملف بوضوح جيد", paragraphs: ["ابدأ بالمستوى المتوازن وانظر إلى الحجم الظاهر بعد الضغط. وإن لم يكفِ فاضغط الملف الأصلي مجددًا بالمستوى القوي بدل ضغط الناتج مرتين، فكل مرة إضافية تزيد التشويش. كبّر الخطوط الصغيرة والأختام والتوقيعات قبل إرسال الملف.", "تنقص المستندات الممسوحة ضوئيًا أكثر من غيرها، أما ملف PDF النصي فهو صغير أصلًا وقد لا ينقص إطلاقًا، وفي هذه الحالة تُبقي الأداة ملفك الأصلي."] },
    { heading: "إن لم ينزل الملف تحت الحد المطلوب", paragraphs: ["احذف الصفحات غير اللازمة بأداة [حذف صفحات من PDF](/tools/remove-pages-from-pdf)، أو قسّم الملف إلى أجزاء بأداة [تقسيم PDF](/tools/split-pdf). واقرأ دليلنا [ضغط ملف PDF وتقليل حجمه](/guides/dght-pdf) للمزيد."] },
  ],
  "merge-pdf": [
    { heading: "نصائح لمستند مدموج مرتب", paragraphs: ["سمِّ ملفاتك بأسماء تتبع الترتيب المطلوب، وأضفها كلها دفعة واحدة، ثم اضبط الترتيب بالأسهم قبل الدمج. تُنسخ الصفحات دون إعادة ضغط فتبقى الجودة كما هي، لكن حجم الملف الناتج يساوي مجموع الملفات الأصلية.", "وإن كان الناتج كبيرًا للإرسال بالبريد فاضغطه بعد الدمج بأداة [ضغط PDF](/tools/compress-pdf) لا قبله."] },
    { heading: "مشكلات شائعة", paragraphs: ["الملف المرفوض غالبًا محمي بكلمة مرور، فافتح حمايته أولًا بأداة [فك حماية PDF](/tools/unlock-pdf). وإن ظهرت صفحة مقلوبة أو في غير مكانها فعدّلها بأداة [تنظيم PDF](/tools/organize-pdf) بدل إعادة الدمج. والشرح الكامل في دليلنا [دمج ملفات PDF في ملف واحد](/guides/dmj-pdf)."] },
  ],
  "pdf-to-word": [
    { heading: "ما الذي يُحوَّل جيدًا وما الذي يحتاج مراجعة", paragraphs: ["تُعاد بناء العناوين والفقرات والخط العريض والمائل والأسطر العربية من اليمين إلى اليسار كمحتوى Word حقيقي. أما الجداول والأعمدة المتعددة والصور داخل صفحات النص فلا تُعاد، فراجعها في Word بعد التحويل.", "الملف الممسوح ضوئيًا لا نص فيه ليُحوَّل. استخدم [تحويل الصورة إلى نص (OCR)](/tools/image-to-text) للحصول على نص قابل للتعديل."] },
    { heading: "طرق أخرى لاستخراج الكلمات", paragraphs: ["إن كنت تحتاج النص فقط فأداة [PDF إلى نص](/tools/pdf-to-text) أسرع ولا مشكلات تنسيق فيها. ودليلنا [تحويل PDF إلى Word مع الحفاظ على التنسيق](/guides/pdf-to-word-arabic) يشرح ما تتوقعه."] },
  ],
  "image-to-text": [
    { heading: "صور تعطي نصًا دقيقًا", paragraphs: ["أمسك الكاميرا مستقيمة فوق الصفحة، واستخدم إضاءة متساوية بلا انعكاس، وتأكد من وضوح النص. وقصّ الحواف والصور بأداة [قص الصور](/tools/crop-image)، واختر اللغة الصحيحة فاللغة الخاطئة تعطي نصًا بلا معنى. ويعمل النص العربي والإنجليزي المختلط عند اختيار اللغتين معًا.", "راجع دائمًا الأرقام والأسماء والتواريخ فهي الأهم والأسهل خطأً في القراءة."] },
    { heading: "الصيغ والخطوات التالية", paragraphs: ["يمكنك نسخ النص أو تنزيله بصيغة txt أو Word، أو إنشاء PDF قابل للبحث يحتفظ بصورة الصفحة الأصلية. وإن كان ملف PDF يحوي نصًا أصلًا فأداة [PDF إلى نص](/tools/pdf-to-text) فورية ودقيقة. وللمزيد اقرأ دليلنا [استخراج النص من PDF](/guides/extract-text-from-pdf-arabic)."] },
  ],
  "bank-statement-converter": [
    { heading: "التحويل التلقائي أم اليدوي؟", paragraphs: ["يعالج التحويل التلقائي معظم الكشوف: يدمج الأوصاف الممتدة على عدة أسطر، ويزيل الترويسات والتذييلات المتكررة، ويحوّل المبالغ إلى أرقام حقيقية. وانتقل إلى «التحديد اليدوي» حين يكون التخطيط غير معتاد، كجداول بلا خطوط أو ملاحظات بين الصفوف: ترسم مربعًا حول كل جدول وتسمي الأعمدة فيُحوَّل ما داخل المربعات فقط.", "الكشوف الممسوحة تُقرأ بتقنية OCR في متصفحك، فراجع المبالغ بعناية."] },
    { heading: "تحقق قبل أن تعتمد الأرقام", paragraphs: ["يعيد فحص الرصيد حساب الرصيد الجاري ويعلّم أي صف لا يطابق المطبوع. وتأكد من صيغة التاريخ بتاريخ تعرفه لأن صيغتي اليوم أولًا والشهر أولًا تتشابهان في أوائل الشهر. ودليلنا [تحويل كشف الحساب البنكي من PDF إلى Excel](/guides/bank-statement-pdf-to-excel-arabic) يشرح العمل كله."] },
  ],
  "amount-in-words": [
    { heading: "استخدام الناتج في الشيكات والفواتير", paragraphs: ["انسخ الصياغة كما هي واقرأها مرة قبل التوقيع، فبعض البنوك تفضّل صياغتها الخاصة. اكتب الأرقام بجانب رمز العملة واملأ بقية السطر حتى لا يمكن الإضافة. والعملات ذات الخانات الثلاث، كالريال العماني والدينار الكويتي، وحدتها الصغرى جزء من ألف، فالخانة الثالثة مهمة.", "ويشرح دليلنا [كتابة المبلغ بالحروف في الشيك](/guides/amount-in-words-cheque-arabic) القواعد خطوة بخطوة."] },
    { heading: "قواعد العربية تُطبَّق عنك", paragraphs: ["تتغير كلمة العملة في العربية بحسب العدد: الواحد والاثنان والثلاثة إلى العشرة والأحد عشر إلى التسعة والتسعين والمئات المستديرة، لكل منها صيغة. والوحدات الصغرى كالبيسة والهللة مؤنثة. وتطبق الأداة هذه القواعد تلقائيًا. ولطباعة الناتج على الشيك استخدم [طباعة الشيكات](/tools/cheque-printer)."] },
  ],
};

export function deepDiveFor(toolId: string, locale: Locale): DeepDiveSection[] | undefined {
  return (locale === "ar" ? ar : en)[toolId];
}

/** Every tool that has extra content in English. */
export const deepDiveToolIds = Object.keys(en);
