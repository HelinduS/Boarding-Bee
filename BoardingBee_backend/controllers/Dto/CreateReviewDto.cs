namespace BoardingBee_backend.Controllers.Dto
{
    public class CreateReviewDto
    {
        public int Rating { get; set; }   // 1-5
        public string? Text { get; set; } // optional
    }
}
