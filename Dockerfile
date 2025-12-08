# Node.js 24 기반의 경량 Alpine 이미지 사용
FROM node:24-alpine

# 앱 디렉터리 설정
WORKDIR /usr/src/app

# package.json 복사 및 의존성 설치
COPY package*.json ./
RUN npm install --production

# 소스 복사
COPY . .

# 비루트 사용자로 변경
USER node

# 앱이 사용하는 포트
EXPOSE 3000


# 앱 실행 명령어
CMD ["node", "app.js"]
