namespace BoardingBee_backend.Controllers.Dto
{
    public class ReviewResponseDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string? Username { get; set; }
        public int Rating { get; set; }
        public string? Text { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
