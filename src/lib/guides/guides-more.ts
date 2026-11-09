import type { Guide } from "./guides";

/** More English guides, written around what people actually search for. Links are written as [text](/path). */
export const moreGuides: Guide[] = [
  {
    slug: "compress-pdf-to-100kb-200kb-500kb-1mb",
    title: "How to compress a PDF to 100 KB, 200 KB, 500 KB or 1 MB",
    description: "How to get a PDF under a specific size limit for job portals, exam forms and email, and which settings to try when it will not shrink enough.",
    updated: "2026-11-09",
    tools: ["compress-pdf", "split-pdf", "pdf-to-jpg"],
    summary: "Open a free PDF compressor, pick the strongest level and check the size shown after compression. Photos and scans make PDFs big, so reducing them is what gets a file under 100 KB, 200 KB, 500 KB or 1 MB. If it is still too large, remove pages or split the file.",
    related: ["how-to-compress-a-pdf", "how-to-split-a-pdf-and-extract-pages", "how-to-merge-pdf-files"],
    intro: "Many portals reject a PDF over a fixed size: 100 KB for a signature form, 200 KB or 500 KB for exam applications, 1 MB for a visa or job upload. Getting under the limit is usually possible, but you need to know what makes a PDF large and which steps to try in what order.",
    sections: [
      {
        heading: "Know your target and your starting size",
        paragraphs: [
          "Check the file size in your file manager before you begin. A text-only document is often already under 200 KB. A scanned document or one with photos can be 5 to 20 MB, and reaching 100 KB from there needs real compression and sometimes fewer pages.",
          "Remember that 1 MB is 1,000 KB for most upload forms. If a portal says 'under 1 MB', aim for around 900 KB to leave a safety margin.",
        ],
      },
      {
        heading: "Step-by-step method",
        paragraphs: ["Use [Compress PDF](/tools/compress-pdf). It runs in your browser, so nothing is uploaded."],
        list: {
          ordered: true,
          items: [
            "Choose your PDF and start with the Balanced level. Note the size shown after compression.",
            "If it is still above your limit, compress the original again at the Strong level. Always start from the original file, because compressing an already compressed copy only adds blur.",
            "Open the result and zoom in on text, stamps and signatures to check they are still readable.",
            "If it is still too big, remove pages you do not need with [Remove Pages from PDF](/tools/remove-pages-from-pdf), or split the file into parts with [Split PDF](/tools/split-pdf).",
          ],
        },
      },
      {
        heading: "What to expect at each size",
        paragraphs: [],
        list: {
          items: [
            "1 MB: usually easy for documents with a few photos or pages. Balanced level is normally enough.",
            "500 KB: fine for a short scanned document of a few pages at the Strong level.",
            "200 KB: achievable for one to three scanned pages. Longer scans need splitting.",
            "100 KB: only realistic for one or two pages. A single full-page colour scan can already exceed it.",
          ],
        },
      },
      {
        heading: "When it still will not shrink",
        paragraphs: [
          "If the PDF is mostly text and still large, it may contain embedded fonts or many pages. There is little left to remove, and the tool tells you when the original is already the smallest it can be.",
          "For scans, the best fix is at the source. Re-scan in black and white or grayscale at 150 to 200 DPI instead of 300 DPI colour. A black and white page can be a tenth of the size. You can also convert pages to images with [PDF to JPG](/tools/pdf-to-jpg), resize them, and rebuild the PDF with [JPG to PDF](/tools/jpg-to-pdf), but this makes text unselectable.",
        ],
      },
      {
        heading: "Do not lose legibility",
        paragraphs: ["A tiny file nobody can read gets rejected as well. Check ID numbers, dates and stamps at 100 percent zoom. Government and exam portals usually accept slightly larger files than the stated limit by a few KB, but do not count on it."],
      },
    ],
    faqs: [
      { question: "Can I compress a PDF to exactly 100 KB?", answer: "You can get close by trying stronger levels, but the result depends on the content. One or two pages of scanned text can reach 100 KB; a long colour document usually cannot without splitting it." },
      { question: "Is it safe to compress an ID or certificate online?", answer: "Compress PDF works in your browser, so the file never leaves your device." },
      { question: "Why did the file get bigger after compression?", answer: "That happens when the original was already well compressed. Keep the original; the tool will say when it cannot improve the file." },
    ],
  },
  {
    slug: "how-to-convert-pdf-to-excel",
    title: "How to convert a PDF to Excel without retyping the tables",
    description: "Pull tables out of PDF invoices, reports and statements into an Excel spreadsheet with real numbers, and fix the usual problems with columns and scans.",
    updated: "2026-11-09",
    tools: ["pdf-to-excel", "bank-statement-converter", "image-to-text"],
    summary: "Use a PDF to Excel converter on a PDF whose text can be selected: it finds the columns from the gaps between words and writes each table to a sheet with real numbers. Scanned PDFs need OCR first, and bank statements convert best with a statement-specific tool.",
    related: ["convert-bank-statement-pdf-to-excel", "how-to-extract-text-from-a-pdf", "how-to-convert-pdf-to-word-keep-formatting"],
    intro: "Copying a table from a PDF into Excel usually produces one long column of text. The real fix is a converter that understands rows and columns. Here is how to get a clean spreadsheet the first time, and what to do when a PDF refuses to cooperate.",
    sections: [
      {
        heading: "First: is your PDF text or a picture?",
        paragraphs: [
          "Try selecting a word in the PDF with your mouse. If you can highlight it, the file contains real text and converts accurately. If the whole page highlights as one block or nothing highlights, it is a scan, which is a picture of paper. A converter cannot read a picture directly.",
          "For scans, extract the text first with [Image to Text (OCR)](/tools/image-to-text), then check the numbers. Accuracy depends on the scan quality.",
        ],
      },
      {
        heading: "Convert step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [PDF to Excel](/tools/pdf-to-excel) and choose your PDF.",
            "Check the preview: the tool finds the columns from the white gaps between values on each page.",
            "Convert, then download the .xlsx file.",
            "Open it and check totals against the PDF: add a column of values and compare the sum with the printed total.",
          ],
        },
      },
      {
        heading: "Numbers must be numbers",
        paragraphs: [
          "A common problem is that amounts arrive as text, so sums show zero. A good converter turns values like 1,250.500, 15% and (300.00) into real numbers with a matching format, which makes totals, sorting and filters work. Codes with leading zeros, such as account numbers, stay as text on purpose so the zeros are not lost.",
          "If your numbers still look wrong, check the regional format: some PDFs use a comma as the decimal separator.",
        ],
      },
      {
        heading: "Bank statements are a special case",
        paragraphs: [
          "Statements have wrapped descriptions, running balances and repeated headers on every page. A general converter can mishandle them. The [Bank Statement Converter](/tools/bank-statement-converter) rebuilds one row per transaction, removes repeated headers and checks the running balance so you can see whether a row was missed.",
        ],
      },
      {
        heading: "Tips for messy tables",
        paragraphs: [
          "Tables without lines, merged cells and multi-line cells are the hardest. If the result has columns shifted, convert fewer pages at a time, then fix the sheet in Excel with Text to Columns. For a few rows, retyping a figure after checking it is faster than perfecting the conversion.",
        ],
      },
    ],
    faqs: [
      { question: "Does PDF to Excel work with Arabic?", answer: "Yes for PDFs with selectable text. Right-to-left text is read in the correct order, but check numbers in the result." },
      { question: "Why are all my numbers in one column?", answer: "The page probably has no clear gaps between columns, or it is a scan. Try a text-based version of the PDF, or use OCR first." },
      { question: "Is my financial data uploaded?", answer: "No. The conversion happens in your browser." },
    ],
  },
  {
    slug: "how-to-extract-text-from-a-pdf",
    title: "How to extract text from a PDF (including scanned PDFs)",
    description: "Copy the text out of any PDF as plain text, keep Arabic and English in the right order, and read scanned pages with OCR.",
    updated: "2026-11-09",
    tools: ["pdf-to-text", "image-to-text", "unlock-pdf"],
    summary: "For a normal PDF, a PDF to Text tool reads the text directly and gives you plain text to copy or save as .txt. For a scanned PDF there is no text inside, so you need OCR, which recognises the letters from the picture of each page.",
    related: ["how-to-extract-text-from-an-image-ocr", "how-to-convert-pdf-to-word-keep-formatting", "how-to-convert-pdf-to-excel"],
    intro: "Maybe you need a paragraph from a report, the words of a contract for a translation, or all the text of an old scanned letter. Selecting and copying by hand breaks lines and loses order. This guide shows the quick way and what to do when copying does not work at all.",
    sections: [
      {
        heading: "Two kinds of PDF",
        paragraphs: [
          "A text PDF is created from a word processor, a website or an accounting system. Its words are stored as text, so extraction is instant and exact. A scanned PDF is a photograph of paper. It looks the same but has no text inside, so selecting does nothing.",
          "A quick test: press Ctrl+F in your PDF reader and search for a word you can see. If it finds nothing, the file is a scan.",
        ],
      },
      {
        heading: "Extract the text step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [PDF to Text](/tools/pdf-to-text) and choose your file.",
            "Pick Paragraphs for letters and reports, or Same lines as the PDF for statements, lists and code.",
            "Turn on page markers if you want to see where each page starts.",
            "Keep OCR on if the file might contain scanned pages, and choose Arabic, English or both.",
            "Press Extract text, then copy it or download the .txt file.",
          ],
        },
      },
      {
        heading: "What OCR can and cannot do",
        paragraphs: [
          "OCR (optical character recognition) reads the shapes of letters in an image. Clear printed text in a straight, well-lit scan is read very accurately. Handwriting, blurry photos, low contrast and decorative fonts reduce accuracy a lot, so always proofread numbers and names.",
          "For best results scan at 300 DPI in black and white or grayscale, keep pages straight, and choose the correct language. Reading Arabic and English together is supported, though each extra language is slightly slower.",
        ],
      },
      {
        heading: "Locked or damaged PDFs",
        paragraphs: [
          "A PDF that asks for a password cannot be read until it is unlocked. If you know the password, use [Unlock PDF](/tools/unlock-pdf) first. A PDF that is damaged may open partly; try opening and re-saving it in another reader first.",
        ],
      },
      {
        heading: "After extraction",
        paragraphs: [
          "Plain text has no fonts or images. If you want to edit the document with its structure, convert to Word instead using [PDF to Word](/tools/pdf-to-word). For tables, use [PDF to Excel](/tools/pdf-to-excel).",
        ],
      },
    ],
    faqs: [
      { question: "Why can't I copy text from my PDF?", answer: "It is probably a scanned image or the author disabled copying. Use OCR for scans." },
      { question: "Does extraction keep Arabic in the right order?", answer: "Yes. Right-to-left lines are read correctly and letter forms are converted to normal letters so the text can be searched." },
      { question: "Is my PDF uploaded?", answer: "No. Extraction and OCR run in your browser." },
    ],
  },
  {
    slug: "how-to-extract-text-from-an-image-ocr",
    title: "How to extract text from an image or photo (OCR in Arabic and English)",
    description: "Copy text from a screenshot, receipt or scanned page with free OCR, plus the photo tips that decide whether the result is accurate.",
    updated: "2026-11-09",
    tools: ["image-to-text", "resize-image", "crop-image"],
    summary: "Upload the image to an OCR tool, choose the language of the text, and copy the result. Straight, sharp, well-lit photos give accurate text; blurry or tilted ones do not. You can download plain text, a Word file or a searchable PDF.",
    related: ["how-to-extract-text-from-a-pdf", "how-to-resize-and-compress-images", "how-to-convert-pdf-to-word-keep-formatting"],
    intro: "You photographed a receipt, a page of a book or a sign, and now you need the words as text. Typing it out takes ages and invites mistakes. OCR does it in seconds, but the quality of the photo matters more than any setting.",
    sections: [
      {
        heading: "Take a photo OCR can read",
        paragraphs: [],
        list: {
          items: [
            "Hold the camera parallel to the page so lines are straight, not at an angle.",
            "Use even light and avoid shadows and glare from glossy paper.",
            "Get close enough that letters are clearly sharp, and tap to focus.",
            "Use a plain background so the page edges are obvious.",
          ],
        },
      },
      {
        heading: "Extract the text step by step",
        paragraphs: ["Use [Image to Text (OCR)](/tools/image-to-text). It runs in your browser, so photos of documents stay on your device."],
        list: {
          ordered: true,
          items: [
            "Choose the language: Arabic, English or both for mixed text.",
            "Add one or several photos, screenshots or a scanned PDF.",
            "Press Extract text and wait. The first run downloads the reading engine once.",
            "Check the estimated accuracy, proofread, then copy the text or download it as .txt, Word or a searchable PDF.",
          ],
        },
      },
      {
        heading: "Fix a poor result",
        paragraphs: [
          "If accuracy is low, first check the selected language, since the wrong one produces nonsense. Then crop out everything except the text with [Crop Image](/tools/crop-image), because borders and pictures confuse the engine. If the photo is huge, a moderate size works better than an enormous one; too small is also a problem, so aim for text at least 20 pixels tall.",
        ],
      },
      {
        heading: "Arabic OCR specifics",
        paragraphs: [
          "Arabic is harder than English for OCR because letters connect and change shape, and dots and diacritics are small. Printed Arabic in common fonts reads well; calligraphic fonts and handwriting do not. Always double-check numbers, names and dates, which are the most important and the most error-prone.",
        ],
      },
      {
        heading: "Searchable PDFs",
        paragraphs: ["A searchable PDF keeps the original image and adds an invisible text layer. You can search and select words while the page still looks exactly like the scan. This is the best format for archiving scanned documents."],
      },
    ],
    faqs: [
      { question: "Can OCR read handwriting?", answer: "Only neat, print-like handwriting, and not reliably. OCR is designed for printed text." },
      { question: "Which languages are supported?", answer: "Arabic and English, together or separately." },
      { question: "Are my photos uploaded?", answer: "No. Text is recognised in your browser; only the engine and language files are downloaded once." },
    ],
  },
  {
    slug: "how-to-compress-an-image-to-100kb",
    title: "How to compress an image to 100 KB, 50 KB or 20 KB for forms and portals",
    description: "Get passport photos, signatures and documents under strict size limits without making them unreadable, using resize and compress together.",
    updated: "2026-11-09",
    tools: ["compress-image", "resize-image", "crop-image"],
    summary: "Resize the picture to the pixel size the portal needs, then use a compressor with a target size such as 100 KB. Use JPG for photos. Resizing first makes the file much smaller than compression alone.",
    related: ["how-to-resize-and-compress-images", "compress-pdf-to-100kb-200kb-500kb-1mb", "how-to-remove-background-from-a-photo"],
    intro: "Exam forms, visa sites and job portals often ask for a photo under 50 KB, a signature under 20 KB or a scan under 200 KB. A modern phone photo is several megabytes, so you need to reduce it by 98 percent or more. The trick is doing it in the right order.",
    sections: [
      {
        heading: "Read the requirements carefully",
        paragraphs: [
          "Look for three numbers: the maximum file size, the required pixel dimensions or aspect ratio, and the allowed format, usually JPG. Many portals want a specific size such as 200 × 230 pixels for a photo or 140 × 60 for a signature.",
        ],
      },
      {
        heading: "Step 1: crop to the correct shape",
        paragraphs: ["Use [Crop Image](/tools/crop-image) to frame the face or signature with the correct proportions. Cropping out empty space also reduces the file size."],
      },
      {
        heading: "Step 2: resize to the required pixels",
        paragraphs: ["Open [Resize Image](/tools/resize-image) and enter the exact width and height, or only one of them to keep proportions. A 4,000-pixel photo shrunk to 400 pixels is already about 100 times smaller in area."],
      },
      {
        heading: "Step 3: compress to the target size",
        paragraphs: [
          "Use [Compress Image](/tools/compress-image) and type the target, for example 100 KB, 50 KB or 20 KB. The tool searches for the highest quality that fits, and only reduces the dimensions a little if it has to. Choose JPG or WebP for photos. PNG is lossless and rarely shrinks enough.",
        ],
      },
      {
        heading: "Signatures and documents",
        paragraphs: [
          "Sign on plain white paper with a dark pen, photograph it in daylight, crop tightly and compress. A signature is mostly white, so it compresses to a very small size. For scanned documents, black and white scans are far smaller than colour.",
        ],
      },
      {
        heading: "Quality check",
        paragraphs: [
          "Zoom to 100 percent and check the face, text and edges. Compression artifacts show as blocky patches. If the face looks smeared at 20 KB, try a slightly larger size or reduce the dimensions further instead of lowering quality.",
        ],
      },
    ],
    faqs: [
      { question: "Why is my compressed photo still too big?", answer: "Resize the dimensions first. A huge pixel size cannot reach a tiny file size without destroying quality." },
      { question: "Is metadata removed?", answer: "Yes, compressed images are saved without EXIF data such as GPS location and camera details." },
      { question: "Are my photos uploaded?", answer: "No. Everything runs in your browser." },
    ],
  },
  {
    slug: "how-to-convert-pdf-to-word-keep-formatting",
    title: "How to convert a PDF to Word and keep the formatting (Arabic and English)",
    description: "Turn a PDF into an editable Word document with real headings and paragraphs, and learn what converters cannot keep.",
    updated: "2026-11-09",
    tools: ["pdf-to-word", "pdf-to-text", "image-to-text"],
    summary: "Use a PDF to Word converter on a PDF with selectable text: it rebuilds headings, paragraphs, bold and italic as real Word styles. Complex layouts such as columns and tables may need cleanup, and scanned PDFs need OCR first.",
    related: ["how-to-extract-text-from-a-pdf", "how-to-convert-pdf-to-excel", "how-to-merge-pdf-files"],
    intro: "A PDF is built for reading, not editing. Converting it to Word lets you fix wording, reuse text and translate it. How well it works depends on how the PDF was made and how complicated its layout is.",
    sections: [
      {
        heading: "How conversion works",
        paragraphs: [
          "A PDF stores letters at exact positions on a page, with no idea of paragraphs. A converter has to guess the structure: lines that sit close together are joined into paragraphs, larger text becomes headings, and bold and italic fonts are detected. Right-to-left lines are marked so Arabic stays in the correct direction.",
        ],
      },
      {
        heading: "Convert step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [PDF to Word](/tools/pdf-to-word) and choose the PDF.",
            "Decide whether each PDF page should start a new page in Word.",
            "Press Convert to Word and check the preview of the first paragraphs.",
            "Download the .docx and open it in Word, Google Docs, Pages or LibreOffice.",
          ],
        },
      },
      {
        heading: "What usually needs checking",
        paragraphs: [],
        list: {
          items: [
            "Tables and multi-column pages: text is kept but the layout may not be rebuilt, so adjust it in Word.",
            "Pictures inside text pages: not carried over, so re-insert them if needed.",
            "Headers and footers: repeated on every page, so delete the extras.",
            "Special fonts: Word substitutes a similar font if yours is missing.",
          ],
        },
      },
      {
        heading: "Scanned PDFs",
        paragraphs: [
          "A scan has no text, so conversion cannot rebuild editable paragraphs. The converter adds the pages as pictures. For real text, run [Image to Text (OCR)](/tools/image-to-text), which produces a Word file from the recognised text.",
        ],
      },
      {
        heading: "Alternatives when you only need the words",
        paragraphs: ["If layout does not matter, [PDF to Text](/tools/pdf-to-text) is faster and avoids formatting problems entirely. For tables, use [PDF to Excel](/tools/pdf-to-excel)."],
      },
    ],
    faqs: [
      { question: "Will Word look exactly like the PDF?", answer: "No converter can guarantee it. Text and paragraphs transfer well; complex layouts need manual cleanup." },
      { question: "Does it support Arabic?", answer: "Yes. Arabic lines are detected and kept right-to-left." },
      { question: "Is my document uploaded?", answer: "No. The conversion runs in your browser." },
    ],
  },
  {
    slug: "how-to-split-a-pdf-and-extract-pages",
    title: "How to split a PDF and extract just the pages you need",
    description: "Split a large PDF into separate files, pull out a page range, or remove pages, with examples of how to write page ranges.",
    updated: "2026-11-09",
    tools: ["split-pdf", "remove-pages-from-pdf", "organize-pdf"],
    summary: "Open a PDF splitter, type the page ranges you want such as 2-4, 7, 9- and each range becomes its own file. To keep a document but drop some pages, use a remove-pages tool instead.",
    related: ["how-to-merge-pdf-files", "compress-pdf-to-100kb-200kb-500kb-1mb", "how-to-crop-and-rotate-pdf-pages"],
    intro: "A 200-page scan with the one page you need, a contract that should go out in sections, or a form with extra pages: all of these call for splitting or extracting. It takes a minute once you know how page ranges work.",
    sections: [
      {
        heading: "Split, extract or remove: which one?",
        paragraphs: [],
        list: {
          items: [
            "Split: cut one PDF into several files, for example one per chapter.",
            "Extract: keep only specific pages as a new file.",
            "Remove: keep the whole document except some pages.",
          ],
        },
      },
      {
        heading: "How to write page ranges",
        paragraphs: [
          "Separate items with commas. A dash gives a range, a single number gives one page, and leaving the end open goes to the last page. So 2-4 means pages 2, 3 and 4; 7 means just page 7; and 8- means page 8 to the end.",
          "In [Split PDF](/tools/split-pdf) each comma-separated item becomes its own file. To combine pages from different places into one document, split them out first and join them with [Merge PDF](/tools/merge-pdf).",
        ],
      },
      {
        heading: "Step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open Split PDF and choose the file.",
            "Enter the ranges, for example 1-3, 4-10, 11-.",
            "Press Split and download each file, or all of them together.",
            "Open each result to make sure it starts and ends on the right page.",
          ],
        },
      },
      {
        heading: "Removing pages instead",
        paragraphs: [
          "If you only need to delete a cover sheet, blank pages or an appendix, [Remove Pages from PDF](/tools/remove-pages-from-pdf) is quicker: enter the pages to drop and save a new file. To also rotate or reorder pages, use [Organize PDF](/tools/organize-pdf), where you can see every page and drag it into place.",
        ],
      },
      {
        heading: "Why people split",
        paragraphs: [
          "The common reasons are upload limits, sending only the relevant part of a confidential document, and separating scanned batches. Splitting a large scan into parts is also a way to get each part under a size limit; see our guide on [getting a PDF under 500 KB or 1 MB](/guides/compress-pdf-to-100kb-200kb-500kb-1mb).",
        ],
      },
    ],
    faqs: [
      { question: "Does splitting lower the quality?", answer: "No. Pages are copied as they are." },
      { question: "Can I extract non-consecutive pages into one file?", answer: "Split them out and merge, or use Organize PDF to keep only the pages you want in order." },
      { question: "Is my PDF uploaded?", answer: "No. Splitting happens in your browser." },
    ],
  },
  {
    slug: "how-to-sign-a-pdf-online-for-free",
    title: "How to sign a PDF online for free (draw, type or upload)",
    description: "Add your signature, initials and date to a PDF without printing, and learn when an image signature is enough and when you need a digital certificate.",
    updated: "2026-11-09",
    tools: ["sign-pdf", "edit-pdf", "protect-pdf"],
    summary: "Open a PDF signing tool, draw, type or upload your signature, place it on the page and save. This adds your signature as an image, which is accepted for many everyday documents. Some contracts require a certificate-based digital signature instead.",
    related: ["how-to-password-protect-and-unlock-a-pdf", "how-to-add-page-numbers-and-watermark-to-a-pdf", "how-to-merge-pdf-files"],
    intro: "Printing, signing and scanning a form wastes paper and time. Signing the PDF directly takes about a minute. Before you do, it is worth knowing what kind of signature the recipient accepts.",
    sections: [
      {
        heading: "Sign step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [Sign PDF](/tools/sign-pdf) and choose the document.",
            "Create your signature: draw it with a mouse or finger, type your name in a handwriting style, or upload a photo of your real signature.",
            "Click the page where it belongs. Drag to move it and resize it to fit the line.",
            "Add initials, the date or text if needed, then save and download the signed PDF.",
          ],
        },
      },
      {
        heading: "Make your signature look good",
        paragraphs: [
          "For an uploaded signature, sign in dark ink on plain white paper, photograph it in daylight and crop it tightly with [Crop Image](/tools/crop-image). A transparent background looks best on coloured forms. If your screen signature looks shaky, try again slower or use the typed option.",
        ],
      },
      {
        heading: "Is an image signature valid?",
        paragraphs: [
          "An image of your signature is accepted for many forms, such as applications, leave requests, consent forms and routine agreements. Some contracts, property documents and government filings require a digital signature backed by a certificate or a qualified signing service. If you are unsure, ask the recipient what they accept, because the rules vary by country.",
        ],
      },
      {
        heading: "Filling in the rest of the form",
        paragraphs: [
          "If the PDF is not a fillable form, use [Edit PDF](/tools/edit-pdf) to add typed text, dates and ticks anywhere on the page, and white-out boxes to cover old text. After you finish, you can protect the file with a password using [Protect PDF](/tools/protect-pdf) before emailing it.",
        ],
      },
      {
        heading: "Privacy",
        paragraphs: ["Your document and signature are processed in your browser and disappear when you close the tab. Nothing is saved on a server."],
      },
    ],
    faqs: [
      { question: "Can I sign on my phone?", answer: "Yes. Draw your signature with your finger and place it on the page." },
      { question: "Is my signature stored?", answer: "No. It exists only in your browser until you close the tab." },
      { question: "Can I sign several pages?", answer: "Yes. Add your signature or initials on each page that needs it." },
    ],
  },
  {
    slug: "how-to-convert-jpg-to-pdf",
    title: "How to convert JPG and other images to a PDF",
    description: "Combine photos, scans or screenshots into one PDF, choose the page size, fix rotation, and handle iPhone HEIC photos.",
    updated: "2026-11-09",
    tools: ["jpg-to-pdf", "image-converter", "compress-pdf"],
    summary: "Add your images to a JPG to PDF tool, put them in order, choose a page size such as A4, and download one PDF with a page per image. For iPhone HEIC photos, convert them to JPG first if your browser cannot read them.",
    related: ["compress-pdf-to-100kb-200kb-500kb-1mb", "how-to-merge-pdf-files", "how-to-resize-and-compress-images"],
    intro: "Photographed documents, receipts and certificates are easier to send and print as a single PDF than as ten loose pictures. Here is how to build one that looks tidy and stays small.",
    sections: [
      {
        heading: "Step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [JPG to PDF](/tools/jpg-to-pdf) and add your images. PNG and other common formats work too.",
            "Arrange them in the order you want. Each image becomes one page.",
            "Choose the page size: A4 or Letter with a small margin for printing and forms, or 'same as image' to keep each page the exact size of its picture.",
            "Create the PDF and download it.",
          ],
        },
      },
      {
        heading: "Quality and rotation",
        paragraphs: [
          "JPG photos are placed into the PDF as they are, so the quality does not drop. Phone photos may carry a hidden rotation flag, and good tools turn them upright automatically. If a page looks sideways, rotate it afterwards with [Rotate PDF](/tools/rotate-pdf).",
        ],
      },
      {
        heading: "iPhone HEIC photos",
        paragraphs: [
          "iPhones save photos as HEIC by default. Safari can read these, but other browsers cannot. If your tool rejects them, convert the photos to JPG first with [Image Converter](/tools/image-converter), or switch the iPhone camera format to 'Most Compatible'.",
        ],
      },
      {
        heading: "Keep the file small",
        paragraphs: [
          "Ten phone photos can make a PDF of 30 MB. Shrink the pictures first with [Compress Image](/tools/compress-image), or compress the finished PDF with [Compress PDF](/tools/compress-pdf). For forms with a strict limit, read our guide on [compressing a PDF to a target size](/guides/compress-pdf-to-100kb-200kb-500kb-1mb).",
        ],
      },
      {
        heading: "Better scans from a phone",
        paragraphs: ["Lay the page flat in good light, hold the phone parallel, and crop the edges with [Crop Image](/tools/crop-image) before converting. Straight, cropped pages look professional and are smaller."],
      },
    ],
    faqs: [
      { question: "Can I put many images in one PDF?", answer: "Yes. Add as many as the tool allows and reorder them before creating the PDF." },
      { question: "Will the text in the PDF be selectable?", answer: "No. It is a picture. To make it searchable, run OCR with Image to Text and download a searchable PDF." },
      { question: "Are my images uploaded?", answer: "No. The PDF is built in your browser." },
    ],
  },
  {
    slug: "how-to-remove-background-from-a-photo",
    title: "How to remove the background from a photo for free",
    description: "Cut out people and products automatically, get a transparent PNG, and fix hair and edge problems for professional-looking results.",
    updated: "2026-11-09",
    tools: ["remove-background", "crop-image", "resize-image"],
    summary: "Upload the photo to a background remover, let the AI separate the subject, then download a transparent PNG or add a solid colour. Clear subjects with good contrast work best; hair and glass may need a little extra care.",
    related: ["how-to-compress-an-image-to-100kb", "how-to-resize-and-compress-images", "how-to-convert-jpg-to-pdf"],
    intro: "A clean cut-out makes product photos look professional and passport or profile pictures easier to fit to a required colour. You no longer need design software: an AI model can do it in seconds, in your browser.",
    sections: [
      {
        heading: "Remove a background step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [Remove Background](/tools/remove-background) and add your photo.",
            "Wait while the AI model separates the subject. The first use downloads the model once (about 88 MB) and then it starts in seconds.",
            "Preview the result on a checkered or coloured background.",
            "Download the PNG with a transparent background, or choose a solid colour such as white for forms.",
          ],
        },
      },
      {
        heading: "Photos that work best",
        paragraphs: [],
        list: {
          items: [
            "A clear subject that stands out from the background: people, products, animals, cars.",
            "Even lighting with no heavy shadows across the edges.",
            "A high-resolution image, so edges are crisp.",
            "A background that differs in colour from the subject.",
          ],
        },
      },
      {
        heading: "Tricky cases",
        paragraphs: [
          "Fine hair, fur, smoke and transparent objects such as glass are the hardest. If edges look rough, take the photo against a plain, contrasting background, or zoom in and compare the result with the original. Cropping in tightly with [Crop Image](/tools/crop-image) before removal also helps the model focus.",
        ],
      },
      {
        heading: "Fitting the final size",
        paragraphs: [
          "Marketplaces, ID forms and websites ask for specific sizes. Resize the finished cut-out with [Resize Image](/tools/resize-image), and if there is a file size limit follow our guide on [compressing an image to 100 KB](/guides/how-to-compress-an-image-to-100kb). Remember that PNG with transparency is larger than JPG; if you add a solid background, save as JPG.",
        ],
      },
      {
        heading: "Privacy and limits",
        paragraphs: ["The model runs on your device, so your photos never leave it, and there are no daily limits or watermarks."],
      },
    ],
    faqs: [
      { question: "Why is the first use slow?", answer: "The AI model must download once. After that it is stored by your browser." },
      { question: "Can I get a white background?", answer: "Yes. Choose a solid colour instead of transparency, then save as JPG." },
      { question: "Is it really free?", answer: "Yes. There is no sign-up, limit or watermark." },
    ],
  },
  {
    slug: "how-to-add-page-numbers-and-watermark-to-a-pdf",
    title: "How to add page numbers and a watermark to a PDF",
    description: "Number the pages of a report or contract, skip the cover, and stamp DRAFT or a logo across pages in English or Arabic.",
    updated: "2026-11-09",
    tools: ["add-page-numbers", "watermark-pdf", "protect-pdf"],
    summary: "Open an add-page-numbers tool, pick the position, style and starting number, and save. For a watermark, type text or upload a logo, set the angle and transparency, and apply it to all pages. Both work in English and Arabic.",
    related: ["how-to-merge-pdf-files", "how-to-sign-a-pdf-online-for-free", "how-to-password-protect-and-unlock-a-pdf"],
    intro: "Long documents need page numbers so people can refer to them, and drafts or confidential files often need a visible watermark. Both are quick to add after the document is finished.",
    sections: [
      {
        heading: "Add page numbers",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [Add Page Numbers](/tools/add-page-numbers) and choose your PDF.",
            "Pick the position, such as bottom centre or bottom right, and the style, for example Page 1 of 12, or Arabic words and digits.",
            "Set the first number if you are continuing from another document, and tick 'Don't number the first page' to skip the cover.",
            "Save and check that numbers do not overlap content. Increase the distance from the edge if needed.",
          ],
        },
      },
      {
        heading: "Page numbers in Arabic documents",
        paragraphs: ["Arabic documents often use Arabic-Indic digits (١، ٢، ٣). The tool can write the label in Arabic, for example «صفحة ١ من ١٢», so it suits right-to-left documents."],
      },
      {
        heading: "Add a watermark",
        paragraphs: [
          "Open [Watermark PDF](/tools/watermark-pdf), type text such as DRAFT, CONFIDENTIAL or your company name, or upload a PNG logo. Choose the angle, size and transparency so it is visible but does not hide the text, and apply it to all pages or some pages.",
        ],
      },
      {
        heading: "Watermarks are not security",
        paragraphs: [
          "A watermark is drawn on top of the page, and someone with PDF editing software could remove it. For real protection also lock the file with a password using [Protect PDF](/tools/protect-pdf) and restrict editing and copying.",
        ],
      },
      {
        heading: "Order of work",
        paragraphs: [
          "Finish editing first. Merge all parts, delete unwanted pages and reorder, then add page numbers, then the watermark, then sign. Adding numbers before merging gives duplicate numbering. Our guide on [merging PDFs](/guides/how-to-merge-pdf-files) covers the first step.",
        ],
      },
    ],
    faqs: [
      { question: "Can I number only some pages?", answer: "You can skip the first page and choose a starting number. For other cases, split the file, number the parts and merge." },
      { question: "Can I use my logo as a watermark?", answer: "Yes. Upload a PNG, ideally with a transparent background." },
      { question: "Is my PDF uploaded?", answer: "No. Everything happens in your browser." },
    ],
  },
  {
    slug: "how-to-translate-a-document-and-keep-the-layout",
    title: "How to translate a Word, PDF or Excel document and keep its layout",
    description: "Translate whole documents between Arabic, English and 20 other languages privately, while tables, fonts and pictures stay in place.",
    updated: "2026-11-09",
    tools: ["document-translator", "pdf-to-word", "ai-text-summarizer"],
    summary: "Upload the document to a document translator, choose the target language and download the translated file. For Word, Excel and PowerPoint only the words change, so tables, fonts and pictures stay. PDF files come back as an editable Word file, so their layout may differ.",
    related: ["how-to-convert-pdf-to-word-keep-formatting", "how-to-extract-text-from-a-pdf", "how-to-extract-text-from-an-image-ocr"],
    intro: "Translating a document by copying and pasting paragraphs into a translator destroys the formatting and takes hours. A document translator replaces the words in place, so you get a translated file that looks like the original.",
    sections: [
      {
        heading: "Translate step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open [Document Translator](/tools/document-translator) and choose your file: Word, PowerPoint, Excel, PDF with selectable text, HTML, CSV, subtitles and more.",
            "Pick the source and target languages. Arabic, English, French, German, Spanish, Hindi and many others are supported.",
            "Start the translation. The first time you use a language pair, your browser downloads its translation model (about 80 to 120 MB) and keeps it.",
            "Download the translated file and read it through.",
          ],
        },
      },
      {
        heading: "Layout: what stays and what changes",
        paragraphs: [
          "For Word, PowerPoint, Excel, HTML and similar files, only the words are replaced, so formatting, tables and pictures stay. Text direction can change when translating between left-to-right and right-to-left languages, so check alignment. PDF, OpenDocument and RTF files come back as an editable Word file, so the layout can differ from the original. If layout matters, convert the PDF to Word first with [PDF to Word](/tools/pdf-to-word), check it, translate the Word file, then save it as PDF.",
        ],
      },
      {
        heading: "Machine translation: how to get a better result",
        paragraphs: [],
        list: {
          items: [
            "Fix typos in the source first; machine translation copies mistakes.",
            "Use short, clear sentences and avoid slang and idioms.",
            "Check names, numbers, dates and legal terms by hand.",
            "For contracts and official documents, have a professional translator review the result.",
          ],
        },
      },
      {
        heading: "Privacy",
        paragraphs: [
          "Translation runs on your own device, so confidential documents are not sent to a translation service. That matters for contracts, medical reports and internal files.",
        ],
      },
      {
        heading: "When you only need the gist",
        paragraphs: ["If you want to know what a long document says rather than a full translation, summarise it first with [AI Text Summarizer](/tools/ai-text-summarizer) and then translate only the important parts."],
      },
    ],
    faqs: [
      { question: "Which languages are supported?", answer: "English, Arabic, Chinese, French, German, Spanish, Hindi, Russian and many more; the tool lists them all." },
      { question: "Is machine translation accurate enough for official use?", answer: "It is a good draft for understanding and editing, but official or legal documents should be checked by a qualified translator." },
      { question: "Is my document uploaded?", answer: "No. Translation happens in your browser." },
    ],
  },
];
