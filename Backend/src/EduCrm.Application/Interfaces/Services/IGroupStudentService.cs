using EduCrm.Application.Common;
using EduCrm.Application.DTOs.GroupStudent.Request;
using EduCrm.Application.DTOs.GroupStudent.Response;

namespace EduCrm.Application.Interfaces.Services;

public interface IGroupStudentService
{Task<Result<GroupStudentResponse>> TransferAsync(TransferStudentRequest request);
    Task<Result<List<GroupStudentResponse>>> GetByGroupAsync(int groupId);
    Task<Result<GroupStudentResponse>> EnrollAsync(EnrollStudentRequest request);
    Task<Result<bool>> RemoveAsync(RemoveStudentRequest request);
}