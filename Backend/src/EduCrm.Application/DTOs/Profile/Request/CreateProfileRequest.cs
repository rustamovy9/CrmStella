using System.ComponentModel.DataAnnotations;

namespace EduCrm.Application.DTOs.Profile.Request;

public class CreateProfileRequest
{
    [MaxLength(500, ErrorMessage = "About me must be at most 500 characters")]
    public string? AboutMe { get; set; }

    [DataType(DataType.Date)] public DateOnly? DateOfBirth { get; set; }

    [MaxLength(200, ErrorMessage = "Address must be at most 200 characters")]
    public string? Address { get; set; }

    [RegularExpression(@"^@?[\w]{5,32}$", ErrorMessage = "Invalid Telegram username")]
    public string? TelegramUsername { get; set; }

    [Url(ErrorMessage = "Invalid LinkedIn URL")]
    [MaxLength(500)]
    public string? LinkedInUrl { get; set; } = null;

    [Url(ErrorMessage = "Invalid GitHub URL")]
    [MaxLength(500)]
    public string? GithubUrl { get; set; } = null;
}