# 개발 및 빌드 스테이지
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# yarn 설치
RUN corepack enable && corepack prepare yarn@stable --activate

# 패키지 파일 복사
COPY package.json yarn.lock ./
COPY tsconfig*.json ./

# 프로덕션 종속성 설치
RUN yarn install --frozen-lockfile

# 소스 코드 복사
COPY . .

# 애플리케이션 빌드
RUN yarn build

# 프로덕션 스테이지
FROM node:18-alpine AS production

# 작업 디렉토리 설정
WORKDIR /app

# PM2 전역 설치 (npm 사용)
RUN npm install -g pm2

# 필요한 시스템 패키지 설치
RUN apk add --no-cache \
    curl \
    jpeg-dev \
    cairo-dev \
    giflib-dev \
    pango-dev \
    python3 \
    make \
    g++ \
    tzdata

# 한국 시간대 설정
ENV TZ=Asia/Seoul

# yarn 설치
RUN corepack enable && corepack prepare yarn@stable --activate

# 빌드된 결과물과 필요한 파일들 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock ./

# 프로덕션 의존성만 설치
RUN yarn install --production --frozen-lockfile

# 업로드 디렉토리 생성
RUN mkdir -p uploads/posters uploads/tickets uploads/others \
    && chown -R node:node uploads

# node 사용자로 전환
USER node

# 헬스체크를 위한 포트
EXPOSE 8080

# pm2 설정 파일 생성
COPY ecosystem.config.js .

# 환경변수 설정
ENV NODE_ENV=production \
    PORT=8080

# 컨테이너 실행 명령
CMD ["pm2-runtime", "start", "ecosystem.config.js"]