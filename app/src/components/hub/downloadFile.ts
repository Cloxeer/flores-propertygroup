/**
 * ELI5: Hands the browser some text and asks it to save it as a file.
 * What: Blob + temporary anchor download helper (original `Y0`).
 * Owns: client-side text file download.
 * Depends on: DOM only.
 */
export function downloadFile(fileName: string, content: string, mimeType = "text/plain"): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
