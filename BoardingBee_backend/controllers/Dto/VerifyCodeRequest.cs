namespace BoardingBee_backend.Controllers.Dto
{
    public class VerifyCodeRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty; // 6-digit OTP
    }
}
