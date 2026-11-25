/** Amount in cents shown in a number field, always with cents when not zero (480 → "4.80", 0 → "0"). */
export const inputAmount = (cents: number) => (cents === 0 ? "0" : (cents / 100).toFixed(2));

/** Hands the viewer a file generated in the browser. */
export function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
