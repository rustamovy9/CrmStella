namespace EduCrm.Domain.Entities;

public class Mentor
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public string? Specialization { get; set; }
    public int? ExperienceYears { get; set; }
    public DateTime HireDate { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;

    public User User { get; set; } = null!;
    public ICollection<Group> Groups { get; set; } = new List<Group>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}