FROM centos:6

# Install yum.
RUN yum update -y
RUN yum install -y yum install sudo java-1.8.0-openjdk java-1.8.0-openjdk-devel && yum clean all && yum install -y wget
RUN yum install -y openssl-devel
RUN yum install -y gcc-c++ make

# install nodejs 8.x
RUN curl -sL https://rpm.nodesource.com/setup_8.x | sudo -E bash - 
RUN yum install -y nodejs

# Application (nodejs)
COPY ./sample /sample
WORKDIR /sample
EXPOSE 8080
CMD ["npm", "start"]