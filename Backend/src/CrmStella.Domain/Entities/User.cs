namespace CrmStella.Domain.Entities;

public class User
{
    public int Id { get; set; }
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string FullName => $"{FirstName} {LastName}".Trim();

    public string Email { get; set; } = null!;
    public string? PhoneNumber { get; set; }
    public string PasswordHash { get; set; } = null!;

    public int RoleId { get; set; }
    public bool IsActive { get; set; } = true;

    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }

    public string? InviteToken { get; set; }
    public DateTime? InviteTokenExpiry { get; set; }
    public bool IsPasswordSet { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;
    public Profile? Profile { get; set; }
    public Mentor? Mentor { get; set; }
    public Student? Student { get; set; }

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<VerificationCode> VerificationCodes { get; set; } = new List<VerificationCode>();
}