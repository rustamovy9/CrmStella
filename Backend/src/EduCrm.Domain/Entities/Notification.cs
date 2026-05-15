using EduCrm.Domain.Enums;

namespace EduCrm.Domain.Entities;

public class Notification
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public NotificationType Type { get; set; } = NotificationType.Info;

    public bool IsRead { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    public User User { get; set; } = null!;
}