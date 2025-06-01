import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FileUpload } from '@/components/FileUpload'

// Mock the file processor utilities
vi.mock('@/lib/locker/fileProcessor', () => ({
  validateFile: vi.fn(),
  formatFileSize: vi.fn((size: number) => `${size} bytes`),
}))

vi.mock('@/lib/locker/constants', () => ({
  FILE_UPLOAD_CONSTANTS: {
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    ACCEPTED_FILE_TYPES: ['image/png', 'image/jpeg', 'text/plain'],
  },
}))

describe(FileUpload, () => {
  const mockOnFileSelect = vi.fn()
  const mockOnFileRemove = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload dropzone when no file is selected', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    )

    expect(screen.getByText('Choose a file or drag it here')).toBeInTheDocument()
    expect(screen.getByText('Browse Files')).toBeInTheDocument()
    expect(screen.getByText('All files will be uploaded to Walrus storage')).toBeInTheDocument()
  })

  it('shows file information when a file is selected', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={mockFile}
      />
    )

    expect(screen.getByText('test.txt')).toBeInTheDocument()
    expect(screen.getByText('File ready for upload')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /remove file/i })).toBeInTheDocument()
  })

  it('shows processing state when file is being processed', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={mockFile}
        isProcessing
        processingProgress={50}
      />
    )

    expect(screen.getByText('Processing file...')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('shows error state when there is an error', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={mockFile}
        error="File processing failed"
      />
    )

    expect(screen.getByText('File processing failed')).toBeInTheDocument()
  })

  it('calls onFileRemove when remove button is clicked', () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })

    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={mockFile}
      />
    )

    const removeButton = screen.getByRole('button', { name: /remove file/i })
    fireEvent.click(removeButton)

    expect(mockOnFileRemove).toHaveBeenCalledTimes(1)
  })

  it('disables interactions when disabled prop is true', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        disabled
      />
    )

    const browseButton = screen.getByText('Browse Files')

    expect(browseButton).toBeDisabled()
  })

  it('shows supported file formats information', () => {
    render(
      <FileUpload
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    )

    expect(screen.getByText(/Supported formats:/)).toBeInTheDocument()
  })
})
