/** Amount in cents shown in a form field (e.g. 1250 → "12.5"). */
export const inputAmount = (cents: number) => String(cents / 100);

/** Hands the viewer a file generated in the browser. */
export function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
