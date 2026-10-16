import nodemailer from 'nodemailer';
import { config } from '../config.js';
import { logger } from '../logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private transporter: any;

  constructor() {
    if (config.email.service === 'nodemailer' && config.email.nodemailer) {
      this.transporter = nodemailer.createTransport({
        host: config.email.nodemailer.host,
        port: config.email.nodemailer.port,
        secure: config.email.nodemailer.port === 465,
        auth: {
          user: config.email.nodemailer.user,
          pass: config.email.nodemailer.password
        }
      });
      logger.info('✅ Nodemailer SMTP configured', {
        host: config.email.nodemailer.host,
        port: config.email.nodemailer.port,
        user: config.email.nodemailer.user,
        secure: config.email.nodemailer.port === 465
      });
    } else {
      logger.warn('⚠️ Email service not configured properly', {
        service: config.email.service,
        hasNodemailer: !!config.email.nodemailer
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      if (!this.transporter) {
        logger.warn('Email transporter not initialized');
        return;
      }

      const result = await this.transporter.sendMail({
        from: `${process.env.MAIL_FROM_NAME || 'FriFri'} <${config.email.nodemailer?.user || 'noreply@frifri.com'}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      logger.info(`Email sent to ${options.to}`, {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected
      });
    } catch (error: any) {
      logger.error(`Failed to send email to ${options.to}`, {
        message: error?.message,
        code: error?.code
      });
    }
  }

  async sendAdminNotification(subject: string, message: string): Promise<void> {
    const adminEmail = config.email.nodemailer?.user || 'admin@frifri.com';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${subject}</h2>
        <p>${message}</p>
        <p style="color: #999; font-size: 12px;">Email amministrativa automatica</p>
      </div>
    `;

    await this.sendEmail({
      to: adminEmail,
      subject: `[ADMIN] ${subject}`,
      html
    });
  }

  async generateWeeklyPoemHtml(poem: { title: string; text: string; author: string }, email?: string): Promise<string> {
    try {
      const templatePath = path.join(__dirname, '../templates/weekly-poem.html');
      let html = fs.readFileSync(templatePath, 'utf-8');
      
      const unsubscribeUrl = email 
        ? `${process.env.APP_URL || 'https://frifri.it'}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
        : `${process.env.APP_URL || 'https://frifri.it'}/api/v1/newsletter/unsubscribe`;

      html = html
        .replace(/{{poemTitle}}/g, poem.title || 'Senza titolo')
        .replace(/{{poemText}}/g, poem.text || '')
        .replace(/{{poemAuthor}}/g, poem.author || 'Autore sconosciuto')
        .replace(/{{appUrl}}/g, process.env.APP_URL || 'https://frifri.it')
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

      return html;
    } catch (error) {
      logger.error('Failed to generate weekly poem HTML:', error);
      throw error;
    }
  }

  async generateNewsletterHtml(subject: string, body: string, email?: string): Promise<string> {
    try {
      const templatePath = path.join(__dirname, '../templates/weekly-poem.html');
      let html = fs.readFileSync(templatePath, 'utf-8');
      
      const unsubscribeUrl = email 
        ? `${process.env.APP_URL || 'https://frifri.it'}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
        : `${process.env.APP_URL || 'https://frifri.it'}/api/v1/newsletter/unsubscribe`;

      html = html
        .replace(/{{poemTitle}}/g, subject || 'Newsletter')
        .replace(/{{poemText}}/g, body || '')
        .replace(/{{poemAuthor}}/g, 'FriFri.it')
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

      return html;
    } catch (error) {
      logger.error('Failed to generate newsletter HTML:', error);
      throw error;
    }
  }

  async sendPrizeCodeEmail(
    playerEmail: string,
    prizeCode: string,
    sponsorName: string,
    gameType: string,
    claimUrl: string,
    playedDate?: Date
  ): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../templates/winner.html');
      let emailHtml = fs.readFileSync(templatePath, 'utf-8');

      emailHtml = emailHtml
        .replace(/{{prizeCode}}/g, prizeCode)
        .replace(/{{sponsorName}}/g, sponsorName)
        .replace(/{{gameName}}/g, gameType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
        .replace(/{{playedDate}}/g, playedDate ? playedDate.toLocaleString('it-IT') : new Date().toLocaleString('it-IT'))
        .replace(/{{claimUrl}}/g, claimUrl)
        .replace(/{{prizeDescription}}/g, `Sconto 20% su articoli in ceramica da ${sponsorName}`);

      await this.sendEmail({
        to: playerEmail,
        subject: `FriFri.it - Codice premio per ${sponsorName}`,
        html: emailHtml
      });
    } catch (error: any) {
      logger.error(`Failed to send prize code email to ${playerEmail}`, {
        message: error?.message
      });
    }
  }

  async sendSponsorNotification(
    sponsorEmail: string,
    prizeCode: string,
    sponsorName: string,
    prizeDescription: string,
    gameName: string,
    playedDate: string,
    claimUrl?: string
  ): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../templates/sponsors.html');
      let emailHtml = fs.readFileSync(templatePath, 'utf-8');

      emailHtml = emailHtml
        .replace(/{{prizeCode}}/g, prizeCode)
        .replace(/{{sponsorName}}/g, sponsorName)
        .replace(/{{prizeDescription}}/g, prizeDescription)
        .replace(/{{gameName}}/g, gameName)
        .replace(/{{playedDate}}/g, playedDate)
        .replace(/{{claimUrl}}/g, claimUrl || '#');

      await this.sendEmail({
        to: sponsorEmail,
        subject: `FriFri.it - Conferma premio assegnato – Codice: ${prizeCode}`,
        html: emailHtml
      });
    } catch (error: any) {
      logger.error(`Failed to send sponsor notification to ${sponsorEmail}`, {
        message: error?.message
      });
    }
  }
  async sendNewsletterWelcome(email: string): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../templates/newsletter-welcome.html');
      let emailHtml = fs.readFileSync(templatePath, 'utf-8');

      const unsubscribeUrl = `${process.env.APP_URL || 'https://frifri.it'}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
      emailHtml = emailHtml
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

      await this.sendEmail({
        to: email,
        subject: 'Benvenuto nella Newsletter di FriFri',
        html: emailHtml
      });
    } catch (error: any) {
      logger.error(`Failed to send newsletter welcome email to ${email}`, {
        message: error?.message
      });
    }
  }

  async sendWeeklyPoem(email: string, poemData: { title: string; text: string; author: string }): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../templates/weekly-poem.html');
      let emailHtml = fs.readFileSync(templatePath, 'utf-8');

      const unsubscribeUrl = `${process.env.APP_URL || 'https://frifri.it'}/api/v1/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
      emailHtml = emailHtml
        .replace(/{{poemTitle}}/g, poemData.title || 'Senza titolo')
        .replace(/{{poemText}}/g, poemData.text || '')
        .replace(/{{poemAuthor}}/g, poemData.author || 'Autore sconosciuto')
        .replace(/{{appUrl}}/g, process.env.APP_URL || 'https://frifri.it')
        .replace(/{{unsubscribeUrl}}/g, unsubscribeUrl);

      await this.sendEmail({
        to: email,
        subject: 'FriFri.it - la tua poesia settimanale',
        html: emailHtml
      });
    } catch (error: any) {
      logger.error(`Failed to send weekly poem to ${email}`, {
        message: error?.message
      });
    }
  }
}

export const emailService = new EmailService();
