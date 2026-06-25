using CrmStella.Application.Common;
using CrmStella.Application.DTOs.Group.Response;
using CrmStella.Application.DTOs.GroupStudent.Request;
using CrmStella.Application.DTOs.GroupStudent.Response;
using CrmStella.Application.DTOs.Mentor.Response;

namespace CrmStella.Application.Interfaces.Services;

public interface IGroupStudentService
{
    Task<Result<GroupStudentResponse>> TransferAsync(TransferStudentRequest request);
    Task<Result<List<GroupStudentResponse>>> GetByGroupAsync(int groupId);
    Task<Result<List<GroupListItemResponse>>> GetMyGroupsAsync(int userId);
    Task<Result<StudentGroupDetailsResponse>> GetMyGroupAsync(int userId, int groupId);
    Task<Result<GroupStudentResponse>> EnrollAsync(EnrollStudentRequest request);
    Task<Result<bool>> RemoveAsync(RemoveStudentRequest request);

    Task<Result<List<GroupListItemResponse>>> GetMentorGroupsAsync(int userId);

    Task<Result<MentorGroupDetailsResponse>> GetMentorGroupAsync(int userId, int groupId);
}