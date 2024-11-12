# 1. 기본 디렉토리 생성
mkdir -p src/{events,tickets,seats,users,auth,common,config,utils}

# 2. Auth Module 파일 생성
mkdir -p src/auth/{strategies,guards,decorators}
mkdir -p src/auth/dto
touch src/auth/auth.module.ts
touch src/auth/auth.controller.ts
touch src/auth/auth.service.ts
touch src/auth/dto/login.dto.ts
touch src/auth/dto/register.dto.ts
touch src/auth/dto/token.dto.ts
touch src/auth/strategies/jwt.strategy.ts
touch src/auth/strategies/local.strategy.ts
touch src/auth/guards/jwt-auth.guard.ts
touch src/auth/guards/local-auth.guard.ts
touch src/auth/decorators/public.decorator.ts
touch src/auth/decorators/current-user.decorator.ts

# 3. Users Module 파일 생성 (Auth와 연계되는 부분 추가)
mkdir -p src/users/{entities,dto}
touch src/users/users.module.ts
touch src/users/users.controller.ts
touch src/users/users.service.ts
touch src/users/entities/user.entity.ts
touch src/users/dto/create-user.dto.ts
touch src/users/dto/update-user.dto.ts
touch src/users/dto/user-response.dto.ts

# 4. Events Module 파일 생성
mkdir -p src/events/{entities,dto}
touch src/events/events.module.ts
touch src/events/events.controller.ts
touch src/events/events.service.ts
touch src/events/entities/event.entity.ts
touch src/events/entities/event-schedule.entity.ts
touch src/events/entities/event-additional-info.entity.ts
touch src/events/dto/create-event.dto.ts
touch src/events/dto/update-event.dto.ts

# 5. Tickets Module 파일 생성
mkdir -p src/tickets/{entities,dto}
touch src/tickets/tickets.module.ts
touch src/tickets/tickets.controller.ts
touch src/tickets/tickets.service.ts
touch src/tickets/entities/ticket.entity.ts
touch src/tickets/dto/create-ticket.dto.ts
touch src/tickets/dto/update-ticket.dto.ts

# 6. Seats Module 파일 생성
mkdir -p src/seats/{entities,dto}
touch src/seats/seats.module.ts
touch src/seats/seats.controller.ts
touch src/seats/seats.service.ts
touch src/seats/entities/seat.entity.ts
touch src/seats/entities/seat-lock.entity.ts
touch src/seats/dto/lock-seat.dto.ts
touch src/seats/dto/reserve-seat.dto.ts

# 7. Common 파일 생성
mkdir -p src/common/{decorators,guards,interceptors,filters,middleware}
touch src/common/decorators/roles.decorator.ts
touch src/common/guards/roles.guard.ts
touch src/common/interceptors/transform.interceptor.ts
touch src/common/filters/http-exception.filter.ts
touch src/common/middleware/logger.middleware.ts
touch src/common/constants.ts
touch src/common/types.ts
touch src/common/enums.ts

# 8. Config & Utils 파일 생성
touch src/config/typeorm.config.ts
touch src/config/swagger.config.ts
touch src/config/jwt.config.ts
touch src/utils/date.util.ts
touch src/utils/password.util.ts
touch src/utils/logger.util.ts

# 9. Main 파일 생성
touch src/app.module.ts
touch src/main.ts

# 10. 기본 의존성 설치
yarn add @nestjs/common @nestjs/core @nestjs/config @nestjs/typeorm @nestjs/swagger @nestjs/jwt @nestjs/passport typeorm mysql2 bcryptjs class-validator class-transformer reflect-metadata rxjs passport passport-jwt passport-local

# 11. 개발 의존성 설치
yarn add -D @nestjs/cli @nestjs/testing @types/node @types/jest @types/passport-jwt @types/passport-local @types/bcryptjs typescript ts-node ts-jest jest nodemon prettier