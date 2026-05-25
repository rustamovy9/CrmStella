namespace EduCrm.Domain.Constants;

public static class AuditActions
{
    public const string Login = "Login";
    public const string Logout = "Logout";
    public const string Register = "Register";
    public const string RefreshToken = "RefreshToken";
    public const string AssignRole = "AssignRole";

    public const string ForgotPassword = "ForgotPassword";
    public const string VerifyResetCode = "VerifyResetCode";
    public const string ResetPassword = "ResetPassword";
    public const string ChangePassword = "ChangePassword";

    public const string CreateUser = "CreateUser";
    public const string UpdateUser = "UpdateUser";
    public const string DeleteUser = "DeleteUser";
    public const string ActivateUser = "ActivateUser";
    public const string DeactivateUser = "DeactivateUser";
    public const string ChangeUserRole = "ChangeUserRole";

    public const string CreateProfile = "CreateProfile";
    public const string UpdateProfile = "UpdateProfile";
    public const string DeleteProfile = "DeleteProfile";
    public const string UploadAvatar = "UploadAvatar";
    public const string DeleteAvatar = "DeleteAvatar";

    public const string CreateMentor = "CreateMentor";
    public const string UpdateMentor = "UpdateMentor";
    public const string DeleteMentor = "DeleteMentor";

    public const string CreateStudent = "CreateStudent";
    public const string UpdateStudent = "UpdateStudent";
    public const string DeleteStudent = "DeleteStudent";
    public const string EnrollStudent = "EnrollStudent";

    public const string CreateCourse = "CreateCourse";
    public const string UpdateCourse = "UpdateCourse";
    public const string DeleteCourse = "DeleteCourse";
    public const string SetCourseStatus = "SetCourseStatus";
    public const string PublishCourse = "PublishCourse";
    public const string ArchiveCourse = "ArchiveCourse";

    public const string CreateGroup = "CreateGroup";
    public const string UpdateGroup = "UpdateGroup";
    public const string DeleteGroup = "DeleteGroup";
    public const string SetGroupStatus = "SetGroupStatus";
    public const string TransferStudent = "TransferStudent";
    public const string AddStudentToGroup = "AddStudentToGroup";
    public const string RemoveStudentFromGroup = "RemoveStudentFromGroup";

    public const string CreateSchedule = "CreateSchedule";
    public const string UpdateSchedule = "UpdateSchedule";
    public const string DeleteSchedule = "DeleteSchedule";

    public const string MarkAttendance = "MarkAttendance";
    public const string UpdateAttendance = "UpdateAttendance";
    public const string DeleteAttendance = "DeleteAttendance";

    public const string CreatePayment = "CreatePayment";
    public const string UpdatePayment = "UpdatePayment";
    public const string DeletePayment = "DeletePayment";
    public const string ConfirmPayment = "ConfirmPayment";
    public const string RefundPayment = "RefundPayment";
    public const string UploadPaymentReceipt = "UploadPaymentReceipt";

    public const string CreateHomework = "CreateHomework";
    public const string UpdateHomework = "UpdateHomework";
    public const string DeleteHomework = "DeleteHomework";
    public const string SubmitHomework = "SubmitHomework";
    public const string GradeHomework = "GradeHomework";
    public const string SetHomeworkStatus = "SetHomeworkStatus";

    public const string CreateExam = "CreateExam";
    public const string UpdateExam = "UpdateExam";
    public const string SetExamStatus = "SetExamStatus";
    public const string CreateExamResult = "CreateExamResult";
    public const string UpdateExamResult = "UpdateExamResult";

    public const string CreateLesson = "CreateLesson";
    public const string UpdateLesson = "UpdateLesson";
    public const string DeleteLesson = "DeleteLesson";

    public const string CreateLessonScore = "CreateLessonScore";
    public const string UpdateLessonScore = "UpdateLessonScore";
    public const string DeleteLessonScore = "DeleteLessonScore";

    public const string CreateNotification = "CreateNotification";
    public const string UpdateNotification = "UpdateNotification";
    public const string DeleteNotification = "DeleteNotification";
    public const string MarkNotificationAsRead = "MarkNotificationAsRead";
    public const string MarkAllNotificationsAsRead = "MarkAllNotificationsAsRead";

    public const string UploadFile = "UploadFile";
    public const string DeleteFile = "DeleteFile";

    public const string RecalculateWeekResult = "RecalculateWeekResult";
    public const string UpdateWeekResultComment = "UpdateWeekResultComment";


    public const string SystemError = "SystemError";
    public const string AccessDenied = "AccessDenied";
    public const string ClearCache = "ClearCache";
    public const string SendEmail = "SendEmail";
    public const string SendVerificationCode = "SendVerificationCode";
    
    //
    public const string AssignRole = "assign_role";
}