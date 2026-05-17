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
        var subject = "Email verification code";
        var body = $"""
                    <h2>Hello, {fullName}!</h2>
                    <p>Your verification code:</p>
                    <h1 style="letter-spacing: 8px">{code}</h1>
                    <p>Code is valid for 5 minutes.</p>
                    """;

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendPasswordResetAsync(string toEmail, string fullName, string code)
    {
        var subject = "Password reset code";
        var body = $"""
                    <h2>Hello, {fullName}!</h2>
                    <p>Your password reset code:</p>
                    <h1 style="letter-spacing: 8px">{code}</h1>
                    <p>Code is valid for 5 minutes.</p>
                    <p>If you did not request this, ignore this email.</p>
                    """;

        await SendAsync(toEmail, subject, body);
    }

    public async Task SendWelcomeAsync(string toEmail, string fullName, string tempPassword)
    {
        var subject = "Welcome to EduCRM";
        var body = $"""
                    <h2>Welcome, {fullName}!</h2>
                    <p>Your account has been created.</p>
                    <p>Email: <b>{toEmail}</b></p>
                    <p>Temporary password: <b>{tempPassword}</b></p>
                    <p>Please change your password after first login.</p>
                    """;

        await SendAsync(toEmail, subject, body);
    }

    private async Task SendAsync(string toEmail, string subject, string body)
    {
        using var client = new SmtpClient(_settings.Host, _settings.Port)
        {
            Credentials = new NetworkCredential(_settings.UserName, _settings.Password),
            EnableSsl = true
        };

        var message = new MailMessage
        {
            From = new MailAddress(_settings.FromEmail, _settings.FromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = true
        };

        message.To.Add(toEmail);
        await client.SendMailAsync(message);
    }
}