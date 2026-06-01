using EduCrm.Domain.Entities;

namespace EduCrm.Application.Interfaces.Repositories;

public interface IGroupStudentRepository
{
    Task<List<GroupStudent>> GetByGroupAsync(int groupId, CancellationToken cancellationToken = default);
    Task<GroupStudent?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> IsActiveEnrollmentAsync(int groupId, int studentId, CancellationToken cancellationToken = default);
    Task<int> CountActiveInGroupAsync(int groupId, CancellationToken cancellationToken = default);

    public Task<List<GroupStudent>> GetDueBillingsAsync(
        DateTime asOf, CancellationToken ct = default);

    Task<GroupStudent?> GetByGroupAndStudentAsync(
        int groupId, int studentId, CancellationToken ct = default);

    Task CreateAsync(GroupStudent groupStudent, CancellationToken cancellationToken = default);
    Task UpdateAsync(GroupStudent groupStudent, CancellationToken cancellationToken = default);
}