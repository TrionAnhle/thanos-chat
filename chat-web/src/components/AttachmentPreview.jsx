import { useEffect, useMemo, useState } from 'react'

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif)$/i
const PDF_EXTENSIONS = /\.pdf$/i
const WORD_EXTENSIONS = /\.(doc|docx)$/i
const EXCEL_EXTENSIONS = /\.(xls|xlsx)$/i
const shortenFromEnd = (value, maxLength = 28) => {
  if (!value || value.length <= maxLength) {
    return value
  }
  return `...${value.slice(-(maxLength - 3))}`
}

const getFilenameFromUrl = (url) => {
  if (!url) {
    return ''
  }
  try {
    const cleanUrl = url.split('?')[0]
    const parts = cleanUrl.split('/').filter(Boolean)
    return parts.length ? parts[parts.length - 1] : ''
  } catch {
    return ''
  }
}

const detectFileKind = ({ attachment, fileUrl }) => {
  const filename = attachment?.name ?? getFilenameFromUrl(fileUrl)
  const mimeType = attachment?.type ?? ''

  const matchers = [
    { kind: 'image', test: () => mimeType.startsWith('image/') || IMAGE_EXTENSIONS.test(filename) },
    { kind: 'pdf', test: () => mimeType === 'application/pdf' || PDF_EXTENSIONS.test(filename) },
    {
      kind: 'doc',
      test: () =>
        mimeType.includes('word') ||
        mimeType === 'application/msword' ||
        WORD_EXTENSIONS.test(filename),
    },
    {
      kind: 'sheet',
      test: () =>
        mimeType.includes('spreadsheet') ||
        mimeType === 'application/vnd.ms-excel' ||
        EXCEL_EXTENSIONS.test(filename),
    },
  ]

  for (const matcher of matchers) {
    if (matcher.test()) {
      return matcher.kind
    }
  }
  return 'other'
}

const AttachmentPreview = ({
  attachment,
  error,
  onRemove,
  fileUrl,
  fileName,
  readOnly = false,
}) => {
  const [objectUrl, setObjectUrl] = useState(null)

  const displayName = useMemo(() => {
    if (attachment?.name) {
      return attachment.name
    }
    if (fileName) {
      return fileName
    }
    const derived = getFilenameFromUrl(fileUrl)
    return derived || 'Attachment'
  }, [attachment, fileName, fileUrl])

  const truncatedDisplayName = useMemo(
    () => shortenFromEnd(displayName, 28),
    [displayName],
  )

  const fileKind = useMemo(
    () => detectFileKind({ attachment, fileUrl }),
    [attachment, fileUrl],
  )

  useEffect(() => {
    if (!attachment || readOnly) {
      setObjectUrl(null)
      return undefined
    }
    const nextPreviewUrl = URL.createObjectURL(attachment)
    setObjectUrl(nextPreviewUrl)
    return () => URL.revokeObjectURL(nextPreviewUrl)
  }, [attachment, readOnly])

  const isImage = fileKind === 'image'
  const previewSrc = isImage ? (fileUrl ?? objectUrl) : null
  const linkTarget = fileUrl ?? objectUrl ?? '#'

  const renderNonImagePreview = () => {
    const kindLabel =
      fileKind === 'pdf'
        ? 'PDF'
        : fileKind === 'doc'
        ? 'DOC'
        : fileKind === 'sheet'
        ? 'XLS'
        : 'FILE'

    return (
      <a
        href={linkTarget}
        target="_blank"
        rel="noreferrer"
        className="user-input__file-chip"
      >
        <span className="user-input__file-chip-ext">{kindLabel}</span>
        <span className="user-input__file-name">{truncatedDisplayName}</span>
      </a>
    )
  }

  const hasAttachment = Boolean(attachment || fileUrl)
  if (!error && !hasAttachment) {
    return null
  }

  return (
    <div className="user-input__attachment">
      {error && <p className="user-input__error">{error}</p>}
      {hasAttachment && (
        <div className={`user-input__preview ${readOnly ? 'user-input__preview--static' : ''}`}>
          {isImage && previewSrc ? (
            <a href={previewSrc} target="_blank" rel="noreferrer">
              <img src={previewSrc} alt={displayName} width="80" height="80" />
            </a>
          ) : (
            renderNonImagePreview()
          )}
          {!readOnly && onRemove && (
            <button type="button" className="link-button" onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default AttachmentPreview
