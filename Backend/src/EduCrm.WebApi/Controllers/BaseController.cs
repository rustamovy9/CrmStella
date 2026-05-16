using EduCrm.Application.Common;
using EduCrm.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace EduCrm.WebApi.Controllers;

[ApiController]
public class BaseController : ControllerBase
{
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