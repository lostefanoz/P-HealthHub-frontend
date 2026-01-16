import { ReportsService } from '../application/services/ReportsService'
import type { ReportDto, PagedResult } from '../infrastructure/api/ReportsApiClient'

const reportsService = new ReportsService()

export type { ReportDto, PagedResult }

export async function listReports(params?: {
  appointment_id?: number
  archived_only?: boolean
  q?: string
  limit?: number
  offset?: number
  uploaded_from?: string
  uploaded_to?: string
}) {
  return reportsService.listReports(params)
}

export async function uploadReport(data: { appointment_id: number; note?: string; file?: File | null }) {
  return reportsService.uploadReport(data)
}

export async function previewReport(reportId: number) {
  return reportsService.previewReport(reportId)
}

export async function downloadReport(reportId: number) {
  return reportsService.downloadReport(reportId)
}

export async function deleteReportWithNote(reportId: number, note: string) {
  return reportsService.deleteReportWithNote(reportId, note)
}

export async function updateReportNote(reportId: number, note: string) {
  return reportsService.updateReportNote(reportId, note)
}
