// DTOs/Profile/Request/CreateProfileRequest.cs

using System.ComponentModel.DataAnnotations;
using CrmStella.Application.Attributes;

namespace CrmStella.Application.DTOs.Profile.Request;

public class CreateProfileRequest
{
    [MaxLength(500, ErrorMessage = "About me must be at most 500 characters")]
    public string? AboutMe { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(200, ErrorMessage = "Address must be at most 200 characters")]
    public string? Address { get; set; }

    [MaxLength(50, ErrorMessage = "Telegram username must be at most 50 characters")]
    public string? TelegramUsername { get; set; }

    [OptionalUrl(ErrorMessage = "Invalid LinkedIn URL")]
    [MaxLength(500)]
    public string? LinkedInUrl { get; set; }

    [OptionalUrl(ErrorMessage = "Invalid GitHub URL")]
    [MaxLength(500)]
    public string? GithubUrl { get; set; }
}