import { describe, expect, test } from "vitest";
import { amountInArabic, amountInEnglish, countNoun, englishNumber, getCurrency, numberWords, parseAmount } from ".";

const OMR = getCurrency("OMR")!;
const SAR = getCurrency("SAR")!;
const AED = getCurrency("AED")!;
const INR = getCurrency("INR")!;
const riyal = SAR.ar.unit;
const halala = SAR.ar.sub;

describe("Arabic numbers", () => {
  test.each([
    [3, "ثلاثة"], [10, "عشرة"], [11, "أحد عشر"], [12, "اثنا عشر"], [15, "خمسة عشر"], [20, "عشرون"],
    [21, "واحد وعشرون"], [22, "اثنان وعشرون"], [35, "خمسة وثلاثون"], [100, "مائة"], [200, "مائتان"],
    [305, "ثلاثمائة وخمسة"], [999, "تسعمائة وتسعة وتسعون"], [1000, "ألف"], [2000, "ألفان"], [3000, "ثلاثة آلاف"],
    [11000, "أحد عشر ألفًا"], [100000, "مائة ألف"], [101000, "مائة وواحد ألف"], [1001, "ألف وواحد"],
    [2500, "ألفان وخمسمائة"], [1000000, "مليون"], [2000000, "مليونان"], [5000000, "خمسة ملايين"],
    [1250750, "مليون ومائتان وخمسون ألفًا وسبعمائة وخمسون"], [3000000000, "ثلاثة مليارات"],
  ])("%i (masculine)", (n, words) => {
    expect(numberWords(n)).toBe(words);
  });

  test("feminine forms for feminine nouns", () => {
    expect(numberWords(3, "f")).toBe("ثلاث");
    expect(numberWords(11, "f")).toBe("إحدى عشرة");
    expect(numberWords(12, "f")).toBe("اثنتا عشرة");
    expect(numberWords(21, "f")).toBe("إحدى وعشرون");
    expect(numberWords(3000, "f")).toBe("ثلاثة آلاف"); // the thousands follow «ألف», which is masculine
  });

  test("counted nouns take the right form", () => {
    expect(countNoun(1, riyal)).toBe("ريال سعودي واحد");
    expect(countNoun(2, riyal)).toBe("ريالان سعوديان");
    expect(countNoun(3, riyal)).toBe("ثلاثة ريالات سعودية");
    expect(countNoun(11, riyal)).toBe("أحد عشر ريالًا سعوديًا");
    expect(countNoun(100, riyal)).toBe("مائة ريال سعودي");
    expect(countNoun(103, riyal)).toBe("مائة وثلاثة ريالات سعودية");
    expect(countNoun(1500, riyal)).toBe("ألف وخمسمائة ريال سعودي");
    expect(countNoun(1, halala)).toBe("هللة واحدة");
    expect(countNoun(3, halala)).toBe("ثلاث هللات");
    expect(countNoun(50, halala)).toBe("خمسون هللة");
    expect(countNoun(0, riyal)).toBe("صفر ريال سعودي");
  });
});

describe("amount in Arabic", () => {
  test("cheque style with فقط … لا غير", () => {
    expect(amountInArabic(523, 50, OMR, { only: true })).toBe("فقط خمسمائة وثلاثة وعشرون ريالًا عمانيًا وخمسون بيسة لا غير");
    expect(amountInArabic(1500, 0, AED, { only: true })).toBe("فقط ألف وخمسمائة درهم إماراتي لا غير");
    expect(amountInArabic(0, 750, OMR)).toBe("سبعمائة وخمسون بيسة");
    expect(amountInArabic(12, 5, SAR)).toBe("اثنا عشر ريالًا سعوديًا وخمس هللات");
    expect(amountInArabic(100, 25, SAR, { fractionAsNumber: true })).toBe("مائة ريال سعودي و25/100");
  });
});

describe("English", () => {
  test("numbers", () => {
    expect(englishNumber(0)).toBe("Zero");
    expect(englishNumber(21)).toBe("Twenty-One");
    expect(englishNumber(105)).toBe("One Hundred Five");
    expect(englishNumber(1_250_750)).toBe("One Million Two Hundred Fifty Thousand Seven Hundred Fifty");
    expect(englishNumber(12_34_567, true)).toBe("Twelve Lakh Thirty-Four Thousand Five Hundred Sixty-Seven");
    expect(englishNumber(5_00_00_000, true)).toBe("Five Crore");
  });
  test("amounts", () => {
    expect(amountInEnglish(523, 50, OMR, { only: true })).toBe("Five Hundred Twenty-Three Omani Rials and Fifty Baisa Only");
    expect(amountInEnglish(1, 1, SAR)).toBe("One Saudi Riyal and One Halala");
    expect(amountInEnglish(100, 5, OMR, { fractionAsNumber: true, uppercase: true })).toBe("ONE HUNDRED OMANI RIALS AND 005/1000");
    expect(amountInEnglish(150000, 0, INR)).toBe("One Lakh Fifty Thousand Indian Rupees");
  });
});

describe("parseAmount", () => {
  test("separators, digits and precision per currency", () => {
    expect(parseAmount("1,234.5", 1000)).toEqual({ whole: 1234, fraction: 500 });
    expect(parseAmount("١٬٢٣٤٫٥٠", 100)).toEqual({ whole: 1234, fraction: 50 });
    expect(parseAmount("12.345", 100)).toBeNull(); // too many decimals for a 2-decimal currency
    expect(parseAmount("12.340", 100)).toEqual({ whole: 12, fraction: 34 });
    expect(parseAmount("abc", 100)).toBeNull();
    expect(parseAmount("1000000000000", 100)).toBeNull();
  });
});
