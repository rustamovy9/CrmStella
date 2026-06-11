using CrmStella.Application.Common;
using CrmStella.Application.DTOs.GroupStudent.Request;
using CrmStella.Application.DTOs.GroupStudent.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IGroupStudentService
{
    Task<Result<GroupStudentResponse>> TransferAsync(TransferStudentRequest request);
    Task<Result<List<GroupStudentResponse>>> GetByGroupAsync(int groupId);
    Task<Result<GroupStudentResponse>> EnrollAsync(EnrollStudentRequest request);
    Task<Result<bool>> RemoveAsync(RemoveStudentRequest request);
}