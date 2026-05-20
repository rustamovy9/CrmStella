using System.Net;
using System.Net.Mail;
using EduCrm.Application.Common;
using EduCrm.Application.Interfaces.Services;
using Microsoft.Extensions.Options;

namespace EduCrm.Infrastructure.Services;

public class EmailService(IOptions<EmailSettings> settings) : IEmailService
{
    private readonly EmailSettings _settings = settings.Value;

    public async Task SendVerificationCodeAsync(string toEmail, string fullName, string code)
    {
        var subject = "Your verification code — EduCRM";
        var body = $"""
            <p style="margin: 0 0 6px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Email Verification</p>
            <p style="margin: 0 0 24px; font-size: 15px; color: #444;">Hello, <strong style="color: #111;">{fullName}</strong>. Use the code below to verify your email address.</p>
            <div style="display: inline-block; background: #f4f4f5; border-radius: 10px; padding: 18px 40px; margin: 0 0 24px;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #111;">{code}</span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #999;">This code expires in <strong>5 minutes</strong>. If you didn't request this, you can safely ignore this email.</p>
            """;

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendPasswordResetAsync(string toEmail, string fullName, string code)
    {
        var subject = "Password reset code — EduCRM";
        var body = $"""
            <p style="margin: 0 0 6px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Password Reset</p>
            <p style="margin: 0 0 24px; font-size: 15px; color: #444;">Hello, <strong style="color: #111;">{fullName}</strong>. Use the code below to reset your password.</p>
            <div style="display: inline-block; background: #f4f4f5; border-radius: 10px; padding: 18px 40px; margin: 0 0 24px;">
                <span style="font-family: 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #111;">{code}</span>
            </div>
            <p style="margin: 0; font-size: 13px; color: #999;">This code expires in <strong>5 minutes</strong>. If you didn't request a password reset, please ignore this email — your account remains secure.</p>
            """;

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendWelcomeAsync(string toEmail, string fullName, string tempPassword)
    {
        var subject = "Welcome to EduCRM";
        var body = $"""
            <p style="margin: 0 0 6px; font-size: 13px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Account Created</p>
            <p style="margin: 0 0 24px; font-size: 15px; color: #444;">Hello, <strong style="color: #111;">{fullName}</strong>. Your EduCRM account is ready.</p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin: 0 0 24px;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #ebebeb; color: #888; width: 40%;">Email</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #ebebeb; color: #111; font-weight: 600;">{toEmail}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; color: #888;">Temporary password</td>
                    <td style="padding: 10px 0; font-family: 'Courier New', monospace; color: #111; font-weight: 600; letter-spacing: 1px;">{tempPassword}</td>
                </tr>
            </table>
            <p style="margin: 0; font-size: 13px; color: #999;">Please change your password after your first login.</p>
            """;

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendAsync(string toEmail, string subject, string body)
    {
        try
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
                EnableSsl = true,
                Timeout = 5000
            };

            var html = $"""
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                </head>
                <body style="margin: 0; padding: 0; background: #f6f6f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 16px;">
                        <tr>
                            <td align="center">
                                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px;">

                                    <!-- Header -->
                                    <tr>
                                        <td style="padding: 0 0 20px;">
                                            <table width="100%" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td>
                                                        <span style="font-size: 15px; font-weight: 700; color: #111; letter-spacing: -0.3px;">EduCRM</span>
                                                    </td>
                                                    <td align="right">
                                                        <span style="font-size: 12px; color: #aaa;">Education Management System</span>
                                                    </td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>

                                    <!-- Card -->
                                    <tr>
                                        <td style="background: #ffffff; border-radius: 12px; padding: 36px 40px; border: 1px solid #e8e8ea;">
                                            {body}
                                        </td>
                                    </tr>

                                    <!-- Footer -->
                                    <tr>
                                        <td style="padding: 20px 0 0; text-align: center;">
                                            <span style="font-size: 12px; color: #bbb;">© 2026 EduCRM · This is an automated message, please do not reply.</span>
                                        </td>
                                    </tr>

                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
                """;

            var message = new MailMessage
            {
                From = new MailAddress(_settings.FromEmail, _settings.FromName),
                Subject = subject,
                Body = html,
                IsBodyHtml = true
            };

            message.To.Add(toEmail);
            await client.SendMailAsync(message);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send email to {toEmail}: {ex.Message}");
            throw;
        }
    }
}