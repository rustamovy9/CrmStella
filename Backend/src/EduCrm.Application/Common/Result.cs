using EduCrm.Domain.Enums;

namespace EduCrm.Application.Common;

public class Result<T>
{
    public bool IsSuccess { get; }
    public T? Data { get; set; }
    public string? Error { get; }
    public ErrorType? ErrorType { get; }

    private Result(T? data)
    {
        IsSuccess = true;
        Data = data;
    }

    private Result(string error, ErrorType errorType)
    {
        IsSuccess = false;
        Error = error;
        ErrorType = errorType;
    }

    public static Result<T> Ok(T? data) => new(data);

    public static Result<T> Fail(string error, ErrorType errorType = Domain.Enums.ErrorType.NotFound) => new(error, errorType);
}