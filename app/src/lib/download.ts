/**
 * ELI5: Helpers that hand a file to the browser so it downloads.
 * What: Blob download trigger and data-URL (PDF) to Blob conversion.
 * Owns: file-download helpers shared by workspace pages.
 * Depends on: browser DOM APIs only.
 */

/** Triggers a browser download of `content` as `filename`. */
export function downloadTextFile(filename: string, content: string, mimeType = "text/plain"): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Converts a `data:application/pdf;base64,...` URL into a PDF Blob. */
export function pdfDataUrlToBlob(dataUrl: string): Blob {
  const binary = atob(dataUrl.split(",")[1]);
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], {
    type: "application/pdf",
  });
}
