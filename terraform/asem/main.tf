provider "aws" {
  region = "ap-northeast-2"
  shared_credentials_file = "~/.aws/credentials"
}

module "asem" {
  source = "../"

  profile = "asem"
  region = "ap-northeast-2"
  cidr_vpc = "10.1.0.0/16"
  cidr_public_subnet = ["10.1.11.0/24", "10.1.12.0/24"]
  cidr_private_subnet = ["10.1.1.0/24", "10.1.2.0/24"]
  availability_zone = ["ap-northeast-2a", "ap-northeast-2c"]
  default_tags = {
    Profile = "asem"
    Desc = "Managed by Terraform"
    Stage = "asem"
    Creator = "Terraform"
  }
}
