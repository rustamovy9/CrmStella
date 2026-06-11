namespace CrmStella.Domain.Enums;

public enum VerificationCodeType
{
    EmailConfirmation = 1,
    PasswordReset = 2,
    LoginTwoFactor = 3,
    PhoneConfirmation = 4
}