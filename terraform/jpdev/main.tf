provider "aws" {
  region = "ap-northeast-1"
  shared_credentials_file = "~/.aws/credentials"
}

module "mgt" {
  source = "../"

  profile = "jpdev"
  region = "ap-northeast-1"
  cidr_vpc = "10.1.0.0/16"
  cidr_public_subnet = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
  cidr_private_subnet = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
  availability_zone = ["ap-northeast-1a", "ap-northeast-1c", "ap-northeast-1d"]
  default_tags = {
    Profile = "jpdev"
    Desc = "Managed by Terraform"
    Stage = "jpdev"
    Creator = "Terraform"
  }
}
