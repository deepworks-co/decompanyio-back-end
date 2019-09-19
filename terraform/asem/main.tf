provider "aws" {
  region = "ap-northeast-2"
  shared_credentials_file = "~/.aws/credentials"
}

module "asem" {
  source "../"
}
