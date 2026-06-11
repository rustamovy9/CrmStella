namespace CrmStella.Application.Interfaces.Services;

public interface IEmailService
{
    Task SendVerificationCodeAsync(string toEmail, string fullName, string code);
    Task SendPasswordResetAsync(string toEmail, string fullName, string code);
    Task SendWelcomeAsync(string toEmail, string fullName, string tempPassword);
    Task SendAsync(string toEmail, string subject, string body);
}