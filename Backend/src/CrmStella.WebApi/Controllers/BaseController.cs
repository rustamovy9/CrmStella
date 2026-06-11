using System.Security.Claims;
using CrmStella.Application.Common;
using CrmStella.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace CrmStella.WebApi.Controllers;

[ApiController]
public class BaseController : ControllerBase
{
    protected int GetUserId()
    {
        return int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    protected string GetUserRole()
    {
        return User.FindFirstValue(ClaimTypes.Role)!;
    }

    protected IActionResult HandleResult<T>(Result<T> result, int successStatusCode = 200)
    {
        if (result.IsSuccess)
            return StatusCode(successStatusCode, result);

        return HandleError(result);
    }

    protected IActionResult HandleError<T>(Result<T> result)
    {
        return result.ErrorType switch
        {
            ErrorType.Validation => BadRequest(result),
            ErrorType.BadRequest => BadRequest(result),
            ErrorType.NotFound => NotFound(result),
            ErrorType.Conflict => Conflict(result),
            ErrorType.Unauthorized => Unauthorized(result),
            ErrorType.Forbidden => StatusCode(StatusCodes.Status403Forbidden, result),
            ErrorType.NoChange => StatusCode(StatusCodes.Status304NotModified, result),
            ErrorType.Unknown => StatusCode(StatusCodes.Status500InternalServerError, result),
            _ => StatusCode(StatusCodes.Status500InternalServerError, result)
        };
    }
}