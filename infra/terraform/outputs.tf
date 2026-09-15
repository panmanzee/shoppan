output "web_url" {
  description = "CloudFront URL for the Next.js web app"
  value       = "https://${aws_cloudfront_distribution.web.domain_name}"
}

output "api_url" {
  description = "CloudFront URL for the Express API"
  value       = "https://${aws_cloudfront_distribution.api.domain_name}"
}

output "images_cdn_url" {
  description = "CloudFront URL for product images"
  value       = "https://${aws_cloudfront_distribution.images.domain_name}"
}

output "images_bucket_name" {
  description = "S3 bucket name for product images (use for presigned URL generation)"
  value       = aws_s3_bucket.images.bucket
}

output "rds_endpoint" {
  description = "RDS Postgres endpoint (host:port)"
  value       = "${aws_db_instance.main.address}:${aws_db_instance.main.port}"
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name (use with aws ecs update-service on deploy)"
  value       = aws_ecs_cluster.main.name
}

output "alb_dns" {
  description = "ALB DNS (useful for DNS CNAME records)"
  value       = aws_lb.main.dns_name
}
