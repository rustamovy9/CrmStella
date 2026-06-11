namespace CrmStella.Application.DTOs.Files.Response;

public class FileUploadResponse
{
    public int Id { get; set; }
    public string OriginalFileName { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public string MimeType { get; set; } = string.Empty;
}