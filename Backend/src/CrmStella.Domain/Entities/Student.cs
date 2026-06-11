namespace CrmStella.Domain.Entities;

public class Student
{
    public int Id { get; set; }
    public int UserId { get; set; }

    public decimal Balance { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;

    public ICollection<GroupStudent> GroupStudents { get; set; } = new List<GroupStudent>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<HomeworkSubmission> HomeworkSubmissions { get; set; } = new List<HomeworkSubmission>();
    public ICollection<LessonScore> LessonScores { get; set; } = new List<LessonScore>();
    public ICollection<ExamResult> ExamResults { get; set; } = new List<ExamResult>();
    public ICollection<WeekResult> WeekResults { get; set; } = new List<WeekResult>();
    public ICollection<StudentProgress> StudentProgresses { get; set; } = new List<StudentProgress>();
}