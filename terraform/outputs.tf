output "vpc_id" {
  description = "The ID of the VPC"
  value       = concat(aws_vpc.vpc.*.id, [""])[0]
}
output "region" {
  description = "Region"
  value       = var.region
}
output "profile" {
  description = "Profile"
  value       = var.profile
}
output "public_subnet_arns" {
  description = "List of ARNs of public subnets"
  value       = aws_subnet.subnet_public.*.arn
}
output "availability_zone" {
  description = "A list of availability zones specified as argument to this module"
  value       = var.availability_zone
}