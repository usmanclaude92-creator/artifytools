/** Written guides (English). Each one explains a real task and points to the tools that do it. */
export interface GuideSection {
  heading: string;
  paragraphs: string[];
  /** Optional numbered or bulleted list shown after the paragraphs. */
  list?: { ordered?: boolean; items: string[] };
}

export interface Guide {
  /** Language of the article. Defaults to English. */
  lang?: "en" | "ar";
  slug: string;
  title: string;
  description: string;
  /** ISO date (YYYY-MM-DD). */
  updated: string;
  /** Ids of the tools this guide is about; the first is the main one. */
  tools: string[];
  /** A two-sentence direct answer shown first (also what search and AI assistants quote). */
  summary?: string;
  /** Slugs of related guides in the same language, shown under the article. */
  related?: string[];
  /** Paragraphs may contain links written as [text](/tools/merge-pdf). */
  intro: string;
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
}

const baseGuides: Guide[] = [
  {
    slug: "how-to-merge-pdf-files",
    title: "How to merge PDF files into one document",
    description: "A practical guide to combining PDFs in the right order, keeping quality, and fixing the usual problems such as protected files and oversized results.",
    updated: "2026-11-08",
    tools: ["merge-pdf", "organize-pdf", "compress-pdf"],
    intro: "Applications, tax filings, claims and project reports often need to go out as a single PDF. Merging is simple, but a few choices decide whether the result is tidy or a mess: the order of the files, the size of the output, and whether any file is locked. This guide walks through the whole job.",
    sections: [
      {
        heading: "Before you start: get your files ready",
        paragraphs: [
          "Put every file you want to combine in one folder and give them names that sort in the order you want, for example 01-cover.pdf, 02-report.pdf and 03-appendix.pdf. Even though you can reorder files later, clear names save time and prevent mistakes.",
          "Check each file opens normally. A PDF that asks for a password cannot be combined until it is unlocked, and a damaged file will be refused. If you have photos or scans in other formats, convert them to PDF first so they can join the same document.",
        ],
      },
      {
        heading: "Merging step by step",
        paragraphs: ["The Merge PDF tool runs in your browser, so the documents stay on your device while you work."],
        list: {
          ordered: true,
          items: [
            "Open Merge PDF and choose or drop your files. You can add up to 30 at once.",
            "Use the up and down arrows to put the files in order. The file at the top becomes the first pages of the result.",
            "Press Merge PDFs and wait a moment. The page count of the result should equal the total of your files.",
            "Download the combined PDF and scroll through it once to confirm every section is present and the right way up.",
          ],
        },
      },
      {
        heading: "Keeping the result a sensible size",
        paragraphs: [
          "Merging copies pages as they are, so the combined file is roughly as large as all the originals added together. That can be a problem when an upload form limits you to 5 or 10 MB. The size is almost always caused by photos and scans rather than text.",
          "If the merged file is too large, run it through Compress PDF afterwards. Choose the balanced level for email and uploads, or a stronger level when a portal has a tight limit. Compress after merging, not before, so you only do it once.",
        ],
      },
      {
        heading: "Fixing pages after the merge",
        paragraphs: [
          "Sometimes one page ends up sideways, duplicated or in the wrong place. Instead of merging again, open the merged file in Organize PDF. You can rotate pages, delete the ones you do not need, and drag the rest into their proper positions. Remove Pages from PDF is quicker if you only need to take pages out.",
        ],
      },
      {
        heading: "Common problems",
        paragraphs: [
          "A file is refused: it is usually password-protected or damaged. Unlock it with the password you were given, then try again. Bookmarks and some interactive form features in the originals may not carry over, because the pages are copied rather than the whole document structure. If you rely on bookmarks, add them again in your PDF reader after merging.",
        ],
      },
    ],
    faqs: [
      { question: "Does merging reduce quality?", answer: "No. Pages are copied without being re-compressed, so text stays sharp and selectable and images are unchanged." },
      { question: "Are my files uploaded when I merge them?", answer: "No. The Merge PDF tool combines the files in your browser. Nothing is sent to a server." },
      { question: "How many files can I merge at once?", answer: "Up to 30 files in one go. For more, merge in batches and then merge the batches." },
    ],
  },
  {
    slug: "how-to-compress-a-pdf",
    title: "How to compress a PDF without ruining it",
    description: "Why PDFs get so big, which compression level to pick for email, uploads and printing, and what to do when a file will not shrink.",
    updated: "2026-11-08",
    tools: ["compress-pdf", "merge-pdf", "split-pdf"],
    intro: "A PDF that is too large to email or upload is one of the most common office annoyances. The good news is that size is usually caused by one thing, the images inside it, and that can be reduced a lot without touching the text. Here is how to do it properly.",
    sections: [
      {
        heading: "Why a PDF is big",
        paragraphs: [
          "Text, fonts and simple drawings take very little space. A 40-page text report may be under 300 KB. What makes files heavy is photographs and scanned pages, which are stored as high-resolution pictures. A single phone photo can be several megabytes, and a scanner set to high resolution can produce a few megabytes for every page.",
          "That is why compression tools work on the images. They re-save each picture at a lower resolution or quality, while leaving text, fonts and lines exactly as they were.",
        ],
      },
      {
        heading: "Choosing the right level",
        paragraphs: ["Compress PDF offers three strengths. Pick by what you will do with the file:"],
        list: {
          items: [
            "Light: for documents you will print, or contracts and drawings where fine detail matters. The file shrinks less but images stay close to the original.",
            "Balanced: the best default for email attachments and most online forms. It saves a lot of space and the pages still look good on screen.",
            "Strong: for portals with a hard limit, such as 1 MB or 2 MB. Photos look softer, so check the result before sending.",
          ],
        },
      },
      {
        heading: "Step by step",
        paragraphs: ["Open Compress PDF, choose your file and select a level. The tool shows the size before and after, so you can see whether it was worth it. If the result is still too big, try the next stronger level on the original file rather than compressing the already compressed copy again, which only adds quality loss."],
      },
      {
        heading: "When the file will not get smaller",
        paragraphs: [
          "If your PDF is mostly text, or its images were already compressed, there is little left to remove. In that case the tool tells you the original is already the best version rather than handing you a worse copy.",
          "Another option is to split the document. Split PDF can cut a long file into parts that each fit under a limit, and you can send them separately. For scans, re-scanning at a lower resolution (150 to 200 DPI is enough for reading) gives a smaller file at the source.",
        ],
      },
      {
        heading: "Privacy",
        paragraphs: ["Contracts, IDs and statements are exactly the files people compress. The compression runs in your browser, so the document is never uploaded, stored or logged."],
      },
    ],
    faqs: [
      { question: "Will my text become blurry?", answer: "No. Only photos and scanned images are re-encoded. Text, fonts and vector shapes are copied unchanged." },
      { question: "What size should I aim for to email a PDF?", answer: "Most email services accept attachments up to about 20 to 25 MB, but keeping files under 5 MB is more reliable for the person receiving them." },
      { question: "Is it safe to compress confidential documents online?", answer: "With a browser-based tool the file stays on your device. Check that a tool says where processing happens before using it for sensitive files." },
    ],
  },
  {
    slug: "convert-bank-statement-pdf-to-excel",
    title: "How to convert a bank statement PDF to Excel",
    description: "Turn a PDF bank statement into a clean spreadsheet with dates, debits, credits and balances, and check the numbers add up.",
    updated: "2026-11-08",
    tools: ["bank-statement-converter", "pdf-to-excel", "unlock-pdf"],
    intro: "Accountants, loan officers and small business owners regularly need a bank statement as a spreadsheet. Copying and pasting from a PDF breaks columns and merges lines, so the work takes hours. A converter built for statements does the structure for you, and a balance check tells you whether anything was missed.",
    sections: [
      {
        heading: "What a good conversion looks like",
        paragraphs: [
          "The goal is one row per transaction with separate columns for Date, Description, Debit, Credit and Balance. Dates should be real dates you can sort and filter, amounts should be real numbers you can add up, and a description that wraps over two or three lines should become a single cell.",
        ],
      },
      {
        heading: "Step by step",
        paragraphs: ["The Bank Statement Converter runs in your browser, so the statement is not uploaded."],
        list: {
          ordered: true,
          items: [
            "If the PDF is password-protected, remove the password first with Unlock PDF using the password the bank gave you.",
            "Open Bank Statement Converter and choose the PDF. Pick Automatic Conversion for most statements.",
            "Review the preview. Check the first and last rows against the statement, and look at any rows flagged by the balance check.",
            "Download as Excel (XLSX) or CSV.",
          ],
        },
      },
      {
        heading: "When automatic conversion is not enough",
        paragraphs: [
          "Some layouts are unusual: tables without lines, several tables on a page, or notes mixed between rows. Use Manual Selection. You draw a box around each table on the page preview, add lines between columns, and tell the tool what each column holds. Only what is inside your boxes is converted, so headers, footers and advertisements are left out.",
          "Scanned statements, which are pictures of paper, are read with OCR in your browser. Accuracy depends on the scan quality, so check amounts carefully.",
        ],
      },
      {
        heading: "Check the numbers",
        paragraphs: [
          "The balance check adds each credit and subtracts each debit from the previous balance and compares the result with the balance printed on the statement. A mismatch means a transaction was missed or an amount was misread. Fix it in the spreadsheet or redo that table with Manual Selection.",
          "Be careful with dates. Day-first and month-first formats look alike for the first twelve days of a month, so confirm the format with a date you know, such as the opening balance date.",
        ],
      },
      {
        heading: "Tips for using the result",
        paragraphs: [
          "Keep the original PDF alongside the spreadsheet as the record. Add a column for categories, then use a pivot table to total spending by category. If you have several months, convert each statement and paste them into one sheet in date order.",
        ],
      },
    ],
    faqs: [
      { question: "Is my bank statement uploaded anywhere?", answer: "No. The statement is read inside your browser and never leaves your device." },
      { question: "Does it work with Arabic statements?", answer: "Yes. Statements in English or Arabic are supported, as long as the PDF has selectable text or is scanned clearly enough for OCR." },
      { question: "Why do some rows fail the balance check?", answer: "Usually a transaction line was missed or split. Compare the flagged row with the PDF and correct it, or use Manual Selection for that table." },
    ],
  },
  {
    slug: "how-to-write-cheque-amount-in-words",
    title: "How to write the amount in words on a cheque",
    description: "The rules for writing cheque amounts in words in English and Arabic, with examples for Gulf currencies, and how to avoid alteration.",
    updated: "2026-11-08",
    tools: ["amount-in-words", "cheque-printer"],
    intro: "The amount in words is the line a bank trusts most on a cheque. If the figures and the words disagree, the words normally win, and a vague or unfinished line makes alteration easy. Writing it consistently also avoids a rejected cheque. This guide explains the conventions and shows how to produce the wording quickly.",
    sections: [
      {
        heading: "The basic rules",
        paragraphs: ["Whatever the language, a few habits apply everywhere:"],
        list: {
          items: [
            "Write the whole amount, including the currency name, for example “Omani Rials One Thousand Two Hundred Fifty”.",
            "Write the smaller unit too: baisa, fils, halala, cents or pence. If there are none, many banks like “Only” at the end.",
            "Start the words at the far left and fill the line. Draw a line through any leftover space so nothing can be added.",
            "Write the figures right next to the currency symbol, with no gap before the first digit.",
          ],
        },
      },
      {
        heading: "Currencies with three decimals",
        paragraphs: [
          "Omani rial, Kuwaiti dinar, Bahraini dinar and Jordanian dinar are divided into 1,000 smaller units, not 100. So 1,250.751 Omani rials is one thousand two hundred fifty rials and seven hundred fifty-one baisa. People used to two decimals often mix this up, so check the third digit.",
        ],
      },
      {
        heading: "Writing the amount in Arabic",
        paragraphs: [
          "Arabic amounts (tafqeet) follow grammar rules that change the currency word with the number: one rial, two rials as a dual, a plural for 3 to 10, and a different form after 11 to 99. The smaller unit has its own gender, for example بيسة and هللة. Writing this by hand is where mistakes creep in.",
          "The Amount in Words tool applies these rules automatically in Arabic and English, supports many currencies, and gives you text to copy onto a cheque or invoice. Read the result once before signing, because some banks prefer their own phrasing.",
        ],
      },
      {
        heading: "Printing it onto the cheque",
        paragraphs: [
          "If you issue many cheques, Cheque Printer fills in the date, payee, figures and words for you on the cheque leaves your bank provided. Run a test print on plain paper, hold it against a real leaf over a light, and adjust positions in millimetres before using the real one. It is for filling in leaves from your bank, not for printing blank cheques, which banks do not accept.",
        ],
      },
      {
        heading: "Avoiding alteration",
        paragraphs: [
          "Never leave gaps in the words line. Add asterisks or a line after the figures. Use a pen with permanent ink. If you make a mistake, write a new cheque instead of overwriting, since many banks reject altered cheques unless the drawer signs next to the change.",
        ],
      },
    ],
    faqs: [
      { question: "What if the figures and words differ?", answer: "In most banking practice the amount in words is taken as correct, but banks may also return the cheque to ask the drawer to confirm, so avoid any difference." },
      { question: "Why does 'Only' appear at the end?", answer: "It closes the line so that nothing can be added after the amount. In Arabic the equivalent is «لا غير»." },
      { question: "Can I use the generated words for invoices and contracts?", answer: "Yes. The wording suits invoices, receipts and contracts as well as cheques." },
    ],
  },
  {
    slug: "how-to-crop-and-rotate-pdf-pages",
    title: "How to crop and rotate PDF pages",
    description: "Trim margins, cut shipping labels out of larger pages, and fix sideways or crooked scans using free browser tools.",
    updated: "2026-11-08",
    tools: ["crop-pdf", "rotate-pdf", "organize-pdf"],
    intro: "A PDF page often carries more than you need: wide margins, a label on half of an A4 sheet, or a scan that came out sideways or slightly tilted. Cropping and rotating fix this without redrawing anything, so quality is unchanged.",
    sections: [
      {
        heading: "Cropping versus resizing",
        paragraphs: [
          "Cropping changes which part of the page is visible. The text and pictures are not re-compressed or moved, so nothing gets blurry. This is different from shrinking the page, which scales everything down.",
        ],
      },
      {
        heading: "Crop a PDF step by step",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open Crop PDF and choose your file.",
            "Drag the crop box over the part you want to keep, or press a Quick crop button such as top half.",
            "Choose whether the crop applies to all pages or just this page. For documents with the same margins on every page, use all pages.",
            "Press Save cropped PDF and open the result to confirm nothing important was cut off.",
          ],
        },
      },
      {
        heading: "Shipping labels and invoices",
        paragraphs: [
          "Sellers on marketplaces often receive a label printed on the top half of an A4 page. Cropping to the label alone saves paper and fits label printers. Use Quick crop for the top half, or draw the box exactly around the label and apply it to every page of a batch.",
        ],
      },
      {
        heading: "Fix sideways and crooked pages",
        paragraphs: [
          "If a page is sideways, use the turn buttons to rotate it in quarter turns. To fix a slightly tilted scan, the Straighten control tilts the page by a few degrees so text lines up with the grid before you place the crop box. For rotating whole documents, Rotate PDF is faster, and Organize PDF lets you rotate individual pages while also reordering or deleting them.",
        ],
      },
      {
        heading: "One thing to know",
        paragraphs: [
          "A cropped page hides the outside area, but the original content can still exist in the file. If the removed part is confidential, do not rely on cropping alone. Print the cropped result to a new PDF so the hidden part is gone.",
        ],
      },
    ],
    faqs: [
      { question: "Does cropping lower the quality?", answer: "No. Only the visible page area changes; the content is not redrawn or compressed." },
      { question: "Can I crop just one page?", answer: "Yes. Choose this page only, set its box, and the other pages stay as they are." },
      { question: "Is my PDF uploaded?", answer: "No. Everything is done in your browser on your device." },
    ],
  },
  {
    slug: "how-to-resize-and-compress-images",
    title: "How to resize and compress images for email and websites",
    description: "Choose the right pixel size, format and quality so photos load fast and meet upload limits without looking poor.",
    updated: "2026-11-08",
    tools: ["resize-image", "compress-image", "crop-image"],
    intro: "Phone photos are enormous: often 4,000 pixels wide and several megabytes. Websites, email and application forms rarely need that. Reducing the pixel size and then the file size makes pages load faster and satisfies upload limits, while still looking sharp at the size people see it.",
    sections: [
      {
        heading: "Pixels and file size are different",
        paragraphs: [
          "Resizing changes the dimensions, such as 4000 × 3000 pixels down to 1600 × 1200. Compressing changes how much data each pixel costs. For the biggest saving, do both: resize first, then compress.",
          "As a guide, 1,600 pixels wide is plenty for a full-width web image, 800 pixels suits a blog column, and 300 to 600 pixels is enough for profile photos and thumbnails.",
        ],
      },
      {
        heading: "Pick the right format",
        paragraphs: [],
        list: {
          items: [
            "JPG: best for photographs. Small files, no transparency.",
            "PNG: best for logos, screenshots and graphics with sharp edges or transparency. Files are larger, and recompressing them rarely helps.",
            "WebP: modern format that is usually smaller than both at similar quality, supported by current browsers.",
          ],
        },
      },
      {
        heading: "Resize step by step",
        paragraphs: [
          "Open Resize Image and add one or many pictures. Fill in only the width or only the height to keep the proportions, or set both and choose whether to fit inside, crop to fill or add borders. Quick sizes cover common social media and banner dimensions. Avoid enlarging; it cannot add detail and looks soft.",
        ],
      },
      {
        heading: "Hitting an exact size such as 100 KB",
        paragraphs: [
          "Government and job portals often demand a photo under 100 KB or 200 KB. In Compress Image, type the target size. The tool searches for the highest quality that fits, and reduces dimensions slightly only if it must. Using WebP or JPG as output gives much better results than PNG for photos.",
        ],
      },
      {
        heading: "Cropping and privacy",
        paragraphs: [
          "Crop Image helps you cut distracting edges or match an aspect ratio before resizing. Photos usually carry hidden data such as GPS location and the camera model. Compressing in the tool saves the picture without this metadata, which is worth doing before posting images publicly.",
        ],
      },
    ],
    faqs: [
      { question: "What size should website images be?", answer: "Around 1,600 pixels wide for full-width images and under 200 KB each is a good target for fast pages." },
      { question: "Why did my PNG not get smaller?", answer: "PNG is lossless, so re-saving rarely helps. Convert to WebP or JPG for photographs." },
      { question: "Are my photos uploaded?", answer: "No. The images are processed in your browser and never sent to a server." },
    ],
  },
  {
    slug: "how-to-password-protect-and-unlock-a-pdf",
    title: "How to password-protect and unlock a PDF",
    description: "Add a password and permissions to a PDF, remove one you know, and understand what PDF protection does and does not guarantee.",
    updated: "2026-11-08",
    tools: ["protect-pdf", "unlock-pdf", "password-generator"],
    intro: "Payslips, contracts and IDs often need to be sent by email, where anyone along the way could read them. A password on the PDF is a simple safeguard. The opposite problem is also common: a statement that needs a password every time you open it or merge it. This guide covers both.",
    sections: [
      {
        heading: "Two kinds of PDF protection",
        paragraphs: [
          "An open password is required to open the file at all. It is encrypted, so without it the content is unreadable. A permissions password is different: the file opens freely, but printing, copying or editing can be switched off. Reader apps respect these settings, but they are a courtesy rather than strong security for a file someone can already open.",
        ],
      },
      {
        heading: "Protecting a PDF",
        paragraphs: [],
        list: {
          ordered: true,
          items: [
            "Open Protect PDF and choose the file.",
            "Enter a password. Use a long one: 12 or more characters mixing words, numbers and symbols. The Password Generator can create one.",
            "Choose what readers may do: print, copy text and images, or edit.",
            "Save the protected PDF, then open it once to confirm the password works.",
            "Send the password by a different channel than the file, for example by phone or messaging app rather than the same email.",
          ],
        },
      },
      {
        heading: "Unlocking a PDF you can open",
        paragraphs: [
          "Unlock PDF removes the password from a file when you enter the right one, so you can merge, edit or print it freely. It also removes printing and copying restrictions from files that already open. It does not guess or crack forgotten passwords, and you should only unlock files you own or have permission to change.",
        ],
      },
      {
        heading: "Choosing and keeping the password",
        paragraphs: [
          "A password that can be guessed makes the encryption pointless. Avoid names, birthdays and common words. A password manager is the safest place to store it. If you forget the password of a protected PDF, nobody can recover the content, so keep a safe record.",
        ],
      },
      {
        heading: "Your files stay with you",
        paragraphs: ["Both tools work in your browser. The document and the password are never uploaded, which matters when the file is sensitive in the first place."],
      },
    ],
    faqs: [
      { question: "How strong is the encryption?", answer: "Protect PDF uses AES-128 encryption. The strength in practice depends on how strong your password is." },
      { question: "Can I remove the password later?", answer: "Yes, with Unlock PDF, as long as you know the password." },
      { question: "Is it legal to unlock a PDF?", answer: "Unlock only your own files or ones you have permission to change." },
    ],
  },
  {
    slug: "are-online-file-tools-safe",
    title: "Are online PDF and image tools safe? Upload versus in-browser processing",
    description: "How to tell whether a website uploads your documents, why it matters for contracts and IDs, and how to check before you use a tool.",
    updated: "2026-11-08",
    tools: ["merge-pdf", "compress-pdf", "unlock-pdf"],
    intro: "Every day people drop passports, bank statements and contracts onto free websites to convert or shrink them. Many of those sites upload the file to their own servers. That is not automatically harmful, but you should know when it happens. This guide explains the two ways tools work and how to judge them.",
    sections: [
      {
        heading: "Two ways a tool can work",
        paragraphs: [
          "Server-side tools send your file across the internet to a company's computer, process it there and send the result back. The company may keep copies for a while, log them, or pass them to other services. Browser-based tools run the code on your own device. The file is opened by your browser and the result is created locally, so there is nothing to upload.",
          "Some jobs genuinely need a server, such as heavy AI processing or certain format conversions. In those cases a tool should say so clearly before you use it.",
        ],
      },
      {
        heading: "Why it matters",
        paragraphs: [
          "Documents like IDs, tax returns, medical reports and bank statements contain exactly what fraudsters want. Even a well-meaning service can suffer a data breach, and stored files may be kept longer than you expect. Using a tool that never receives the file removes that risk entirely.",
        ],
      },
      {
        heading: "How to check a tool",
        paragraphs: [],
        list: {
          items: [
            "Read the privacy statement on the tool page. A trustworthy tool says where processing happens and how long files are kept.",
            "Open your browser's developer tools, choose the Network tab and process a file. If a large upload request appears, the file left your device.",
            "Try going offline after the page loads. A tool that still works is processing locally.",
            "Look for vague claims such as 'secure' or 'deleted after one hour'. These describe the company's promise, not what the technology prevents.",
          ],
        },
      },
      {
        heading: "How Artify Tools handles this",
        paragraphs: [
          "Most Artify tools, including the PDF, image, cheque and bank statement tools, process files in your browser, and each tool page states its processing mode. The few tools that use an external provider, such as AI features, say so before you use them. See the privacy policy for details.",
        ],
      },
      {
        heading: "Good habits whatever tool you use",
        paragraphs: [
          "Remove sensitive pages you do not need to share. Prefer a password on anything you email. Do not use public computers for personal documents, and clear downloaded copies when you are finished.",
        ],
      },
    ],
    faqs: [
      { question: "Does a padlock in the address bar mean my file is safe?", answer: "It means the connection is encrypted in transit. It does not tell you what the site does with the file after it arrives." },
      { question: "Can a browser tool see my files?", answer: "The page's code runs on your device and can read a file you choose, but a tool that processes locally does not send it anywhere. You can verify this in the Network tab." },
      { question: "Which of Artify's tools upload files?", answer: "Each tool page states its processing mode under Privacy. Most are browser-local; anything that uses an external provider says so." },
    ],
  },
  {
    slug: "how-to-create-a-strong-password",
    title: "How to create a strong password you can actually manage",
    description: "What makes a password strong, how long it should be, and why a password manager and a random generator beat clever tricks.",
    updated: "2026-11-08",
    tools: ["password-generator"],
    intro: "Most account break-ins do not involve clever hacking. Attackers try passwords leaked from other sites, or guess common patterns. A strong, unique password for every account stops most of this. The challenge is managing dozens of them, which is easier than it sounds.",
    sections: [
      {
        heading: "Length beats complexity",
        paragraphs: [
          "Each extra character multiplies the number of guesses an attacker needs. A random 16-character password is vastly stronger than an 8-character one with symbols. For important accounts such as email, banking and your password manager, aim for 16 characters or more. For others, 12 is a reasonable minimum.",
          "Substitutions like replacing a with @ barely help, because attackers' software already tries them.",
        ],
      },
      {
        heading: "Make every password unique",
        paragraphs: [
          "If you reuse one password and any site is breached, attackers try it everywhere else, a method called credential stuffing. Using a different password for each account limits the damage of any single leak to that one site.",
        ],
      },
      {
        heading: "Let a generator do the random part",
        paragraphs: [
          "People are poor at being random. We pick names, dates and keyboard patterns. A generator uses the browser's secure random source so every character is equally likely. In the Password Generator choose a length from 8 to 128, select character types, and optionally exclude look-alikes such as O and 0 if you must type it by hand. The password is created on your device and is never sent anywhere.",
        ],
      },
      {
        heading: "Use a password manager",
        paragraphs: [
          "A reputable password manager stores all your passwords behind one strong master password and fills them in for you. Use a long passphrase for the master one, for example four or five unrelated words, and never reuse it elsewhere.",
        ],
      },
      {
        heading: "Add a second step",
        paragraphs: [
          "Turn on two-step verification for email, banking and social accounts. An authenticator app or security key is stronger than text messages. Even if your password leaks, the attacker still cannot sign in.",
        ],
      },
    ],
    faqs: [
      { question: "How long should a password be?", answer: "At least 12 characters for ordinary accounts and 16 or more for important ones." },
      { question: "Is it safe to use an online password generator?", answer: "It is if the password is generated in your browser and never transmitted. Artify's generator works that way." },
      { question: "Should I change my passwords regularly?", answer: "Change one when you suspect it was exposed or after a breach, rather than on a fixed schedule. Unique strong passwords matter more." },
    ],
  },
];

import { moreGuides } from "./guides-more";
import { guidesAr } from "./guides-ar";

export const guides: Guide[] = [...baseGuides, ...moreGuides];
export const allGuides: Guide[] = [...guides, ...guidesAr];

/** Guides written in the given language. */
export function guidesFor(locale: "en" | "ar"): Guide[] {
  return locale === "ar" ? guidesAr : guides;
}

export function getGuide(slug: string, locale: "en" | "ar" = "en"): Guide | undefined {
  return guidesFor(locale).find((g) => g.slug === slug);
}

export function guidesForTool(toolId: string, locale: "en" | "ar" = "en"): Guide[] {
  return guidesFor(locale).filter((g) => g.tools.includes(toolId));
}
