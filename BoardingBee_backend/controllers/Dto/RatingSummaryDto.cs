namespace BoardingBee_backend.Controllers.Dto
{
    public class RatingSummaryDto
    {
        public double Average { get; set; }
        public int Count { get; set; }
        public Dictionary<int,int> Histogram { get; set; } = new() { {1,0},{2,0},{3,0},{4,0},{5,0} };
    }
}
