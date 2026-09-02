import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "../config/env";
import { logger } from "../config/logger";

// ─── Notification Data Interfaces ─────────────────────────────────────────────

export interface TravelRequestNotificationData {
  requestId: string;
  employeeName: string;
  employeeId: string;
  department: string;
  designation: string;
  origin: string;
  destination: string;
  departureDate: Date | string;
  returnDate?: Date | string | null;
  tripType: string;
  purpose: string;
  additionalInfo?: string | null;
  status: string;
  createdAt: Date | string;
}

export interface TravelApprovalNotificationData {
  requestId: string;
  employeeEmail: string;
  employeeName: string;
  origin: string;
  destination: string;
  departureDate: Date | string;
  returnDate?: Date | string | null;
  purpose: string;
  approvedBy: string;
  approvalDate: Date | string;
}

export interface TravelRejectionNotificationData {
  requestId: string;
  employeeEmail: string;
  employeeName: string;
  origin: string;
  destination: string;
  departureDate: Date | string;
  returnDate?: Date | string | null;
  purpose: string;
  rejectedBy: string;
  rejectionDate: Date | string;
  rejectionReason: string;
}

export interface BookingConfirmationNotificationData {
  requestId: string;
  bookingId: string;
  employeeEmail: string;
  employeeName: string;
  origin: string;
  destination: string;
  airline: string;
  flightNumber: string;
  pnr: string;
  ticketNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureDatetime: Date | string;
  arrivalDatetime: Date | string;
  fare: number | string;
  currency: string;
  seat?: string | null;
  baggage?: string | null;
  vendor: string;
  bookingSource: string;
  bookingDate: Date | string;
  hasTicketFile?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***";
  const [local, domain] = parts;
  const maskedLocal =
    (local?.length ?? 0) > 2
      ? `${local?.substring(0, 2)}***`
      : `${local?.substring(0, 1)}***`;
  return `${maskedLocal}@${domain}`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "N/A";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDatetime(d: Date | string | null | undefined): string {
  if (!d) return "N/A";
  const dateObj = typeof d === "string" ? new Date(d) : d;
  return dateObj.toLocaleString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

// ─── HTML Template Wrapper ────────────────────────────────────────────────────

function buildHtmlTemplate(title: string, headerBadge: string, contentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 20px; color: #1e293b; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .header { background: #0f172a; color: #ffffff; padding: 24px; text-align: left; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }
    .header .subtitle { font-size: 13px; color: #94a3b8; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 600; border-radius: 4px; margin-top: 12px; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }
    .badge-booked { background: #e0e7ff; color: #3730a3; }
    .content { padding: 24px; }
    .info-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    .info-table td { padding: 10px 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    .info-table td.label { font-weight: 600; color: #64748b; width: 35%; background: #f8fafc; }
    .info-table td.value { color: #1e293b; }
    .footer { background: #f8fafc; padding: 16px 24px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ETMS</h1>
      <div class="subtitle">Enterprise Travel Management System</div>
      ${headerBadge}
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      This is an automated notification from Enterprise Travel Management System (ETMS). Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>`;
}

// ─── Email Service Class ──────────────────────────────────────────────────────

export class EmailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initTransporter();
  }

  /**
   * Initializes the Nodemailer transporter using environment variables.
   */
  private initTransporter(): void {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
      this.isConfigured = true;
    } else {
      this.isConfigured = false;
    }
  }

  /**
   * Allows setting a custom transporter (useful for mocking during automated tests).
   */
  public setTransporter(customTransporter: Transporter | null): void {
    this.transporter = customTransporter;
    this.isConfigured = customTransporter !== null;
  }

  /**
   * Sends an email safely.
   * Catches errors internally so email failure NEVER breaks a business transaction.
   */
  public async sendMail(options: {
    to: string;
    subject: string;
    html: string;
    type: string;
    metadata?: Record<string, unknown>;
  }): Promise<boolean> {
    const maskedTo = maskEmail(options.to);

    logger.info(`[EMAIL_ATTEMPT] Sending ${options.type} email to ${maskedTo}`, {
      type: options.type,
      subject: options.subject,
      ...options.metadata,
    });

    if (!this.isConfigured || !this.transporter) {
      logger.warn(
        `[EMAIL_SIMULATED] SMTP not configured. Skipped sending real email to ${maskedTo}.`,
        { type: options.type, ...options.metadata }
      );
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info(`[EMAIL_SENT] Successfully delivered ${options.type} to ${maskedTo}`, {
        type: options.type,
        ...options.metadata,
      });
      return true;
    } catch (error) {
      logger.error(`[EMAIL_FAILED] Failed to deliver ${options.type} to ${maskedTo}`, error, {
        type: options.type,
        ...options.metadata,
      });
      return false;
    }
  }

  // ─── 1. New Travel Request Notification (Sent to Admin) ─────────────────────

  public async sendTravelRequestNotification(
    data: TravelRequestNotificationData
  ): Promise<boolean> {
    const title = `New Travel Request — ${data.origin} to ${data.destination}`;
    const badge = `<span class="badge badge-pending">PENDING APPROVAL</span>`;

    const contentHtml = `
      <p>Hello Admin,</p>
      <p>A new travel request has been submitted and is awaiting your review.</p>
      <table class="info-table">
        <tr><td class="label">Request ID</td><td class="value">${data.requestId}</td></tr>
        <tr><td class="label">Employee</td><td class="value">${data.employeeName} (${data.employeeId})</td></tr>
        <tr><td class="label">Department</td><td class="value">${data.department}</td></tr>
        <tr><td class="label">Designation</td><td class="value">${data.designation}</td></tr>
        <tr><td class="label">Route</td><td class="value"><strong>${data.origin}</strong> → <strong>${data.destination}</strong></td></tr>
        <tr><td class="label">Trip Type</td><td class="value">${data.tripType}</td></tr>
        <tr><td class="label">Departure Date</td><td class="value">${formatDate(data.departureDate)}</td></tr>
        ${data.returnDate ? `<tr><td class="label">Return Date</td><td class="value">${formatDate(data.returnDate)}</td></tr>` : ""}
        <tr><td class="label">Purpose</td><td class="value">${data.purpose}</td></tr>
        ${data.additionalInfo ? `<tr><td class="label">Additional Notes</td><td class="value">${data.additionalInfo}</td></tr>` : ""}
        <tr><td class="label">Submitted On</td><td class="value">${formatDatetime(data.createdAt)}</td></tr>
      </table>
      <p>Please log in to the ETMS Admin Portal to review and approve or reject this request.</p>
    `;

    const html = buildHtmlTemplate(title, badge, contentHtml);

    return this.sendMail({
      to: env.ADMIN_EMAIL,
      subject: `[ETMS] New Travel Request from ${data.employeeName} (${data.origin} → ${data.destination})`,
      html,
      type: "TRAVEL_REQUEST_CREATED",
      metadata: { requestId: data.requestId, employeeId: data.employeeId },
    });
  }

  // ─── 2. Travel Approval Notification (Sent to Employee) ────────────────────

  public async sendTravelApprovalNotification(
    data: TravelApprovalNotificationData
  ): Promise<boolean> {
    const title = `Travel Request Approved — ${data.origin} to ${data.destination}`;
    const badge = `<span class="badge badge-approved">APPROVED</span>`;

    const contentHtml = `
      <p>Dear ${data.employeeName},</p>
      <p>Great news! Your travel request has been <strong>approved</strong> by administration.</p>
      <table class="info-table">
        <tr><td class="label">Request ID</td><td class="value">${data.requestId}</td></tr>
        <tr><td class="label">Route</td><td class="value"><strong>${data.origin}</strong> → <strong>${data.destination}</strong></td></tr>
        <tr><td class="label">Departure Date</td><td class="value">${formatDate(data.departureDate)}</td></tr>
        ${data.returnDate ? `<tr><td class="label">Return Date</td><td class="value">${formatDate(data.returnDate)}</td></tr>` : ""}
        <tr><td class="label">Purpose</td><td class="value">${data.purpose}</td></tr>
        <tr><td class="label">Approved By</td><td class="value">${data.approvedBy}</td></tr>
        <tr><td class="label">Approval Date</td><td class="value">${formatDatetime(data.approvalDate)}</td></tr>
      </table>
      <p>Our travel desk is currently processing your flight booking. You will receive a separate confirmation email with your ticket details once booked.</p>
    `;

    const html = buildHtmlTemplate(title, badge, contentHtml);

    return this.sendMail({
      to: data.employeeEmail,
      subject: `[ETMS] Travel Request Approved: ${data.origin} → ${data.destination}`,
      html,
      type: "TRAVEL_REQUEST_APPROVED",
      metadata: { requestId: data.requestId },
    });
  }

  // ─── 3. Travel Rejection Notification (Sent to Employee) ────────────────────

  public async sendTravelRejectionNotification(
    data: TravelRejectionNotificationData
  ): Promise<boolean> {
    const title = `Travel Request Update — ${data.origin} to ${data.destination}`;
    const badge = `<span class="badge badge-rejected">REJECTED</span>`;

    const contentHtml = `
      <p>Dear ${data.employeeName},</p>
      <p>We regret to inform you that your travel request has been <strong>rejected</strong>.</p>
      <table class="info-table">
        <tr><td class="label">Request ID</td><td class="value">${data.requestId}</td></tr>
        <tr><td class="label">Route</td><td class="value"><strong>${data.origin}</strong> → <strong>${data.destination}</strong></td></tr>
        <tr><td class="label">Departure Date</td><td class="value">${formatDate(data.departureDate)}</td></tr>
        ${data.returnDate ? `<tr><td class="label">Return Date</td><td class="value">${formatDate(data.returnDate)}</td></tr>` : ""}
        <tr><td class="label">Purpose</td><td class="value">${data.purpose}</td></tr>
        <tr><td class="label">Reviewed By</td><td class="value">${data.rejectedBy}</td></tr>
        <tr><td class="label">Rejection Date</td><td class="value">${formatDatetime(data.rejectionDate)}</td></tr>
        <tr><td class="label">Reason</td><td class="value" style="color: #b91c1c; font-weight: 600;">${data.rejectionReason}</td></tr>
      </table>
      <p>If you have any questions or require further clarification, please reach out to your reporting manager or the administration team.</p>
    `;

    const html = buildHtmlTemplate(title, badge, contentHtml);

    return this.sendMail({
      to: data.employeeEmail,
      subject: `[ETMS] Travel Request Rejected: ${data.origin} → ${data.destination}`,
      html,
      type: "TRAVEL_REQUEST_REJECTED",
      metadata: { requestId: data.requestId },
    });
  }

  // ─── 4. Flight Booking Confirmation (Sent to Employee) ─────────────────────

  public async sendBookingConfirmation(
    data: BookingConfirmationNotificationData
  ): Promise<boolean> {
    const title = `Flight Booking Confirmed — ${data.airline} (${data.origin} → ${data.destination})`;
    const badge = `<span class="badge badge-booked">BOOKED</span>`;

    const contentHtml = `
      <p>Dear ${data.employeeName},</p>
      <p>Your flight tickets for your upcoming trip to <strong>${data.destination}</strong> have been confirmed.</p>
      <table class="info-table">
        <tr><td class="label">Request ID</td><td class="value">${data.requestId}</td></tr>
        <tr><td class="label">Airline</td><td class="value"><strong>${data.airline}</strong> (${data.flightNumber})</td></tr>
        <tr><td class="label">PNR / Booking Ref</td><td class="value" style="font-size: 16px; font-weight: 700; color: #1e40af;">${data.pnr}</td></tr>
        <tr><td class="label">Ticket Number</td><td class="value">${data.ticketNumber}</td></tr>
        <tr><td class="label">Departure</td><td class="value"><strong>${data.departureAirport}</strong> at ${formatDatetime(data.departureDatetime)}</td></tr>
        <tr><td class="label">Arrival</td><td class="value"><strong>${data.arrivalAirport}</strong> at ${formatDatetime(data.arrivalDatetime)}</td></tr>
        ${data.seat ? `<tr><td class="label">Seat</td><td class="value">${data.seat}</td></tr>` : ""}
        ${data.baggage ? `<tr><td class="label">Baggage Allowance</td><td class="value">${data.baggage}</td></tr>` : ""}
        <tr><td class="label">Fare</td><td class="value">${data.currency} ${data.fare}</td></tr>
        <tr><td class="label">Booking Vendor</td><td class="value">${data.vendor}</td></tr>
        <tr><td class="label">Booking Date</td><td class="value">${formatDatetime(data.bookingDate)}</td></tr>
        <tr><td class="label">E-Ticket File</td><td class="value">Available to view/download in your authenticated ETMS dashboard</td></tr>
      </table>
      <p>Please ensure you carry a valid government-issued photo ID and reach the airport at least 2 hours prior to domestic departure.</p>
    `;

    const html = buildHtmlTemplate(title, badge, contentHtml);

    return this.sendMail({
      to: data.employeeEmail,
      subject: `[ETMS] Flight Confirmed: ${data.airline} ${data.flightNumber} [PNR: ${data.pnr}]`,
      html,
      type: "FLIGHT_BOOKING_CONFIRMED",
      metadata: { requestId: data.requestId, bookingId: data.bookingId, pnr: data.pnr },
    });
  }
}

export const emailService = new EmailService();
