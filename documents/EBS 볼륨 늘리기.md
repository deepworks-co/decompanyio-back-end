## EBS Volume 늘리기
> https://docs.aws.amazon.com/ko_kr/AWSEC2/latest/UserGuide/recognize-expanded-volume-linux.html
EBS 콘솔에서 Modify Volume 하고 난뒤

### Nitro 기반 인스턴스의 파일 시스템
```bash
lsblk
sudo growpart /dev/nvme0n1 1
sudo xfs_growfs -d /
```

### T2계열 인스턴스

```bash
lsblk
sudo growpart /dev/xvda 1
lsblk
sudo resize2fs /dev/xvda1
```