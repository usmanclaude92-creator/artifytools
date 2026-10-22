// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { ToastProvider } from "@/components/ui/toast";
import type { Locale } from "@/lib/i18n";
import type { FileRules } from "@/lib/files";
import { FileDropZone, FileList, FileProcessingError, useFileQueue, type FileProcessor } from ".";

afterEach(cleanup);

const rules: FileRules = { accept: ["image/*"], maxFileBytes: 1000, maxFiles: 2 };
const file = (name: string, type: string, size: number) => new File([new Uint8Array(size)], name, { type });

function wrap(ui: React.ReactNode, locale: Locale = "en") {
  return render(
    <LocaleProvider locale={locale}>
      <ToastProvider>{ui}</ToastProvider>
    </LocaleProvider>,
  );
}

function input(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

describe("FileDropZone", () => {
  test("accepts valid files and explains rejected ones", () => {
    const onFiles = vi.fn();
    const { container } = wrap(<FileDropZone rules={rules} onFiles={onFiles} typesLabel="JPG or PNG" />);
    expect(input(container).accept).toBe("image/*");
    expect(input(container).multiple).toBe(true);
    fireEvent.change(input(container), { target: { files: [file("a.png", "image/png", 10), file("doc.pdf", "application/pdf", 10), file("big.png", "image/png", 5000)] } });
    expect(onFiles).toHaveBeenCalledTimes(1);
    expect(onFiles.mock.calls[0]![0].map((f: File) => f.name)).toEqual(["a.png"]);
    expect(screen.getByText("“\u2068doc.pdf\u2069” isn't a supported file type.")).toBeTruthy();
    expect(screen.getByText("“\u2068big.png\u2069” is larger than the 1 KB limit.")).toBeTruthy();
    expect(screen.getByText("1 file added.").getAttribute("role")).toBe("status");
  });

  test("dropping files works and counts already-selected files toward the limit", () => {
    const onFiles = vi.fn();
    const { container } = wrap(<FileDropZone rules={rules} onFiles={onFiles} typesLabel="images" existing={[file("x.png", "image/png", 5)]} />);
    const zone = container.querySelector("[data-dropzone]")!;
    fireEvent.drop(zone, { dataTransfer: { files: [file("a.png", "image/png", 10), file("b.png", "image/png", 10)], types: ["Files"] } });
    expect(onFiles.mock.calls[0]![0].map((f: File) => f.name)).toEqual(["a.png"]);
    expect(screen.getByText("“\u2068b.png\u2069” wasn't added: the limit is 2 files.")).toBeTruthy();
  });

  test("pasting files from the clipboard adds them", () => {
    const onFiles = vi.fn();
    wrap(<FileDropZone rules={rules} onFiles={onFiles} typesLabel="images" />);
    const event = new Event("paste", { bubbles: true, cancelable: true }) as Event & { clipboardData: unknown };
    event.clipboardData = { files: [file("shot.png", "image/png", 20)] };
    act(() => {
      document.body.dispatchEvent(event);
    });
    expect(onFiles.mock.calls[0]![0][0].name).toBe("shot.png");
  });

  test("Arabic labels and messages", () => {
    const { container } = wrap(<FileDropZone rules={{ ...rules, maxFiles: 1 }} onFiles={() => {}} typesLabel="PNG" />, "ar");
    expect(screen.getByRole("button", { name: /اختر ملفًا/ })).toBeTruthy();
    expect(input(container).multiple).toBe(false);
    fireEvent.change(input(container), { target: { files: [file("ملف.pdf", "application/pdf", 10)] } });
    expect(screen.getByText("نوع الملف «\u2068ملف.pdf\u2069» غير مدعوم.")).toBeTruthy();
  });
});

function QueueHarness({ processor, concurrency = 1 }: { processor: FileProcessor<string>; concurrency?: number }) {
  const q = useFileQueue(processor, { concurrency });
  return (
    <div>
      <button type="button" onClick={() => q.add([file("a.png", "image/png", 10), file("b.png", "image/png", 20), file("c.png", "image/png", 30)])}>add</button>
      <button type="button" onClick={() => q.cancel()}>cancel</button>
      <button type="button" onClick={() => q.rerun("failed")}>retry</button>
      <p data-testid="busy">{String(q.busy)}</p>
      <FileList items={q.items} onRemove={q.remove} onMove={q.move} onClear={q.clear} actions={(it) => it.result && <span>{it.result}</span>} />
    </div>
  );
}

describe("useFileQueue + FileList", () => {
  test("processes in order with limited concurrency, then reports done", async () => {
    let running = 0;
    let maxRunning = 0;
    const processor: FileProcessor<string> = async (f, { onProgress }) => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      onProgress(0.5);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      return `out-${f.name}`;
    };
    wrap(<QueueHarness processor={processor} concurrency={2} />);
    fireEvent.click(screen.getByText("add"));
    await waitFor(() => expect(screen.getAllByText("Done")).toHaveLength(3));
    expect(maxRunning).toBe(2);
    expect(screen.getByText("out-c.png")).toBeTruthy();
    expect(screen.getByTestId("busy").textContent).toBe("false");
    expect(screen.getByText("3 files · 60 B")).toBeTruthy();
  });

  test("shows processor errors, retries failed items, reorders and removes", async () => {
    let fail = true;
    const processor: FileProcessor<string> = async (f) => {
      if (f.name === "b.png" && fail) throw new FileProcessingError("This image is damaged.");
      if (f.name === "c.png" && fail) throw new Error("internal");
      return "ok";
    };
    wrap(<QueueHarness processor={processor} />);
    fireEvent.click(screen.getByText("add"));
    await waitFor(() => expect(screen.getByText("This image is damaged.")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Something went wrong while processing this file.")).toBeTruthy());

    fail = false;
    fireEvent.click(screen.getByText("retry"));
    await waitFor(() => expect(screen.getAllByText("Done")).toHaveLength(3));

    fireEvent.click(screen.getByRole("button", { name: "Move c.png up" }));
    const names = () => Array.from(document.querySelectorAll("li p[title]")).map((p) => p.textContent);
    expect(names()).toEqual(["a.png", "c.png", "b.png"]);
    expect((screen.getByRole("button", { name: "Move a.png up" }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Remove c.png" }));
    expect(names()).toEqual(["a.png", "b.png"]);
    fireEvent.click(screen.getByRole("button", { name: "Remove all" }));
    expect(document.querySelectorAll("li")).toHaveLength(0);
  });

  test("cancel aborts running work and marks waiting items cancelled", async () => {
    const signals: AbortSignal[] = [];
    const processor: FileProcessor<string> = (_f, { signal }) =>
      new Promise((resolve) => {
        signals.push(signal);
        setTimeout(() => resolve("late"), 50);
      });
    wrap(<QueueHarness processor={processor} />);
    fireEvent.click(screen.getByText("add"));
    await waitFor(() => expect(screen.getByText("Processing…")).toBeTruthy());
    fireEvent.click(screen.getByText("cancel"));
    expect(screen.getAllByText("Cancelled")).toHaveLength(3);
    expect(signals[0]!.aborted).toBe(true);
    await new Promise((r) => setTimeout(r, 80));
    expect(screen.queryByText("Done")).toBeNull(); // late results are ignored
  });
});
