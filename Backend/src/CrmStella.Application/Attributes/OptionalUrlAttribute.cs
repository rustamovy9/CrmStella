using System.ComponentModel.DataAnnotations;

namespace CrmStella.Application.Attributes;

public class OptionalUrlAttribute : ValidationAttribute
{
    public override bool IsValid(object? value)
    {
        if (value is null) return true;

        var url = value as string;

        if (string.IsNullOrWhiteSpace(url)) return true;

        return Uri.TryCreate(url, UriKind.Absolute, out var result)
               && (result.Scheme == Uri.UriSchemeHttp || result.Scheme == Uri.UriSchemeHttps);
    }
}