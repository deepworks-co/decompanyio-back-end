# Multi Regional Serverless Application 구축하기

## AWS Blog
[https://aws.amazon.com/ko/blogs/compute/building-a-multi-region-serverless-application-with-amazon-api-gateway-and-aws-lambda/]



## share.decompany.io 테스트용 stack정보,
multi-region-serverless-endpoint-dns
HostedZoneId	ZO260TTPSTOGR
MultiregionEndpoint	api.share.decompany.io	-
Region1Endpoint	d-jtp1zd4ysc.execute-api.ap-northeast-2.amazonaws.com	-
Region1HealthEndpoint	e142fgmuai.execute-api.ap-northeast-2.amazonaws.com	-
Region2Endpoint	d-2jd9su01m0.execute-api.us-west-1.amazonaws.com	-
Region2HealthEndpoint	hxpunkg3kh.execute-api.us-west-1.amazonaws.com

##  Create Stack For Multi Endpoint DNS
 - multi-region-serverless-endpoint-dns.yaml 참조

```yaml
    AWSTemplateFormatVersion: '2010-09-09'
    Description: 'Setting up Service Discovery for two API end points.'
    Parameters:
      Region1HealthEndpoint:
        Description: The health endpoint in the first region.
        Type: String
      Region2HealthEndpoint:
        Description: The health endpoint in the second region.
        Type: String
      Region1Endpoint:
        Description: The endpoint in the first region.
        Type: String
      Region2Endpoint:
        Description: The endpoint in the second region.
        Type: String
      HostedZoneId:
        Description: The hosted zone we will create records in.
        Type: String
      MultiregionEndpoint:
        Description: The hostname of the multi-region endpoint.
        Type: String


    Resources:
      HealthcheckRegion1:
        Type: "AWS::Route53::HealthCheck"
        Properties:
          HealthCheckConfig:
            Port: "443"
            Type: "HTTPS_STR_MATCH"
            SearchString: "ok"
            ResourcePath: "/asem/api/tags?t=latest"
            FullyQualifiedDomainName: !Ref Region1HealthEndpoint
            RequestInterval: "30"
            FailureThreshold: "2"

      HealthcheckRegion2:
        Type: "AWS::Route53::HealthCheck"
        Properties:
          HealthCheckConfig:
            Port: "443"
            Type: "HTTPS_STR_MATCH"
            SearchString: "ok"
            ResourcePath: "/dev/api/tags?t=latest"
            FullyQualifiedDomainName: !Ref Region2HealthEndpoint
            RequestInterval: "30"
            FailureThreshold: "2"


      Region1EndpointRecord:
              Type: AWS::Route53::RecordSet
              Properties:
                Region: ap-northeast-2
                HealthCheckId: !Ref HealthcheckRegion1
                SetIdentifier: "endpoint-region1"
                HostedZoneId: !Ref HostedZoneId
                Name: !Ref MultiregionEndpoint
                Type: CNAME
                TTL: 60
                ResourceRecords:
                  - !Ref Region1Endpoint


      Region2EndpointRecord:
        Type: AWS::Route53::RecordSet
        Properties:
          Region: us-west-1
          HealthCheckId: !Ref HealthcheckRegion2
          SetIdentifier: "endpoint-region2"
          HostedZoneId: !Ref HostedZoneId
          Name: !Ref MultiregionEndpoint
          Type: CNAME
          TTL: 60
          ResourceRecords:
            - !Ref Region2Endpoint

```