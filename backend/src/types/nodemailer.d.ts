declare module "nodemailer" {
  export interface SendMailOptions {
    from?: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename?: string;
      content?: Buffer | string;
      path?: string;
      contentType?: string;
    }>;
  }

  export interface Transporter {
    sendMail(
      options: SendMailOptions,
      callback?: (err: Error | null, info: unknown) => void
    ): Promise<unknown>;
  }

  export interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
    [key: string]: unknown;
  }

  export function createTransport(
    options: TransportOptions | unknown
  ): Transporter;
}
