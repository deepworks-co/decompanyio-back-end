AUTH0
=============

1. https://auth0.com/ 회원 가입 및 로그인
2. 로그인 후 Dashboard에서 Create Application 클릭및 application 생성
    1. Single Page Web Application 선택 및 Create
3. 생성후 Application> Setting 로 이동
    1. ClientId 확인
    2. Domain 확인
    3. Allow Callback URLs
        - http://localhost:8000/callback << frontend를 로컬 8000 포트로 동작시킬경우 필요합니다. 
        - 기타필요한 callback url을 쉼표로 구분하여 설정 http://localhost:8000/callback, http://localhost:8000/callback, http://localhost:8000/callback, 
    4. Allowed Web Origins
        - https://www.polarisoffice.com(선택하세요~) 으로 설정 
        - 3번과 동일하게 복수의 host를 쉼표로 구분하여 설정할수 있습니다.
    5. Allowed Logout URLs
        - 4번과 동일한 값으로 설정하면됩니다. 

    6. 맨밑의 Show Advanced Settings를 클릭 > Certificates로 이동하여 서명된 인증서를 다운로드 받습니다. 
        - 해당 인증서는 backend에서 사용됩니다. 

Frontend

===========

1. /src/properties/auth.properties.js의 domain, clientId, callbackUrl 값을  수정한다.

Backend

===========

1. restapis>auth0 디렉토리 이동
2. 다운로드 받은 인증서를 decompany.pem에 덮어쓴다.
3. secrets.json 의 AUTH0_CLIENT_ID 키값을 AUTH0에서 생성된 clinetId로 덮어쓴다.
 