using CrmStella.Domain.Enums;

namespace CrmStella.Domain.Entities;

public class FileStorage
{
    public int Id { get; set; }

    public FileOwnerType OwnerType { get; set; }
    public int OwnerId { get; set; }

    public int? UploadedByUserId { get; set; }

    public string OriginalFileName { get; set; } = null!;
    public string StoredFileName { get; set; } = null!;
    public string FilePath { get; set; } = null!;
    public string? Url { get; set; }

    public long FileSize { get; set; }
    public string MimeType { get; set; } = null!;
    public string? Extension { get; set; }

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public User? UploadedByUser { get; set; }
}