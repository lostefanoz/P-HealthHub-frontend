import { ReportsApiClient, ReportDto, PagedResult } from '../../infrastructure/api/ReportsApiClient'

export class ReportsService {
  constructor(private client: ReportsApiClient = new ReportsApiClient()) {}

  listReports(params?: {
    appointment_id?: number
    archived_only?: boolean
    q?: string
    limit?: number
    offset?: number
    uploaded_from?: string
    uploaded_to?: string
  }): Promise<PagedResult<ReportDto>> {
    return this.client.listReports(params)
  }

  uploadReport(data: { appointment_id: number; note?: string; file?: File | null }) {
    return this.client.uploadReport(data)
  }

  previewReport(reportId: number) {
    return this.client.previewReport(reportId)
  }

  downloadReport(reportId: number) {
    return this.client.downloadReport(reportId)
  }

  deleteReportWithNote(reportId: number, note: string) {
    return this.client.deleteReportWithNote(reportId, note)
  }

  updateReportNote(reportId: number, note: string) {
    return this.client.updateReportNote(reportId, note)
  }
}
