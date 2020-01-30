#resources
resource "aws_vpc" "vpc" {
  cidr_block = "${var.cidr_vpc}"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = merge(var.default_tags,
    {
      "Name" = "vpc_${var.profile}"
    }
  )
}

resource "aws_internet_gateway" "igw" {
  vpc_id = "${aws_vpc.vpc.id}"
  tags = merge(var.default_tags,
    {
      "Name" = "igw_${var.profile}"
    }
  )
}

resource "aws_subnet" "public" {
  count = "${length(var.cidr_public_subnet)}"
  
  vpc_id = "${aws_vpc.vpc.id}"
  cidr_block = "${var.cidr_public_subnet[count.index]}"
  map_public_ip_on_launch = "true"
  availability_zone = "${var.availability_zone[count.index]}"
  tags = merge(var.default_tags,
    {
      "Name" = "public_subnet_${var.profile}"
    }
  )
}

resource "aws_route_table" "rtb_public" {
  vpc_id = "${aws_vpc.vpc.id}"

  route {
      cidr_block = "0.0.0.0/0"
      gateway_id = "${aws_internet_gateway.igw.id}"
  }

  tags = merge(var.default_tags,
    {
      "Name" = "rtb_public_${var.profile}"
    }
  )
}



resource "aws_route_table_association" "rta_subnet_public" {
  count = "${length(var.cidr_public_subnet)}"
  subnet_id      = "${aws_subnet.public[count.index].id}"
  route_table_id = "${aws_route_table.rtb_public.id}"
}


resource "aws_eip" "eip" {
  count = "${length(var.cidr_public_subnet)}"

  vpc      = true

  tags = merge(var.default_tags,
    {
      "Name" = "eip_${var.profile}"
    }
  )
}

resource "aws_nat_gateway" "gw" {
  count = "${length(var.cidr_public_subnet)}"

  allocation_id = "${aws_eip.eip[count.index].id}"
  subnet_id     = "${aws_subnet.public[count.index].id}"

  tags = merge(var.default_tags,
    {
      "Name" = "nat_${var.profile}"
    }
  )
}

resource "aws_subnet" "private" {
  count = "${length(var.cidr_private_subnet)}"
  
  vpc_id = "${aws_vpc.vpc.id}"
  cidr_block = "${var.cidr_private_subnet[count.index]}"
  availability_zone = "${var.availability_zone[count.index]}"
  tags = merge(var.default_tags,
    {
      "Name" = "private_subnet_${var.profile}"
    }
  )
}

resource "aws_route_table" "rtb_private" {
  count = "${length(aws_nat_gateway.gw)}"

  vpc_id = "${aws_vpc.vpc.id}"

  route {
      cidr_block = "0.0.0.0/0"
      gateway_id = "${aws_nat_gateway.gw[count.index].id}"
  }

  tags = merge(var.default_tags,
    {
      "Name" = "rtb_private_${var.profile}"
    }
  )
}



resource "aws_route_table_association" "rta_subnet_private" {
  count = "${length(var.cidr_private_subnet)}"
  subnet_id      = "${aws_subnet.private[count.index].id}"
  route_table_id = "${aws_route_table.rtb_private[count.index].id}"
}

resource "aws_security_group" "sg_default" {
  name = "sg_${var.profile}_default"
  vpc_id = "${aws_vpc.vpc.id}"

  # SSH access from the VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags,
    {
      "Name": "sg_default_${var.profile}"
    } 
  )
}

resource "aws_security_group" "sg_lambda" {
  name = "sg_${var.profile}_lambda"
  vpc_id = "${aws_vpc.vpc.id}"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags,
    {
      "Name" = "sg_lambda_${var.profile}"
    } 
  )
}

resource "aws_security_group" "sg_web" {
  name = "sg_${var.profile}_web"
  vpc_id = "${aws_vpc.vpc.id}"

  # SSH access from the VPC
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags,
    {
      "Name": "sg_web_${var.profile}"
    }
  )
}

resource "aws_security_group" "sg_mongodb" {
  name = "sg_${var.profile}_mongodb"
  vpc_id = "${aws_vpc.vpc.id}"

  # SSH access from the VPC
  ingress {
    from_port   = 27017
    to_port     = 27017
    protocol    = "tcp"
    security_groups = ["${aws_security_group.sg_lambda.id}", "${aws_security_group.sg_default.id}"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags,
    {
      "Name" = "sg_mongodb_${var.profile}"
    }
  )
}

resource "aws_security_group" "sg_ssh" {
  name = "sg_${var.profile}_ssh"
  vpc_id = "${aws_vpc.vpc.id}"

  # SSH access from the VPC
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags,
    {
      "Name" = "sg_ssh_${var.profile}"
    }
  )
}

resource "aws_security_group" "sg_endpoint" {
  name = "sg_${var.profile}_endpoint"
  vpc_id = "${aws_vpc.vpc.id}"

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    security_groups = ["${aws_security_group.sg_lambda.id}", "${aws_security_group.sg_default.id}"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.default_tags,
    {
      "Name" = "sg_endpoint_${var.profile}"
    }
  )
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id       = "${aws_vpc.vpc.id}"
  service_name = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  tags = merge(var.default_tags,
    {
      "Name" = "endpoint_s3_${var.profile}"  
    }
  )
}

resource "aws_vpc_endpoint_route_table_association" "s3" {
  count = "${length(aws_route_table.rtb_private)}"

  route_table_id  = "${aws_route_table.rtb_private[count.index].id}"
  vpc_endpoint_id = "${aws_vpc_endpoint.s3.id}"
}