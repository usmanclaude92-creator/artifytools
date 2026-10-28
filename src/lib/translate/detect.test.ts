import { describe, expect, it } from "vitest";
import { detectLanguage } from "./detect";
import { LANGUAGES } from "./languages";

const all = LANGUAGES.map((l) => l.code);

describe("detectLanguage", () => {
  it.each([
    ["The meeting is on Monday at ten, and the report is due on Friday for the team.", "en"],
    ["La réunion a lieu lundi à dix heures et le rapport est pour vendredi.", "fr"],
    ["Das Treffen findet am Montag um zehn Uhr statt und der Bericht ist nicht fertig.", "de"],
    ["La reunión es el lunes a las diez y el informe es para el viernes.", "es"],
    ["La riunione è lunedì alle dieci e il rapporto è per venerdì.", "it"],
    ["De vergadering is maandag om tien uur en het verslag is niet klaar.", "nl"],
    ["Rapat diadakan pada hari Senin dan laporan ini untuk tim kami.", "id"],
    ["Cuộc họp diễn ra vào thứ Hai và báo cáo của chúng tôi được gửi.", "vi"],
    ["سيعقد الاجتماع يوم الاثنين الساعة العاشرة صباحا.", "ar"],
    ["Встреча состоится в понедельник в десять часов.", "ru"],
    ["Зустріч відбудеться в понеділок о десятій годині, їй потрібно.", "uk"],
    ["बैठक सोमवार को सुबह दस बजे है।", "hi"],
    ["会议在星期一上午十点举行。", "zh"],
    ["会議は月曜日の十時です。", "ja"],
    ["회의는 월요일 열 시에 있습니다.", "ko"],
    ["การประชุมคือวันจันทร์เวลาสิบโมง", "th"],
  ])("%s", (text, lang) => {
    expect(detectLanguage(text, all)).toBe(lang);
  });

  it("only offers languages that are allowed", () => {
    expect(detectLanguage("Das Treffen findet am Montag statt und der Bericht ist nicht fertig.", ["en", "ar"])).toBe("en");
    expect(detectLanguage("会议在星期一上午十点举行。", ["en"])).toBeNull();
  });

  it("returns null when there are no letters", () => {
    expect(detectLanguage("12345 ... !!!", all)).toBeNull();
    expect(detectLanguage("", all)).toBeNull();
  });
});
