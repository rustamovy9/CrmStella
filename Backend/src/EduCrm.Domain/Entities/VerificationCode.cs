using EduCrm.Domain.Enums;

namespace EduCrm.Domain.Entities;

public class VerificationCode
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public string CodeHash { get; set; } = null!;
    public VerificationCodeType Type { get; set; }

    public DateTime Expiration { get; set; }
    public bool IsUsed { get; set; } = false;
    public int Attempts { get; set; } = 0;
    public int MaxAttempts { get; set; } = 5;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }

    public User User { get; set; } = null!;
}