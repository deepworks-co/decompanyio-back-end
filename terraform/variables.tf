# Variables
variable "profile" {
  default = "asem"
}

variable "region" {
  default = "ap-northeast-2"
}

variable "cidr_vpc" {
  description = "CIDR block for the VPC"
  default = "10.1.0.0/16"
}

variable "cidr_public_subnet" {
  description = "CIDR block for the public subnet"
  default = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]  
}

variable "cidr_private_subnet" {
  description = "CIDR block for the private subnet"
  default = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "availability_zone" {
  description = "availability zone to create subnet"
  default = ["ap-northeast-2a", "ap-northeast-2b", "ap-northeast-2c"]
}

variable "default_tags" {
  type = "map"
  default = {
    Profile = "asem"
    Desc = "Managed by Terraform"
    Stage = "asem"
    Creator = "Terraform"
  }
}