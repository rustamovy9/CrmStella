namespace EduCrm.Domain.Entities;

public class Lesson
{
    public int Id { get; set; }

    public int GroupId { get; set; }
    public int WeekNumber { get; set; }
    public int OrderIndex { get; set; }

    public string Title { get; set; } = null!;
    public string? Description { get; set; }

    public DateTime LessonDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }

    public bool IsCompleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Group Group { get; set; } = null!;

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<Homework> Homeworks { get; set; } = new List<Homework>();
    public ICollection<LessonScore> LessonScores { get; set; } = new List<LessonScore>();
    public ICollection<FileStorage> Files { get; set; } = new List<FileStorage>();
}