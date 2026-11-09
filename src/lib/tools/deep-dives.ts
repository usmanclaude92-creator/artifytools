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
  "organize-pdf": [
    { heading: "Reorder, rotate and delete in one pass", paragraphs: ["Every page appears as a thumbnail you can drag into place, rotate or delete, and you can bring in pages from other PDFs with Add More Files. Pages are copied as they are, so quality does not change. Press Reset to bring back every page in its original order before you save.", "Check the result page by page before sending it, especially after deleting pages."] },
    { heading: "Related jobs", paragraphs: ["To only take pages out, [Remove Pages from PDF](/tools/remove-pages-from-pdf) is quicker. To join whole files, use [Merge PDF](/tools/merge-pdf). Our guide on [splitting a PDF and extracting pages](/guides/how-to-split-a-pdf-and-extract-pages) shows common workflows."] },
  ],
  "rotate-pdf": [
    { heading: "Fixing sideways pages", paragraphs: ["Each page has its own rotate buttons, and there are buttons to turn all pages at once. Rotating changes only the page's orientation setting, so nothing is redrawn or compressed.", "If a scan is slightly tilted rather than sideways, use the straighten control in [Crop PDF](/tools/crop-pdf)."] },
    { heading: "Protected files", paragraphs: ["A password-protected PDF must be unlocked first with [Unlock PDF](/tools/unlock-pdf). To rotate and reorder at the same time, use [Organize PDF](/tools/organize-pdf)."] },
  ],
  "crop-pdf": [
    { heading: "Cropping margins and labels", paragraphs: ["Drag the crop box over the part you want to keep and choose whether it applies to all pages or just one. Quick crop buttons help with common cases such as the top half of a page, which is handy for shipping labels printed on A4. Turn and straighten fix sideways or crooked scans before you set the box.", "Cropping hides the outside area without redrawing the content, so quality stays the same."] },
    { heading: "Confidential content", paragraphs: ["The cropped-away area may still exist inside the file. If it is confidential, print the cropped result to a new PDF. Our guide on [cropping and rotating PDF pages](/guides/how-to-crop-and-rotate-pdf-pages) explains the steps."] },
  ],
  "edit-pdf": [
    { heading: "Correcting text in a PDF", paragraphs: ["You can cover existing text with a white-out box and type the correction on top, which works for most changes. Add text, dates, images and signatures anywhere on the page, and move or resize each item before saving. Arabic text is drawn correctly shaped and right to left.", "Retyping text inside the original paragraph flow is not possible in a PDF, so keep corrections short."] },
    { heading: "Finishing the document", paragraphs: ["Add your signature with [Sign PDF](/tools/sign-pdf), number the pages with [Add Page Numbers](/tools/add-page-numbers), and lock the file with [Protect PDF](/tools/protect-pdf) if it is confidential."] },
  ],
  "watermark-pdf": [
    { heading: "Choosing a good watermark", paragraphs: ["Use short text such as DRAFT or CONFIDENTIAL, or a transparent PNG logo. Set a diagonal angle and moderate transparency so the page stays readable. Arabic text is supported.", "A watermark is drawn on top of the page, so someone with PDF editing software could remove it. For real protection also use [Protect PDF](/tools/protect-pdf)."] },
    { heading: "Order of work", paragraphs: ["Merge and edit first, then add page numbers and the watermark. Our guide on [adding page numbers and a watermark to a PDF](/guides/how-to-add-page-numbers-and-watermark-to-a-pdf) has the details."] },
  ],
  "add-page-numbers": [
    { heading: "Numbering long documents", paragraphs: ["Choose the position, the style such as Page 1 of 12, and the starting number. Tick Don't number the first page to skip a cover. If pages have content near the edge, increase the distance from the edge so numbers do not overlap it.", "Arabic documents can use Arabic words and digits, for example «صفحة ١ من ١٢»."] },
    { heading: "Before and after", paragraphs: ["Merge your files first with [Merge PDF](/tools/merge-pdf) so numbering runs through the whole document. Add a watermark afterwards with [Watermark PDF](/tools/watermark-pdf) if needed."] },
  ],
  "protect-pdf": [
    { heading: "Choosing a password", paragraphs: ["Use a long password that is not easy to guess; the password is what keeps the file safe. The PDF is encrypted with AES-128 on your device. Send the password by a different channel from the file, and keep a record, because a forgotten password cannot be recovered.", "You can also decide whether readers may print, copy or edit. Standard PDF apps respect these settings, but they are not a guarantee against someone who can already open the file."] },
    { heading: "Related", paragraphs: ["Create a strong password with [Password Generator](/tools/password-generator), and remove protection later with [Unlock PDF](/tools/unlock-pdf). Read more in our guide on [protecting and unlocking a PDF](/guides/how-to-password-protect-and-unlock-a-pdf)."] },
  ],
  "unlock-pdf": [
    { heading: "What it can and cannot do", paragraphs: ["Enter the password you know and save a copy that opens without it, or remove printing and copying restrictions from a PDF that opens freely. Standard PDF passwords are supported, including AES-128 and AES-256 used by banks and modern apps.", "It does not guess or crack passwords. Unlock only files you own or have permission to change."] },
    { heading: "Next steps", paragraphs: ["Statements and payslips that are unlocked can be merged with [Merge PDF](/tools/merge-pdf) or converted with [Bank Statement Converter](/tools/bank-statement-converter). Learn more in our guide on [protecting and unlocking a PDF](/guides/how-to-password-protect-and-unlock-a-pdf)."] },
  ],
  "pdf-to-jpg": [
    { heading: "Choosing resolution and format", paragraphs: ["150 DPI suits screens, chats and documents. Choose 300 DPI for printing or when you need to zoom into small text, and 72 DPI for the smallest files. JPG files are much smaller and fine for most pages; PNG keeps text and lines perfectly sharp and supports transparent backgrounds but is larger.", "A password-protected PDF must be unlocked first with [Unlock PDF](/tools/unlock-pdf)."] },
    { heading: "Working with the images", paragraphs: ["Make the pictures smaller with [Compress Image](/tools/compress-image) or [Resize Image](/tools/resize-image), or put them back into a PDF with [JPG to PDF](/tools/jpg-to-pdf). If you want the words instead, use [PDF to Text](/tools/pdf-to-text)."] },
  ],
  "resize-image": [
    { heading: "Keeping the proportions", paragraphs: ["Fill in only the width or only the height and the other side is worked out from each image's proportions. When you set both, choose fit, fill and crop, borders or stretch. Making an image bigger than the original cannot add detail, so it can look soft; shrinking keeps it sharp.", "Quick sizes cover square posts, stories, Full HD, video thumbnails, banners and profile photos, and you can resize many images and download them as a ZIP."] },
    { heading: "Meeting a file size limit", paragraphs: ["Resize first, then use [Compress Image](/tools/compress-image) with a target size. See our guides on [resizing and compressing images](/guides/how-to-resize-and-compress-images) and [getting an image to 100 KB](/guides/how-to-compress-an-image-to-100kb)."] },
  ],
  "crop-image": [
    { heading: "Cropping to an exact shape or size", paragraphs: ["Choose a shape such as 1:1 or 16:9, or type the width and height in pixels. Cropping does not resize the pixels you keep, so quality is unchanged: PNG stays lossless and JPG and WebP are saved at high quality.", "To crop many images the same way, use [Resize Image](/tools/resize-image) with Fill and crop."] },
    { heading: "Typical uses", paragraphs: ["Crop a signature or photo before compressing it for a form, frame a product before [removing the background](/tools/remove-background), or trim a page before running [OCR](/tools/image-to-text)."] },
  ],
  "image-converter": [
    { heading: "Choosing the output format", paragraphs: ["JPG is best for photos you want to share or upload anywhere, PNG for screenshots, logos and images with transparency, and WebP for the smallest files on websites. JPG cannot be transparent, so transparent areas are filled with the background colour you choose, white by default.", "HEIC photos from an iPhone convert to JPG in your browser, many at once, and can be downloaded as a ZIP."] },
    { heading: "After converting", paragraphs: ["Make files smaller with [Compress Image](/tools/compress-image), or combine them into a document with [JPG to PDF](/tools/jpg-to-pdf). See our guide on [converting JPG to PDF](/guides/how-to-convert-jpg-to-pdf)."] },
  ],
  "document-translator": [
    { heading: "Getting a better translation", paragraphs: ["Fix typos in the source first, use short clear sentences, and avoid slang. Check names, numbers, dates and legal terms by hand, because machine translation can contain mistakes.", "The first time you use a language pair your browser downloads its translation model (about 80 to 120 MB) and keeps it, so later translations start quickly and nothing you translate is sent anywhere."] },
    { heading: "Layout and file types", paragraphs: ["Word, PowerPoint, Excel, HTML, CSV, Markdown and subtitle files come back in the same format with their layout kept; PDF, OpenDocument and RTF come back as an editable Word file. Read our guide on [translating a document and keeping the layout](/guides/how-to-translate-a-document-and-keep-the-layout)."] },
  ],
  "password-generator": [
    { heading: "Making passwords you can manage", paragraphs: ["Use at least 12 characters, and 16 or more for important accounts, with a different password on every site. Passwords are created with the browser's secure random generator and are never sent or stored. Exclude look-alike characters such as O and 0 only when you must type the password by hand.", "Store passwords in a password manager and turn on two-step verification."] },
    { heading: "Related", paragraphs: ["Protect a sensitive file with a strong password using [Protect PDF](/tools/protect-pdf). Read our guide on [creating a strong password](/guides/how-to-create-a-strong-password)."] },
  ],
  "word-to-pdf": [
    { heading: "Why a print window opens", paragraphs: ["Your browser has the best PDF engine on your device, with full support for Arabic and other scripts. Choose Save as PDF in the print window to write a real PDF with selectable text. Fonts that are not installed on your device are replaced with similar ones, which can move line or page breaks slightly.", "Old .doc files must be saved as .docx in Word, Google Docs or LibreOffice first."] },
    { heading: "After converting", paragraphs: ["Reduce the size with [Compress PDF](/tools/compress-pdf), join documents with [Merge PDF](/tools/merge-pdf), or add [page numbers](/tools/add-page-numbers) and a [signature](/tools/sign-pdf)."] },
  ],
  "excel-to-pdf": [
    { heading: "Fitting a spreadsheet on the page", paragraphs: ["With Fit to page width on, each sheet is scaled down to fit, and Automatic orientation switches to landscape when a sheet is wider than a portrait page. Values appear as Excel shows them, with number and date formats, fonts, fills, borders and merged cells kept.", "Charts, images and conditional formatting are not carried over. Old .xls files must be saved as .xlsx first."] },
    { heading: "Related", paragraphs: ["To go the other way and pull tables out of a PDF, use [PDF to Excel](/tools/pdf-to-excel). Compress or number the result with [Compress PDF](/tools/compress-pdf) and [Add Page Numbers](/tools/add-page-numbers)."] },
  ],
  "remove-pages-from-pdf": [
    { heading: "Deleting the right pages", paragraphs: ["Tap the pages to drop or type page numbers and ranges such as 2, 5-7, and check the count of pages that will be kept before saving. The rest of the document is copied as it is, so quality does not change.", "To keep only some pages as a new file, use [Split PDF](/tools/split-pdf) instead; to also reorder or rotate, use [Organize PDF](/tools/organize-pdf)."] },
    { heading: "Making it smaller", paragraphs: ["Removing pages is one of the quickest ways to get under an upload limit. Follow it with [Compress PDF](/tools/compress-pdf) if the file is still too large, as described in our guide on [getting a PDF to a target size](/guides/compress-pdf-to-100kb-200kb-500kb-1mb)."] },
  ],
  "pdf-to-text": [
    { heading: "Paragraphs or same lines", paragraphs: ["Paragraphs joins wrapped lines and separates blocks with a blank line, which reads best for letters and reports. Same lines keeps every line break, which suits tables, statements and code. Turn on page markers to see where each page starts.", "Pages that are pictures have no text, so keep OCR on to read them in Arabic and English."] },
    { heading: "Related", paragraphs: ["Want formatting too? Use [PDF to Word](/tools/pdf-to-word). Need tables? Use [PDF to Excel](/tools/pdf-to-excel). Our guide on [extracting text from a PDF](/guides/how-to-extract-text-from-a-pdf) covers scanned files."] },
  ],
  "qr-code-generator": [
    { heading: "Making a QR code that scans", paragraphs: ["Medium error correction suits most uses; choose Quartile or High for printed or outdoor codes or when you add a logo, though the pattern gets denser. Shorter content makes simpler codes that scan faster, and the tool accepts up to 2,000 characters.", "The data is encoded directly in the image with no tracking redirect, so the code works as long as the destination does."] },
    { heading: "Printing tips", paragraphs: ["Keep a quiet border around the code, use dark on light colours, and test with two different phones before printing in bulk. Download SVG for large prints and PNG for screens."] },
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
  "protect-pdf": [
    { heading: "اختيار كلمة المرور", paragraphs: ["استخدم كلمة مرور طويلة يصعب تخمينها، فهي ما يحمي الملف. يُشفَّر الملف بتشفير AES-128 على جهازك. أرسل كلمة المرور بقناة مختلفة عن الملف، واحتفظ بها، فلا يمكن استعادة كلمة مرور منسية.", "ويمكنك تحديد هل يسمح للقارئ بالطباعة أو النسخ أو التعديل. تحترم تطبيقات PDF المعتادة هذه الإعدادات، لكنها لا تضمن شيئًا ضد من يستطيع فتح الملف أصلًا."] },
    { heading: "مواضيع مرتبطة", paragraphs: ["أنشئ كلمة مرور قوية بأداة [مولّد كلمات المرور](/tools/password-generator)، وأزل الحماية لاحقًا بأداة [فك حماية PDF](/tools/unlock-pdf)."] },
  ],
  "unlock-pdf": [
    { heading: "ما الذي تفعله الأداة وما لا تفعله", paragraphs: ["أدخل كلمة المرور التي تعرفها واحفظ نسخة تُفتح دونها، أو أزل قيود الطباعة والنسخ من ملف يُفتح بحرية. تُدعم كلمات مرور PDF المعتادة بما فيها AES-128 وAES-256 التي تستخدمها البنوك والتطبيقات الحديثة.", "لا تخمّن الأداة كلمات المرور ولا تكسرها. فُك حماية الملفات التي تملكها أو لديك إذن بتعديلها فقط."] },
    { heading: "الخطوات التالية", paragraphs: ["يمكن دمج الكشوف وكشوف الرواتب بعد فك حمايتها بأداة [دمج PDF](/tools/merge-pdf) أو تحويلها بأداة [محوّل كشوف الحساب](/tools/bank-statement-converter)."] },
  ],
  "split-pdf": [
    { heading: "كتابة نطاقات الصفحات", paragraphs: ["افصل العناصر بفواصل. «2-4» تعني الصفحات من 2 إلى 4، و«7» الصفحة 7 وحدها، و«8-» من الصفحة 8 إلى النهاية. كل عنصر بين فاصلتين يصبح ملفًا مستقلًا. ولدمج صفحات من أماكن مختلفة في مستند واحد، قسّمها ثم اجمعها بأداة [دمج PDF](/tools/merge-pdf).", "وإن أردت حذف صفحات فقط فأداة [حذف صفحات من PDF](/tools/remove-pages-from-pdf) أسرع."] },
    { heading: "متى تقسّم؟", paragraphs: ["من الأسباب الشائعة حدود حجم الرفع، وإرسال الجزء المعني فقط من مستند سري، وفصل دفعة من المسوحات. ويمكن أيضًا تقسيم ملف كبير لجعل كل جزء ضمن الحد المسموح، بعد الضغط بأداة [ضغط PDF](/tools/compress-pdf)."] },
  ],
  "resize-image": [
    { heading: "الحفاظ على النسب", paragraphs: ["اكتب العرض وحده أو الارتفاع وحده فيُحسب الضلع الآخر من نسب كل صورة. وعند تحديد الاثنين اختر بين الملاءمة أو التعبئة مع القص أو الحدود أو التمديد. تكبير الصورة فوق حجمها الأصلي لا يضيف تفاصيل فقد تبدو ناعمة، أما التصغير فيبقيها حادة.", "تغطي الأحجام السريعة المنشورات المربعة والقصص وFull HD والصور المصغرة للفيديو واللافتات وصور الملف الشخصي، ويمكنك تغيير حجم صور كثيرة وتنزيلها في ملف ZIP."] },
    { heading: "الالتزام بحد حجم الملف", paragraphs: ["غيّر الأبعاد أولًا ثم استخدم أداة [ضغط الصور](/tools/compress-image) بحجم مستهدف مثل 100 كيلوبايت."] },
  ],
  "jpg-to-pdf": [
    { heading: "بناء ملف PDF مرتب من الصور", paragraphs: ["أضف الصور ورتّبها واختر A4 أو Letter مع هامش صغير للطباعة، أو أبقِ كل صفحة بحجم صورتها. توضع صور JPG كما هي فلا تنخفض الجودة. والصور المستقيمة المقصوصة أفضل، لذا قصّ الحواف بأداة [قص الصور](/tools/crop-image) أولًا.", "الصور الكثيرة تصنع ملف PDF كبيرًا، فاضغطه بعدها بأداة [ضغط PDF](/tools/compress-pdf)."] },
    { heading: "صور الآيفون", paragraphs: ["يقرأ Safari صور HEIC من الآيفون، أما المتصفحات الأخرى فقد لا تقرؤها. حوّلها إلى JPG بأداة [محوّل الصور](/tools/image-converter) أو اضبط الكاميرا على «الأكثر توافقًا»."] },
  ],
};

export function deepDiveFor(toolId: string, locale: Locale): DeepDiveSection[] | undefined {
  return (locale === "ar" ? ar : en)[toolId];
}

/** Every tool that has extra content in English. */
export const deepDiveToolIds = Object.keys(en);
