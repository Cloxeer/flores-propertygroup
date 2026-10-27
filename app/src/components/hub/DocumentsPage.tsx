import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Download, FileText, FolderOpen, LockKeyhole, Upload } from "lucide-react";
import { toast } from "sonner";
import { useHub } from "@/contexts/HubContext";
import { formatDate } from "@/lib/dates";
import { newId } from "@/lib/utils";
import { pdfDataUrlToBlob } from "@/lib/download";
import type { HubDocument } from "@/lib/types";
import { Badge, EmptyState, HubDialog, PageHeading } from "@/components/hub/Primitives";

const MAX_PDF_BYTES = 3 * 1024 * 1024;
const PDF_MAGIC = "%PDF-";

/** Which milestone completes each uploadable document kind. */
const DOCUMENT_KIND_MILESTONES: Record<string, string> = {
  "Purchase agreement": "earnest",
  "Resolution addendum": "resolution",
  "Closing disclosure": "settlement",
  "Settlement statement": "settlement",
};

interface PdfPreview {
  name: string;
  url: string;
}

/** Document vault route (/documents) and the client portal "Key Documents" view (orig G0). */
export function DocumentsPage({ clientTxId }: { clientTxId?: string }) {
  const { state, update, clientOnly } = useHub();
  const [filter, setFilter] = useState(clientTxId || "all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [transactionId, setTransactionId] = useState(state.transactions[0]?.id || "");
  const [kind, setKind] = useState("Purchase agreement");
  const [finalized, setFinalized] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PdfPreview | null>(null);

  const documents = state.documents.filter(
    (doc) =>
      (filter === "all" || doc.transactionId === filter) &&
      (!clientTxId || (doc.finalized && doc.published)),
  );

  async function submitUpload(event: FormEvent) {
    event.preventDefault();
    if (!file || !transactionId) return;
    if (file.size > MAX_PDF_BYTES) {
      toast.error("Please choose a PDF smaller than 3 MB.");
      return;
    }
    if ((await file.slice(0, 5).text()) !== PDF_MAGIC) {
      toast.error("This file is not a valid PDF.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = String(reader.result);
      try {
        await update((draft) => {
          const transaction = draft.transactions.find((item) => item.id === transactionId);
          draft.documents.push({
            id: newId(),
            transactionId,
            name: file.name,
            kind,
            milestoneId: DOCUMENT_KIND_MILESTONES[kind],
            finalized,
            published:
              finalized &&
              !!transaction?.completedMilestones.includes(DOCUMENT_KIND_MILESTONES[kind]),
            createdAt: new Date().toISOString(),
            data: dataUrl,
            size: file.size,
          });
        });
        toast.success(
          finalized
            ? "Finalized PDF added. It will publish when its milestone is complete."
            : "Draft PDF added to the team vault.",
        );
        setUploadOpen(false);
        setFile(null);
      } catch {
        // update() already surfaces its own failure toast.
      }
    };
    reader.readAsDataURL(file);
  }

  function viewPdf(doc: HubDocument) {
    if (!doc.data) {
      toast.info("Upload a PDF to view this document.");
      return;
    }
    try {
      setPreview({ name: doc.name, url: URL.createObjectURL(pdfDataUrlToBlob(doc.data)) });
    } catch {
      toast.error("This PDF could not be opened.");
    }
  }

  function downloadPdf(doc: HubDocument) {
    if (!doc.data) return;
    const link = document.createElement("a");
    const url = URL.createObjectURL(pdfDataUrlToBlob(doc.data));
    link.href = url;
    link.download = doc.name.endsWith(".pdf") ? doc.name : `${doc.name}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
  }

  function toggleFinalized(docId: string) {
    update((draft) => {
      const doc = draft.documents.find((item) => item.id === docId);
      if (doc) {
        doc.finalized = !doc.finalized;
        doc.published =
          doc.finalized &&
          !!draft.transactions
            .find((item) => item.id === doc.transactionId)
            ?.completedMilestones.includes(doc.milestoneId);
      }
    });
  }

  return (
    <>
      <PageHeading
        title={
          clientTxId
            ? "The important things, all in one place."
            : "A little less searching. A lot more certainty."
        }
        description={
          clientTxId
            ? "Your finalized key documents, ready when you need them."
            : "Your hybrid vault. Finalized milestones become client-ready documents."
        }
        action={
          !clientTxId && !clientOnly ? (
            <button className="button primary" onClick={() => setUploadOpen(true)}>
              <Upload size={15} />
              Upload PDF
            </button>
          ) : undefined
        }
      />
      <div className="vault-explainer">
        <span className="vault-icon">
          <FolderOpen size={24} />
        </span>
        <div>
          <strong>Only the documents that matter.</strong>
          <p>
            Finalized + milestone complete = automatically visible in your client’s Key Documents.
          </p>
        </div>
        <Badge color="sage">
          <LockKeyhole size={12} />
          Private vault
        </Badge>
      </div>
      {!clientTxId && (
        <div className="page-toolbar">
          <span>{documents.length} key documents</span>
          <select
            aria-label="Filter documents by transaction"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All transactions</option>
            {state.transactions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.address}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="documents-grid">
        {documents.map((doc) => (
          <article key={doc.id} className="document-card">
            <div className="document-top">
              <span className="pdf-icon">
                <FileText size={28} />
                <small>PDF</small>
              </span>
              <Badge color={doc.published ? "sage" : doc.finalized ? "blue" : "gold"}>
                {doc.published ? "Client-ready" : doc.finalized ? "Finalized" : "Team draft"}
              </Badge>
            </div>
            <h3>{doc.name}</h3>
            <p>{state.transactions.find((item) => item.id === doc.transactionId)?.address}</p>
            <small>
              {doc.kind} · {formatDate(doc.createdAt.slice(0, 10))}
            </small>
            <div className="document-actions">
              <button className="button secondary small" onClick={() => viewPdf(doc)}>
                View PDF
                <ArrowRight size={13} />
              </button>
              <button
                className="icon-button"
                onClick={() => downloadPdf(doc)}
                aria-label={`Download ${doc.name}`}
              >
                <Download size={16} />
              </button>
            </div>
            {!clientTxId && !clientOnly && (
              <label className="document-finalize">
                <input
                  type="checkbox"
                  checked={doc.finalized}
                  onChange={() => toggleFinalized(doc.id)}
                />
                Finalized milestone PDF
              </label>
            )}
          </article>
        ))}
      </div>
      {documents.length === 0 && (
        <EmptyState
          title="Your important documents will live here."
          description={
            clientTxId
              ? "Your team will add finalized PDFs as your journey moves forward."
              : "Upload a finalized purchase agreement, resolution addendum or closing document."
          }
        />
      )}
      <HubDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Add a key document."
        description="Keep the final version close. Leave the noise behind."
      >
        <form onSubmit={submitUpload} className="form-grid">
          <label className="span-two">
            Transaction
            <select
              required
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
            >
              <option value="">Select a transaction</option>
              {state.transactions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.address}
                </option>
              ))}
            </select>
          </label>
          <label className="span-two">
            Document type
            <select value={kind} onChange={(event) => setKind(event.target.value)}>
              {Object.keys(DOCUMENT_KIND_MILESTONES).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="upload-drop span-two">
            <Upload size={26} />
            <strong>{file?.name || "Choose a key document"}</strong>
            <span>PDF only · up to 3 MB · no unsigned licensed templates</span>
            <input
              required
              type="file"
              accept="application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>
          <label className="checkbox-label span-two">
            <input
              type="checkbox"
              checked={finalized}
              onChange={(event) => setFinalized(event.target.checked)}
            />
            This is the finalized version
          </label>
          <div className="form-note span-two">
            <LockKeyhole size={16} />
            The client only sees finalized PDFs when the associated milestone is marked complete.
          </div>
          <div className="modal-footer span-two">
            <button type="button" className="button secondary" onClick={() => setUploadOpen(false)}>
              Cancel
            </button>
            <button className="button primary" disabled={!file || !transactionId}>
              <Upload size={14} />
              Add document
            </button>
          </div>
        </form>
      </HubDialog>
      {preview && (
        <HubDialog
          open
          onClose={() => {
            URL.revokeObjectURL(preview.url);
            setPreview(null);
          }}
          title={preview.name}
          description="Your key document"
          wide
        >
          <iframe className="pdf-viewer" src={preview.url} title={preview.name} />
          <a className="button secondary" href={preview.url} target="_blank" rel="noreferrer">
            Open PDF in a new tab
            <ArrowRight size={14} />
          </a>
        </HubDialog>
      )}
    </>
  );
}
